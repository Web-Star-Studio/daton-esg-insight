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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_data: {
        Row: {
          created_at: string
          emission_source_id: string
          id: string
          period_end_date: string
          period_start_date: string
          quantity: number
          source_document: string | null
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emission_source_id: string
          id?: string
          period_end_date: string
          period_start_date: string
          quantity: number
          source_document?: string | null
          unit: string
          user_id: string
        }
        Update: {
          created_at?: string
          emission_source_id?: string
          id?: string
          period_end_date?: string
          period_start_date?: string
          quantity?: number
          source_document?: string | null
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_data_emission_source_id_fkey"
            columns: ["emission_source_id"]
            isOneToOne: false
            referencedRelation: "emission_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calculated_emissions: {
        Row: {
          activity_data_id: string
          calculation_date: string
          details_json: Json | null
          emission_factor_id: string
          id: string
          total_co2e: number
        }
        Insert: {
          activity_data_id: string
          calculation_date?: string
          details_json?: Json | null
          emission_factor_id: string
          id?: string
          total_co2e: number
        }
        Update: {
          activity_data_id?: string
          calculation_date?: string
          details_json?: Json | null
          emission_factor_id?: string
          id?: string
          total_co2e?: number
        }
        Relationships: [
          {
            foreignKeyName: "calculated_emissions_activity_data_id_fkey"
            columns: ["activity_data_id"]
            isOneToOne: true
            referencedRelation: "activity_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculated_emissions_emission_factor_id_fkey"
            columns: ["emission_factor_id"]
            isOneToOne: false
            referencedRelation: "emission_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          name: string
          sector: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          name: string
          sector?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          name?: string
          sector?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          company_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          related_id: string
          related_model: string
          upload_date: string
          uploader_user_id: string
        }
        Insert: {
          company_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          related_id: string
          related_model: string
          upload_date?: string
          uploader_user_id: string
        }
        Update: {
          company_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          related_id?: string
          related_model?: string
          upload_date?: string
          uploader_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploader_user_id_fkey"
            columns: ["uploader_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emission_factors: {
        Row: {
          activity_unit: string
          category: string
          ch4_factor: number | null
          co2_factor: number | null
          company_id: string | null
          created_at: string
          id: string
          n2o_factor: number | null
          name: string
          source: string
          type: Database["public"]["Enums"]["emission_factor_type_enum"]
          year_of_validity: number | null
        }
        Insert: {
          activity_unit: string
          category: string
          ch4_factor?: number | null
          co2_factor?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          n2o_factor?: number | null
          name: string
          source: string
          type?: Database["public"]["Enums"]["emission_factor_type_enum"]
          year_of_validity?: number | null
        }
        Update: {
          activity_unit?: string
          category?: string
          ch4_factor?: number | null
          co2_factor?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          n2o_factor?: number | null
          name?: string
          source?: string
          type?: Database["public"]["Enums"]["emission_factor_type_enum"]
          year_of_validity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emission_factors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      emission_sources: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          scope: number
          status: Database["public"]["Enums"]["emission_source_status_enum"]
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scope: number
          status?: Database["public"]["Enums"]["emission_source_status_enum"]
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scope?: number
          status?: Database["public"]["Enums"]["emission_source_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emission_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          company_id: string
          conditions: string | null
          created_at: string
          expiration_date: string
          id: string
          issue_date: string | null
          issuing_body: string
          name: string
          process_number: string | null
          responsible_user_id: string | null
          status: Database["public"]["Enums"]["license_status_enum"]
          type: Database["public"]["Enums"]["license_type_enum"]
          updated_at: string
        }
        Insert: {
          company_id: string
          conditions?: string | null
          created_at?: string
          expiration_date: string
          id?: string
          issue_date?: string | null
          issuing_body: string
          name: string
          process_number?: string | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["license_status_enum"]
          type: Database["public"]["Enums"]["license_type_enum"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          conditions?: string | null
          created_at?: string
          expiration_date?: string
          id?: string
          issue_date?: string | null
          issuing_body?: string
          name?: string
          process_number?: string | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["license_status_enum"]
          type?: Database["public"]["Enums"]["license_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string
          full_name: string
          id: string
          job_title: string | null
          role: Database["public"]["Enums"]["user_role_enum"]
        }
        Insert: {
          company_id: string
          created_at?: string
          full_name: string
          id: string
          job_title?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
        }
        Update: {
          company_id?: string
          created_at?: string
          full_name?: string
          id?: string
          job_title?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_license_status: {
        Args: {
          current_status: Database["public"]["Enums"]["license_status_enum"]
          expiration_date_param: string
          issue_date_param: string
        }
        Returns: Database["public"]["Enums"]["license_status_enum"]
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      emission_factor_type_enum: "system" | "custom"
      emission_source_status_enum: "Ativo" | "Inativo"
      license_status_enum: "Ativa" | "Em Renovação" | "Vencida" | "Suspensa"
      license_type_enum: "LP" | "LI" | "LO" | "LAS" | "LOC" | "Outra"
      user_role_enum: "Admin" | "Editor" | "Leitor"
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
      emission_factor_type_enum: ["system", "custom"],
      emission_source_status_enum: ["Ativo", "Inativo"],
      license_status_enum: ["Ativa", "Em Renovação", "Vencida", "Suspensa"],
      license_type_enum: ["LP", "LI", "LO", "LAS", "LOC", "Outra"],
      user_role_enum: ["Admin", "Editor", "Leitor"],
    },
  },
} as const
