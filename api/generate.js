// api/generate.js
// Лимит (15/день) и докупленные токены считаются на сервере (Upstash Redis),
// привязаны к licenseCode -- очисткой кэша/браузера не обходится.
// Если Redis вдруг недоступен, генерация всё равно проходит (сайт не ломается).
// Открыть /api/generate в браузере -- покажет, что работает, а что нет (без секретов).

const DAILY_LIMIT = 15;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
const MODEL = 'claude-sonnet-4-6';

async function redis(commands) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  if (!res.ok) {
    throw new Error(`redis http ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('redis bad response');
  }
  return data.map(item => {
    if (item.error) throw new Error(`redis: ${item.error}`);
    return item.result;
  });
}

async function checkAndConsume(licenseCode) {
  const today = new Date().toISOString().slice(0, 10);
  const limitKey = `limit:${licenseCode}:${today}`;
  const creditsKey = `credits:${licenseCode}`;

  const [count] = await redis([
    ['INCR', limitKey],
    ['EXPIRE', limitKey, 93600]
  ]);

  if (count <= DAILY_LIMIT) {
    return { ok: true };
  }

  // Дневной лимит исчерпан -- пробуем списать с докупленных токенов
  const [creditsRaw] = await redis([['GET', creditsKey]]);
  const credits = parseInt(creditsRaw || '0', 10);

  if (credits > 0) {
    await redis([['DECR', creditsKey]]);
    return { ok: true, usedCredit: true };
  }

  return { ok: false };
}

async function healthCheck(res) {
  const report = {
    redisUrlSet: Boolean(REDIS_URL),
    redisTokenSet: Boolean(REDIS_TOKEN),
    anthropicKeySet: Boolean(process.env.ANTHROPIC_API_KEY),
    accessCodeSet: Boolean(process.env.ACCESS_CODE),
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

  const isSharedCode = licenseCode && licenseCode === process.env.ACCESS_CODE;
  const isAppSumoCode = licenseCode && licenseCode.trim().toUpperCase().startsWith('TAG-');
  const isFreeTrial = trial === true;

  if (!isFreeTrial && (!licenseCode || (!isSharedCode && !isAppSumoCode))) {
    return res.status(403).json({ error: 'Invalid access code' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // Серверный лимит -- только для платных (не trial) запросов.
  if (!isFreeTrial) {
    try {
      const result = await checkAndConsume(licenseCode);
      if (!result.ok) {
        return res.status(429).json({ error: 'limit_reached' });
      }
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
        max_tokens: 1000,
        messages: [{ role: 'user', content }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic error:', response.status, JSON.stringify(data).slice(0, 300));
      return res.status(502).json({ error: 'ai_error', status: response.status });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error contacting AI:', err.message);
    return res.status(500).json({ error: 'Error contacting AI' });
  }
}
