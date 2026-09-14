// api/generate.js
// Принимает три случая для доступа:
// 1. Общий код (Getly/прямые продажи), хранится в переменной окружения ACCESS_CODE
// 2. AppSumo-коды — проверяются и гасятся отдельной функцией /api/redeem-appsumo
//    при разблокировке (см. unlock.html); здесь просто проверяем префикс "TAG-"
//    как дополнительную защиту (основная проверка уже прошла на этапе unlock)
// 3. trial: true — одна бесплатная генерация без кода вообще, чтобы
//    модераторы маркетплейсов могли реально попробовать продукт.
//
// Поддерживает два формата запроса:
// - { prompt: "..." } — обычный текстовый запрос (как раньше)
// - { prompt: "...", images: [{ base64, mediaType }] } — запрос с фото/видео-кадром,
//   чтобы Claude реально анализировал содержимое, а не просто текст темы

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

  // Собираем содержимое сообщения: если есть фото — массив блоков
  // (картинка + текст), если нет — просто текст, как раньше
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
