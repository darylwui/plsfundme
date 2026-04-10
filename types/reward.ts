import type { Database } from './database.types'

export type Reward = Database['public']['Tables']['rewards']['Row']
export type RewardInsert = Database['public']['Tables']['rewards']['Insert']
export type RewardUpdate = Database['public']['Tables']['rewards']['Update']

/** Shape used in the reward creation form */
export interface RewardFormData {
  title: string
  description: string
  minimum_pledge_sgd: number
  estimated_delivery_date: string
  max_backers: number | null
  includes_physical_item: boolean
  image_url: string | null
}
