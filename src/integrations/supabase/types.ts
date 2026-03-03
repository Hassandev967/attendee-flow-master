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
      attestations: {
        Row: {
          created_at: string
          date_envoi: string | null
          date_generation: string | null
          envoyee: boolean
          generee: boolean
          id: string
          inscription_id: string
          pdf_url: string | null
        }
        Insert: {
          created_at?: string
          date_envoi?: string | null
          date_generation?: string | null
          envoyee?: boolean
          generee?: boolean
          id?: string
          inscription_id: string
          pdf_url?: string | null
        }
        Update: {
          created_at?: string
          date_envoi?: string | null
          date_generation?: string | null
          envoyee?: boolean
          generee?: boolean
          id?: string
          inscription_id?: string
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attestations_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      emargements: {
        Row: {
          horodatage: string
          id: string
          inscription_id: string
          mode: Database["public"]["Enums"]["emargement_mode"]
        }
        Insert: {
          horodatage?: string
          id?: string
          inscription_id: string
          mode?: Database["public"]["Enums"]["emargement_mode"]
        }
        Update: {
          horodatage?: string
          id?: string
          inscription_id?: string
          mode?: Database["public"]["Enums"]["emargement_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "emargements_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: true
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          annulee: boolean
          created_at: string
          id: string
          mode_participation: Database["public"]["Enums"]["session_mode"]
          participant_id: string
          qr_code: string | null
          session_id: string
        }
        Insert: {
          annulee?: boolean
          created_at?: string
          id?: string
          mode_participation?: Database["public"]["Enums"]["session_mode"]
          participant_id: string
          qr_code?: string | null
          session_id: string
        }
        Update: {
          annulee?: boolean
          created_at?: string
          id?: string
          mode_participation?: Database["public"]["Enums"]["session_mode"]
          participant_id?: string
          qr_code?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      intervenants: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          nom: string
          organisation: string
          photo_url: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          nom: string
          organisation: string
          photo_url?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          nom?: string
          organisation?: string
          photo_url?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          canal: string
          contenu: string | null
          created_at: string
          date_envoi: string | null
          destinataire_email: string
          id: string
          session_id: string | null
          statut: Database["public"]["Enums"]["notification_statut"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          canal?: string
          contenu?: string | null
          created_at?: string
          date_envoi?: string | null
          destinataire_email: string
          id?: string
          session_id?: string | null
          statut?: Database["public"]["Enums"]["notification_statut"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          canal?: string
          contenu?: string | null
          created_at?: string
          date_envoi?: string | null
          destinataire_email?: string
          id?: string
          session_id?: string | null
          statut?: Database["public"]["Enums"]["notification_statut"]
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          email: string
          entreprise: string
          fonction: string
          id: string
          niveau_export: Database["public"]["Enums"]["niveau_export"]
          nom: string
          prenom: string
          secteur: string
          taille: string
          telephone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          entreprise: string
          fonction: string
          id?: string
          niveau_export?: Database["public"]["Enums"]["niveau_export"]
          nom: string
          prenom: string
          secteur: string
          taille: string
          telephone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          entreprise?: string
          fonction?: string
          id?: string
          niveau_export?: Database["public"]["Enums"]["niveau_export"]
          nom?: string
          prenom?: string
          secteur?: string
          taille?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_intervenants: {
        Row: {
          id: string
          intervenant_id: string
          session_id: string
        }
        Insert: {
          id?: string
          intervenant_id: string
          session_id: string
        }
        Update: {
          id?: string
          intervenant_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_intervenants_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_intervenants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          date_session: string
          description: string | null
          horaire: string
          id: string
          lien_replay: string | null
          lien_visio: string | null
          lieu: string
          mode: Database["public"]["Enums"]["session_mode"]
          places: number
          statut: Database["public"]["Enums"]["session_statut"]
          thematique: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_session: string
          description?: string | null
          horaire: string
          id?: string
          lien_replay?: string | null
          lien_visio?: string | null
          lieu: string
          mode?: Database["public"]["Enums"]["session_mode"]
          places?: number
          statut?: Database["public"]["Enums"]["session_statut"]
          thematique: string
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_session?: string
          description?: string | null
          horaire?: string
          id?: string
          lien_replay?: string | null
          lien_visio?: string | null
          lieu?: string
          mode?: Database["public"]["Enums"]["session_mode"]
          places?: number
          statut?: Database["public"]["Enums"]["session_statut"]
          thematique?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      emargement_mode: "qr_code" | "lien_en_ligne"
      niveau_export: "debutant" | "intermediaire" | "confirme"
      notification_statut: "envoye" | "en_attente" | "echoue"
      notification_type:
        | "confirmation"
        | "rappel_j2"
        | "rappel_j1"
        | "post_session"
        | "annulation"
      session_mode: "presentiel" | "en_ligne" | "hybride"
      session_statut:
        | "brouillon"
        | "publiee"
        | "en_cours"
        | "terminee"
        | "annulee"
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
      emargement_mode: ["qr_code", "lien_en_ligne"],
      niveau_export: ["debutant", "intermediaire", "confirme"],
      notification_statut: ["envoye", "en_attente", "echoue"],
      notification_type: [
        "confirmation",
        "rappel_j2",
        "rappel_j1",
        "post_session",
        "annulation",
      ],
      session_mode: ["presentiel", "en_ligne", "hybride"],
      session_statut: [
        "brouillon",
        "publiee",
        "en_cours",
        "terminee",
        "annulee",
      ],
    },
  },
} as const
