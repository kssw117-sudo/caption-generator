// api/buy-credits.js
// POST { licenseCode, email } -- создаёт счёт в Lava.top на пакет из 30 генераций
//   и возвращает ссылку на оплату. Генерации начисляются после оплаты (api/lava-webhook.js).
// GET ?code=TAG-... -- сколько генераций использовано сегодня и сколько докуплено (для сайта).
// Нужны переменные в Vercel: LAVA_API_KEY, LAVA_OFFER_ID.

import { redis, isUniqueCode, normalizeCode, getUsage } from './_lib.js';

const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30; // связь "счёт -> код" храним 30 дней

export default async function handler(req, res) {
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
    const lavaRes = await fetch('https://gate.lava.top/api/v3/invoice', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.LAVA_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        email: cleanEmail,
        offerId: process.env.LAVA_OFFER_ID,
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
