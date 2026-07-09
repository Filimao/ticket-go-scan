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
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          created_at: string
          event_id: string
          id: string
          qr_code: string
          result: string
          scanned_by: string | null
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          qr_code: string
          result: string
          scanned_by?: string | null
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          qr_code?: string
          result?: string
          scanned_by?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          assigned_by: string | null
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          featured: boolean
          id: string
          image_url: string | null
          organizer_id: string | null
          slug: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          organizer_id?: string | null
          slug?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          organizer_id?: string | null
          slug?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          commission_type: string
          commission_value: number
          currency: string
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commission_type?: string
          commission_value?: number
          currency?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commission_type?: string
          commission_value?: number
          currency?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_approved_organizer: boolean
          is_blocked: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_approved_organizer?: boolean
          is_blocked?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved_organizer?: boolean
          is_blocked?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          name: string
          price: number
          quantity_sold: number
          quantity_total: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          price?: number
          quantity_sold?: number
          quantity_total?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price?: number
          quantity_sold?: number
          quantity_total?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          buyer_email: string
          buyer_name: string
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          price_paid: number
          qr_code: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          price_paid?: number
          qr_code: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          price_paid?: number
          qr_code?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      checkin_ticket: {
        Args: { _event_id: string; _qr: string }
        Returns: Json
      }
      confirm_ticket_payment: {
        Args: { _ticket_id: string }
        Returns: {
          buyer_email: string
          buyer_name: string
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          price_paid: number
          qr_code: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          used_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_ticket_payment: {
        Args: { _ticket_id: string }
        Returns: {
          buyer_email: string
          buyer_name: string
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          price_paid: number
          qr_code: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          used_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "organizer" | "customer"
      event_status:
        | "draft"
        | "published"
        | "cancelled"
        | "pending"
        | "rejected"
        | "ended"
      ticket_status: "valid" | "used" | "cancelled" | "pending_payment"
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
      app_role: ["admin", "organizer", "customer"],
      event_status: [
        "draft",
        "published",
        "cancelled",
        "pending",
        "rejected",
        "ended",
      ],
      ticket_status: ["valid", "used", "cancelled", "pending_payment"],
    },
  },
} as const
