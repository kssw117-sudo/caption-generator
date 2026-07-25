// api/create-payment.js
// Создаёт разовую ссылку на оплату через NOWPayments с автоматическим
// перенаправлением на страницу с кодом после успешной оплаты.
// Без базы данных — код доступа один общий (TAG92), не привязан к заказу.

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

  if (!process.env.PUBLIC_URL) {
    return res.status(500).json({ error: 'PUBLIC_URL не задан на сервере (пусто в Environment Variables)' });
  }
  if (!process.env.NOWPAYMENTS_API_KEY) {
    return res.status(500).json({ error: 'NOWPAYMENTS_API_KEY не задан на сервере (пусто в Environment Variables)' });
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
      return res.status(500).json({
        error: (npData.message || npData.code || JSON.stringify(npData)) + ' | PUBLIC_URL сейчас равен: "' + process.env.PUBLIC_URL + '"'
      });
    }

    return res.status(200).json({ paymentUrl: npData.invoice_url });
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сети: ' + err.message });
  }
}
