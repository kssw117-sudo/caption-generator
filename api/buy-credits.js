// api/buy-credits.js
// POST { licenseCode, email } -- создаёт счёт в Lava.top на пакет из 30 генераций
//   и возвращает ссылку на оплату. Генерации начисляются после оплаты (api/lava-webhook.js).
// GET ?code=TAG-... -- сколько генераций использовано сегодня и сколько докуплено (для сайта).
// GET ?check=1 -- проверка настройки Lava (без секретов).
// Нужны переменные в Vercel: LAVA_API_KEY, LAVA_OFFER_ID (ID товара из адреса его страницы в Lava).

import { redis, isUniqueCode, normalizeCode, getUsage } from './_lib.js';

const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30; // связь "счёт -> код" храним 30 дней
const PACK_PRICE_USD = 5;
const LAVA = 'https://gate.lava.top';

function lavaHeaders() {
  return {
    'X-Api-Key': process.env.LAVA_API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
}

function configuredId() {
  return (process.env.LAVA_OFFER_ID || '').trim();
}

// Lava отдаёт товар либо прямо в элементе списка, либо внутри item.data.
function asProduct(item) {
  return (item && item.data && item.data.id) ? item.data : (item || {});
}

// Ищем наш товар в списке товаров Lava.
async function findProduct() {
  const id = configuredId();
  let url = `${LAVA}/api/v2/products?feedVisibility=ALL`;
  for (let page = 0; url && page < 10; page += 1) {
    const r = await fetch(url, { headers: lavaHeaders() });
    if (!r.ok) throw new Error(`lava products http ${r.status}`);
    const data = await r.json();
    for (const item of data.items || []) {
      const product = asProduct(item);
      const offers = product.offers || [];
      if (product.id === id || offers.some(o => o.id === id)) {
        return product;
      }
    }
    url = data.nextPage || null;
  }
  return null;
}

// Варианты счёта по очереди: Lava по-разному принимает ID цены и ID товара,
// поэтому пробуем все и запоминаем тот, что сработал.
let workingVariant = null;
async function invoiceVariants() {
  const id = configuredId();
  const variants = [];
  try {
    const product = await findProduct();
    const offers = (product && product.offers) || [];
    const usdOffer = offers.find(o => (o.prices || []).some(p => p.currency === 'USD')) || offers[0];
    if (usdOffer && usdOffer.id !== id) variants.push({ name: 'offer', offerId: usdOffer.id });
  } catch (err) {
    console.error('Lava product lookup failed:', err.message);
  }
  variants.push({ name: 'id', offerId: id });
  variants.push({ name: 'id+amount', offerId: id, amount: PACK_PRICE_USD });
  if (workingVariant) {
    variants.sort((a, b) => (a.name === workingVariant ? -1 : b.name === workingVariant ? 1 : 0));
  }
  return variants;
}

async function createInvoice(baseBody) {
  const errors = [];
  for (const v of await invoiceVariants()) {
    const body = { ...baseBody, offerId: v.offerId };
    if (v.amount) body.amount = v.amount;
    const r = await fetch(`${LAVA}/api/v3/invoice`, {
      method: 'POST',
      headers: lavaHeaders(),
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.id && data.paymentUrl) {
      workingVariant = v.name;
      return data;
    }
    errors.push(`${v.name}: ${r.status} ${JSON.stringify(data).slice(0, 200)}`);
  }
  throw new Error(`Lava refused all invoice variants -> ${errors.join(' | ')}`);
}

async function checkReport() {
  const report = {
    lavaApiKeySet: Boolean(process.env.LAVA_API_KEY),
    lavaOfferIdSet: Boolean(process.env.LAVA_OFFER_ID),
    lavaWebhookKeySet: Boolean(process.env.LAVA_WEBHOOK_KEY),
    offerIdStart: configuredId().slice(0, 8),
    productFound: false
  };
  if (!report.lavaApiKeySet || !report.lavaOfferIdSet) return report;
  try {
    const product = await findProduct();
    if (product) {
      report.productFound = true;
      report.productTitle = product.title;
      report.isDynamicPrice = product.isDynamicPrice;
      report.offers = (product.offers || []).map(o => ({
        id: o.id,
        prices: (o.prices || []).map(p => `${p.amount} ${p.currency}`)
      }));
      report.settings = JSON.stringify(product.settings || null).slice(0, 400);
    }
  } catch (err) {
    report.error = String(err.message).slice(0, 120);
  }
  report.lastWorkingVariant = workingVariant;
  return report;
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query && req.query.check) {
    return res.status(200).json(await checkReport());
  }

  if (req.method === 'GET') {
    const code = normalizeCode(req.query && req.query.code);
    if (!(await isUniqueCode(code))) {
      return res.status(403).json({ error: 'Invalid access code' });
    }
    try {
      return res.status(200).json(await getUsage(code));
    } catch (err) {
      return res.status(503).json({ error: 'usage_unavailable' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseCode, email } = req.body || {};
  const code = normalizeCode(licenseCode);
  const cleanEmail = typeof email === 'string' ? email.trim() : '';

  if (!(await isUniqueCode(code))) {
    return res.status(403).json({ error: 'Invalid access code' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!process.env.LAVA_API_KEY || !process.env.LAVA_OFFER_ID) {
    console.error('LAVA_API_KEY or LAVA_OFFER_ID is not set in Vercel');
    return res.status(500).json({ error: 'payments_not_configured' });
  }

  const siteUrl = `https://${req.headers.host}`;

  try {
    const invoice = await createInvoice({
      email: cleanEmail,
      currency: 'USD',
      buyerLanguage: 'EN',
      periodicity: 'ONE_TIME',
      clientUtm: { utm_content: code },
      successful_return_url: `${siteUrl}/?credits=success`,
      failure_return_url: `${siteUrl}/?credits=failed`,
      cancel_return_url: `${siteUrl}/`
    });

    // Запоминаем, к какому коду относится этот счёт -- по нему вебхук начислит генерации.
    await redis([['SET', `lavaorder:${invoice.id}`, code, 'EX', ORDER_TTL_SECONDS]]);

    return res.status(200).json({ paymentUrl: invoice.paymentUrl });
  } catch (err) {
    console.error('Buy credits failed:', err.message);
    return res.status(502).json({ error: 'payment_error' });
  }
}
