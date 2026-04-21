export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      buildings: {
        Row: {
          address: string
          billing_status: Database["public"]["Enums"]["billing_status"]
          company_id: string
          created_at: string
          id: string
          logo_storage_path: string | null
          name: string
          recommended_batches_by_unit_type: Json
          stripe_customer_id: string | null
          tenant_contact_info: Json | null
          updated_at: string
        }
        Insert: {
          address: string
          billing_status?: Database["public"]["Enums"]["billing_status"]
          company_id: string
          created_at?: string
          id?: string
          logo_storage_path?: string | null
          name: string
          recommended_batches_by_unit_type?: Json
          stripe_customer_id?: string | null
          tenant_contact_info?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string
          billing_status?: Database["public"]["Enums"]["billing_status"]
          company_id?: string
          created_at?: string
          id?: string
          logo_storage_path?: string | null
          name?: string
          recommended_batches_by_unit_type?: Json
          stripe_customer_id?: string | null
          tenant_contact_info?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_line_items: {
        Row: {
          billing_period: string
          building_id: string
          category: Database["public"]["Enums"]["cost_category"]
          created_at: string
          entered_by_user_id: string | null
          id: string
          incurred_on: string
          invoice_id: string | null
          markup_cents: number
          move_in_id: string | null
          passthrough_cents: number
          total_cents: number | null
          updated_at: string
        }
        Insert: {
          billing_period: string
          building_id: string
          category: Database["public"]["Enums"]["cost_category"]
          created_at?: string
          entered_by_user_id?: string | null
          id?: string
          incurred_on: string
          invoice_id?: string | null
          markup_cents?: number
          move_in_id?: string | null
          passthrough_cents?: number
          total_cents?: number | null
          updated_at?: string
        }
        Update: {
          billing_period?: string
          building_id?: string
          category?: Database["public"]["Enums"]["cost_category"]
          created_at?: string
          entered_by_user_id?: string | null
          id?: string
          incurred_on?: string
          invoice_id?: string | null
          markup_cents?: number
          move_in_id?: string | null
          passthrough_cents?: number
          total_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_line_items_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "cost_line_items_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_line_items_entered_by_user_id_fkey"
            columns: ["entered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_line_items_move_in_id_fkey"
            columns: ["move_in_id"]
            isOneToOne: false
            referencedRelation: "move_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_line_items_move_in_id_fkey"
            columns: ["move_in_id"]
            isOneToOne: false
            referencedRelation: "overdue_move_ins"
            referencedColumns: ["move_in_id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_period: string
          building_id: string
          created_at: string
          failed_at: string | null
          finalized_at: string | null
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          billing_period: string
          building_id: string
          created_at?: string
          failed_at?: string | null
          finalized_at?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          building_id?: string
          created_at?: string
          failed_at?: string | null
          finalized_at?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "invoices_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      move_in_events: {
        Row: {
          actor_user_id: string | null
          event_type: Database["public"]["Enums"]["move_in_event_type"]
          id: string
          move_in_id: string
          occurred_at: string
          payload: Json
        }
        Insert: {
          actor_user_id?: string | null
          event_type: Database["public"]["Enums"]["move_in_event_type"]
          id?: string
          move_in_id: string
          occurred_at?: string
          payload?: Json
        }
        Update: {
          actor_user_id?: string | null
          event_type?: Database["public"]["Enums"]["move_in_event_type"]
          id?: string
          move_in_id?: string
          occurred_at?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "move_in_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_in_events_move_in_id_fkey"
            columns: ["move_in_id"]
            isOneToOne: false
            referencedRelation: "move_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_in_events_move_in_id_fkey"
            columns: ["move_in_id"]
            isOneToOne: false
            referencedRelation: "overdue_move_ins"
            referencedColumns: ["move_in_id"]
          },
        ]
      }
      move_ins: {
        Row: {
          batch_count: number
          building_id: string
          created_at: string
          created_by_user_id: string | null
          delivered_at: string | null
          external_id: string | null
          id: string
          move_in_date: string
          returned_at: string | null
          state: Database["public"]["Enums"]["move_in_state"]
          tenant_email: string
          tenant_name: string
          tenant_phone: string | null
          unit_label: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          batch_count: number
          building_id: string
          created_at?: string
          created_by_user_id?: string | null
          delivered_at?: string | null
          external_id?: string | null
          id?: string
          move_in_date: string
          returned_at?: string | null
          state?: Database["public"]["Enums"]["move_in_state"]
          tenant_email: string
          tenant_name: string
          tenant_phone?: string | null
          unit_label: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          batch_count?: number
          building_id?: string
          created_at?: string
          created_by_user_id?: string | null
          delivered_at?: string | null
          external_id?: string | null
          id?: string
          move_in_date?: string
          returned_at?: string | null
          state?: Database["public"]["Enums"]["move_in_state"]
          tenant_email?: string
          tenant_name?: string
          tenant_phone?: string | null
          unit_label?: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_ins_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "move_ins_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_ins_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_emails: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["tenant_email_kind"]
          move_in_id: string
          resend_message_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["tenant_email_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["tenant_email_kind"]
          move_in_id: string
          resend_message_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["tenant_email_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["tenant_email_kind"]
          move_in_id?: string
          resend_message_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["tenant_email_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_emails_move_in_id_fkey"
            columns: ["move_in_id"]
            isOneToOne: false
            referencedRelation: "move_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_emails_move_in_id_fkey"
            columns: ["move_in_id"]
            isOneToOne: false
            referencedRelation: "overdue_move_ins"
            referencedColumns: ["move_in_id"]
          },
        ]
      }
      tote_acquisitions: {
        Row: {
          acquisition_type: Database["public"]["Enums"]["tote_acquisition_type"]
          building_id: string
          count: number
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          acquisition_type: Database["public"]["Enums"]["tote_acquisition_type"]
          building_id: string
          count: number
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          acquisition_type?: Database["public"]["Enums"]["tote_acquisition_type"]
          building_id?: string
          count?: number
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tote_acquisitions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "tote_acquisitions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      tote_losses: {
        Row: {
          building_id: string
          count: number
          created_at: string
          id: string
          notes: string | null
          reason: Database["public"]["Enums"]["tote_loss_reason"]
          reported_by_user_id: string | null
        }
        Insert: {
          building_id: string
          count: number
          created_at?: string
          id?: string
          notes?: string | null
          reason: Database["public"]["Enums"]["tote_loss_reason"]
          reported_by_user_id?: string | null
        }
        Update: {
          building_id?: string
          count?: number
          created_at?: string
          id?: string
          notes?: string | null
          reason?: Database["public"]["Enums"]["tote_loss_reason"]
          reported_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tote_losses_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "tote_losses_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tote_losses_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tote_pools: {
        Row: {
          building_id: string
          count: number
          created_at: string
          id: string
          location: Database["public"]["Enums"]["tote_location"]
          updated_at: string
        }
        Insert: {
          building_id: string
          count?: number
          created_at?: string
          id?: string
          location: Database["public"]["Enums"]["tote_location"]
          updated_at?: string
        }
        Update: {
          building_id?: string
          count?: number
          created_at?: string
          id?: string
          location?: Database["public"]["Enums"]["tote_location"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tote_pools_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "tote_pools_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          building_id: string | null
          company_id: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "users_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      building_billing_summary: {
        Row: {
          billing_period: string | null
          building_id: string | null
          markup_cents: number | null
          passthrough_cents: number | null
          subscription_cents: number | null
          total_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_line_items_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "cost_line_items_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      building_inventory_summary: {
        Row: {
          at_3pl: number | null
          building_id: string | null
          in_building: number | null
          lost: number | null
          out_with_tenant: number | null
          palletization_progress_pct: number | null
          total_owned: number | null
        }
        Relationships: []
      }
      overdue_move_ins: {
        Row: {
          building_id: string | null
          days_overdue: number | null
          move_in_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "move_ins_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building_inventory_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "move_ins_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_building_id: { Args: never; Returns: string }
      current_user_company_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      decrement_pool: {
        Args: {
          p_amount: number
          p_building_id: string
          p_location: Database["public"]["Enums"]["tote_location"]
        }
        Returns: undefined
      }
      increment_pool: {
        Args: {
          p_amount: number
          p_building_id: string
          p_location: Database["public"]["Enums"]["tote_location"]
        }
        Returns: undefined
      }
    }
    Enums: {
      billing_status: "setup_pending" | "active" | "delinquent"
      cost_category:
        | "delivery"
        | "pickup"
        | "warehousing"
        | "management_fee"
        | "subscription"
      invoice_status: "draft" | "finalized" | "paid" | "failed" | "void"
      move_in_event_type:
        | "created"
        | "delivered"
        | "returned"
        | "cancelled"
        | "email_scheduled_sent"
        | "email_delivered_sent"
        | "email_reminder_sent"
        | "email_bounced"
      move_in_state: "pending_delivery" | "delivered" | "returned" | "cancelled"
      tenant_email_kind: "scheduled" | "delivered" | "reminder_48h"
      tenant_email_status: "pending" | "sent" | "failed" | "bounced"
      tote_acquisition_type: "initial" | "reorder"
      tote_location: "in_building" | "at_3pl" | "out_with_tenant"
      tote_loss_reason: "lost" | "damaged" | "decommissioned"
      unit_type: "studio" | "1br" | "2br" | "3br_plus" | "other"
      user_role: "pm_billing_admin" | "company_admin" | "totes_admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_status: ["setup_pending", "active", "delinquent"],
      cost_category: [
        "delivery",
        "pickup",
        "warehousing",
        "management_fee",
        "subscription",
      ],
      invoice_status: ["draft", "finalized", "paid", "failed", "void"],
      move_in_event_type: [
        "created",
        "delivered",
        "returned",
        "cancelled",
        "email_scheduled_sent",
        "email_delivered_sent",
        "email_reminder_sent",
        "email_bounced",
      ],
      move_in_state: ["pending_delivery", "delivered", "returned", "cancelled"],
      tenant_email_kind: ["scheduled", "delivered", "reminder_48h"],
      tenant_email_status: ["pending", "sent", "failed", "bounced"],
      tote_acquisition_type: ["initial", "reorder"],
      tote_location: ["in_building", "at_3pl", "out_with_tenant"],
      tote_loss_reason: ["lost", "damaged", "decommissioned"],
      unit_type: ["studio", "1br", "2br", "3br_plus", "other"],
      user_role: ["pm_billing_admin", "company_admin", "totes_admin"],
    },
  },
} as const

