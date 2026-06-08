import { randomBytes } from "crypto";

type Challenge = { nonce: string; expiresAt: number };

// In-memory store — sufficient for single-instance beta.
// TODO: migrate to Redis for multi-instance deployments.
const store = new Map<string, Challenge>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function prune() {
  const now = Date.now();
  for (const [key, v] of store.entries()) {
    if (now > v.expiresAt) store.delete(key);
  }
}

export function createChallenge(userId: string): string {
  prune();
  const nonce = randomBytes(16).toString("hex");
  store.set(userId, { nonce, expiresAt: Date.now() + TTL_MS });
  return nonce;
}

export function consumeChallenge(userId: string, nonce: string): boolean {
  const entry = store.get(userId);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(userId);
    return false;
  }
  if (entry.nonce !== nonce) return false;
  store.delete(userId); // one-time use
  return true;
}
