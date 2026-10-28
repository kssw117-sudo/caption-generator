// api/_lib.js -- общие функции для серверных файлов (сам по себе не открывается как адрес).
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const DAILY_LIMIT = 15;
export const CREDITS_PER_PACK = 30;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

export function redisConfigured() {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

// Выполняет несколько команд Redis за один запрос, возвращает массив результатов.
export async function redis(commands) {
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

// Уникальные коды покупателей (TAG-...) -- только те, что реально есть в списке.
let uniqueCodes = null;
function loadUniqueCodes() {
  if (uniqueCodes) return uniqueCodes;
  try {
    const file = require('../dealfuel/codes.json');
    const list = Array.isArray(file) ? file : Object.values(file).flat();
    uniqueCodes = new Set(
      list.map(c => String(typeof c === 'object' && c ? c.code : c).trim().toUpperCase())
    );
  } catch (err) {
    console.error('Could not load codes list:', err.message);
    uniqueCodes = new Set();
  }
  return uniqueCodes;
}

export function uniqueCodesCount() {
  return loadUniqueCodes().size;
}

export function normalizeCode(code) {
  return typeof code === 'string' ? code.trim().toUpperCase() : '';
}

export function isSharedCode(code) {
  return Boolean(code) && code === process.env.ACCESS_CODE;
}

export function redeemedKey(code) {
  return `code:${normalizeCode(code)}`;
}

// Код настоящий, если он есть в списке dealfuel/codes.json
// или был активирован через страницу /unlock (тогда он отмечен в Redis).
// Выдуманный TAG-что-угодно больше не проходит.
export async function isUniqueCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized.startsWith('TAG-')) return false;
  if (loadUniqueCodes().has(normalized)) return true;
  try {
    const [marked] = await redis([['GET', redeemedKey(normalized)]]);
    return Boolean(marked);
  } catch (err) {
    console.error('Code check in Redis failed:', err.message);
    return false;
  }
}

export function todayKey(code) {
  const today = new Date().toISOString().slice(0, 10);
  return `limit:${normalizeCode(code)}:${today}`;
}

export function creditsKey(code) {
  return `credits:${normalizeCode(code)}`;
}

// Сколько использовано сегодня и сколько докуплено -- для показа на сайте.
export async function getUsage(code) {
  const [usedRaw, creditsRaw] = await redis([
    ['GET', todayKey(code)],
    ['GET', creditsKey(code)]
  ]);
  return {
    used: Math.min(parseInt(usedRaw || '0', 10), DAILY_LIMIT),
    limit: DAILY_LIMIT,
    credits: parseInt(creditsRaw || '0', 10)
  };
}
