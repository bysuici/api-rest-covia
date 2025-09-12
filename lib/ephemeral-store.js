import crypto from 'crypto';

const TTL_SECONDS = Number(process.env.EPHEMERAL_TTL_SECONDS || 600);
const MAX_ITEMS = Number(process.env.EPHEMERAL_MAX_ITEMS || 500);
const MAX_TOTAL_MB = Number(process.env.EPHEMERAL_MAX_TOTAL_MB || 612);

const store = new Map();
let totalBytes = 0;

function now() { return Date.now(); }

function sweep() {
  const t = now();
  for (const [token, item] of store.entries()) {
    if (item.expiresAt <= t) {
      totalBytes -= item.size;
      store.delete(token);
    }
  }
}
setInterval(sweep, 60_000).unref();

function randomToken() {
  return crypto.randomBytes(18).toString('base64url');
}

function ensureCapacity(bytesToAdd) {
  const maxBytes = MAX_TOTAL_MB * 1024 * 1024;
  if (bytesToAdd > maxBytes) {
    throw Object.assign(new Error('Archivo demasiado grande para el store efímero'), { status: 413 });
  }
  while ((store.size >= MAX_ITEMS || totalBytes + bytesToAdd > maxBytes) && store.size > 0) {
    const [oldTok, old] = store.entries().next().value;
    store.delete(oldTok);
    totalBytes -= old.size;
  }
}

export function putEphemeral(data, { mime, filename, ttlSec = TTL_SECONDS } = {}) {
  const buffer = Buffer.isBuffer(data) ? data : (data instanceof Uint8Array ? Buffer.from(data) : null);
  if (!buffer) {
    throw Object.assign(new Error('Buffer inválido'), { status: 400 });
  }
  const size = buffer.byteLength;
  ensureCapacity(size);
  const token = randomToken();
  const expiresAt = now() + Math.max(10_000, ttlSec * 1000);
  store.set(token, { buffer, mime, filename, expiresAt, size });
  totalBytes += size;
  return { token, expiresAt };
}

export function getEphemeral(token) {
  const item = store.get(token);
  if (!item) return null;
  if (item.expiresAt <= now()) {
    totalBytes -= item.size;
    store.delete(token);
    return null;
  }
  return item; 
}

export function delEphemeral(token) {
  const item = store.get(token);
  if (!item) return false;
  totalBytes -= item.size;
  store.delete(token);
  return true;
}
