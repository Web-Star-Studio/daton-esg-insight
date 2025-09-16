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
          emission_factor_id: string | null
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
          emission_factor_id?: string | null
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
          emission_factor_id?: string | null
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
            foreignKeyName: "activity_data_emission_factor_id_fkey"
            columns: ["emission_factor_id"]
            isOneToOne: false
            referencedRelation: "emission_factors"
            referencedColumns: ["id"]
          },
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
      activity_logs: {
        Row: {
          action_type: string
          company_id: string
          created_at: string
          description: string
          details_json: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          company_id: string
          created_at?: string
          description: string
          details_json?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string
          description?: string
          details_json?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_monitoring: {
        Row: {
          activity_id: string
          area_completed: number | null
          carbon_sequestered: number | null
          company_id: string
          created_at: string
          created_by_user_id: string
          evidence_files: Json | null
          id: string
          monitoring_date: string
          notes: string | null
          progress_percentage: number | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          area_completed?: number | null
          carbon_sequestered?: number | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          evidence_files?: Json | null
          id?: string
          monitoring_date: string
          notes?: string | null
          progress_percentage?: number | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          area_completed?: number | null
          carbon_sequestered?: number | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          evidence_files?: Json | null
          id?: string
          monitoring_date?: string
          notes?: string | null
          progress_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_monitoring_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "conservation_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_extraction_patterns: {
        Row: {
          company_id: string
          created_at: string
          document_type: string
          extraction_rules: Json
          field_patterns: Json
          id: string
          last_used_at: string | null
          success_count: number
          updated_at: string
          usage_count: number
        }
        Insert: {
          company_id: string
          created_at?: string
          document_type: string
          extraction_rules?: Json
          field_patterns?: Json
          id?: string
          last_used_at?: string | null
          success_count?: number
          updated_at?: string
          usage_count?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          document_type?: string
          extraction_rules?: Json
          field_patterns?: Json
          id?: string
          last_used_at?: string | null
          success_count?: number
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_type: string
          capacity_unit: string | null
          cnae_code: string | null
          company_id: string
          created_at: string
          critical_parameters: string[] | null
          description: string | null
          id: string
          installation_year: number | null
          location: string | null
          monitoring_frequency: string | null
          monitoring_responsible: string | null
          name: string
          operational_status: string | null
          parent_asset_id: string | null
          pollution_potential: string | null
          productive_capacity: number | null
          updated_at: string
        }
        Insert: {
          asset_type: string
          capacity_unit?: string | null
          cnae_code?: string | null
          company_id: string
          created_at?: string
          critical_parameters?: string[] | null
          description?: string | null
          id?: string
          installation_year?: number | null
          location?: string | null
          monitoring_frequency?: string | null
          monitoring_responsible?: string | null
          name: string
          operational_status?: string | null
          parent_asset_id?: string | null
          pollution_potential?: string | null
          productive_capacity?: number | null
          updated_at?: string
        }
        Update: {
          asset_type?: string
          capacity_unit?: string | null
          cnae_code?: string | null
          company_id?: string
          created_at?: string
          critical_parameters?: string[] | null
          description?: string | null
          id?: string
          installation_year?: number | null
          location?: string | null
          monitoring_frequency?: string | null
          monitoring_responsible?: string | null
          name?: string
          operational_status?: string | null
          parent_asset_id?: string | null
          pollution_potential?: string | null
          productive_capacity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          action_plan: string | null
          audit_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          responsible_user_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          action_plan?: string | null
          audit_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          responsible_user_id?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_plan?: string | null
          audit_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          responsible_user_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audits: {
        Row: {
          audit_type: string
          auditor: string | null
          company_id: string
          created_at: string
          end_date: string | null
          id: string
          scope: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audit_type: string
          auditor?: string | null
          company_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          scope?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audit_type?: string
          auditor?: string | null
          company_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          scope?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      compliance_tasks: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          due_date: string
          evidence_document_id: string | null
          frequency: Database["public"]["Enums"]["frequency_enum"]
          id: string
          notes: string | null
          requirement_id: string | null
          responsible_user_id: string | null
          status: Database["public"]["Enums"]["compliance_task_status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          due_date: string
          evidence_document_id?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"]
          id?: string
          notes?: string | null
          requirement_id?: string | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["compliance_task_status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          evidence_document_id?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"]
          id?: string
          notes?: string | null
          requirement_id?: string | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["compliance_task_status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tasks_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "regulatory_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      conservation_activities: {
        Row: {
          activity_type: string
          area_size: number | null
          carbon_impact_estimate: number | null
          company_id: string
          coordinates: Json | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          investment_amount: number | null
          location: string | null
          methodology: string | null
          monitoring_plan: string | null
          responsible_user_id: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          area_size?: number | null
          carbon_impact_estimate?: number | null
          company_id: string
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          investment_amount?: number | null
          location?: string | null
          methodology?: string | null
          monitoring_plan?: string | null
          responsible_user_id?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          area_size?: number | null
          carbon_impact_estimate?: number | null
          company_id?: string
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          investment_amount?: number | null
          location?: string | null
          methodology?: string | null
          monitoring_plan?: string | null
          responsible_user_id?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conservation_activity_types: {
        Row: {
          carbon_factor: number | null
          created_at: string
          description: string | null
          id: string
          methodology_reference: string | null
          name: string
          unit: string | null
        }
        Insert: {
          carbon_factor?: number | null
          created_at?: string
          description?: string | null
          id?: string
          methodology_reference?: string | null
          name: string
          unit?: string | null
        }
        Update: {
          carbon_factor?: number | null
          created_at?: string
          description?: string | null
          id?: string
          methodology_reference?: string | null
          name?: string
          unit?: string | null
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
      custom_forms: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          is_published: boolean
          structure_json: Json
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          is_published?: boolean
          structure_json: Json
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          is_published?: boolean
          structure_json?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_collection_tasks: {
        Row: {
          assigned_to_user_id: string | null
          company_id: string
          created_at: string
          description: string | null
          due_date: string
          frequency: string
          id: string
          metadata: Json | null
          name: string
          period_end: string
          period_start: string
          related_asset_id: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          due_date: string
          frequency: string
          id?: string
          metadata?: Json | null
          name: string
          period_end: string
          period_start: string
          related_asset_id?: string | null
          status?: string
          task_type: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          frequency?: string
          id?: string
          metadata?: Json | null
          name?: string
          period_end?: string
          period_start?: string
          related_asset_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_import_jobs: {
        Row: {
          company_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          import_type: string
          log: Json | null
          progress_percentage: number | null
          records_processed: number | null
          records_total: number | null
          status: string
          updated_at: string
          uploader_user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          import_type: string
          log?: Json | null
          progress_percentage?: number | null
          records_processed?: number | null
          records_total?: number | null
          status?: string
          updated_at?: string
          uploader_user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          import_type?: string
          log?: Json | null
          progress_percentage?: number | null
          records_processed?: number | null
          records_total?: number | null
          status?: string
          updated_at?: string
          uploader_user_id?: string
        }
        Relationships: []
      }
      document_extraction_jobs: {
        Row: {
          ai_model_used: string | null
          company_id: string
          confidence_score: number | null
          created_at: string
          document_id: string
          error_message: string | null
          id: string
          processing_end_time: string | null
          processing_start_time: string | null
          processing_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          company_id: string
          confidence_score?: number | null
          created_at?: string
          document_id: string
          error_message?: string | null
          id?: string
          processing_end_time?: string | null
          processing_start_time?: string | null
          processing_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          company_id?: string
          confidence_score?: number | null
          created_at?: string
          document_id?: string
          error_message?: string | null
          id?: string
          processing_end_time?: string | null
          processing_start_time?: string | null
          processing_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_extraction_job_document"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_confidence_score: number | null
          ai_extracted_category: string | null
          ai_processing_status: string | null
          company_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          folder_id: string | null
          id: string
          related_id: string
          related_model: string
          tags: string[] | null
          upload_date: string
          uploader_user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_extracted_category?: string | null
          ai_processing_status?: string | null
          company_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          folder_id?: string | null
          id?: string
          related_id: string
          related_model: string
          tags?: string[] | null
          upload_date?: string
          uploader_user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_extracted_category?: string | null
          ai_processing_status?: string | null
          company_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          folder_id?: string | null
          id?: string
          related_id?: string
          related_model?: string
          tags?: string[] | null
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
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
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
          details_json: Json | null
          id: string
          n2o_factor: number | null
          name: string
          source: string
          type: Database["public"]["Enums"]["emission_factor_type_enum"]
          validation_status: string | null
          year_of_validity: number | null
        }
        Insert: {
          activity_unit: string
          category: string
          ch4_factor?: number | null
          co2_factor?: number | null
          company_id?: string | null
          created_at?: string
          details_json?: Json | null
          id?: string
          n2o_factor?: number | null
          name: string
          source: string
          type?: Database["public"]["Enums"]["emission_factor_type_enum"]
          validation_status?: string | null
          year_of_validity?: number | null
        }
        Update: {
          activity_unit?: string
          category?: string
          ch4_factor?: number | null
          co2_factor?: number | null
          company_id?: string | null
          created_at?: string
          details_json?: Json | null
          id?: string
          n2o_factor?: number | null
          name?: string
          source?: string
          type?: Database["public"]["Enums"]["emission_factor_type_enum"]
          validation_status?: string | null
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
          asset_id: string | null
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          scope: number
          scope_3_category_number: number | null
          status: Database["public"]["Enums"]["emission_source_status_enum"]
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scope: number
          scope_3_category_number?: number | null
          status?: Database["public"]["Enums"]["emission_source_status_enum"]
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scope?: number
          scope_3_category_number?: number | null
          status?: Database["public"]["Enums"]["emission_source_status_enum"]
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emission_sources_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emission_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_metrics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          metric_key: string
          period: string
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          metric_key: string
          period: string
          unit?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          metric_key?: string
          period?: string
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "esg_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_solution_providers: {
        Row: {
          categories: string[] | null
          certifications: string[] | null
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          rating: number | null
          status: string
          total_reviews: number | null
          updated_at: string
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          categories?: string[] | null
          certifications?: string[] | null
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          rating?: number | null
          status?: string
          total_reviews?: number | null
          updated_at?: string
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          categories?: string[] | null
          certifications?: string[] | null
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          rating?: number | null
          status?: string
          total_reviews?: number | null
          updated_at?: string
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      esg_solutions: {
        Row: {
          case_studies: Json | null
          category: string
          created_at: string
          description: string
          id: string
          impact_metrics: Json | null
          implementation_time: string | null
          is_featured: boolean | null
          price_range: string | null
          pricing_model: string | null
          provider_id: string
          requirements: string[] | null
          roi_estimate: string | null
          status: string
          subcategory: string | null
          target_problems: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          case_studies?: Json | null
          category: string
          created_at?: string
          description: string
          id?: string
          impact_metrics?: Json | null
          implementation_time?: string | null
          is_featured?: boolean | null
          price_range?: string | null
          pricing_model?: string | null
          provider_id: string
          requirements?: string[] | null
          roi_estimate?: string | null
          status?: string
          subcategory?: string | null
          target_problems?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          case_studies?: Json | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          impact_metrics?: Json | null
          implementation_time?: string | null
          is_featured?: boolean | null
          price_range?: string | null
          pricing_model?: string | null
          provider_id?: string
          requirements?: string[] | null
          roi_estimate?: string | null
          status?: string
          subcategory?: string | null
          target_problems?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esg_solutions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esg_solution_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_data_preview: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          company_id: string
          confidence_scores: Json
          created_at: string
          extracted_fields: Json
          extraction_job_id: string
          id: string
          suggested_mappings: Json
          target_table: string
          updated_at: string
          validation_notes: string | null
          validation_status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          company_id: string
          confidence_scores?: Json
          created_at?: string
          extracted_fields?: Json
          extraction_job_id: string
          id?: string
          suggested_mappings?: Json
          target_table: string
          updated_at?: string
          validation_notes?: string | null
          validation_status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          company_id?: string
          confidence_scores?: Json
          created_at?: string
          extracted_fields?: Json
          extraction_job_id?: string
          id?: string
          suggested_mappings?: Json
          target_table?: string
          updated_at?: string
          validation_notes?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_extracted_preview_job"
            columns: ["extraction_job_id"]
            isOneToOne: false
            referencedRelation: "document_extraction_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_items_curated: {
        Row: {
          approved_at: string | null
          approved_by: string
          field_name: string
          file_id: string | null
          id: string
          lineage: Json | null
          value: string
        }
        Insert: {
          approved_at?: string | null
          approved_by: string
          field_name: string
          file_id?: string | null
          id?: string
          lineage?: Json | null
          value: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string
          field_name?: string
          file_id?: string | null
          id?: string
          lineage?: Json | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_items_curated_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_items_staging: {
        Row: {
          confidence: number | null
          extracted_value: string | null
          extraction_id: string | null
          field_name: string
          id: string
          row_index: number | null
          source_text: string | null
          status: string
        }
        Insert: {
          confidence?: number | null
          extracted_value?: string | null
          extraction_id?: string | null
          field_name: string
          id?: string
          row_index?: number | null
          source_text?: string | null
          status?: string
        }
        Update: {
          confidence?: number | null
          extracted_value?: string | null
          extraction_id?: string | null
          field_name?: string
          id?: string
          row_index?: number | null
          source_text?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_items_staging_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions: {
        Row: {
          created_at: string | null
          file_id: string | null
          id: string
          model: string
          quality_score: number | null
          raw_json: Json
        }
        Insert: {
          created_at?: string | null
          file_id?: string | null
          id?: string
          model: string
          quality_score?: number | null
          raw_json: Json
        }
        Update: {
          created_at?: string | null
          file_id?: string | null
          id?: string
          model?: string
          quality_score?: number | null
          raw_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "extractions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          mime: string
          original_name: string
          size_bytes: number
          status: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          mime: string
          original_name: string
          size_bytes: number
          status: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          mime?: string
          original_name?: string
          size_bytes?: number
          status?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          company_id: string
          form_id: string
          id: string
          submission_data: Json
          submitted_at: string
          submitted_by_user_id: string
        }
        Insert: {
          company_id: string
          form_id: string
          id?: string
          submission_data: Json
          submitted_at?: string
          submitted_by_user_id: string
        }
        Update: {
          company_id?: string
          form_id?: string
          id?: string
          submission_data?: Json
          submitted_at?: string
          submitted_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "custom_forms"
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
      ghg_reports: {
        Row: {
          biogenic_co2: number
          company_id: string
          created_at: string
          generated_at: string
          id: string
          methodology_version: string | null
          report_data: Json
          report_type: string
          report_year: number
          scope_1_total: number
          scope_2_location_total: number
          scope_2_market_total: number
          scope_3_total: number
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          biogenic_co2?: number
          company_id: string
          created_at?: string
          generated_at?: string
          id?: string
          methodology_version?: string | null
          report_data?: Json
          report_type: string
          report_year: number
          scope_1_total?: number
          scope_2_location_total?: number
          scope_2_market_total?: number
          scope_3_total?: number
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          biogenic_co2?: number
          company_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          methodology_version?: string | null
          report_data?: Json
          report_type?: string
          report_year?: number
          scope_1_total?: number
          scope_2_location_total?: number
          scope_2_market_total?: number
          scope_3_total?: number
          updated_at?: string
          verification_status?: string | null
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
      land_use_change: {
        Row: {
          area_hectares: number
          calculation_method: string | null
          carbon_stock_after: number | null
          carbon_stock_before: number | null
          change_year: number
          climate_zone: string | null
          co2_emissions: number | null
          company_id: string
          created_at: string
          current_use: string
          id: string
          location_state: string | null
          previous_use: string
          updated_at: string
          vegetation_type: string | null
        }
        Insert: {
          area_hectares: number
          calculation_method?: string | null
          carbon_stock_after?: number | null
          carbon_stock_before?: number | null
          change_year: number
          climate_zone?: string | null
          co2_emissions?: number | null
          company_id: string
          created_at?: string
          current_use: string
          id?: string
          location_state?: string | null
          previous_use: string
          updated_at?: string
          vegetation_type?: string | null
        }
        Update: {
          area_hectares?: number
          calculation_method?: string | null
          carbon_stock_after?: number | null
          carbon_stock_before?: number | null
          change_year?: number
          climate_zone?: string | null
          co2_emissions?: number | null
          company_id?: string
          created_at?: string
          current_use?: string
          id?: string
          location_state?: string | null
          previous_use?: string
          updated_at?: string
          vegetation_type?: string | null
        }
        Relationships: []
      }
      license_ai_analysis: {
        Row: {
          ai_insights: Json
          ai_model_used: string | null
          analysis_type: string
          company_id: string
          confidence_score: number | null
          created_at: string
          id: string
          license_id: string
          processing_time_ms: number | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_insights?: Json
          ai_model_used?: string | null
          analysis_type?: string
          company_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          license_id: string
          processing_time_ms?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_insights?: Json
          ai_model_used?: string | null
          analysis_type?: string
          company_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          license_id?: string
          processing_time_ms?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_ai_analysis_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_alerts: {
        Row: {
          action_required: boolean
          alert_type: string
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          is_resolved: boolean
          license_id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          action_required?: boolean
          alert_type: string
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_resolved?: boolean
          license_id: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_required?: boolean
          alert_type?: string
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_resolved?: boolean
          license_id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_alerts_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_conditions: {
        Row: {
          ai_confidence: number | null
          ai_extracted: boolean
          company_id: string
          condition_category: string | null
          condition_text: string
          created_at: string
          due_date: string | null
          frequency: Database["public"]["Enums"]["frequency_enum"] | null
          id: string
          license_id: string
          priority: string
          responsible_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_extracted?: boolean
          company_id: string
          condition_category?: string | null
          condition_text: string
          created_at?: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"] | null
          id?: string
          license_id: string
          priority?: string
          responsible_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_extracted?: boolean
          company_id?: string
          condition_category?: string | null
          condition_text?: string
          created_at?: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"] | null
          id?: string
          license_id?: string
          priority?: string
          responsible_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_conditions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          ai_confidence_score: number | null
          ai_extracted_data: Json | null
          ai_last_analysis_at: string | null
          ai_processing_status: string | null
          asset_id: string | null
          company_id: string
          compliance_score: number | null
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
          ai_confidence_score?: number | null
          ai_extracted_data?: Json | null
          ai_last_analysis_at?: string | null
          ai_processing_status?: string | null
          asset_id?: string | null
          company_id: string
          compliance_score?: number | null
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
          ai_confidence_score?: number | null
          ai_extracted_data?: Json | null
          ai_last_analysis_at?: string | null
          ai_processing_status?: string | null
          asset_id?: string | null
          company_id?: string
          compliance_score?: number | null
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
            foreignKeyName: "licenses_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
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
      marketplace_favorites: {
        Row: {
          company_id: string
          created_at: string
          id: string
          solution_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          solution_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          solution_id?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_leads: {
        Row: {
          budget_range: string | null
          closed_at: string | null
          company_id: string
          contact_notes: string | null
          contacted_at: string | null
          created_at: string
          estimated_value: number | null
          id: string
          insight_reference: string | null
          priority: string
          provider_response: string | null
          solution_id: string
          specific_requirements: string | null
          status: string
          timeline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          closed_at?: string | null
          company_id: string
          contact_notes?: string | null
          contacted_at?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          insight_reference?: string | null
          priority?: string
          provider_response?: string | null
          solution_id: string
          specific_requirements?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_range?: string | null
          closed_at?: string | null
          company_id?: string
          contact_notes?: string | null
          contacted_at?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          insight_reference?: string | null
          priority?: string
          provider_response?: string | null
          solution_id?: string
          specific_requirements?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_leads_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "esg_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      regulatory_requirements: {
        Row: {
          company_id: string
          created_at: string
          id: string
          jurisdiction: Database["public"]["Enums"]["jurisdiction_enum"]
          reference_code: string | null
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          jurisdiction?: Database["public"]["Enums"]["jurisdiction_enum"]
          reference_code?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          jurisdiction?: Database["public"]["Enums"]["jurisdiction_enum"]
          reference_code?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      solution_reviews: {
        Row: {
          company_id: string
          created_at: string
          id: string
          implementation_success: boolean | null
          provider_id: string
          rating: number
          review_text: string | null
          roi_achieved: string | null
          solution_id: string
          title: string | null
          user_id: string
          verified_purchase: boolean | null
          would_recommend: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          implementation_success?: boolean | null
          provider_id: string
          rating: number
          review_text?: string | null
          roi_achieved?: string | null
          solution_id: string
          title?: string | null
          user_id: string
          verified_purchase?: boolean | null
          would_recommend?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          implementation_success?: boolean | null
          provider_id?: string
          rating?: number
          review_text?: string | null
          roi_achieved?: string | null
          solution_id?: string
          title?: string | null
          user_id?: string
          verified_purchase?: boolean | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "solution_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esg_solution_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_reviews_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "esg_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_distribution: {
        Row: {
          company_id: string
          created_at: string
          direction: string
          distance_km: number | null
          emission_source_id: string | null
          fuel_consumption: number | null
          fuel_type: string | null
          id: string
          transport_mode: string
          updated_at: string
          weight_tonnes: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          direction: string
          distance_km?: number | null
          emission_source_id?: string | null
          fuel_consumption?: number | null
          fuel_type?: string | null
          id?: string
          transport_mode: string
          updated_at?: string
          weight_tonnes?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          direction?: string
          distance_km?: number | null
          emission_source_id?: string | null
          fuel_consumption?: number | null
          fuel_type?: string | null
          id?: string
          transport_mode?: string
          updated_at?: string
          weight_tonnes?: number | null
        }
        Relationships: []
      }
      variable_factors: {
        Row: {
          biodiesel_percentage: number
          created_at: string
          electricity_sin_factor: number | null
          ethanol_percentage: number
          id: string
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          biodiesel_percentage?: number
          created_at?: string
          electricity_sin_factor?: number | null
          ethanol_percentage?: number
          id?: string
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          biodiesel_percentage?: number
          created_at?: string
          electricity_sin_factor?: number | null
          ethanol_percentage?: number
          id?: string
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      waste_logs: {
        Row: {
          asset_id: string | null
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
          asset_id?: string | null
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
          asset_id?: string | null
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
            foreignKeyName: "waste_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wastewater_treatment: {
        Row: {
          ch4_emissions: number | null
          company_id: string
          created_at: string
          discharge_pathway: string | null
          id: string
          methane_recovered: boolean | null
          n2o_emissions: number | null
          nitrogen_content: number | null
          organic_load_bod: number | null
          sludge_removed: boolean | null
          temperature: number | null
          treatment_type: string
          updated_at: string
          volume_treated: number | null
        }
        Insert: {
          ch4_emissions?: number | null
          company_id: string
          created_at?: string
          discharge_pathway?: string | null
          id?: string
          methane_recovered?: boolean | null
          n2o_emissions?: number | null
          nitrogen_content?: number | null
          organic_load_bod?: number | null
          sludge_removed?: boolean | null
          temperature?: number | null
          treatment_type: string
          updated_at?: string
          volume_treated?: number | null
        }
        Update: {
          ch4_emissions?: number | null
          company_id?: string
          created_at?: string
          discharge_pathway?: string | null
          id?: string
          methane_recovered?: boolean | null
          n2o_emissions?: number | null
          nitrogen_content?: number | null
          organic_load_bod?: number | null
          sludge_removed?: boolean | null
          temperature?: number | null
          treatment_type?: string
          updated_at?: string
          volume_treated?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_conservation_stats: {
        Args: { p_company_id: string }
        Returns: Json
      }
      calculate_license_status: {
        Args: {
          current_status: Database["public"]["Enums"]["license_status_enum"]
          expiration_date_param: string
          issue_date_param: string
        }
        Returns: Database["public"]["Enums"]["license_status_enum"]
      }
      exec_sql: {
        Args: { query: string }
        Returns: Json
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_activity: {
        Args: {
          p_action_type: string
          p_company_id: string
          p_description: string
          p_details_json?: Json
          p_user_id: string
        }
        Returns: string
      }
      update_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      carbon_project_status_enum: "Ativo" | "Encerrado" | "Suspenso"
      compliance_task_status_enum:
        | "Pendente"
        | "Em Andamento"
        | "Concluído"
        | "Em Atraso"
      credit_status_enum: "Disponível" | "Aposentado" | "Reservado"
      emission_factor_type_enum: "system" | "custom"
      emission_source_status_enum: "Ativo" | "Inativo"
      frequency_enum:
        | "Única"
        | "Anual"
        | "Semestral"
        | "Trimestral"
        | "Mensal"
        | "Sob Demanda"
      goal_status_enum:
        | "No Caminho Certo"
        | "Atenção Necessária"
        | "Atingida"
        | "Atrasada"
      jurisdiction_enum: "Federal" | "Estadual" | "Municipal"
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
      compliance_task_status_enum: [
        "Pendente",
        "Em Andamento",
        "Concluído",
        "Em Atraso",
      ],
      credit_status_enum: ["Disponível", "Aposentado", "Reservado"],
      emission_factor_type_enum: ["system", "custom"],
      emission_source_status_enum: ["Ativo", "Inativo"],
      frequency_enum: [
        "Única",
        "Anual",
        "Semestral",
        "Trimestral",
        "Mensal",
        "Sob Demanda",
      ],
      goal_status_enum: [
        "No Caminho Certo",
        "Atenção Necessária",
        "Atingida",
        "Atrasada",
      ],
      jurisdiction_enum: ["Federal", "Estadual", "Municipal"],
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
