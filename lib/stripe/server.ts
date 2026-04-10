import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

export const PLATFORM_FEE_PERCENT = 5

/** Calculate the 5% platform fee in cents (Stripe works in smallest currency unit) */
export function calculateApplicationFee(amountSgdCents: number): number {
  return Math.round(amountSgdCents * (PLATFORM_FEE_PERCENT / 100))
}

/** Convert SGD dollars to cents for Stripe */
export function toCents(amountSgd: number): number {
  return Math.round(amountSgd * 100)
}

/** Convert Stripe cents back to SGD dollars */
export function fromCents(amountCents: number): number {
  return amountCents / 100
}
