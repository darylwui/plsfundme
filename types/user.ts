import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/** Safe public-facing subset of a profile (no Stripe IDs, no KYC details) */
export interface PublicProfile {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  website_url: string | null
}
