export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaign_drafts: {
        Row: {
          draft_data: Json
          id: string
          rewards_data: Json
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          draft_data?: Json
          id?: string
          rewards_data?: Json
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          draft_data?: Json
          id?: string
          rewards_data?: Json
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_verifications: {
        Row: {
          created_at: string
          method: string
          nationality: string | null
          profile_id: string
          residency: string | null
          uinfin_hash: string
          verified_at: string
          verified_dob: string | null
          verified_name: string
        }
        Insert: {
          created_at?: string
          method: string
          nationality?: string | null
          profile_id: string
          residency?: string | null
          uinfin_hash: string
          verified_at?: string
          verified_dob?: string | null
          verified_name: string
        }
        Update: {
          created_at?: string
          method?: string
          nationality?: string | null
          profile_id?: string
          residency?: string | null
          uinfin_hash?: string
          verified_at?: string
          verified_dob?: string | null
          verified_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_sgd: number
          created_at: string
          creator_id: string
          id: string
          net_amount_sgd: number
          platform_fee_sgd: number
          processed_at: string | null
          project_id: string
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount_sgd: number
          created_at?: string
          creator_id: string
          id?: string
          net_amount_sgd: number
          platform_fee_sgd: number
          processed_at?: string | null
          project_id: string
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_sgd?: number
          created_at?: string
          creator_id?: string
          id?: string
          net_amount_sgd?: number
          platform_fee_sgd?: number
          processed_at?: string | null
          project_id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pledges: {
        Row: {
          amount_sgd: number
          backer_id: string
          backer_note: string | null
          created_at: string
          delivered_at: string | null
          fulfillment_status: Database["public"]["Enums"]["fulfillment_status"]
          id: string
          is_anonymous: boolean
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          platform_fee_sgd: number
          project_id: string
          reward_id: string | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["pledge_status"]
          stripe_payment_intent_id: string | null
          stripe_payment_method_id: string | null
          stripe_setup_intent_id: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          amount_sgd: number
          backer_id: string
          backer_note?: string | null
          created_at?: string
          delivered_at?: string | null
          fulfillment_status?: Database["public"]["Enums"]["fulfillment_status"]
          id?: string
          is_anonymous?: boolean
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          platform_fee_sgd?: number
          project_id: string
          reward_id?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["pledge_status"]
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          amount_sgd?: number
          backer_id?: string
          backer_note?: string | null
          created_at?: string
          delivered_at?: string | null
          fulfillment_status?: Database["public"]["Enums"]["fulfillment_status"]
          id?: string
          is_anonymous?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          platform_fee_sgd?: number
          project_id?: string
          reward_id?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["pledge_status"]
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pledges_backer_id_fkey"
            columns: ["backer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_stripe_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_account_id: string | null
          stripe_customer_id: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          is_admin?: boolean
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      project_feedback: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          parent_id: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          parent_id?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          parent_id?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_feedback_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_feedback_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_manager_profiles: {
        Row: {
          bio: string
          company_name: string | null
          company_website: string | null
          created_at: string
          id: string
          id_document_url: string | null
          linkedin_url: string | null
          project_description: string
          project_type: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          singpass_sub: string | null
          singpass_verified: boolean
          status: Database["public"]["Enums"]["pm_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          bio: string
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          id: string
          id_document_url?: string | null
          linkedin_url?: string | null
          project_description: string
          project_type: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          singpass_sub?: string | null
          singpass_verified?: boolean
          status?: Database["public"]["Enums"]["pm_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          bio?: string
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          id_document_url?: string | null
          linkedin_url?: string | null
          project_description?: string
          project_type?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          singpass_sub?: string | null
          singpass_verified?: boolean
          status?: Database["public"]["Enums"]["pm_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_manager_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_manager_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          body: string
          created_at: string
          creator_id: string
          id: string
          is_backers_only: boolean
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          creator_id: string
          id?: string
          is_backers_only?: boolean
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          creator_id?: string
          id?: string
          is_backers_only?: boolean
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          amount_pledged_sgd: number
          backer_count: number
          category_id: string
          cover_image_url: string | null
          created_at: string
          creator_id: string
          deadline: string
          deleted_at: string | null
          failed_at: string | null
          full_description: string
          funded_at: string | null
          funding_goal_sgd: number
          id: string
          is_featured: boolean
          launched_at: string | null
          payout_mode: Database["public"]["Enums"]["payout_mode"]
          rejection_reason: string | null
          rejection_reason_code: string | null
          short_description: string
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          amount_pledged_sgd?: number
          backer_count?: number
          category_id: string
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          deadline: string
          deleted_at?: string | null
          failed_at?: string | null
          full_description?: string
          funded_at?: string | null
          funding_goal_sgd: number
          id?: string
          is_featured?: boolean
          launched_at?: string | null
          payout_mode?: Database["public"]["Enums"]["payout_mode"]
          rejection_reason?: string | null
          rejection_reason_code?: string | null
          short_description: string
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          amount_pledged_sgd?: number
          backer_count?: number
          category_id?: string
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          deadline?: string
          deleted_at?: string | null
          failed_at?: string | null
          full_description?: string
          funded_at?: string | null
          funding_goal_sgd?: number
          id?: string
          is_featured?: boolean
          launched_at?: string | null
          payout_mode?: Database["public"]["Enums"]["payout_mode"]
          rejection_reason?: string | null
          rejection_reason_code?: string | null
          short_description?: string
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          claimed_count: number
          created_at: string
          description: string | null
          display_order: number
          estimated_delivery_date: string | null
          id: string
          image_url: string | null
          includes_physical_item: boolean
          is_active: boolean
          max_backers: number | null
          minimum_pledge_sgd: number
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          claimed_count?: number
          created_at?: string
          description?: string | null
          display_order?: number
          estimated_delivery_date?: string | null
          id?: string
          image_url?: string | null
          includes_physical_item?: boolean
          is_active?: boolean
          max_backers?: number | null
          minimum_pledge_sgd: number
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          claimed_count?: number
          created_at?: string
          description?: string | null
          display_order?: number
          estimated_delivery_date?: string | null
          id?: string
          image_url?: string | null
          includes_physical_item?: boolean
          is_active?: boolean
          max_backers?: number | null
          minimum_pledge_sgd?: number
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stretch_goals: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          goal_amount_sgd: number
          id: string
          project_id: string
          reached_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          goal_amount_sgd: number
          id?: string
          project_id: string
          reached_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          goal_amount_sgd?: number
          id?: string
          project_id?: string
          reached_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stretch_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_platform_fee: {
        Args: { p_amount_sgd: number }
        Returns: number
      }
      check_stretch_goals: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      claim_reward_slot: { Args: { p_reward_id: string }; Returns: boolean }
      decrement_pledge_totals: {
        Args: { p_amount_sgd: number; p_project_id: string }
        Returns: undefined
      }
      increment_pledge_totals: {
        Args: { p_amount_sgd: number; p_project_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      process_expired_campaigns: {
        Args: never
        Returns: {
          goal: number
          outcome: string
          project_id: string
          total_pledged: number
        }[]
      }
      release_reward_slot: { Args: { p_reward_id: string }; Returns: undefined }
    }
    Enums: {
      fulfillment_status: "unfulfilled" | "shipped" | "delivered"
      kyc_status: "unverified" | "pending" | "approved" | "rejected"
      payment_method_type: "card" | "paynow"
      payout_mode: "manual" | "automatic"
      payout_status: "pending" | "processing" | "paid" | "failed"
      pledge_status:
        | "pending"
        | "authorized"
        | "paynow_captured"
        | "captured"
        | "released"
        | "refunded"
        | "failed"
      pm_status: "pending_review" | "approved" | "rejected"
      project_status:
        | "draft"
        | "active"
        | "funded"
        | "failed"
        | "cancelled"
        | "pending_review"
        | "removed"
      user_role: "backer" | "project_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      fulfillment_status: ["unfulfilled", "shipped", "delivered"],
      kyc_status: ["unverified", "pending", "approved", "rejected"],
      payment_method_type: ["card", "paynow"],
      payout_mode: ["manual", "automatic"],
      payout_status: ["pending", "processing", "paid", "failed"],
      pledge_status: [
        "pending",
        "authorized",
        "paynow_captured",
        "captured",
        "released",
        "refunded",
        "failed",
      ],
      pm_status: ["pending_review", "approved", "rejected"],
      project_status: [
        "draft",
        "active",
        "funded",
        "failed",
        "cancelled",
        "pending_review",
        "removed",
      ],
      user_role: ["backer", "project_manager"],
    },
  },
} as const
