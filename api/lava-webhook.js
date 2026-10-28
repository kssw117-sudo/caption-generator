// api/lava-webhook.js
// Lava.top присылает сюда уведомление после оплаты. Если оплачен наш счёт на пакет
// генераций -- начисляем 30 генераций на код покупателя. Повторное уведомление
// по тому же платежу ничего не начислит второй раз.
// Нужна переменная в Vercel: LAVA_WEBHOOK_KEY -- тот же ключ, что указан в настройках вебхука в Lava.top.

import { redis, creditsKey, CREDITS_PER_PACK } from './_lib.js';

function isAuthorized(req) {
  const expected = process.env.LAVA_WEBHOOK_KEY;
  if (!expected) return false;

  // Вариант 1: ключ в заголовке X-Api-Key
  if (req.headers['x-api-key'] === expected) return true;

  // Вариант 2: Basic-авторизация (пароль = ключ)
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
    const password = decoded.slice(decoded.indexOf(':') + 1);
    if (password === expected) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const event = req.body || {};
  const contractId = event.contractId;

  // Нас интересуют только успешные оплаты. Остальное просто подтверждаем.
  if (event.eventType !== 'payment.success' || !contractId) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  try {
    // Только счета, созданные нашим сайтом (покупки других товаров игнорируем).
    const [code] = await redis([['GET', `lavaorder:${contractId}`]]);
    if (!code) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Защита от двойного начисления: отмечаем платёж; если уже был отмечен -- выходим.
    const [firstTime] = await redis([['SET', `lavapaid:${contractId}`, '1', 'NX', 'EX', 60 * 60 * 24 * 365]]);
    if (firstTime !== 'OK') {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    try {
      const [total] = await redis([['INCRBY', creditsKey(code), CREDITS_PER_PACK]]);
      console.log(`Credited ${CREDITS_PER_PACK} generations to ${code}, balance ${total}`);
    } catch (err) {
      // Не начислили -- снимаем отметку, чтобы повторное уведомление начислило.
      await redis([['DEL', `lavapaid:${contractId}`]]).catch(() => {});
      throw err;
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook processing failed:', err.message);
    // 500 -- чтобы Lava.top прислала уведомление повторно.
    return res.status(500).json({ error: 'temporary_error' });
  }
}
