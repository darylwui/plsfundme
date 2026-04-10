export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectStatus = 'draft' | 'pending_review' | 'active' | 'funded' | 'failed' | 'cancelled' | 'removed'
export type PledgeStatus = 'pending' | 'authorized' | 'paynow_captured' | 'captured' | 'released' | 'refunded' | 'failed'
export type PaymentMethodType = 'card' | 'paynow'
export type FulfillmentStatus = 'unfulfilled' | 'shipped' | 'delivered'
export type KycStatus = 'unverified' | 'pending' | 'approved' | 'rejected'
export type PayoutMode = 'manual' | 'automatic'
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: []
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          website_url: string | null
          kyc_status: KycStatus
          kyc_submitted_at: string | null
          kyc_reviewed_at: string | null
          kyc_rejection_reason: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          website_url?: string | null
          kyc_status?: KycStatus
          kyc_submitted_at?: string | null
          kyc_reviewed_at?: string | null
          kyc_rejection_reason?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      categories: {
        Relationships: []
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_name: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_name?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      projects: {
        Relationships: []
        Row: {
          id: string
          creator_id: string
          category_id: string
          title: string
          slug: string
          short_description: string
          full_description: string
          cover_image_url: string | null
          video_url: string | null
          funding_goal_sgd: number
          amount_pledged_sgd: number
          backer_count: number
          payout_mode: PayoutMode
          status: ProjectStatus
          start_date: string | null
          deadline: string
          launched_at: string | null
          funded_at: string | null
          failed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          category_id: string
          title: string
          slug: string
          short_description: string
          full_description?: string
          cover_image_url?: string | null
          video_url?: string | null
          funding_goal_sgd: number
          amount_pledged_sgd?: number
          backer_count?: number
          payout_mode?: PayoutMode
          status?: ProjectStatus
          start_date?: string | null
          deadline: string
          launched_at?: string | null
          funded_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      rewards: {
        Relationships: []
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          minimum_pledge_sgd: number
          estimated_delivery_date: string | null
          max_backers: number | null
          claimed_count: number
          includes_physical_item: boolean
          is_active: boolean
          display_order: number
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          minimum_pledge_sgd: number
          estimated_delivery_date?: string | null
          max_backers?: number | null
          claimed_count?: number
          includes_physical_item?: boolean
          is_active?: boolean
          display_order?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['rewards']['Insert']>
      }
      stretch_goals: {
        Relationships: []
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          goal_amount_sgd: number
          reached_at: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          goal_amount_sgd: number
          reached_at?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['stretch_goals']['Insert']>
      }
      pledges: {
        Relationships: []
        Row: {
          id: string
          project_id: string
          backer_id: string
          reward_id: string | null
          amount_sgd: number
          platform_fee_sgd: number
          stripe_payment_intent_id: string | null
          stripe_setup_intent_id: string | null
          stripe_payment_method_id: string | null
          payment_method: PaymentMethodType
          status: PledgeStatus
          fulfillment_status: FulfillmentStatus
          shipped_at: string | null
          delivered_at: string | null
          tracking_url: string | null
          is_anonymous: boolean
          backer_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          backer_id: string
          reward_id?: string | null
          amount_sgd: number
          platform_fee_sgd?: number
          stripe_payment_intent_id?: string | null
          stripe_setup_intent_id?: string | null
          stripe_payment_method_id?: string | null
          payment_method: PaymentMethodType
          status?: PledgeStatus
          fulfillment_status?: FulfillmentStatus
          shipped_at?: string | null
          delivered_at?: string | null
          tracking_url?: string | null
          is_anonymous?: boolean
          backer_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pledges']['Insert']>
      }
      payouts: {
        Relationships: []
        Row: {
          id: string
          project_id: string
          creator_id: string
          amount_sgd: number
          platform_fee_sgd: number
          net_amount_sgd: number
          stripe_transfer_id: string | null
          status: PayoutStatus
          requested_at: string
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          creator_id: string
          amount_sgd: number
          platform_fee_sgd: number
          net_amount_sgd: number
          stripe_transfer_id?: string | null
          status?: PayoutStatus
          requested_at?: string
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>
      }
      project_updates: {
        Relationships: []
        Row: {
          id: string
          project_id: string
          creator_id: string
          title: string
          body: string
          is_backers_only: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          creator_id: string
          title: string
          body: string
          is_backers_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['project_updates']['Insert']>
      }
    }
    Views: Record<string, never>
    CompositeTypes: Record<string, never>
    Functions: {
      increment_pledge_totals: {
        Args: { p_project_id: string; p_amount_sgd: number }
        Returns: void
      }
      decrement_pledge_totals: {
        Args: { p_project_id: string; p_amount_sgd: number }
        Returns: void
      }
      claim_reward_slot: {
        Args: { p_reward_id: string }
        Returns: boolean
      }
      release_reward_slot: {
        Args: { p_reward_id: string }
        Returns: void
      }
      calculate_platform_fee: {
        Args: { p_amount_sgd: number }
        Returns: number
      }
      check_stretch_goals: {
        Args: { p_project_id: string }
        Returns: void
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      project_status: ProjectStatus
      pledge_status: PledgeStatus
      payment_method_type: PaymentMethodType
      fulfillment_status: FulfillmentStatus
      kyc_status: KycStatus
      payout_mode: PayoutMode
      payout_status: PayoutStatus
    }
  }
}
