// api/generate.js
// Лимит и докупленные токены считаются на сервере (Upstash Redis),
// привязаны к licenseCode -- обойти очисткой localStorage/браузера нельзя.

const DAILY_LIMIT = 15;

async function redis(command) {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  return res.json();
}

async function checkAndConsume(licenseCode) {
  const today = new Date().toISOString().slice(0, 10);
  const limitKey = `limit:${licenseCode}:${today}`;
  const creditsKey = `credits:${licenseCode}`;

  // Атомарно увеличиваем счётчик дня и ставим TTL на 26 часов (с запасом)
  const [[, count]] = await redis([
    ['INCR', limitKey],
    ['EXPIRE', limitKey, 93600]
  ]);

  if (count <= DAILY_LIMIT) {
    return { ok: true };
  }

  // Дневной лимит исчерпан -- пробуем списать с докупленных токенов
  const [[, creditsRaw]] = await redis([['GET', creditsKey]]);
  const credits = parseInt(creditsRaw || '0', 10);

  if (credits > 0) {
    await redis([['DECR', creditsKey]]);
    return { ok: true, usedCredit: true };
  }

  return { ok: false };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseCode, prompt, images, trial } = req.body;

  const isSharedCode = licenseCode && licenseCode === process.env.ACCESS_CODE;
  const isAppSumoCode = licenseCode && licenseCode.trim().toUpperCase().startsWith('TAG-');
  const isFreeTrial = trial === true;

  if (!isFreeTrial && (!licenseCode || (!isSharedCode && !isAppSumoCode))) {
    return res.status(403).json({ error: 'Invalid access code' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // Серверный лимит проверяем только для платных (не trial) запросов.
  // Для общего ACCESS_CODE это будет ОДИН общий счётчик на всех, кто им
  // пользуется -- см. предупреждение в чате: стоит переходить на уникальные коды.
  if (!isFreeTrial) {
    const result = await checkAndConsume(licenseCode);
    if (!result.ok) {
      return res.status(429).json({ error: 'limit_reached' });
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
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error contacting AI' });
  }
}
