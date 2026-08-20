import Stripe from 'stripe';

/**
 * @forge-pro/payments — Stripe access layer.
 *
 * Env-gated like @forge-pro/db. Checkout sessions, webhook parsing, and
 * license issuance land with the checkout milestone (Session 4).
 */

export const DEFAULT_CURRENCY = 'USD';

export function getStripeEnv(): { secretKey?: string; webhookSecret?: string } {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

let cached: Stripe | null = null;

/** Create a Stripe client from env. Returns null when STRIPE_SECRET_KEY is unset. */
export function getStripe(env: { secretKey?: string } = getStripeEnv()): Stripe | null {
  if (!env.secretKey) {
    return null;
  }
  if (!cached) {
    cached = new Stripe(env.secretKey);
  }
  return cached;
}

/** Helper: cents → Stripe's minor-unit amount (identity, but explicit). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount);
}
