// api/buy-credits.js
// POST { licenseCode, email } -- создаёт счёт в Lava.top на пакет из 30 генераций
//   и возвращает ссылку на оплату. Генерации начисляются после оплаты (api/lava-webhook.js).
// GET ?code=TAG-... -- сколько генераций использовано сегодня и сколько докуплено (для сайта).
// Нужны переменные в Vercel: LAVA_API_KEY, LAVA_OFFER_ID.

import { redis, isUniqueCode, normalizeCode, getUsage } from './_lib.js';

const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30; // связь "счёт -> код" храним 30 дней

// В LAVA_OFFER_ID можно вписать ID товара (из адреса страницы товара в Lava) --
// сервер сам найдёт ID его цены (offer), который нужен для счёта.
let resolvedOffer = null;
async function resolveOffer() {
  if (resolvedOffer) return resolvedOffer;
  const configured = (process.env.LAVA_OFFER_ID || '').trim();
  let url = 'https://gate.lava.top/api/v2/products?feedVisibility=ALL';
  for (let page = 0; url && page < 10; page += 1) {
    const r = await fetch(url, { headers: { 'X-Api-Key': process.env.LAVA_API_KEY, Accept: 'application/json' } });
    if (!r.ok) throw new Error(`lava products http ${r.status}`);
    const data = await r.json();
    for (const item of data.items || []) {
      // Lava отдаёт товар либо прямо в элементе списка, либо внутри item.data.
      const product = (item.data && item.data.id) ? item.data : item;
      const offers = product.offers || [];
      const byProduct = product.id === configured;
      const byOffer = offers.find(o => o.id === configured);
      if (byProduct || byOffer) {
        const offer = byOffer
          || offers.find(o => (o.prices || []).some(p => p.currency === 'USD'))
          || offers[0];
        if (!offer) throw new Error('product has no price');
        resolvedOffer = {
          offerId: offer.id,
          hasUsdPrice: (offer.prices || []).some(p => p.currency === 'USD')
        };
        return resolvedOffer;
      }
    }
    url = data.nextPage || null;
  }
  // Не нашли в списке -- считаем, что вписан сам ID цены.
  return { offerId: configured, hasUsdPrice: null };
}

export default async function handler(req, res) {
  // /api/buy-credits?check=1 -- проверка настройки Lava (без секретов).
  if (req.method === 'GET' && req.query && req.query.check) {
    const report = {
      lavaApiKeySet: Boolean(process.env.LAVA_API_KEY),
      lavaOfferIdSet: Boolean(process.env.LAVA_OFFER_ID),
      lavaWebhookKeySet: Boolean(process.env.LAVA_WEBHOOK_KEY),
      productFound: false,
      usdPrice: null
    };
    if (report.lavaApiKeySet && report.lavaOfferIdSet) {
      try {
        const offer = await resolveOffer();
        report.productFound = offer.hasUsdPrice !== null;
        report.usdPrice = offer.hasUsdPrice;
      } catch (err) {
        report.error = String(err.message).slice(0, 80);
      }
      // Диагностика: какие товары видит Lava по этому ключу (только названия и ID, без секретов).
      const configured = (process.env.LAVA_OFFER_ID || '').trim();
      report.offerIdLooksValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(configured);
      report.offerIdStart = configured.slice(0, 8);
      try {
        const r = await fetch('https://gate.lava.top/api/v2/products?feedVisibility=ALL', {
          headers: { 'X-Api-Key': process.env.LAVA_API_KEY, Accept: 'application/json' }
        });
        report.productsHttp = r.status;
        const data = await r.json().catch(() => ({}));
        report.productsSeen = (data.items || []).slice(0, 30).map(item => {
          const product = (item.data && item.data.id) ? item.data : item;
          return {
            type: item.type,
            title: product.title,
            id: product.id,
            keys: Object.keys(item).slice(0, 15),
            offers: (product.offers || []).map(o => ({
              id: o.id,
              currencies: (o.prices || []).map(p => p.currency)
            }))
          };
        });
        report.morePages = Boolean(data.nextPage);
      } catch (err) {
        report.productsError = String(err.message).slice(0, 80);
      }
    }
    return res.status(200).json(report);
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
    const { offerId } = await resolveOffer();
    const lavaRes = await fetch('https://gate.lava.top/api/v3/invoice', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.LAVA_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        email: cleanEmail,
        offerId,
        currency: 'USD',
        buyerLanguage: 'EN',
        periodicity: 'ONE_TIME',
        clientUtm: { utm_content: code },
        successful_return_url: `${siteUrl}/?credits=success`,
        failure_return_url: `${siteUrl}/?credits=failed`,
        cancel_return_url: `${siteUrl}/`
      })
    });

    const invoice = await lavaRes.json().catch(() => ({}));
    if (!lavaRes.ok || !invoice.id || !invoice.paymentUrl) {
      console.error('Lava invoice error:', lavaRes.status, JSON.stringify(invoice).slice(0, 300));
      return res.status(502).json({ error: 'payment_error' });
    }

    // Запоминаем, к какому коду относится этот счёт -- по нему вебхук начислит генерации.
    await redis([['SET', `lavaorder:${invoice.id}`, code, 'EX', ORDER_TTL_SECONDS]]);

    return res.status(200).json({ paymentUrl: invoice.paymentUrl });
  } catch (err) {
    console.error('Buy credits failed:', err.message);
    return res.status(500).json({ error: 'payment_error' });
  }
}
