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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          actif: boolean
          created_at: string
          email: string
          id: string
          nom_complet: string | null
          role: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email: string
          id?: string
          nom_complet?: string | null
          role?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          email?: string
          id?: string
          nom_complet?: string | null
          role?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          user_email: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          user_email: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          user_email?: string
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          created_at: string
          custom_field_id: string
          formation_id: string
          id: string
          participant_email: string
          value: string | null
        }
        Insert: {
          created_at?: string
          custom_field_id: string
          formation_id: string
          id?: string
          participant_email: string
          value?: string | null
        }
        Update: {
          created_at?: string
          custom_field_id?: string
          formation_id?: string
          id?: string
          participant_email?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "v_inscriptions"
            referencedColumns: ["formation_id"]
          },
          {
            foreignKeyName: "custom_field_values_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "v_taux_remplissage"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          active: boolean
          created_at: string
          field_type: string
          id: string
          label: string
          options: Json | null
          position: number
          required: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          field_type?: string
          id?: string
          label: string
          options?: Json | null
          position?: number
          required?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          field_type?: string
          id?: string
          label?: string
          options?: Json | null
          position?: number
          required?: boolean
        }
        Relationships: []
      }
      dropdown_menus: {
        Row: {
          created_at: string
          id: string
          name: string
          options: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          options?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          options?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dynamic_form_fields: {
        Row: {
          created_at: string
          field_type: string
          form_id: string
          id: string
          label: string
          options: Json | null
          placeholder: string | null
          position: number
          required: boolean
          width: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          form_id: string
          id?: string
          label: string
          options?: Json | null
          placeholder?: string | null
          position?: number
          required?: boolean
          width?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          form_id?: string
          id?: string
          label?: string
          options?: Json | null
          placeholder?: string | null
          position?: number
          required?: boolean
          width?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "dynamic_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_form_submissions: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          id: string
          submitted_by: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          submitted_by?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "dynamic_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_public: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      formations: {
        Row: {
          created_at: string
          date_debut: string
          duree: string | null
          formateur: string | null
          id: string
          image_url: string | null
          lieu: string | null
          places: number
          statut: string
          theme: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          duree?: string | null
          formateur?: string | null
          id?: string
          image_url?: string | null
          lieu?: string | null
          places?: number
          statut?: string
          theme: string
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          duree?: string | null
          formateur?: string | null
          id?: string
          image_url?: string | null
          lieu?: string | null
          places?: number
          statut?: string
          theme?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      inscriptions: {
        Row: {
          created_at: string
          date_inscription: string
          formation_id: string
          id: string
          participant_id: string
          statut: string
        }
        Insert: {
          created_at?: string
          date_inscription?: string
          formation_id: string
          id?: string
          participant_id: string
          statut?: string
        }
        Update: {
          created_at?: string
          date_inscription?: string
          formation_id?: string
          id?: string
          participant_id?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "v_inscriptions"
            referencedColumns: ["formation_id"]
          },
          {
            foreignKeyName: "inscriptions_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "v_taux_remplissage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "v_inscriptions"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      participant_secteurs: {
        Row: {
          participant_id: string
          secteur_id: number
        }
        Insert: {
          participant_id: string
          secteur_id: number
        }
        Update: {
          participant_id?: string
          secteur_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "participant_secteurs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_secteurs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "v_inscriptions"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "participant_secteurs_secteur_id_fkey"
            columns: ["secteur_id"]
            isOneToOne: false
            referencedRelation: "secteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          email: string
          id: string
          nom_dirigeant: string
          nom_entreprise: string
          source_id: number | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nom_dirigeant: string
          nom_entreprise: string
          source_id?: number | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom_dirigeant?: string
          nom_entreprise?: string
          source_id?: number | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources_information"
            referencedColumns: ["id"]
          },
        ]
      }
      presences: {
        Row: {
          enregistre_le: string
          enregistre_par: string | null
          id: string
          inscription_id: string
          note: string | null
          present: boolean
        }
        Insert: {
          enregistre_le?: string
          enregistre_par?: string | null
          id?: string
          inscription_id: string
          note?: string | null
          present?: boolean
        }
        Update: {
          enregistre_le?: string
          enregistre_par?: string | null
          id?: string
          inscription_id?: string
          note?: string | null
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "presences_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: true
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: true
            referencedRelation: "v_inscriptions"
            referencedColumns: ["inscription_id"]
          },
        ]
      }
      secteurs: {
        Row: {
          id: number
          nom: string
        }
        Insert: {
          id?: number
          nom: string
        }
        Update: {
          id?: number
          nom?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sources_information: {
        Row: {
          id: number
          nom: string
        }
        Insert: {
          id?: number
          nom: string
        }
        Update: {
          id?: number
          nom?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_inscriptions: {
        Row: {
          date_debut: string | null
          date_inscription: string | null
          email: string | null
          formation_id: string | null
          formation_titre: string | null
          inscription_id: string | null
          lieu: string | null
          nom_dirigeant: string | null
          nom_entreprise: string | null
          participant_id: string | null
          present: boolean | null
          source: string | null
          statut_formation: string | null
          statut_inscription: string | null
          telephone: string | null
          theme: string | null
        }
        Relationships: []
      }
      v_stats_dashboard: {
        Row: {
          formations_a_venir: number | null
          formations_terminees: number | null
          total_formations: number | null
          total_inscrits: number | null
          total_participants: number | null
          total_presents: number | null
        }
        Relationships: []
      }
      v_taux_remplissage: {
        Row: {
          date_debut: string | null
          id: string | null
          inscrits: number | null
          places: number | null
          statut: string | null
          taux_pct: number | null
          theme: string | null
          titre: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      inscrire_participant: {
        Args: {
          p_email: string
          p_formation_id: string
          p_nom_dirigeant: string
          p_nom_entreprise: string
          p_secteur_ids?: number[]
          p_source_id?: number
          p_telephone: string
        }
        Returns: undefined
      }
      is_active_admin: { Args: { check_email: string }; Returns: boolean }
      is_superadmin: { Args: { check_email: string }; Returns: boolean }
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
