// api/redeem-dealfuel.js -- проверяет и активирует уникальный код DealFuel (TAG-...).
// Список кодов -- файл dealfuel/codes.json в этом же репозитории.
// Чтобы добавить коды, допиши их в этот файл и загрузи на GitHub.
// Активации записываются в Redis (когда и с каким email), GitHub-токены больше не нужны.
// Повторная активация того же кода разрешена: код работает как пароль покупателя.

import { redis, redeemedKey, normalizeCode, uniqueCodesCount, isUniqueCode } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, email } = req.body || {};
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return res.status(400).json({ error: 'Please enter your code.' });
  }

  if (uniqueCodesCount() === 0) {
    console.error('Codes list is empty or missing (dealfuel/codes.json)');
    return res.status(500).json({ error: 'Server error, please try again later.' });
  }

  if (!(await isUniqueCode(normalizedCode))) {
    return res.status(404).json({ error: 'Code not recognized.' });
  }

  try {
    const [existing] = await redis([['GET', redeemedKey(normalizedCode)]]);
    if (!existing) {
      const record = JSON.stringify({
        redeemedAt: new Date().toISOString(),
        email: typeof email === 'string' ? email.trim().slice(0, 200) : null
      });
      await redis([['SET', redeemedKey(normalizedCode), record]]);
    }
  } catch (err) {
    // Код настоящий -- пускаем, даже если запись активации не удалась.
    console.error('Could not record activation:', err.message);
  }

  return res.status(200).json({ success: true });
}
