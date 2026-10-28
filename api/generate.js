// api/generate.js
// Уникальные коды (TAG-...): лимит 15/день и докупленные генерации считаются на сервере
// (Upstash Redis) -- очисткой кэша не обходится. Неудачная генерация не списывается.
// Общий код (ACCESS_CODE): у всех покупателей он один, поэтому его лимит считается
// в браузере каждого покупателя -- иначе все делили бы одни 15 генераций на всех.
// Открыть /api/generate в браузере -- покажет, что работает, а что нет (без секретов).

import {
  DAILY_LIMIT, redis, redisConfigured, isSharedCode, isUniqueCode,
  todayKey, creditsKey, uniqueCodesCount
} from './_lib.js';

// Haiku -- в несколько раз быстрее Sonnet, для капшнов и хештегов качества хватает.
const MODEL = 'claude-haiku-4-5-20251001';

async function checkAndConsume(code) {
  const limitKey = todayKey(code);
  const credKey = creditsKey(code);

  const [count, , creditsRaw] = await redis([
    ['INCR', limitKey],
    ['EXPIRE', limitKey, 93600],
    ['GET', credKey]
  ]);
  const credits = parseInt(creditsRaw || '0', 10);

  if (count <= DAILY_LIMIT) {
    return {
      ok: true,
      refundCommand: ['DECR', limitKey],
      usage: { used: count, limit: DAILY_LIMIT, credits }
    };
  }

  // Дневной лимит исчерпан -- списываем докупленную генерацию.
  // DECR атомарный: если два запроса пришли одновременно, в минус не уйдём.
  if (credits > 0) {
    const [left] = await redis([['DECR', credKey]]);
    if (left >= 0) {
      return {
        ok: true,
        refundCommand: ['INCR', credKey],
        usage: { used: DAILY_LIMIT, limit: DAILY_LIMIT, credits: left }
      };
    }
    await redis([['INCR', credKey]]);
  }

  return { ok: false, usage: { used: DAILY_LIMIT, limit: DAILY_LIMIT, credits: 0 } };
}

// Неудачная генерация -- возвращаем списанное (дневную генерацию или докупленную).
async function refund(consumed) {
  if (!consumed || !consumed.refundCommand) return;
  try {
    await redis([consumed.refundCommand]);
  } catch (err) {
    console.error('Refund failed:', err.message);
  }
}

// Ответ модели должен быть валидным JSON -- иначе сайт не сможет его показать.
function isValidJsonAnswer(data) {
  try {
    const text = (data.content || []).map(b => b.text || '').join('');
    JSON.parse(text.replace(/```json|```/g, '').trim());
    return true;
  } catch (err) {
    return false;
  }
}

async function healthCheck(res) {
  const report = {
    redisConfigured: redisConfigured(),
    anthropicKeySet: Boolean(process.env.ANTHROPIC_API_KEY),
    accessCodeSet: Boolean(process.env.ACCESS_CODE),
    lavaApiKeySet: Boolean(process.env.LAVA_API_KEY),
    lavaOfferIdSet: Boolean(process.env.LAVA_OFFER_ID),
    lavaWebhookKeySet: Boolean(process.env.LAVA_WEBHOOK_KEY),
    uniqueCodesLoaded: uniqueCodesCount(),
    redis: 'not checked',
    anthropic: 'not checked'
  };

  try {
    const [pong] = await redis([['PING']]);
    report.redis = pong === 'PONG' ? 'ok' : `unexpected: ${pong}`;
  } catch (err) {
    report.redis = `error: ${String(err.message).slice(0, 80)}`;
  }

  try {
    const r = await fetch(`https://api.anthropic.com/v1/models/${MODEL}`, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    report.anthropic = r.ok ? 'ok' : `error: http ${r.status}`;
  } catch (err) {
    report.anthropic = `error: ${String(err.message).slice(0, 80)}`;
  }

  return res.status(200).json(report);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return healthCheck(res);
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseCode, prompt, images, trial } = req.body || {};

  const shared = isSharedCode(licenseCode);
  const unique = !shared && await isUniqueCode(licenseCode);
  const isFreeTrial = trial === true;

  if (!isFreeTrial && !shared && !unique) {
    return res.status(403).json({ error: 'Invalid access code' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // Серверный лимит -- только для уникальных кодов.
  let consumed = null;
  if (!isFreeTrial && unique) {
    try {
      const result = await checkAndConsume(licenseCode);
      if (!result.ok) {
        return res.status(429).json({ error: 'limit_reached', usage: result.usage });
      }
      consumed = result;
    } catch (err) {
      // Redis недоступен -- не ломаем генерацию покупателю.
      console.error('Limit check failed, allowing request:', err.message);
    }
  }

  let content;
  if (images && images.length > 0) {
    content = [
      ...images.map(img => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.base64 },
      })),
      { type: 'text', text: prompt },
    ];
  } else {
    content = prompt;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic error:', response.status, JSON.stringify(data).slice(0, 300));
      await refund(consumed);
      return res.status(502).json({ error: 'ai_error', status: response.status });
    }
    if (!isValidJsonAnswer(data)) {
      console.error('Model returned non-JSON answer');
      await refund(consumed);
      return res.status(502).json({ error: 'bad_answer' });
    }
    if (consumed) {
      data._usage = consumed.usage;
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error contacting AI:', err.message);
    await refund(consumed);
    return res.status(500).json({ error: 'Error contacting AI' });
  }
}
