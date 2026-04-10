import type { Database } from './database.types'

export type Pledge = Database['public']['Tables']['pledges']['Row']
export type PledgeInsert = Database['public']['Tables']['pledges']['Insert']
export type PledgeUpdate = Database['public']['Tables']['pledges']['Update']

/** Payload sent from checkout form to /api/payments/create-intent */
export interface CreatePledgePayload {
  project_id: string
  reward_id: string | null
  amount_sgd: number
  payment_method: import('./database.types').PaymentMethodType
  is_anonymous: boolean
  backer_note: string | null
}

/** Response from /api/payments/create-intent */
export interface CreatePledgeResponse {
  pledge_id: string
  client_secret: string   // PaymentIntent or SetupIntent client_secret for Stripe.js
  type: 'payment_intent' | 'setup_intent'
}

/** Pledge enriched with backer profile for creator dashboard */
export interface PledgeWithBacker extends Pledge {
  backer: {
    id: string
    display_name: string
    avatar_url: string | null
  } | null  // null when is_anonymous
}
