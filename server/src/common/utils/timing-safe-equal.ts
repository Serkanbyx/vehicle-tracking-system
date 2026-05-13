import { timingSafeEqual as cryptoTimingSafeEqual } from "node:crypto";

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Returns false if lengths differ (no timing leak on length).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return cryptoTimingSafeEqual(bufA, bufB);
}
