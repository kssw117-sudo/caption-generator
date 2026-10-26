// api/add-credits.js
// Начисляет докупленные генерации на licenseCode после оплаты через Lava.top.
// Защищён секретным ключом, чтобы никто чужой не мог начислить себе токены.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseCode, amount, secret } = req.body;

  if (secret !== process.env.ADD_CREDITS_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!licenseCode || !amount) {
    return res.status(400).json({ error: 'licenseCode and amount required' });
  }

  const creditsKey = `credits:${licenseCode}`;

  await fetch(`${process.env.UPSTASH_REDIS_REST_KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([['INCRBY', creditsKey, amount]])
  });

  return res.status(200).json({ ok: true });
}
