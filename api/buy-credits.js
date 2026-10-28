// api/buy-credits.js
// POST { licenseCode, email } -- создаёт счёт в Lava.top на пакет из 30 генераций
//   и возвращает ссылку на оплату. Генерации начисляются после оплаты (api/lava-webhook.js).
// GET ?code=TAG-... -- сколько генераций использовано сегодня и сколько докуплено (для сайта).
// GET ?check=1 -- проверка настройки Lava (без секретов).
// Нужны переменные в Vercel: LAVA_API_KEY, LAVA_OFFER_ID (ID товара из адреса его страницы в Lava).

import { redis, isUniqueCode, normalizeCode, getUsage } from './_lib.js';

const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30; // связь "счёт -> код" храним 30 дней
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

// ID цены (offer) для счёта. Ищем его по ID товара один раз и запоминаем в Redis,
// чтобы покупатель не ждал лишних запросов к Lava.
const OFFER_CACHE_KEY = 'lava:offerid';

async function getOfferId() {
  try {
    const [cached] = await redis([['GET', OFFER_CACHE_KEY]]);
    if (cached) return cached;
  } catch (e) { /* без кэша -- просто спросим Lava */ }

  const product = await findProduct();
  const offers = (product && product.offers) || [];
  const usdOffer = offers.find(o => (o.prices || []).some(p => p.currency === 'USD')) || offers[0];
  const offerId = usdOffer ? usdOffer.id : configuredId();
  try {
    await redis([['SET', OFFER_CACHE_KEY, offerId, 'EX', 60 * 60 * 24]]);
  } catch (e) { /* не критично */ }
  return offerId;
}

class EmailRejectedError extends Error {}

async function saveLastError(entry) {
  try {
    await redis([['SET', 'lava:lasterror', JSON.stringify({ at: new Date().toISOString(), ...entry }), 'EX', 60 * 60 * 24 * 7]]);
  } catch (e) { /* не критично */ }
}

async function createInvoice(baseBody) {
  const offerId = await getOfferId();
  const r = await fetch(`${LAVA}/api/v3/invoice`, {
    method: 'POST',
    headers: lavaHeaders(),
    body: JSON.stringify({ ...baseBody, offerId })
  });
  const data = await r.json().catch(() => ({}));
  if (r.ok && data.id && data.paymentUrl) {
    return data;
  }

  // Ответ Lava сохраняем -- его видно в проверке ?check=1 (без секретов).
  await saveLastError({ status: r.status, response: JSON.stringify(data).slice(0, 300) });

  if (r.status === 404) {
    // Цена не найдена (например, товар изменили) -- в следующий раз найдём заново.
    await redis([['DEL', OFFER_CACHE_KEY]]).catch(() => {});
  }
  if (/email/i.test(String(data.error || ''))) {
    throw new EmailRejectedError('email rejected by Lava');
  }
  throw new Error(`Lava invoice http ${r.status}`);
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
  try {
    const [cachedOffer] = await redis([['GET', OFFER_CACHE_KEY]]);
    report.cachedOfferId = cachedOffer ? cachedOffer.slice(0, 8) : null;
  } catch (e) { /* не критично */ }
  try {
    const [lastError] = await redis([['GET', 'lava:lasterror']]);
    report.lastLavaError = lastError ? JSON.parse(lastError) : null;
  } catch (e) { /* не критично */ }
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
    if (err instanceof EmailRejectedError) {
      return res.status(400).json({ error: 'invalid_email' });
    }
    return res.status(502).json({ error: 'payment_error' });
  }
}
