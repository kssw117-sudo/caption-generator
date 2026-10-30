// api/track.js -- простой счётчик: сколько людей зашло, попробовало, нажало "купить".
// POST { event } -- +1 к событию за сегодня (личные данные не сохраняются).
// GET ?days=30 -- сводка по дням (только числа).

import { redis } from './_lib.js';

const EVENTS = [
  'visit',            // открыли сайт (один раз за сеанс браузера)
  'trial',            // сделали бесплатную пробную генерацию
  'generation',       // генерация по коду доступа
  'limit_reached',    // упёрлись в дневной лимит
  'unlock_click',     // нажали "ввести код"
  'buy_page_click',   // нажали "купить доступ"
  'credits_buy_click' // нажали "купить 30 генераций"
];
const KEEP_SECONDS = 60 * 60 * 24 * 120;

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const event = body && body.event;
    if (!EVENTS.includes(event)) {
      return res.status(400).json({ error: 'unknown event' });
    }
    const key = `stats:${dayKey(new Date())}:${event}`;
    try {
      await redis([['INCR', key], ['EXPIRE', key, KEEP_SECONDS]]);
    } catch (err) {
      console.error('track failed:', err.message);
    }
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const days = Math.min(Math.max(parseInt((req.query && req.query.days) || '30', 10) || 30, 1), 120);
    const dates = [];
    for (let i = 0; i < days; i += 1) {
      dates.push(dayKey(new Date(Date.now() - i * 86400000)));
    }
    const commands = [];
    for (const d of dates) for (const e of EVENTS) commands.push(['GET', `stats:${d}:${e}`]);
    try {
      const values = await redis(commands);
      const totals = Object.fromEntries(EVENTS.map(e => [e, 0]));
      const byDay = {};
      let i = 0;
      for (const d of dates) {
        const row = {};
        for (const e of EVENTS) {
          const n = parseInt(values[i++] || '0', 10);
          if (n) row[e] = n;
          totals[e] += n;
        }
        if (Object.keys(row).length) byDay[d] = row;
      }
      return res.status(200).json({ days, totals, byDay });
    } catch (err) {
      return res.status(503).json({ error: 'stats_unavailable' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
