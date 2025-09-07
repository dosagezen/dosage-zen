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
      collaborations: {
        Row: {
          collaborator_profile_id: string
          collaborator_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          id: string
          is_active: boolean | null
          patient_profile_id: string
          updated_at: string
        }
        Insert: {
          collaborator_profile_id: string
          collaborator_role: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          patient_profile_id: string
          updated_at?: string
        }
        Update: {
          collaborator_profile_id?: string
          collaborator_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          patient_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_collaborator_profile_id_fkey"
            columns: ["collaborator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          collaborator_code: string
          collaborator_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          created_by: string
          id: string
          patient_profile_id: string
          status: Database["public"]["Enums"]["invitation_status"] | null
          updated_at: string
        }
        Insert: {
          collaborator_code: string
          collaborator_role: Database["public"]["Enums"]["app_role"]
          created_at?: string
          created_by: string
          id?: string
          patient_profile_id: string
          status?: Database["public"]["Enums"]["invitation_status"] | null
          updated_at?: string
        }
        Update: {
          collaborator_code?: string
          collaborator_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          created_by?: string
          id?: string
          patient_profile_id?: string
          status?: Database["public"]["Enums"]["invitation_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          celular: string | null
          codigo: string
          created_at: string
          email: string
          id: string
          is_gestor: boolean | null
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          celular?: string | null
          codigo: string
          created_at?: string
          email: string
          id?: string
          is_gestor?: boolean | null
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          celular?: string | null
          codigo?: string
          created_at?: string
          email?: string
          id?: string
          is_gestor?: boolean | null
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          patient_profile_id: string
          plan_name: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_profile_id: string
          plan_name?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_profile_id?: string
          plan_name?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          context_patient_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          context_patient_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          context_patient_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_context_patient_id_fkey"
            columns: ["context_patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_collaborations: {
        Args: { user_uuid: string }
        Returns: {
          collaborator_profile_id: string
          patient_profile_id: string
        }[]
      }
      get_user_profile_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "paciente" | "acompanhante" | "cuidador" | "admin"
      invitation_status: "pendente" | "aceito" | "recusado"
      subscription_status: "ativo" | "inativo" | "cancelado"
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
      app_role: ["paciente", "acompanhante", "cuidador", "admin"],
      invitation_status: ["pendente", "aceito", "recusado"],
      subscription_status: ["ativo", "inativo", "cancelado"],
    },
  },
} as const
