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
      carbon_projects: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          location: string | null
          name: string
          standard: string
          status: Database["public"]["Enums"]["carbon_project_status_enum"]
          type_methodology: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          name: string
          standard: string
          status?: Database["public"]["Enums"]["carbon_project_status_enum"]
          type_methodology: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          name?: string
          standard?: string
          status?: Database["public"]["Enums"]["carbon_project_status_enum"]
          type_methodology?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carbon_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      credit_purchases: {
        Row: {
          available_quantity: number
          company_id: string
          created_at: string
          id: string
          project_id: string | null
          project_name_text: string | null
          purchase_date: string
          quantity_tco2e: number
          registry_id: string | null
          standard: string | null
          total_cost: number | null
          type_methodology: string | null
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          company_id: string
          created_at?: string
          id?: string
          project_id?: string | null
          project_name_text?: string | null
          purchase_date: string
          quantity_tco2e: number
          registry_id?: string | null
          standard?: string | null
          total_cost?: number | null
          type_methodology?: string | null
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          company_id?: string
          created_at?: string
          id?: string
          project_id?: string | null
          project_name_text?: string | null
          purchase_date?: string
          quantity_tco2e?: number
          registry_id?: string | null
          standard?: string | null
          total_cost?: number | null
          type_methodology?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "carbon_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_retirements: {
        Row: {
          company_id: string
          created_at: string
          credit_purchase_id: string
          id: string
          quantity_tco2e: number
          reason: string | null
          retirement_date: string
        }
        Insert: {
          company_id: string
          created_at?: string
          credit_purchase_id: string
          id?: string
          quantity_tco2e: number
          reason?: string | null
          retirement_date: string
        }
        Update: {
          company_id?: string
          created_at?: string
          credit_purchase_id?: string
          id?: string
          quantity_tco2e?: number
          reason?: string | null
          retirement_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_retirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_retirements_credit_purchase_id_fkey"
            columns: ["credit_purchase_id"]
            isOneToOne: false
            referencedRelation: "credit_purchases"
            referencedColumns: ["id"]
          },
        ]
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
      generated_reports: {
        Row: {
          company_id: string
          config_json: Json | null
          created_at: string
          data_period_end: string
          data_period_start: string
          file_path_pdf: string | null
          file_path_xlsx: string | null
          generation_date: string
          id: string
          report_template: Database["public"]["Enums"]["report_template_enum"]
          status: Database["public"]["Enums"]["report_status_enum"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          config_json?: Json | null
          created_at?: string
          data_period_end: string
          data_period_start: string
          file_path_pdf?: string | null
          file_path_xlsx?: string | null
          generation_date?: string
          id?: string
          report_template: Database["public"]["Enums"]["report_template_enum"]
          status?: Database["public"]["Enums"]["report_status_enum"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          config_json?: Json | null
          created_at?: string
          data_period_end?: string
          data_period_start?: string
          file_path_pdf?: string | null
          file_path_xlsx?: string | null
          generation_date?: string
          id?: string
          report_template?: Database["public"]["Enums"]["report_template_enum"]
          status?: Database["public"]["Enums"]["report_status_enum"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_progress_updates: {
        Row: {
          created_at: string
          current_value: number
          goal_id: string
          id: string
          notes: string | null
          progress_percentage: number | null
          update_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_value: number
          goal_id: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          update_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_value?: number
          goal_id?: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          update_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          baseline_period: string | null
          baseline_value: number | null
          company_id: string
          created_at: string
          deadline_date: string
          description: string | null
          id: string
          metric_key: string
          name: string
          responsible_user_id: string | null
          status: Database["public"]["Enums"]["goal_status_enum"]
          target_value: number
          updated_at: string
        }
        Insert: {
          baseline_period?: string | null
          baseline_value?: number | null
          company_id: string
          created_at?: string
          deadline_date: string
          description?: string | null
          id?: string
          metric_key: string
          name: string
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["goal_status_enum"]
          target_value: number
          updated_at?: string
        }
        Update: {
          baseline_period?: string | null
          baseline_value?: number | null
          company_id?: string
          created_at?: string
          deadline_date?: string
          description?: string | null
          id?: string
          metric_key?: string
          name?: string
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["goal_status_enum"]
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      waste_logs: {
        Row: {
          collection_date: string
          company_id: string
          cost: number | null
          created_at: string
          destination_cnpj: string | null
          destination_name: string | null
          final_treatment_type: string | null
          id: string
          mtr_number: string
          quantity: number
          status: Database["public"]["Enums"]["waste_status_enum"]
          transporter_cnpj: string | null
          transporter_name: string | null
          unit: string
          updated_at: string
          waste_class: Database["public"]["Enums"]["waste_class_enum"]
          waste_description: string
        }
        Insert: {
          collection_date: string
          company_id: string
          cost?: number | null
          created_at?: string
          destination_cnpj?: string | null
          destination_name?: string | null
          final_treatment_type?: string | null
          id?: string
          mtr_number: string
          quantity: number
          status?: Database["public"]["Enums"]["waste_status_enum"]
          transporter_cnpj?: string | null
          transporter_name?: string | null
          unit: string
          updated_at?: string
          waste_class: Database["public"]["Enums"]["waste_class_enum"]
          waste_description: string
        }
        Update: {
          collection_date?: string
          company_id?: string
          cost?: number | null
          created_at?: string
          destination_cnpj?: string | null
          destination_name?: string | null
          final_treatment_type?: string | null
          id?: string
          mtr_number?: string
          quantity?: number
          status?: Database["public"]["Enums"]["waste_status_enum"]
          transporter_cnpj?: string | null
          transporter_name?: string | null
          unit?: string
          updated_at?: string
          waste_class?: Database["public"]["Enums"]["waste_class_enum"]
          waste_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_logs_company_id_fkey"
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
      carbon_project_status_enum: "Ativo" | "Encerrado" | "Suspenso"
      credit_status_enum: "Disponível" | "Aposentado" | "Reservado"
      emission_factor_type_enum: "system" | "custom"
      emission_source_status_enum: "Ativo" | "Inativo"
      goal_status_enum:
        | "No Caminho Certo"
        | "Atenção Necessária"
        | "Atingida"
        | "Atrasada"
      license_status_enum: "Ativa" | "Em Renovação" | "Vencida" | "Suspensa"
      license_type_enum: "LP" | "LI" | "LO" | "LAS" | "LOC" | "Outra"
      report_status_enum: "Rascunho" | "Gerando" | "Concluído"
      report_template_enum:
        | "GHG_PROTOCOL"
        | "GRI_STANDARD"
        | "GOALS_PERFORMANCE"
        | "CUSTOM_REPORT"
      user_role_enum: "Admin" | "Editor" | "Leitor"
      waste_class_enum:
        | "Classe I - Perigoso"
        | "Classe II A - Não Inerte"
        | "Classe II B - Inerte"
      waste_status_enum: "Coletado" | "Em Trânsito" | "Destinação Finalizada"
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
      carbon_project_status_enum: ["Ativo", "Encerrado", "Suspenso"],
      credit_status_enum: ["Disponível", "Aposentado", "Reservado"],
      emission_factor_type_enum: ["system", "custom"],
      emission_source_status_enum: ["Ativo", "Inativo"],
      goal_status_enum: [
        "No Caminho Certo",
        "Atenção Necessária",
        "Atingida",
        "Atrasada",
      ],
      license_status_enum: ["Ativa", "Em Renovação", "Vencida", "Suspensa"],
      license_type_enum: ["LP", "LI", "LO", "LAS", "LOC", "Outra"],
      report_status_enum: ["Rascunho", "Gerando", "Concluído"],
      report_template_enum: [
        "GHG_PROTOCOL",
        "GRI_STANDARD",
        "GOALS_PERFORMANCE",
        "CUSTOM_REPORT",
      ],
      user_role_enum: ["Admin", "Editor", "Leitor"],
      waste_class_enum: [
        "Classe I - Perigoso",
        "Classe II A - Não Inerte",
        "Classe II B - Inerte",
      ],
      waste_status_enum: ["Coletado", "Em Trânsito", "Destinação Finalizada"],
    },
  },
} as const
