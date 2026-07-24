// api/create-payment.js
const PRICES = {
  lifetime: { amount: 29, currency: 'usd' },
  monthly: { amount: 9, currency: 'usd' }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan } = req.body;
  if (!plan || !PRICES[plan]) {
    return res.status(400).json({ error: 'Некорректный план' });
  }

  try {
    const npResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: PRICES[plan].amount,
        price_currency: PRICES[plan].currency,
        order_description: `Caption Generator — ${plan}`,
        success_url: `${process.env.PUBLIC_URL}/thanks.html`,
        cancel_url: `${process.env.PUBLIC_URL}/buy.html`
      })
    });

    const npData = await npResponse.json();

    if (!npData.invoice_url) {
      return res.status(500).json({ error: npData.message || npData.code || JSON.stringify(npData) });
    }

    return res.status(200).json({ paymentUrl: npData.invoice_url });
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сети: ' + err.message });
  }
}
