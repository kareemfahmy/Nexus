// GENERATED from the live Supabase schema (Supabase MCP `generate_typescript_types`).
// Do not edit by hand. Regenerate after every migration.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          created_at: string
          customer_id: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          job_title: string | null
          phone: string | null
          site_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          phone?: string | null
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          phone?: string | null
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "v_site_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string
          billing_address_line1: string | null
          billing_city: string | null
          billing_email: string | null
          billing_postal_code: string | null
          billing_state: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          notes: string | null
          payment_terms: string
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string
        }
        Insert: {
          account_number: string
          billing_address_line1?: string | null
          billing_city?: string | null
          billing_email?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          payment_terms?: string
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Update: {
          account_number?: string
          billing_address_line1?: string | null
          billing_city?: string | null
          billing_email?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          payment_terms?: string
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          connectivity_status: Database["public"]["Enums"]["connectivity_status"]
          created_at: string
          device_type: Database["public"]["Enums"]["device_type"]
          equipment_id: string | null
          external_id: string
          firmware_version: string | null
          health_score: number | null
          id: string
          installed_on: string | null
          is_simulated: boolean
          last_seen_at: string | null
          manufacturer: string | null
          model: string | null
          name: string
          provider: string
          site_id: string
          updated_at: string
        }
        Insert: {
          connectivity_status?: Database["public"]["Enums"]["connectivity_status"]
          created_at?: string
          device_type: Database["public"]["Enums"]["device_type"]
          equipment_id?: string | null
          external_id: string
          firmware_version?: string | null
          health_score?: number | null
          id?: string
          installed_on?: string | null
          is_simulated?: boolean
          last_seen_at?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          provider?: string
          site_id: string
          updated_at?: string
        }
        Update: {
          connectivity_status?: Database["public"]["Enums"]["connectivity_status"]
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          equipment_id?: string | null
          external_id?: string
          firmware_version?: string | null
          health_score?: number | null
          id?: string
          installed_on?: string | null
          is_simulated?: boolean
          last_seen_at?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          provider?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "v_site_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          area_served: string | null
          category: Database["public"]["Enums"]["equipment_category"]
          created_at: string
          id: string
          install_date: string | null
          manufacturer: string | null
          model: string | null
          name: string
          serial_number: string | null
          site_id: string
          specs: Json
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
          warranty_until: string | null
        }
        Insert: {
          area_served?: string | null
          category: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          serial_number?: string | null
          site_id: string
          specs?: Json
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          warranty_until?: string | null
        }
        Update: {
          area_served?: string | null
          category?: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          serial_number?: string | null
          site_id?: string
          specs?: Json
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "v_site_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          changed_fields: Json
          created_at: string
          equipment_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changed_fields?: Json
          created_at?: string
          equipment_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changed_fields?: Json
          created_at?: string
          equipment_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_audit_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          equipment_id: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          equipment_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          equipment_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_notes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          incident_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          incident_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          incident_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["incident_event_type"]
          id: string
          incident_id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["incident_event_type"]
          id?: string
          incident_id: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["incident_event_type"]
          id?: string
          incident_id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          device_id: string | null
          display_id: string | null
          equipment_id: string | null
          id: string
          incident_number: number
          opened_at: string
          resolution: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          site_id: string
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          device_id?: string | null
          display_id?: string | null
          equipment_id?: string | null
          id?: string
          incident_number?: never
          opened_at?: string
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          site_id: string
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          device_id?: string | null
          display_id?: string | null
          equipment_id?: string | null
          id?: string
          incident_number?: never
          opened_at?: string
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          site_id?: string
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "v_site_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          address_line1: string
          city: string
          code: string
          created_at: string
          customer_id: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          opened_on: string | null
          postal_code: string
          square_footage: number | null
          state: string
          status: Database["public"]["Enums"]["site_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line1: string
          city: string
          code: string
          created_at?: string
          customer_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          opened_on?: string | null
          postal_code: string
          square_footage?: number | null
          state: string
          status?: Database["public"]["Enums"]["site_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          city?: string
          code?: string
          created_at?: string
          customer_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          opened_on?: string | null
          postal_code?: string
          square_footage?: number | null
          state?: string
          status?: Database["public"]["Enums"]["site_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          team: Database["public"]["Enums"]["team"]
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          team?: Database["public"]["Enums"]["team"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          team?: Database["public"]["Enums"]["team"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      telemetry: {
        Row: {
          device_id: string
          id: number
          metric: Database["public"]["Enums"]["telemetry_metric"]
          recorded_at: string
          value: number
        }
        Insert: {
          device_id: string
          id?: never
          metric: Database["public"]["Enums"]["telemetry_metric"]
          recorded_at: string
          value: number
        }
        Update: {
          device_id?: string
          id?: never
          metric?: Database["public"]["Enums"]["telemetry_metric"]
          recorded_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          trade: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          trade: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          trade?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_id: string | null
          equipment_id: string | null
          id: string
          priority: Database["public"]["Enums"]["wo_priority"]
          scheduled_for: string | null
          site_id: string
          status: Database["public"]["Enums"]["wo_status"]
          title: string
          updated_at: string
          vendor_id: string | null
          wo_number: number
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_id?: string | null
          equipment_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["wo_priority"]
          scheduled_for?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["wo_status"]
          title: string
          updated_at?: string
          vendor_id?: string | null
          wo_number?: never
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_id?: string | null
          equipment_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["wo_priority"]
          scheduled_for?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["wo_status"]
          title?: string
          updated_at?: string
          vendor_id?: string | null
          wo_number?: never
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "v_site_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_dashboard_kpis: {
        Row: {
          active_work_orders: number | null
          critical_incidents: number | null
          customers: number | null
          devices: number | null
          devices_offline: number | null
          devices_online: number | null
          devices_unknown: number | null
          devices_warning: number | null
          equipment: number | null
          open_incidents: number | null
          overdue_work_orders: number | null
          sites: number | null
        }
        Relationships: []
      }
      v_device_latest: {
        Row: {
          device_id: string | null
          metric: Database["public"]["Enums"]["telemetry_metric"] | null
          recorded_at: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      v_site_summary: {
        Row: {
          city: string | null
          code: string | null
          critical_incidents: number | null
          customer_id: string | null
          customer_name: string | null
          device_count: number | null
          devices_offline: number | null
          devices_online: number | null
          devices_unknown: number | null
          devices_warning: number | null
          equipment_count: number | null
          equipment_down: number | null
          id: string | null
          name: string | null
          open_incidents: number | null
          open_work_orders: number | null
          overdue_work_orders: number | null
          state: string | null
          status: Database["public"]["Enums"]["site_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      can_write: { Args: never; Returns: boolean }
      current_member_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_seeding: { Args: never; Returns: boolean }
      ops_weekly_trend: {
        Args: { p_weeks?: number }
        Returns: {
          incidents_opened: number
          incidents_resolved: number
          week: string
          wo_completed: number
          wo_created: number
        }[]
      }
      telemetry_series: {
        Args: { p_bucket: unknown; p_device_id: string; p_since: string }
        Returns: {
          bucket: string
          metric: Database["public"]["Enums"]["telemetry_metric"]
          value: number
        }[]
      }
    }
    Enums: {
      app_role: "viewer" | "operator" | "admin"
      connectivity_status: "online" | "offline" | "warning" | "unknown"
      customer_status: "active" | "onboarding" | "inactive"
      device_type:
        | "thermostat"
        | "gateway"
        | "energy_meter"
        | "temp_sensor"
        | "humidity_sensor"
        | "controller"
        | "other"
      equipment_category:
        | "hvac"
        | "cooler"
        | "freezer"
        | "make_up_air"
        | "exhaust"
        | "other"
      equipment_status: "operational" | "degraded" | "down" | "decommissioned"
      incident_event_type:
        | "created"
        | "status_change"
        | "assignment"
        | "severity_change"
      incident_severity: "sev1" | "sev2" | "sev3" | "sev4"
      incident_status:
        | "open"
        | "in_progress"
        | "pending"
        | "resolved"
        | "closed"
      site_status: "active" | "onboarding" | "inactive"
      team: "support" | "field_service" | "operations"
      telemetry_metric:
        | "room_temp_f"
        | "humidity_pct"
        | "cooling_setpoint_f"
        | "heating_setpoint_f"
        | "temperature_f"
        | "power_kw"
      wo_priority: "low" | "medium" | "high" | "urgent"
      wo_status:
        | "open"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["viewer", "operator", "admin"],
      connectivity_status: ["online", "offline", "warning", "unknown"],
      customer_status: ["active", "onboarding", "inactive"],
      device_type: [
        "thermostat",
        "gateway",
        "energy_meter",
        "temp_sensor",
        "humidity_sensor",
        "controller",
        "other",
      ],
      equipment_category: [
        "hvac",
        "cooler",
        "freezer",
        "make_up_air",
        "exhaust",
        "other",
      ],
      equipment_status: ["operational", "degraded", "down", "decommissioned"],
      incident_event_type: [
        "created",
        "status_change",
        "assignment",
        "severity_change",
      ],
      incident_severity: ["sev1", "sev2", "sev3", "sev4"],
      incident_status: ["open", "in_progress", "pending", "resolved", "closed"],
      site_status: ["active", "onboarding", "inactive"],
      team: ["support", "field_service", "operations"],
      telemetry_metric: [
        "room_temp_f",
        "humidity_pct",
        "cooling_setpoint_f",
        "heating_setpoint_f",
        "temperature_f",
        "power_kw",
      ],
      wo_priority: ["low", "medium", "high", "urgent"],
      wo_status: ["open", "scheduled", "in_progress", "completed", "cancelled"],
    },
  },
} as const
