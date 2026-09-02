// api/generate.js
// Принимает три случая:
// 1. Общий код с Getly, хранится в переменной окружения ACCESS_CODE
// 2. Уникальные AppSumo-коды вида TAG-XXXX-XXXX (сами коды проверяются
//    и гасятся отдельной функцией /api/redeem-appsumo при разблокировке;
//    здесь просто пропускаем любой код с этим префиксом)
// 3. trial: true — одна бесплатная генерация без кода вообще, чтобы
//    модераторы маркетплейсов (Lava.top, AppSumo) могли реально
//    попробовать продукт, а не просто увидеть форму. Ограничение "одна
//    попытка" отслеживается на стороне браузера (localStorage) — как и
//    раньше в этом проекте, это осознанный компромисс: без базы данных
//    невозможно железно ограничить по IP, но риск невелик, потому что
//    это не рекламируется как способ пользоваться продуктом бесплатно.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseCode, prompt, trial } = req.body;

  const isSharedCode = licenseCode && licenseCode === process.env.ACCESS_CODE;
  const isAppSumoCode = licenseCode && licenseCode.trim().toUpperCase().startsWith('TAG-');
  const isFreeTrial = trial === true;

  if (!isFreeTrial && (!licenseCode || (!isSharedCode && !isAppSumoCode))) {
    return res.status(403).json({ error: 'Неверный код доступа' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Нет prompt' });
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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка обращения к ИИ' });
  }
}
