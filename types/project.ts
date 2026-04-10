import type { Database } from './database.types'

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type StretchGoal = Database['public']['Tables']['stretch_goals']['Row']
export type ProjectUpdatePost = Database['public']['Tables']['project_updates']['Row']

/** Project with joined relations for display */
export interface ProjectWithRelations extends Project {
  category: Category
  creator: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  rewards: import('./reward').Reward[]
  stretch_goals: StretchGoal[]
}

/** Data shape for the multi-step creation form */
export interface ProjectDraft {
  // Step 1: Basic Info
  title: string
  category_id: string
  short_description: string
  full_description: string
  cover_image_url: string | null
  video_url: string | null
  // Step 2: Funding
  funding_goal_sgd: number
  start_date: string | null
  deadline: string
  payout_mode: import('./database.types').PayoutMode
  // Step 3: Rewards (managed separately)
  // Step 4: Review + launch
}
