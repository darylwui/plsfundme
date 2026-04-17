import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
  }

  return stripeClient
}

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
