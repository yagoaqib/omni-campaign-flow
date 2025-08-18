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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audience_items: {
        Row: {
          audience_id: string
          e164: string | null
          id: string
          opt_in: boolean | null
          raw_msisdn: string
          validation_status: string
          wa_id: string | null
        }
        Insert: {
          audience_id: string
          e164?: string | null
          id?: string
          opt_in?: boolean | null
          raw_msisdn: string
          validation_status?: string
          wa_id?: string | null
        }
        Update: {
          audience_id?: string
          e164?: string | null
          id?: string
          opt_in?: boolean | null
          raw_msisdn?: string
          validation_status?: string
          wa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audience_items_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audiences"
            referencedColumns: ["id"]
          },
        ]
      }
      audiences: {
        Row: {
          created_at: string | null
          id: string
          invalid_count: number | null
          name: string
          total: number | null
          valid_count: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invalid_count?: number | null
          name: string
          total?: number | null
          valid_count?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invalid_count?: number | null
          name?: string
          total?: number | null
          valid_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_numbers: {
        Row: {
          campaign_id: string
          min_quality: string
          phone_number_ref: string
          pos: number
          quota: number
        }
        Insert: {
          campaign_id: string
          min_quality?: string
          phone_number_ref: string
          pos: number
          quota: number
        }
        Update: {
          campaign_id?: string
          min_quality?: string
          phone_number_ref?: string
          pos?: number
          quota?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_numbers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_numbers_phone_number_ref_fkey"
            columns: ["phone_number_ref"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_template_stacks: {
        Row: {
          campaign_id: string
          category: string
          stack_ref: string
        }
        Insert: {
          campaign_id: string
          category: string
          stack_ref: string
        }
        Update: {
          campaign_id?: string
          category?: string
          stack_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_template_stacks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_template_stacks_stack_ref_fkey"
            columns: ["stack_ref"]
            isOneToOne: false
            referencedRelation: "template_stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_id: string | null
          cascade_policy_id: string | null
          created_at: string | null
          deadline_at: string | null
          desired_category: string
          id: string
          name: string
          status: string
          workspace_id: string
        }
        Insert: {
          audience_id?: string | null
          cascade_policy_id?: string | null
          created_at?: string | null
          deadline_at?: string | null
          desired_category?: string
          id?: string
          name: string
          status?: string
          workspace_id: string
        }
        Update: {
          audience_id?: string | null
          cascade_policy_id?: string | null
          created_at?: string | null
          deadline_at?: string | null
          desired_category?: string
          id?: string
          name?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cascade_policies: {
        Row: {
          campaign_id: string
          created_at: string
          desired_category: string
          id: string
          min_quality: string
          number_quotas: Json
          numbers_order: Json
          per_number: Json
          retry_backoff_sec: number
          retry_max: number
          rules: Json
          template_stack_mkt: string | null
          template_stack_util: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          desired_category?: string
          id?: string
          min_quality?: string
          number_quotas?: Json
          numbers_order?: Json
          per_number?: Json
          retry_backoff_sec?: number
          retry_max?: number
          rules?: Json
          template_stack_mkt?: string | null
          template_stack_util?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          desired_category?: string
          id?: string
          min_quality?: string
          number_quotas?: Json
          numbers_order?: Json
          per_number?: Json
          retry_backoff_sec?: number
          retry_max?: number
          rules?: Json
          template_stack_mkt?: string | null
          template_stack_util?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      contact_list_assignments: {
        Row: {
          assigned_at: string
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          assigned_at?: string
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          assigned_at?: string
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: []
      }
      contact_lists: {
        Row: {
          contact_count: number
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contact_count?: number
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contact_count?: number
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      contact_tag_assignments: {
        Row: {
          assigned_at: string
          contact_id: string
          id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          contact_id: string
          id?: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          contact_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          category: string
          color: string
          contact_count: number
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string
          color?: string
          contact_count?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          color?: string
          contact_count?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          has_whatsapp: boolean
          id: string
          last_contact: string | null
          name: string | null
          phone: string
          source: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          has_whatsapp?: boolean
          id?: string
          last_contact?: string | null
          name?: string | null
          phone: string
          source?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          has_whatsapp?: boolean
          id?: string
          last_contact?: string | null
          name?: string | null
          phone?: string
          source?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      dispatch_jobs: {
        Row: {
          attempts: number
          audience_item_id: string
          campaign_id: string
          client_msg_id: string | null
          error_code: string | null
          id: string
          last_status_at: string | null
          phone_number_ref: string | null
          sent_at: string | null
          status: string
          template_ref: string | null
        }
        Insert: {
          attempts?: number
          audience_item_id: string
          campaign_id: string
          client_msg_id?: string | null
          error_code?: string | null
          id?: string
          last_status_at?: string | null
          phone_number_ref?: string | null
          sent_at?: string | null
          status?: string
          template_ref?: string | null
        }
        Update: {
          attempts?: number
          audience_item_id?: string
          campaign_id?: string
          client_msg_id?: string | null
          error_code?: string | null
          id?: string
          last_status_at?: string | null
          phone_number_ref?: string | null
          sent_at?: string | null
          status?: string
          template_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_jobs_audience_item_id_fkey"
            columns: ["audience_item_id"]
            isOneToOne: false
            referencedRelation: "audience_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_jobs_phone_number_ref_fkey"
            columns: ["phone_number_ref"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_jobs_template_ref_fkey"
            columns: ["template_ref"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string
          components_schema: Json
          created_at: string
          id: string
          language: string
          name: string
          status: string
          updated_at: string
          waba_id: string
          workspace_id: string
        }
        Insert: {
          category?: string
          components_schema?: Json
          created_at?: string
          id?: string
          language?: string
          name: string
          status?: string
          updated_at?: string
          waba_id: string
          workspace_id: string
        }
        Update: {
          category?: string
          components_schema?: Json
          created_at?: string
          id?: string
          language?: string
          name?: string
          status?: string
          updated_at?: string
          waba_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      number_validation_results: {
        Row: {
          contact_id: string
          cost: number | null
          created_at: string
          description: string | null
          id: string
          reason: string
          validated_at: string
        }
        Insert: {
          contact_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          validated_at?: string
        }
        Update: {
          contact_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          validated_at?: string
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          created_at: string | null
          display_number: string
          id: string
          last_health_at: string | null
          mps_target: number
          phone_number_id: string
          quality_rating: string
          status: string
          waba_ref: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          display_number: string
          id?: string
          last_health_at?: string | null
          mps_target?: number
          phone_number_id: string
          quality_rating?: string
          status?: string
          waba_ref: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          display_number?: string
          id?: string
          last_health_at?: string | null
          mps_target?: number
          phone_number_id?: string
          quality_rating?: string
          status?: string
          waba_ref?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_waba_ref_fkey"
            columns: ["waba_ref"]
            isOneToOne: false
            referencedRelation: "wabas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      template_stack_items: {
        Row: {
          pos: number
          stack_id: string
          template_id: string
        }
        Insert: {
          pos: number
          stack_id: string
          template_id: string
        }
        Update: {
          pos?: number
          stack_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_stack_items_stack_id_fkey"
            columns: ["stack_id"]
            isOneToOne: false
            referencedRelation: "template_stacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_stack_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_stacks: {
        Row: {
          category: string
          id: string
          workspace_id: string
        }
        Insert: {
          category: string
          id?: string
          workspace_id: string
        }
        Update: {
          category?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_stacks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      template_statuses: {
        Row: {
          created_at: string
          id: string
          phone_number_ref: string
          review_reason: string | null
          status: string
          synced_at: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number_ref: string
          review_reason?: string | null
          status?: string
          synced_at?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number_ref?: string
          review_reason?: string | null
          status?: string
          synced_at?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          components_schema: Json
          created_at: string | null
          id: string
          language: string
          name: string
          status: string
          waba_ref: string
          workspace_id: string
        }
        Insert: {
          category: string
          components_schema: Json
          created_at?: string | null
          id?: string
          language: string
          name: string
          status: string
          waba_ref: string
          workspace_id: string
        }
        Update: {
          category?: string
          components_schema?: Json
          created_at?: string | null
          id?: string
          language?: string
          name?: string
          status?: string
          waba_ref?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_waba_ref_fkey"
            columns: ["waba_ref"]
            isOneToOne: false
            referencedRelation: "wabas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wabas: {
        Row: {
          access_token: string | null
          app_secret: string | null
          created_at: string | null
          id: string
          meta_business_id: string
          name: string | null
          verify_token: string | null
          waba_id: string
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          app_secret?: string | null
          created_at?: string | null
          id?: string
          meta_business_id: string
          name?: string | null
          verify_token?: string | null
          waba_id: string
          workspace_id: string
        }
        Update: {
          access_token?: string | null
          app_secret?: string | null
          created_at?: string | null
          id?: string
          meta_business_id?: string
          name?: string | null
          verify_token?: string | null
          waba_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wabas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          related_dispatch_job_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          related_dispatch_job_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          related_dispatch_job_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          timezone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          timezone?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_workspace_role: {
        Args: { _roles: string[]; _workspace_id: string }
        Returns: boolean
      }
      is_member: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
