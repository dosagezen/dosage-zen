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
      admin_invitations: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          first_name: string
          id: string
          invite_token: string
          last_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          first_name: string
          id?: string
          invite_token: string
          last_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          invite_token?: string
          last_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          data_agendamento: string
          duracao_minutos: number | null
          especialidade: string | null
          id: string
          local_endereco: string | null
          medico_profissional: string | null
          observacoes: string | null
          patient_profile_id: string
          resultado: string | null
          status: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_agendamento: string
          duracao_minutos?: number | null
          especialidade?: string | null
          id?: string
          local_endereco?: string | null
          medico_profissional?: string | null
          observacoes?: string | null
          patient_profile_id: string
          resultado?: string | null
          status?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_agendamento?: string
          duracao_minutos?: number | null
          especialidade?: string | null
          id?: string
          local_endereco?: string | null
          medico_profissional?: string | null
          observacoes?: string | null
          patient_profile_id?: string
          resultado?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
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
      medication_occurrences: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          medication_id: string
          patient_profile_id: string
          scheduled_at: string
          status:
            | Database["public"]["Enums"]["medication_occurrence_status"]
            | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          medication_id: string
          patient_profile_id: string
          scheduled_at: string
          status?:
            | Database["public"]["Enums"]["medication_occurrence_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          medication_id?: string
          patient_profile_id?: string
          scheduled_at?: string
          status?:
            | Database["public"]["Enums"]["medication_occurrence_status"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_occurrences_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_occurrences_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_occurrences_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedules: {
        Row: {
          created_at: string
          data_programada: string
          horario_programado: string
          horario_tomado: string | null
          id: string
          medication_id: string
          observacoes: string | null
          patient_profile_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_programada: string
          horario_programado: string
          horario_tomado?: string | null
          id?: string
          medication_id: string
          observacoes?: string | null
          patient_profile_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_programada?: string
          horario_programado?: string
          horario_tomado?: string | null
          id?: string
          medication_id?: string
          observacoes?: string | null
          patient_profile_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          dosagem: string
          estoque: number | null
          forma: string
          frequencia: string
          horarios: Json
          id: string
          nome: string
          observacoes: string | null
          patient_profile_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dosagem: string
          estoque?: number | null
          forma: string
          frequencia: string
          horarios?: Json
          id?: string
          nome: string
          observacoes?: string | null
          patient_profile_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dosagem?: string
          estoque?: number | null
          forma?: string
          frequencia?: string
          horarios?: Json
          id?: string
          nome?: string
          observacoes?: string | null
          patient_profile_id?: string
          updated_at?: string
        }
        Relationships: []
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
          email_confirmed: boolean | null
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
          email_confirmed?: boolean | null
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
          email_confirmed?: boolean | null
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
      fn_count_medications: {
        Args: { p_patient_profile_id: string }
        Returns: Json
      }
      fn_mark_occurrence: {
        Args: {
          p_occurrence_id: string
          p_status: Database["public"]["Enums"]["medication_occurrence_status"]
        }
        Returns: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          medication_id: string
          patient_profile_id: string
          scheduled_at: string
          status:
            | Database["public"]["Enums"]["medication_occurrence_status"]
            | null
          updated_at: string | null
        }
      }
      fn_next_occurrence: {
        Args: { p_medication_id: string }
        Returns: string
      }
      fn_upsert_medication_occurrences: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_horarios: string[]
          p_medication_id: string
          p_patient_profile_id: string
        }
        Returns: undefined
      }
      generate_invite_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
      log_admin_action: {
        Args: {
          p_action: string
          p_entity: string
          p_entity_id?: string
          p_new_data?: Json
          p_old_data?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "paciente" | "acompanhante" | "cuidador" | "admin" | "gestor"
      invitation_status: "pendente" | "aceito" | "recusado"
      medication_occurrence_status: "pendente" | "concluido" | "excluido"
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
      app_role: ["paciente", "acompanhante", "cuidador", "admin", "gestor"],
      invitation_status: ["pendente", "aceito", "recusado"],
      medication_occurrence_status: ["pendente", "concluido", "excluido"],
      subscription_status: ["ativo", "inativo", "cancelado"],
    },
  },
} as const
