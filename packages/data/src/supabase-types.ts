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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      dispatch_assignments: {
        Row: {
          accepted_at: string | null
          agency: string
          council_area: string | null
          dispatched_at: string
          en_route_at: string | null
          id: string
          incident_id: string
          on_site_at: string | null
          resolved_at: string | null
          responder_id: string | null
          responder_name: string | null
          sla_seconds: number | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          agency?: string
          council_area?: string | null
          dispatched_at?: string
          en_route_at?: string | null
          id?: string
          incident_id: string
          on_site_at?: string | null
          resolved_at?: string | null
          responder_id?: string | null
          responder_name?: string | null
          sla_seconds?: number | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          agency?: string
          council_area?: string | null
          dispatched_at?: string
          en_route_at?: string | null
          id?: string
          incident_id?: string
          on_site_at?: string | null
          resolved_at?: string | null
          responder_id?: string | null
          responder_name?: string | null
          sla_seconds?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_assignments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_team_members: {
        Row: {
          assignment_id: string
          id: string
          joined_at: string
          responder_id: string | null
          responder_name: string
          role: string
          status: string
        }
        Insert: {
          assignment_id: string
          id?: string
          joined_at?: string
          responder_id?: string | null
          responder_name: string
          role?: string
          status?: string
        }
        Update: {
          assignment_id?: string
          id?: string
          joined_at?: string
          responder_id?: string | null
          responder_name?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_team_members_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "dispatch_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          details: string
          event_type: string
          id: string
          lga: string | null
          location: string | null
          mast_id: string | null
          resolved_at: string | null
          severity: string
          snapshot_url: string | null
          source: string
          state: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details: string
          event_type?: string
          id?: string
          lga?: string | null
          location?: string | null
          mast_id?: string | null
          resolved_at?: string | null
          severity?: string
          snapshot_url?: string | null
          source?: string
          state?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          event_type?: string
          id?: string
          lga?: string | null
          location?: string | null
          mast_id?: string | null
          resolved_at?: string | null
          severity?: string
          snapshot_url?: string | null
          source?: string
          state?: string | null
          status?: string
        }
        Relationships: []
      }
      responder_locations: {
        Row: {
          accuracy: number | null
          assignment_id: string | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          responder_id: string
        }
        Insert: {
          accuracy?: number | null
          assignment_id?: string | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          responder_id: string
        }
        Update: {
          accuracy?: number | null
          assignment_id?: string | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          responder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responder_locations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "dispatch_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      responder_messages: {
        Row: {
          assignment_id: string
          content: string | null
          created_at: string
          id: string
          message_type: string
          sender_id: string | null
          sender_name: string
          sender_role: string
          voice_duration_seconds: number | null
          voice_url: string | null
        }
        Insert: {
          assignment_id: string
          content?: string | null
          created_at?: string
          id?: string
          message_type?: string
          sender_id?: string | null
          sender_name: string
          sender_role?: string
          voice_duration_seconds?: number | null
          voice_url?: string | null
        }
        Update: {
          assignment_id?: string
          content?: string | null
          created_at?: string
          id?: string
          message_type?: string
          sender_id?: string | null
          sender_name?: string
          sender_role?: string
          voice_duration_seconds?: number | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responder_messages_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "dispatch_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      responder_performance: {
        Row: {
          avg_response_seconds: number | null
          council_area: string
          created_at: string
          id: string
          last_active_at: string | null
          responder_id: string | null
          responder_name: string
          total_accepted: number
          total_dispatches: number
          total_ducked: number
          total_rejected: number
        }
        Insert: {
          avg_response_seconds?: number | null
          council_area?: string
          created_at?: string
          id?: string
          last_active_at?: string | null
          responder_id?: string | null
          responder_name: string
          total_accepted?: number
          total_dispatches?: number
          total_ducked?: number
          total_rejected?: number
        }
        Update: {
          avg_response_seconds?: number | null
          council_area?: string
          created_at?: string
          id?: string
          last_active_at?: string | null
          responder_id?: string | null
          responder_name?: string
          total_accepted?: number
          total_dispatches?: number
          total_ducked?: number
          total_rejected?: number
        }
        Relationships: []
      }
      response_sla_logs: {
        Row: {
          assignment_id: string
          created_at: string
          dispatch_to_accept_seconds: number | null
          dispatch_to_arrival_seconds: number | null
          dispatch_to_resolve_seconds: number | null
          id: string
          incident_id: string
          sla_met: boolean | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          dispatch_to_accept_seconds?: number | null
          dispatch_to_arrival_seconds?: number | null
          dispatch_to_resolve_seconds?: number | null
          id?: string
          incident_id: string
          sla_met?: boolean | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          dispatch_to_accept_seconds?: number | null
          dispatch_to_arrival_seconds?: number | null
          dispatch_to_resolve_seconds?: number | null
          id?: string
          incident_id?: string
          sla_met?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "response_sla_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "dispatch_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_sla_logs_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "telecom_admin"
        | "nscdc_command"
        | "nscdc_responder"
        | "ncc_regulator"
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
      app_role: [
        "telecom_admin",
        "nscdc_command",
        "nscdc_responder",
        "ncc_regulator",
      ],
    },
  },
} as const
