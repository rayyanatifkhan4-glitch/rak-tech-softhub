/**
 * Browser-side password hashing using the native Web Crypto API (SHA-256).
 * Uses the same algorithm as Node's crypto.createHash('sha256') — same output.
 * No external dependencies needed.
 */

export async function hashPassword(plainText) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(plainText);
  const hash    = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(plainText, storedHash) {
  const hash = await hashPassword(plainText);
  return hash === storedHash;
}

/**
 * Generate a short random session token (client-side, local desktop use).
 * Not cryptographically signed — acceptable for local LAN desktop app.
 */
export function generateSessionToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a new record ID in a given prefix format.
 * e.g. generateId('INV') → 'INV-1721567890123'
 */
export function generateId(prefix = '') {
  return prefix ? `${prefix}-${Date.now()}` : String(Date.now());
}
