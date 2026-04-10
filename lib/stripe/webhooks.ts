import Stripe from 'stripe'
import { stripe } from './server'

/**
 * Verify and parse an incoming Stripe webhook request.
 * Throws if the signature is invalid.
 */
export async function verifyWebhookSignature(
  request: Request
): Promise<Stripe.Event> {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    throw new Error('Missing stripe-signature header')
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}
