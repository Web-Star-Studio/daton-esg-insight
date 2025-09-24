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
      action_plan_items: {
        Row: {
          action_plan_id: string
          created_at: string
          how_method: string | null
          how_much_cost: number | null
          id: string
          progress_percentage: number | null
          status: string | null
          updated_at: string
          what_action: string
          when_deadline: string | null
          where_location: string | null
          who_responsible_user_id: string | null
          why_reason: string | null
        }
        Insert: {
          action_plan_id: string
          created_at?: string
          how_method?: string | null
          how_much_cost?: number | null
          id?: string
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string
          what_action: string
          when_deadline?: string | null
          where_location?: string | null
          who_responsible_user_id?: string | null
          why_reason?: string | null
        }
        Update: {
          action_plan_id?: string
          created_at?: string
          how_method?: string | null
          how_much_cost?: number | null
          id?: string
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string
          what_action?: string
          when_deadline?: string | null
          where_location?: string | null
          who_responsible_user_id?: string | null
          why_reason?: string | null
        }
        Relationships: []
      }
      action_plans: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          objective: string | null
          plan_type: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          objective?: string | null
          plan_type?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          objective?: string | null
          plan_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_data: {
        Row: {
          created_at: string
          emission_factor_id: string | null
          emission_source_id: string
          id: string
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
      airport_factors: {
        Row: {
          aircraft_category: string
          airport_code: string
          airport_name: string
          ch4_factor: number | null
          co2_factor: number | null
          created_at: string
          factor_type: string
          fuel_consumption_factor: number | null
          id: string
          n2o_factor: number | null
          source: string
          unit: string
          updated_at: string
        }
        Insert: {
          aircraft_category: string
          airport_code: string
          airport_name: string
          ch4_factor?: number | null
          co2_factor?: number | null
          created_at?: string
          factor_type: string
          fuel_consumption_factor?: number | null
          id?: string
          n2o_factor?: number | null
          source?: string
          unit: string
          updated_at?: string
        }
        Update: {
          aircraft_category?: string
          airport_code?: string
          airport_name?: string
          ch4_factor?: number | null
          co2_factor?: number | null
          created_at?: string
          factor_type?: string
          fuel_consumption_factor?: number | null
          id?: string
          n2o_factor?: number | null
          source?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_approvals: {
        Row: {
          approval_notes: string | null
          approval_status: string
          approver_user_id: string
          article_id: string
          company_id: string
          created_at: string
          id: string
          updated_at: string
          version_number: number
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string
          approver_user_id: string
          article_id: string
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          version_number: number
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string
          approver_user_id?: string
          article_id?: string
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: []
      }
      article_bookmarks: {
        Row: {
          article_id: string
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      article_comments: {
        Row: {
          article_id: string
          author_user_id: string
          comment_text: string
          comment_type: string
          company_id: string
          created_at: string
          id: string
          is_resolved: boolean | null
          parent_comment_id: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          author_user_id: string
          comment_text: string
          comment_type?: string
          company_id: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          author_user_id?: string
          comment_text?: string
          comment_type?: string
          company_id?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      article_versions: {
        Row: {
          article_id: string
          category: string
          changes_summary: string | null
          company_id: string
          content: string
          created_at: string
          edited_by_user_id: string
          id: string
          tags: string[] | null
          title: string
          version_number: number
        }
        Insert: {
          article_id: string
          category: string
          changes_summary?: string | null
          company_id: string
          content: string
          created_at?: string
          edited_by_user_id: string
          id?: string
          tags?: string[] | null
          title: string
          version_number: number
        }
        Update: {
          article_id?: string
          category?: string
          changes_summary?: string | null
          company_id?: string
          content?: string
          created_at?: string
          edited_by_user_id?: string
          id?: string
          tags?: string[] | null
          title?: string
          version_number?: number
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
      board_members: {
        Row: {
          age: number | null
          appointment_date: string
          biography: string | null
          committee: string | null
          company_id: string
          created_at: string
          experience_years: number | null
          expertise_areas: string[] | null
          full_name: string
          gender: string | null
          id: string
          is_independent: boolean | null
          position: string
          status: string | null
          term_end_date: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          appointment_date: string
          biography?: string | null
          committee?: string | null
          company_id: string
          created_at?: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          full_name: string
          gender?: string | null
          id?: string
          is_independent?: boolean | null
          position: string
          status?: string | null
          term_end_date?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          appointment_date?: string
          biography?: string | null
          committee?: string | null
          company_id?: string
          created_at?: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          full_name?: string
          gender?: string | null
          id?: string
          is_independent?: boolean | null
          position?: string
          status?: string | null
          term_end_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bsc_objectives: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          name: string
          owner_user_id: string | null
          perspective_id: string
          progress_percentage: number | null
          status: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          perspective_id: string
          progress_percentage?: number | null
          status?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          perspective_id?: string
          progress_percentage?: number | null
          status?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      bsc_perspectives: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number | null
          strategic_map_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          strategic_map_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          strategic_map_id?: string
        }
        Relationships: []
      }
      calculated_emissions: {
        Row: {
          activity_data_id: string
          biogenic_co2e: number | null
          calculation_date: string
          details_json: Json | null
          emission_factor_id: string
          fossil_co2e: number | null
          id: string
          total_co2e: number
        }
        Insert: {
          activity_data_id: string
          biogenic_co2e?: number | null
          calculation_date?: string
          details_json?: Json | null
          emission_factor_id: string
          fossil_co2e?: number | null
          id?: string
          total_co2e: number
        }
        Update: {
          activity_data_id?: string
          biogenic_co2e?: number | null
          calculation_date?: string
          details_json?: Json | null
          emission_factor_id?: string
          fossil_co2e?: number | null
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
          annual_revenue: number | null
          business_units: Json | null
          cnpj: string
          created_at: string
          employee_count: number | null
          fiscal_year_end: string | null
          fiscal_year_start: string | null
          governance_model: string | null
          headquarters_address: string | null
          headquarters_coordinates: Json | null
          headquarters_country: string | null
          id: string
          legal_structure: string | null
          name: string
          reporting_scope: string | null
          sector: string | null
          stock_exchange: string | null
          stock_symbol: string | null
          subsidiaries_excluded: Json | null
          subsidiaries_included: Json | null
        }
        Insert: {
          annual_revenue?: number | null
          business_units?: Json | null
          cnpj: string
          created_at?: string
          employee_count?: number | null
          fiscal_year_end?: string | null
          fiscal_year_start?: string | null
          governance_model?: string | null
          headquarters_address?: string | null
          headquarters_coordinates?: Json | null
          headquarters_country?: string | null
          id?: string
          legal_structure?: string | null
          name: string
          reporting_scope?: string | null
          sector?: string | null
          stock_exchange?: string | null
          stock_symbol?: string | null
          subsidiaries_excluded?: Json | null
          subsidiaries_included?: Json | null
        }
        Update: {
          annual_revenue?: number | null
          business_units?: Json | null
          cnpj?: string
          created_at?: string
          employee_count?: number | null
          fiscal_year_end?: string | null
          fiscal_year_start?: string | null
          governance_model?: string | null
          headquarters_address?: string | null
          headquarters_coordinates?: Json | null
          headquarters_country?: string | null
          id?: string
          legal_structure?: string | null
          name?: string
          reporting_scope?: string | null
          sector?: string | null
          stock_exchange?: string | null
          stock_symbol?: string | null
          subsidiaries_excluded?: Json | null
          subsidiaries_included?: Json | null
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
      conversion_factors: {
        Row: {
          category: string
          conversion_factor: number
          created_at: string
          from_unit: string
          id: string
          source: string
          to_unit: string
          updated_at: string
        }
        Insert: {
          category: string
          conversion_factor: number
          created_at?: string
          from_unit: string
          id?: string
          source?: string
          to_unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          conversion_factor?: number
          created_at?: string
          from_unit?: string
          id?: string
          source?: string
          to_unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      corporate_policies: {
        Row: {
          approval_date: string | null
          approved_by_user_id: string | null
          category: string
          company_id: string
          content: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          effective_date: string
          file_path: string | null
          id: string
          review_date: string | null
          status: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by_user_id?: string | null
          category: string
          company_id: string
          content?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          effective_date: string
          file_path?: string | null
          id?: string
          review_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by_user_id?: string | null
          category?: string
          company_id?: string
          content?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          effective_date?: string
          file_path?: string | null
          id?: string
          review_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      corrective_actions: {
        Row: {
          action_description: string
          completion_date: string | null
          created_at: string
          due_date: string | null
          effectiveness_verification: string | null
          id: string
          non_conformity_id: string
          responsible_user_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_description: string
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          effectiveness_verification?: string | null
          id?: string
          non_conformity_id: string
          responsible_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_description?: string
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          effectiveness_verification?: string | null
          id?: string
          non_conformity_id?: string
          responsible_user_id?: string | null
          status?: string | null
          updated_at?: string
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
      departments: {
        Row: {
          budget: number | null
          company_id: string
          cost_center: string | null
          created_at: string
          description: string | null
          id: string
          manager_employee_id: string | null
          name: string
          parent_department_id: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id: string
          cost_center?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manager_employee_id?: string | null
          name: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string
          cost_center?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manager_employee_id?: string | null
          name?: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_approval_workflows: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      document_approvals: {
        Row: {
          approval_date: string | null
          approval_notes: string | null
          approver_user_id: string | null
          created_at: string
          current_step: number
          document_id: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["approval_status_enum"]
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          approval_date?: string | null
          approval_notes?: string | null
          approver_user_id?: string | null
          created_at?: string
          current_step?: number
          document_id: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status_enum"]
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          approval_date?: string | null
          approval_notes?: string | null
          approver_user_id?: string | null
          created_at?: string
          current_step?: number
          document_id?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status_enum"]
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "document_approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      document_audit_trail: {
        Row: {
          action: string
          details: string | null
          document_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          timestamp: string
          user_id: string
          user_ip_address: unknown | null
        }
        Insert: {
          action: string
          details?: string | null
          document_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          timestamp?: string
          user_id: string
          user_ip_address?: unknown | null
        }
        Update: {
          action?: string
          details?: string | null
          document_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          timestamp?: string
          user_id?: string
          user_ip_address?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_trail_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_controlled_copies: {
        Row: {
          assigned_department: string | null
          assigned_to_user_id: string | null
          copy_number: number
          distributed_date: string
          document_id: string
          id: string
          last_updated: string
          location: string | null
          notes: string | null
          status: string
        }
        Insert: {
          assigned_department?: string | null
          assigned_to_user_id?: string | null
          copy_number: number
          distributed_date?: string
          document_id: string
          id?: string
          last_updated?: string
          location?: string | null
          notes?: string | null
          status?: string
        }
        Update: {
          assigned_department?: string | null
          assigned_to_user_id?: string | null
          copy_number?: number
          distributed_date?: string
          document_id?: string
          id?: string
          last_updated?: string
          location?: string | null
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_controlled_copies_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
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
      document_master_list: {
        Row: {
          code: string
          company_id: string
          created_at: string
          distribution_list: Json | null
          document_id: string
          effective_date: string | null
          id: string
          is_active: boolean
          responsible_department: string | null
          review_date: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          distribution_list?: Json | null
          document_id: string
          effective_date?: string | null
          id?: string
          is_active?: boolean
          responsible_department?: string | null
          review_date?: string | null
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          distribution_list?: Json | null
          document_id?: string
          effective_date?: string | null
          id?: string
          is_active?: boolean
          responsible_department?: string | null
          review_date?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_master_list_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_permissions: {
        Row: {
          document_id: string | null
          expires_at: string | null
          folder_id: string | null
          granted_at: string
          granted_by_user_id: string
          id: string
          is_active: boolean
          permission_level: Database["public"]["Enums"]["permission_level_enum"]
          role: string | null
          user_id: string | null
        }
        Insert: {
          document_id?: string | null
          expires_at?: string | null
          folder_id?: string | null
          granted_at?: string
          granted_by_user_id: string
          id?: string
          is_active?: boolean
          permission_level: Database["public"]["Enums"]["permission_level_enum"]
          role?: string | null
          user_id?: string | null
        }
        Update: {
          document_id?: string | null
          expires_at?: string | null
          folder_id?: string | null
          granted_at?: string
          granted_by_user_id?: string
          id?: string
          is_active?: boolean
          permission_level?: Database["public"]["Enums"]["permission_level_enum"]
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_permissions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          changes_summary: string | null
          content_hash: string | null
          created_at: string
          created_by_user_id: string
          document_id: string
          file_path: string | null
          file_size: number | null
          id: string
          is_current: boolean
          metadata: Json | null
          title: string
          version_number: number
        }
        Insert: {
          changes_summary?: string | null
          content_hash?: string | null
          created_at?: string
          created_by_user_id: string
          document_id: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_current?: boolean
          metadata?: Json | null
          title: string
          version_number: number
        }
        Update: {
          changes_summary?: string | null
          content_hash?: string | null
          created_at?: string
          created_by_user_id?: string
          document_id?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_current?: boolean
          metadata?: Json | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_confidence_score: number | null
          ai_extracted_category: string | null
          ai_processing_status: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          code: string | null
          company_id: string
          controlled_copy: boolean | null
          distribution_list: Json | null
          document_type:
            | Database["public"]["Enums"]["document_type_enum"]
            | null
          effective_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          folder_id: string | null
          id: string
          master_list_included: boolean | null
          next_review_date: string | null
          related_id: string
          related_model: string
          requires_approval: boolean | null
          responsible_department: string | null
          retention_period: unknown | null
          review_frequency:
            | Database["public"]["Enums"]["review_frequency_enum"]
            | null
          tags: string[] | null
          upload_date: string
          uploader_user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_extracted_category?: string | null
          ai_processing_status?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          code?: string | null
          company_id: string
          controlled_copy?: boolean | null
          distribution_list?: Json | null
          document_type?:
            | Database["public"]["Enums"]["document_type_enum"]
            | null
          effective_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          folder_id?: string | null
          id?: string
          master_list_included?: boolean | null
          next_review_date?: string | null
          related_id: string
          related_model: string
          requires_approval?: boolean | null
          responsible_department?: string | null
          retention_period?: unknown | null
          review_frequency?:
            | Database["public"]["Enums"]["review_frequency_enum"]
            | null
          tags?: string[] | null
          upload_date?: string
          uploader_user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_extracted_category?: string | null
          ai_processing_status?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          code?: string | null
          company_id?: string
          controlled_copy?: boolean | null
          distribution_list?: Json | null
          document_type?:
            | Database["public"]["Enums"]["document_type_enum"]
            | null
          effective_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          folder_id?: string | null
          id?: string
          master_list_included?: boolean | null
          next_review_date?: string | null
          related_id?: string
          related_model?: string
          requires_approval?: boolean | null
          responsible_department?: string | null
          retention_period?: unknown | null
          review_frequency?:
            | Database["public"]["Enums"]["review_frequency_enum"]
            | null
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
          biogenic_fraction: number | null
          calorific_value: number | null
          calorific_value_unit: string | null
          category: string
          ch4_factor: number | null
          co2_factor: number | null
          company_id: string | null
          created_at: string
          density: number | null
          density_unit: string | null
          details_json: Json | null
          fuel_type: string | null
          id: string
          is_biofuel: boolean | null
          n2o_factor: number | null
          name: string
          source: string
          type: Database["public"]["Enums"]["emission_factor_type_enum"]
          validation_status: string | null
          year_of_validity: number | null
        }
        Insert: {
          activity_unit: string
          biogenic_fraction?: number | null
          calorific_value?: number | null
          calorific_value_unit?: string | null
          category: string
          ch4_factor?: number | null
          co2_factor?: number | null
          company_id?: string | null
          created_at?: string
          density?: number | null
          density_unit?: string | null
          details_json?: Json | null
          fuel_type?: string | null
          id?: string
          is_biofuel?: boolean | null
          n2o_factor?: number | null
          name: string
          source: string
          type?: Database["public"]["Enums"]["emission_factor_type_enum"]
          validation_status?: string | null
          year_of_validity?: number | null
        }
        Update: {
          activity_unit?: string
          biogenic_fraction?: number | null
          calorific_value?: number | null
          calorific_value_unit?: string | null
          category?: string
          ch4_factor?: number | null
          co2_factor?: number | null
          company_id?: string | null
          created_at?: string
          density?: number | null
          density_unit?: string | null
          details_json?: Json | null
          fuel_type?: string | null
          id?: string
          is_biofuel?: boolean | null
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
          economic_sector: string | null
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
          economic_sector?: string | null
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
          economic_sector?: string | null
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
      employee_trainings: {
        Row: {
          company_id: string
          completion_date: string | null
          created_at: string
          employee_id: string
          expiration_date: string | null
          id: string
          notes: string | null
          score: number | null
          status: string | null
          trainer: string | null
          training_program_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completion_date?: string | null
          created_at?: string
          employee_id: string
          expiration_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string | null
          trainer?: string | null
          training_program_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completion_date?: string | null
          created_at?: string
          employee_id?: string
          expiration_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string | null
          trainer?: string | null
          training_program_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          birth_date: string | null
          company_id: string
          created_at: string
          department: string | null
          education_level: string | null
          email: string | null
          employee_code: string
          employment_type: string | null
          ethnicity: string | null
          full_name: string
          gender: string | null
          hire_date: string
          id: string
          location: string | null
          manager_id: string | null
          phone: string | null
          position: string | null
          position_id: string | null
          salary: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          company_id: string
          created_at?: string
          department?: string | null
          education_level?: string | null
          email?: string | null
          employee_code: string
          employment_type?: string | null
          ethnicity?: string | null
          full_name: string
          gender?: string | null
          hire_date: string
          id?: string
          location?: string | null
          manager_id?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          education_level?: string | null
          email?: string | null
          employee_code?: string
          employment_type?: string | null
          ethnicity?: string | null
          full_name?: string
          gender?: string | null
          hire_date?: string
          id?: string
          location?: string | null
          manager_id?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
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
      esg_performance_indicators: {
        Row: {
          benchmark_value: number | null
          calculation_method: string | null
          company_id: string
          created_at: string
          current_value: number | null
          data_source: string | null
          esg_category: string
          id: string
          indicator_code: string
          indicator_name: string
          is_kpi: boolean | null
          measurement_unit: string | null
          reporting_period: string
          responsible_user_id: string | null
          target_value: number | null
          trend: string | null
          updated_at: string
        }
        Insert: {
          benchmark_value?: number | null
          calculation_method?: string | null
          company_id: string
          created_at?: string
          current_value?: number | null
          data_source?: string | null
          esg_category: string
          id?: string
          indicator_code: string
          indicator_name: string
          is_kpi?: boolean | null
          measurement_unit?: string | null
          reporting_period: string
          responsible_user_id?: string | null
          target_value?: number | null
          trend?: string | null
          updated_at?: string
        }
        Update: {
          benchmark_value?: number | null
          calculation_method?: string | null
          company_id?: string
          created_at?: string
          current_value?: number | null
          data_source?: string | null
          esg_category?: string
          id?: string
          indicator_code?: string
          indicator_name?: string
          is_kpi?: boolean | null
          measurement_unit?: string | null
          reporting_period?: string
          responsible_user_id?: string | null
          target_value?: number | null
          trend?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      esg_risks: {
        Row: {
          company_id: string
          control_measures: string | null
          created_at: string
          esg_category: string
          id: string
          impact: string
          inherent_risk_level: string | null
          last_review_date: string | null
          mitigation_actions: string | null
          next_review_date: string | null
          owner_user_id: string | null
          probability: string
          residual_risk_level: string | null
          review_frequency: string | null
          risk_category: string | null
          risk_description: string
          risk_title: string
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          control_measures?: string | null
          created_at?: string
          esg_category: string
          id?: string
          impact: string
          inherent_risk_level?: string | null
          last_review_date?: string | null
          mitigation_actions?: string | null
          next_review_date?: string | null
          owner_user_id?: string | null
          probability: string
          residual_risk_level?: string | null
          review_frequency?: string | null
          risk_category?: string | null
          risk_description: string
          risk_title: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          control_measures?: string | null
          created_at?: string
          esg_category?: string
          id?: string
          impact?: string
          inherent_risk_level?: string | null
          last_review_date?: string | null
          mitigation_actions?: string | null
          next_review_date?: string | null
          owner_user_id?: string | null
          probability?: string
          residual_risk_level?: string | null
          review_frequency?: string | null
          risk_category?: string | null
          risk_description?: string
          risk_title?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
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
      gri_data_validations: {
        Row: {
          company_id: string
          created_at: string
          error_message: string
          id: string
          indicator_id: string
          is_active: boolean
          validation_rule: Json
        }
        Insert: {
          company_id: string
          created_at?: string
          error_message: string
          id?: string
          indicator_id: string
          is_active?: boolean
          validation_rule: Json
        }
        Update: {
          company_id?: string
          created_at?: string
          error_message?: string
          id?: string
          indicator_id?: string
          is_active?: boolean
          validation_rule?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gri_data_validations_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "gri_indicators_library"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_indicator_benchmarks: {
        Row: {
          benchmark_range_max: number | null
          benchmark_range_min: number | null
          benchmark_value: number | null
          created_at: string
          data_source: string | null
          id: string
          indicator_id: string
          reference_year: number | null
          region: string | null
          sector: string
        }
        Insert: {
          benchmark_range_max?: number | null
          benchmark_range_min?: number | null
          benchmark_value?: number | null
          created_at?: string
          data_source?: string | null
          id?: string
          indicator_id: string
          reference_year?: number | null
          region?: string | null
          sector: string
        }
        Update: {
          benchmark_range_max?: number | null
          benchmark_range_min?: number | null
          benchmark_value?: number | null
          created_at?: string
          data_source?: string | null
          id?: string
          indicator_id?: string
          reference_year?: number | null
          region?: string | null
          sector?: string
        }
        Relationships: [
          {
            foreignKeyName: "gri_indicator_benchmarks_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "gri_indicators_library"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_indicator_data: {
        Row: {
          boolean_value: boolean | null
          created_at: string
          data_source: string | null
          date_value: string | null
          id: string
          indicator_id: string
          is_complete: boolean | null
          last_updated_by: string | null
          methodology: string | null
          notes: string | null
          numeric_value: number | null
          percentage_value: number | null
          report_id: string
          supporting_documents: string[] | null
          text_value: string | null
          unit: string | null
          updated_at: string
          verification_level: string | null
        }
        Insert: {
          boolean_value?: boolean | null
          created_at?: string
          data_source?: string | null
          date_value?: string | null
          id?: string
          indicator_id: string
          is_complete?: boolean | null
          last_updated_by?: string | null
          methodology?: string | null
          notes?: string | null
          numeric_value?: number | null
          percentage_value?: number | null
          report_id: string
          supporting_documents?: string[] | null
          text_value?: string | null
          unit?: string | null
          updated_at?: string
          verification_level?: string | null
        }
        Update: {
          boolean_value?: boolean | null
          created_at?: string
          data_source?: string | null
          date_value?: string | null
          id?: string
          indicator_id?: string
          is_complete?: boolean | null
          last_updated_by?: string | null
          methodology?: string | null
          notes?: string | null
          numeric_value?: number | null
          percentage_value?: number | null
          report_id?: string
          supporting_documents?: string[] | null
          text_value?: string | null
          unit?: string | null
          updated_at?: string
          verification_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_indicator_data_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "gri_indicators_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_indicator_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_indicator_evidence: {
        Row: {
          company_id: string
          created_at: string
          document_id: string | null
          evidence_description: string | null
          evidence_type: string
          file_path: string | null
          id: string
          indicator_data_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_id?: string | null
          evidence_description?: string | null
          evidence_type: string
          file_path?: string | null
          id?: string
          indicator_data_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_id?: string | null
          evidence_description?: string | null
          evidence_type?: string
          file_path?: string | null
          id?: string
          indicator_data_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gri_indicator_evidence_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_indicator_evidence_indicator_data_id_fkey"
            columns: ["indicator_data_id"]
            isOneToOne: false
            referencedRelation: "gri_indicator_data"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_indicator_history: {
        Row: {
          change_reason: string | null
          changed_by_user_id: string
          company_id: string
          created_at: string
          id: string
          indicator_data_id: string
          new_value: string | null
          previous_value: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by_user_id: string
          company_id: string
          created_at?: string
          id?: string
          indicator_data_id: string
          new_value?: string | null
          previous_value?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by_user_id?: string
          company_id?: string
          created_at?: string
          id?: string
          indicator_data_id?: string
          new_value?: string | null
          previous_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_indicator_history_indicator_data_id_fkey"
            columns: ["indicator_data_id"]
            isOneToOne: false
            referencedRelation: "gri_indicator_data"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_indicator_mappings: {
        Row: {
          company_id: string
          created_at: string
          id: string
          indicator_id: string
          is_active: boolean
          mapping_formula: string | null
          mapping_type: string
          source_column: string
          source_table: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          indicator_id: string
          is_active?: boolean
          mapping_formula?: string | null
          mapping_type?: string
          source_column: string
          source_table: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          indicator_id?: string
          is_active?: boolean
          mapping_formula?: string | null
          mapping_type?: string
          source_column?: string
          source_table?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gri_indicator_mappings_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "gri_indicators_library"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_indicator_targets: {
        Row: {
          baseline_value: number | null
          baseline_year: number | null
          company_id: string
          created_at: string
          id: string
          indicator_id: string
          progress_tracking: Json | null
          target_description: string | null
          target_value: number | null
          target_year: number
          updated_at: string
        }
        Insert: {
          baseline_value?: number | null
          baseline_year?: number | null
          company_id: string
          created_at?: string
          id?: string
          indicator_id: string
          progress_tracking?: Json | null
          target_description?: string | null
          target_value?: number | null
          target_year: number
          updated_at?: string
        }
        Update: {
          baseline_value?: number | null
          baseline_year?: number | null
          company_id?: string
          created_at?: string
          id?: string
          indicator_id?: string
          progress_tracking?: Json | null
          target_description?: string | null
          target_value?: number | null
          target_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gri_indicator_targets_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "gri_indicators_library"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_indicators_library: {
        Row: {
          calculation_method: string | null
          code: string
          created_at: string
          data_sources_suggestions: string[] | null
          data_type: Database["public"]["Enums"]["gri_data_type_enum"]
          description: string
          gri_standard: string
          guidance_text: string | null
          id: string
          indicator_type: Database["public"]["Enums"]["gri_indicator_type_enum"]
          is_mandatory: boolean | null
          sector_specific: boolean | null
          sectors: string[] | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          calculation_method?: string | null
          code: string
          created_at?: string
          data_sources_suggestions?: string[] | null
          data_type: Database["public"]["Enums"]["gri_data_type_enum"]
          description: string
          gri_standard: string
          guidance_text?: string | null
          id?: string
          indicator_type: Database["public"]["Enums"]["gri_indicator_type_enum"]
          is_mandatory?: boolean | null
          sector_specific?: boolean | null
          sectors?: string[] | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          calculation_method?: string | null
          code?: string
          created_at?: string
          data_sources_suggestions?: string[] | null
          data_type?: Database["public"]["Enums"]["gri_data_type_enum"]
          description?: string
          gri_standard?: string
          guidance_text?: string | null
          id?: string
          indicator_type?: Database["public"]["Enums"]["gri_indicator_type_enum"]
          is_mandatory?: boolean | null
          sector_specific?: boolean | null
          sectors?: string[] | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gri_report_sections: {
        Row: {
          ai_generated_content: boolean | null
          completion_percentage: number | null
          content: string | null
          created_at: string
          id: string
          is_complete: boolean | null
          last_ai_update: string | null
          order_index: number | null
          report_id: string
          section_key: string
          template_used: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated_content?: boolean | null
          completion_percentage?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          last_ai_update?: string | null
          order_index?: number | null
          report_id: string
          section_key: string
          template_used?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated_content?: boolean | null
          completion_percentage?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          last_ai_update?: string | null
          order_index?: number | null
          report_id?: string
          section_key?: string
          template_used?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gri_report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_reports: {
        Row: {
          ceo_message: string | null
          company_id: string
          completion_percentage: number | null
          created_at: string
          executive_summary: string | null
          gri_standard_version: string
          id: string
          materiality_assessment: Json | null
          methodology: string | null
          publication_date: string | null
          published_at: string | null
          reporting_period_end: string
          reporting_period_start: string
          stakeholder_engagement: Json | null
          status: Database["public"]["Enums"]["report_gri_status_enum"]
          template_config: Json | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          ceo_message?: string | null
          company_id: string
          completion_percentage?: number | null
          created_at?: string
          executive_summary?: string | null
          gri_standard_version?: string
          id?: string
          materiality_assessment?: Json | null
          methodology?: string | null
          publication_date?: string | null
          published_at?: string | null
          reporting_period_end: string
          reporting_period_start: string
          stakeholder_engagement?: Json | null
          status?: Database["public"]["Enums"]["report_gri_status_enum"]
          template_config?: Json | null
          title?: string
          updated_at?: string
          year: number
        }
        Update: {
          ceo_message?: string | null
          company_id?: string
          completion_percentage?: number | null
          created_at?: string
          executive_summary?: string | null
          gri_standard_version?: string
          id?: string
          materiality_assessment?: Json | null
          methodology?: string | null
          publication_date?: string | null
          published_at?: string | null
          reporting_period_end?: string
          reporting_period_start?: string
          stakeholder_engagement?: Json | null
          status?: Database["public"]["Enums"]["report_gri_status_enum"]
          template_config?: Json | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      integrated_reports: {
        Row: {
          approved_by_user_id: string | null
          company_id: string
          content: Json | null
          created_at: string
          created_by_user_id: string
          environmental_score: number | null
          file_path: string | null
          framework: string | null
          governance_score: number | null
          id: string
          overall_esg_score: number | null
          published_at: string | null
          report_title: string
          report_type: string
          reporting_period_end: string
          reporting_period_start: string
          social_score: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_by_user_id?: string | null
          company_id: string
          content?: Json | null
          created_at?: string
          created_by_user_id: string
          environmental_score?: number | null
          file_path?: string | null
          framework?: string | null
          governance_score?: number | null
          id?: string
          overall_esg_score?: number | null
          published_at?: string | null
          report_title: string
          report_type: string
          reporting_period_end: string
          reporting_period_start: string
          social_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_by_user_id?: string | null
          company_id?: string
          content?: Json | null
          created_at?: string
          created_by_user_id?: string
          environmental_score?: number | null
          file_path?: string | null
          framework?: string | null
          governance_score?: number | null
          id?: string
          overall_esg_score?: number | null
          published_at?: string | null
          report_title?: string
          report_type?: string
          reporting_period_end?: string
          reporting_period_start?: string
          social_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      key_results: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          due_date: string | null
          id: string
          okr_id: string
          order_index: number | null
          owner_user_id: string | null
          progress_percentage: number | null
          status: string | null
          target_value: number
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          okr_id: string
          order_index?: number | null
          owner_user_id?: string | null
          progress_percentage?: number | null
          status?: string | null
          target_value: number
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          okr_id?: string
          order_index?: number | null
          owner_user_id?: string | null
          progress_percentage?: number | null
          status?: string | null
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          approval_status: string | null
          author_user_id: string
          category: string | null
          company_id: string
          content: string
          created_at: string
          id: string
          is_published: boolean | null
          last_edited_at: string | null
          last_edited_by_user_id: string | null
          requires_approval: boolean | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          version: number | null
          view_count: number | null
        }
        Insert: {
          approval_status?: string | null
          author_user_id: string
          category?: string | null
          company_id: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          last_edited_at?: string | null
          last_edited_by_user_id?: string | null
          requires_approval?: boolean | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number | null
          view_count?: number | null
        }
        Update: {
          approval_status?: string | null
          author_user_id?: string
          category?: string | null
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          last_edited_at?: string | null
          last_edited_by_user_id?: string | null
          requires_approval?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number | null
          view_count?: number | null
        }
        Relationships: []
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
      legal_documents: {
        Row: {
          company_id: string
          compliance_status: string | null
          created_at: string
          document_id: string | null
          effective_date: string | null
          expiration_date: string | null
          id: string
          issuing_authority: string | null
          law_number: string | null
          legislation_type: string
          next_review_date: string | null
          notes: string | null
          publication_date: string | null
          responsible_user_id: string | null
          review_frequency:
            | Database["public"]["Enums"]["review_frequency_enum"]
            | null
          subject: string
          updated_at: string
        }
        Insert: {
          company_id: string
          compliance_status?: string | null
          created_at?: string
          document_id?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          issuing_authority?: string | null
          law_number?: string | null
          legislation_type: string
          next_review_date?: string | null
          notes?: string | null
          publication_date?: string | null
          responsible_user_id?: string | null
          review_frequency?:
            | Database["public"]["Enums"]["review_frequency_enum"]
            | null
          subject: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          compliance_status?: string | null
          created_at?: string
          document_id?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          issuing_authority?: string | null
          law_number?: string | null
          legislation_type?: string
          next_review_date?: string | null
          notes?: string | null
          publication_date?: string | null
          responsible_user_id?: string | null
          review_frequency?:
            | Database["public"]["Enums"]["review_frequency_enum"]
            | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
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
      materiality_assessments: {
        Row: {
          assessment_year: number
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          external_score: Json | null
          final_matrix: Json | null
          id: string
          internal_score: Json | null
          methodology: string | null
          report_summary: string | null
          selected_themes: Json | null
          stakeholder_participation: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_year: number
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          external_score?: Json | null
          final_matrix?: Json | null
          id?: string
          internal_score?: Json | null
          methodology?: string | null
          report_summary?: string | null
          selected_themes?: Json | null
          stakeholder_participation?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_year?: number
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          external_score?: Json | null
          final_matrix?: Json | null
          id?: string
          internal_score?: Json | null
          methodology?: string | null
          report_summary?: string | null
          selected_themes?: Json | null
          stakeholder_participation?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      materiality_themes: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          gri_indicators: string[] | null
          id: string
          is_active: boolean
          sector_relevance: string[] | null
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          gri_indicators?: string[] | null
          id?: string
          is_active?: boolean
          sector_relevance?: string[] | null
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          gri_indicators?: string[] | null
          id?: string
          is_active?: boolean
          sector_relevance?: string[] | null
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      materiality_topics: {
        Row: {
          business_impact: number | null
          created_at: string
          description: string | null
          goals_targets: string | null
          id: string
          management_approach: string | null
          policies_commitments: string | null
          related_indicators: string[] | null
          report_id: string
          significance_level: number | null
          stakeholder_importance: number | null
          topic_name: string
          updated_at: string
        }
        Insert: {
          business_impact?: number | null
          created_at?: string
          description?: string | null
          goals_targets?: string | null
          id?: string
          management_approach?: string | null
          policies_commitments?: string | null
          related_indicators?: string[] | null
          report_id: string
          significance_level?: number | null
          stakeholder_importance?: number | null
          topic_name: string
          updated_at?: string
        }
        Update: {
          business_impact?: number | null
          created_at?: string
          description?: string | null
          goals_targets?: string | null
          id?: string
          management_approach?: string | null
          policies_commitments?: string | null
          related_indicators?: string[] | null
          report_id?: string
          significance_level?: number | null
          stakeholder_importance?: number | null
          topic_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiality_topics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      mtr_documents: {
        Row: {
          confidence_score: number | null
          created_at: string
          extracted_data: Json | null
          file_name: string
          file_path: string
          id: string
          upload_date: string
          validated_by_user_id: string | null
          validation_date: string | null
          validation_status: string | null
          waste_log_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          extracted_data?: Json | null
          file_name: string
          file_path: string
          id?: string
          upload_date?: string
          validated_by_user_id?: string | null
          validation_date?: string | null
          validation_status?: string | null
          waste_log_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          id?: string
          upload_date?: string
          validated_by_user_id?: string | null
          validation_date?: string | null
          validation_status?: string | null
          waste_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mtr_documents_waste_log"
            columns: ["waste_log_id"]
            isOneToOne: false
            referencedRelation: "waste_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      non_conformities: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string
          detected_by_user_id: string | null
          detected_date: string
          id: string
          nc_number: string
          responsible_user_id: string | null
          root_cause_analysis: string | null
          severity: string
          source: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description: string
          detected_by_user_id?: string | null
          detected_date: string
          id?: string
          nc_number: string
          responsible_user_id?: string | null
          root_cause_analysis?: string | null
          severity: string
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string
          detected_by_user_id?: string | null
          detected_date?: string
          id?: string
          nc_number?: string
          responsible_user_id?: string | null
          root_cause_analysis?: string | null
          severity?: string
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      okrs: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          owner_user_id: string | null
          progress_percentage: number | null
          quarter: string
          status: string | null
          strategic_map_id: string | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          owner_user_id?: string | null
          progress_percentage?: number | null
          quarter: string
          status?: string | null
          strategic_map_id?: string | null
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          owner_user_id?: string | null
          progress_percentage?: number | null
          quarter?: string
          status?: string | null
          strategic_map_id?: string | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          category: string
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          identification_date: string
          impact: string
          implementation_cost: number | null
          mitigation_actions: string | null
          monitoring_indicators: string | null
          next_review_date: string | null
          opportunity_level: string | null
          potential_value: number | null
          probability: string
          responsible_user_id: string | null
          review_date: string | null
          roi_estimate: number | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          identification_date?: string
          impact: string
          implementation_cost?: number | null
          mitigation_actions?: string | null
          monitoring_indicators?: string | null
          next_review_date?: string | null
          opportunity_level?: string | null
          potential_value?: number | null
          probability: string
          responsible_user_id?: string | null
          review_date?: string | null
          roi_estimate?: number | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          identification_date?: string
          impact?: string
          implementation_cost?: number | null
          mitigation_actions?: string | null
          monitoring_indicators?: string | null
          next_review_date?: string | null
          opportunity_level?: string | null
          potential_value?: number | null
          probability?: string
          responsible_user_id?: string | null
          review_date?: string | null
          roi_estimate?: number | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizational_chart: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          employee_id: string | null
          end_date: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean | null
          position_id: string | null
          reports_to_employee_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          employee_id?: string | null
          end_date?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          position_id?: string | null
          reports_to_employee_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          employee_id?: string | null
          end_date?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          position_id?: string | null
          reports_to_employee_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_chart_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizational_chart_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizational_chart_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizational_chart_reports_to_employee_id_fkey"
            columns: ["reports_to_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pgrs_actions: {
        Row: {
          action_description: string
          completion_date: string | null
          created_at: string
          due_date: string
          goal_id: string
          id: string
          notes: string | null
          responsible_user_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_description: string
          completion_date?: string | null
          created_at?: string
          due_date: string
          goal_id: string
          id?: string
          notes?: string | null
          responsible_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_description?: string
          completion_date?: string | null
          created_at?: string
          due_date?: string
          goal_id?: string
          id?: string
          notes?: string | null
          responsible_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pgrs_actions_goal"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "pgrs_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      pgrs_goals: {
        Row: {
          baseline_value: number
          created_at: string
          current_value: number | null
          deadline: string
          goal_type: string
          id: string
          pgrs_plan_id: string
          progress_percentage: number | null
          responsible_user_id: string | null
          status: string | null
          target_value: number
          unit: string
          updated_at: string
          waste_type_id: string | null
        }
        Insert: {
          baseline_value?: number
          created_at?: string
          current_value?: number | null
          deadline: string
          goal_type: string
          id?: string
          pgrs_plan_id: string
          progress_percentage?: number | null
          responsible_user_id?: string | null
          status?: string | null
          target_value: number
          unit?: string
          updated_at?: string
          waste_type_id?: string | null
        }
        Update: {
          baseline_value?: number
          created_at?: string
          current_value?: number | null
          deadline?: string
          goal_type?: string
          id?: string
          pgrs_plan_id?: string
          progress_percentage?: number | null
          responsible_user_id?: string | null
          status?: string | null
          target_value?: number
          unit?: string
          updated_at?: string
          waste_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pgrs_goals_plan"
            columns: ["pgrs_plan_id"]
            isOneToOne: false
            referencedRelation: "pgrs_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pgrs_goals_waste_type"
            columns: ["waste_type_id"]
            isOneToOne: false
            referencedRelation: "pgrs_waste_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pgrs_plans: {
        Row: {
          approval_date: string | null
          company_id: string
          created_at: string
          creation_date: string
          id: string
          next_review_date: string | null
          plan_name: string
          responsible_user_id: string | null
          status: string
          updated_at: string
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          company_id: string
          created_at?: string
          creation_date?: string
          id?: string
          next_review_date?: string | null
          plan_name: string
          responsible_user_id?: string | null
          status?: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          company_id?: string
          created_at?: string
          creation_date?: string
          id?: string
          next_review_date?: string | null
          plan_name?: string
          responsible_user_id?: string | null
          status?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      pgrs_procedures: {
        Row: {
          created_at: string
          description: string
          frequency: string | null
          id: string
          infrastructure_details: string | null
          pgrs_plan_id: string
          procedure_type: string
          responsible_role: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          frequency?: string | null
          id?: string
          infrastructure_details?: string | null
          pgrs_plan_id: string
          procedure_type: string
          responsible_role?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          frequency?: string | null
          id?: string
          infrastructure_details?: string | null
          pgrs_plan_id?: string
          procedure_type?: string
          responsible_role?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pgrs_procedures_plan"
            columns: ["pgrs_plan_id"]
            isOneToOne: false
            referencedRelation: "pgrs_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pgrs_waste_sources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string | null
          pgrs_plan_id: string
          source_name: string
          source_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          pgrs_plan_id: string
          source_name: string
          source_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          pgrs_plan_id?: string
          source_name?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pgrs_waste_sources_plan"
            columns: ["pgrs_plan_id"]
            isOneToOne: false
            referencedRelation: "pgrs_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pgrs_waste_types: {
        Row: {
          composition: string | null
          conama_code: string | null
          created_at: string
          estimated_quantity_monthly: number | null
          hazard_class: string
          ibama_code: string | null
          id: string
          source_id: string
          unit: string | null
          updated_at: string
          waste_name: string
        }
        Insert: {
          composition?: string | null
          conama_code?: string | null
          created_at?: string
          estimated_quantity_monthly?: number | null
          hazard_class: string
          ibama_code?: string | null
          id?: string
          source_id: string
          unit?: string | null
          updated_at?: string
          waste_name: string
        }
        Update: {
          composition?: string | null
          conama_code?: string | null
          created_at?: string
          estimated_quantity_monthly?: number | null
          hazard_class?: string
          ibama_code?: string | null
          id?: string
          source_id?: string
          unit?: string | null
          updated_at?: string
          waste_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pgrs_waste_types_source"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "pgrs_waste_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          level: string | null
          reports_to_position_id: string | null
          requirements: string[] | null
          responsibilities: string[] | null
          salary_range_max: number | null
          salary_range_min: number | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          level?: string | null
          reports_to_position_id?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          level?: string | null
          reports_to_position_id?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_reports_to_position_id_fkey"
            columns: ["reports_to_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      process_activities: {
        Row: {
          activity_type: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          order_index: number | null
          process_map_id: string
          responsible_role: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          order_index?: number | null
          process_map_id: string
          responsible_role?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          order_index?: number | null
          process_map_id?: string
          responsible_role?: string | null
        }
        Relationships: []
      }
      process_connections: {
        Row: {
          condition_text: string | null
          created_at: string
          from_step_id: string
          id: string
          label: string | null
          process_map_id: string
          to_step_id: string
        }
        Insert: {
          condition_text?: string | null
          created_at?: string
          from_step_id: string
          id?: string
          label?: string | null
          process_map_id: string
          to_step_id: string
        }
        Update: {
          condition_text?: string | null
          created_at?: string
          from_step_id?: string
          id?: string
          label?: string | null
          process_map_id?: string
          to_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_connections_from_step_id_fkey"
            columns: ["from_step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_connections_process_map_id_fkey"
            columns: ["process_map_id"]
            isOneToOne: false
            referencedRelation: "process_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_connections_to_step_id_fkey"
            columns: ["to_step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_maps: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          canvas_data: Json | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_current_version: boolean | null
          name: string
          owner_user_id: string | null
          parent_version_id: string | null
          process_type: string | null
          status: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          canvas_data?: Json | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_current_version?: boolean | null
          name: string
          owner_user_id?: string | null
          parent_version_id?: string | null
          process_type?: string | null
          status?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          canvas_data?: Json | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_current_version?: boolean | null
          name?: string
          owner_user_id?: string | null
          parent_version_id?: string | null
          process_type?: string | null
          status?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_maps_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "process_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_stakeholders: {
        Row: {
          created_at: string
          id: string
          process_map_id: string
          responsibilities: string | null
          role: string
          stakeholder_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          process_map_id: string
          responsibilities?: string | null
          role: string
          stakeholder_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          process_map_id?: string
          responsibilities?: string | null
          role?: string
          stakeholder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_stakeholders_process_map_id_fkey"
            columns: ["process_map_id"]
            isOneToOne: false
            referencedRelation: "process_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_steps: {
        Row: {
          created_at: string
          description: string | null
          height: number | null
          id: string
          name: string
          order_index: number | null
          position_x: number | null
          position_y: number | null
          process_map_id: string
          properties: Json | null
          step_type: string
          updated_at: string
          width: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          name: string
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
          process_map_id: string
          properties?: Json | null
          step_type?: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          name?: string
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
          process_map_id?: string
          properties?: Json | null
          step_type?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_steps_process_map_id_fkey"
            columns: ["process_map_id"]
            isOneToOne: false
            referencedRelation: "process_maps"
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
      project_burndown_data: {
        Row: {
          actual_work_remaining: number
          created_at: string
          date: string
          id: string
          planned_work_remaining: number
          project_id: string
          work_completed: number | null
        }
        Insert: {
          actual_work_remaining: number
          created_at?: string
          date: string
          id?: string
          planned_work_remaining: number
          project_id: string
          work_completed?: number | null
        }
        Update: {
          actual_work_remaining?: number
          created_at?: string
          date?: string
          id?: string
          planned_work_remaining?: number
          project_id?: string
          work_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_burndown_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          actual_date: string | null
          created_at: string
          criteria: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          status: string
          target_date: string
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          created_at?: string
          criteria?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          target_date: string
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          created_at?: string
          criteria?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          target_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          allocation_percentage: number | null
          created_at: string
          employee_id: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          notes: string | null
          project_id: string
          role_name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          allocation_percentage?: number | null
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          project_id: string
          role_name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          allocation_percentage?: number | null
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          project_id?: string
          role_name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scope_changes: {
        Row: {
          approval_date: string | null
          approved_by_user_id: string | null
          budget_impact: number | null
          change_request: string
          created_at: string
          id: string
          impact_description: string | null
          justification: string | null
          project_id: string
          requested_by_user_id: string
          schedule_impact_days: number | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approved_by_user_id?: string | null
          budget_impact?: number | null
          change_request: string
          created_at?: string
          id?: string
          impact_description?: string | null
          justification?: string | null
          project_id: string
          requested_by_user_id: string
          schedule_impact_days?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approved_by_user_id?: string | null
          budget_impact?: number | null
          change_request?: string
          created_at?: string
          id?: string
          impact_description?: string | null
          justification?: string | null
          project_id?: string
          requested_by_user_id?: string
          schedule_impact_days?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_scope_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to_user_id: string | null
          created_at: string
          created_by_user_id: string
          dependencies: Json | null
          description: string | null
          end_date: string | null
          estimated_hours: number | null
          id: string
          name: string
          parent_task_id: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          priority: string | null
          progress_percentage: number | null
          project_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to_user_id?: string | null
          created_at?: string
          created_by_user_id: string
          dependencies?: Json | null
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          parent_task_id?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to_user_id?: string | null
          created_at?: string
          created_by_user_id?: string
          dependencies?: Json | null
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          parent_task_id?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          end_date: string | null
          id: string
          manager_user_id: string | null
          methodology: string | null
          name: string
          phase: string
          planned_end_date: string | null
          planned_start_date: string | null
          priority: string | null
          progress_percentage: number | null
          project_type: string
          scope_description: string | null
          spent_budget: number | null
          sponsor_user_id: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_user_id?: string | null
          methodology?: string | null
          name: string
          phase?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_type?: string
          scope_description?: string | null
          spent_budget?: number | null
          sponsor_user_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_user_id?: string | null
          methodology?: string | null
          name?: string
          phase?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_type?: string
          scope_description?: string | null
          spent_budget?: number | null
          sponsor_user_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      refrigerant_factors: {
        Row: {
          category: string
          chemical_formula: string | null
          chemical_name: string
          created_at: string
          gwp_ar4: number | null
          gwp_ar5: number | null
          gwp_ar6: number
          id: string
          is_kyoto_gas: boolean
          refrigerant_code: string
          source: string
          updated_at: string
        }
        Insert: {
          category?: string
          chemical_formula?: string | null
          chemical_name: string
          created_at?: string
          gwp_ar4?: number | null
          gwp_ar5?: number | null
          gwp_ar6: number
          id?: string
          is_kyoto_gas?: boolean
          refrigerant_code: string
          source?: string
          updated_at?: string
        }
        Update: {
          category?: string
          chemical_formula?: string | null
          chemical_name?: string
          created_at?: string
          gwp_ar4?: number | null
          gwp_ar5?: number | null
          gwp_ar6?: number
          id?: string
          is_kyoto_gas?: boolean
          refrigerant_code?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
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
      risk_assessments: {
        Row: {
          category: string | null
          created_at: string
          id: string
          impact: string
          owner_user_id: string | null
          probability: string
          risk_description: string | null
          risk_level: string | null
          risk_matrix_id: string
          risk_title: string
          status: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          impact: string
          owner_user_id?: string | null
          probability: string
          risk_description?: string | null
          risk_level?: string | null
          risk_matrix_id: string
          risk_title: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          impact?: string
          owner_user_id?: string | null
          probability?: string
          risk_description?: string | null
          risk_level?: string | null
          risk_matrix_id?: string
          risk_title?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      risk_matrices: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          matrix_type: string | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          matrix_type?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          matrix_type?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_occurrences: {
        Row: {
          actual_impact: string
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          financial_impact: number | null
          id: string
          lessons_learned: string | null
          occurrence_date: string
          operational_impact: string | null
          prevention_measures: string | null
          resolution_date: string | null
          response_actions: string | null
          responsible_user_id: string | null
          risk_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_impact: string
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          financial_impact?: number | null
          id?: string
          lessons_learned?: string | null
          occurrence_date: string
          operational_impact?: string | null
          prevention_measures?: string | null
          resolution_date?: string | null
          response_actions?: string | null
          responsible_user_id?: string | null
          risk_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_impact?: string
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          financial_impact?: number | null
          id?: string
          lessons_learned?: string | null
          occurrence_date?: string
          operational_impact?: string | null
          prevention_measures?: string | null
          resolution_date?: string | null
          response_actions?: string | null
          responsible_user_id?: string | null
          risk_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_treatments: {
        Row: {
          action_description: string
          created_at: string
          due_date: string | null
          id: string
          responsible_user_id: string | null
          risk_assessment_id: string
          status: string | null
          treatment_type: string
          updated_at: string
        }
        Insert: {
          action_description: string
          created_at?: string
          due_date?: string | null
          id?: string
          responsible_user_id?: string | null
          risk_assessment_id: string
          status?: string | null
          treatment_type: string
          updated_at?: string
        }
        Update: {
          action_description?: string
          created_at?: string
          due_date?: string | null
          id?: string
          responsible_user_id?: string | null
          risk_assessment_id?: string
          status?: string | null
          treatment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      safety_incidents: {
        Row: {
          company_id: string
          corrective_actions: string | null
          created_at: string
          days_lost: number | null
          description: string
          employee_id: string | null
          id: string
          immediate_cause: string | null
          incident_date: string
          incident_time: string | null
          incident_type: string
          investigation_completed_at: string | null
          location: string | null
          medical_treatment_required: boolean | null
          reported_by_user_id: string
          root_cause: string | null
          severity: string
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          corrective_actions?: string | null
          created_at?: string
          days_lost?: number | null
          description: string
          employee_id?: string | null
          id?: string
          immediate_cause?: string | null
          incident_date: string
          incident_time?: string | null
          incident_type: string
          investigation_completed_at?: string | null
          location?: string | null
          medical_treatment_required?: boolean | null
          reported_by_user_id: string
          root_cause?: string | null
          severity: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          corrective_actions?: string | null
          created_at?: string
          days_lost?: number | null
          description?: string
          employee_id?: string | null
          id?: string
          immediate_cause?: string | null
          incident_date?: string
          incident_time?: string | null
          incident_type?: string
          investigation_completed_at?: string | null
          location?: string | null
          medical_treatment_required?: boolean | null
          reported_by_user_id?: string
          root_cause?: string | null
          severity?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sdg_alignment: {
        Row: {
          actions_taken: string | null
          contribution_level: string | null
          created_at: string
          description: string | null
          future_commitments: string | null
          id: string
          report_id: string
          results_achieved: string | null
          sdg_number: number
          sdg_target: string | null
        }
        Insert: {
          actions_taken?: string | null
          contribution_level?: string | null
          created_at?: string
          description?: string | null
          future_commitments?: string | null
          id?: string
          report_id: string
          results_achieved?: string | null
          sdg_number: number
          sdg_target?: string | null
        }
        Update: {
          actions_taken?: string | null
          contribution_level?: string | null
          created_at?: string
          description?: string | null
          future_commitments?: string | null
          id?: string
          report_id?: string
          results_achieved?: string | null
          sdg_number?: number
          sdg_target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdg_alignment_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      sipoc_elements: {
        Row: {
          created_at: string
          description: string | null
          element_type: string
          id: string
          name: string
          order_index: number | null
          process_map_id: string
          requirements: string | null
          specifications: string | null
          stakeholder_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          element_type: string
          id?: string
          name: string
          order_index?: number | null
          process_map_id: string
          requirements?: string | null
          specifications?: string | null
          stakeholder_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          element_type?: string
          id?: string
          name?: string
          order_index?: number | null
          process_map_id?: string
          requirements?: string | null
          specifications?: string | null
          stakeholder_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sipoc_elements_process_map_id_fkey"
            columns: ["process_map_id"]
            isOneToOne: false
            referencedRelation: "process_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      social_projects: {
        Row: {
          budget: number | null
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          impact_metrics: Json | null
          invested_amount: number | null
          location: string | null
          name: string
          objective: string | null
          responsible_user_id: string | null
          start_date: string
          status: string | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impact_metrics?: Json | null
          invested_amount?: number | null
          location?: string | null
          name: string
          objective?: string | null
          responsible_user_id?: string | null
          start_date: string
          status?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impact_metrics?: Json | null
          invested_amount?: number | null
          location?: string | null
          name?: string
          objective?: string | null
          responsible_user_id?: string | null
          start_date?: string
          status?: string | null
          target_audience?: string | null
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
      stakeholder_surveys: {
        Row: {
          assessment_id: string
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          instructions: string | null
          is_anonymous: boolean
          response_deadline: string | null
          status: string
          survey_config: Json
          target_stakeholder_categories: string[] | null
          title: string
          total_invitations: number | null
          total_responses: number | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_anonymous?: boolean
          response_deadline?: string | null
          status?: string
          survey_config?: Json
          target_stakeholder_categories?: string[] | null
          title: string
          total_invitations?: number | null
          total_responses?: number | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_anonymous?: boolean
          response_deadline?: string | null
          status?: string
          survey_config?: Json
          target_stakeholder_categories?: string[] | null
          title?: string
          total_invitations?: number | null
          total_responses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stakeholders: {
        Row: {
          category: string
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          engagement_frequency: string | null
          id: string
          influence_level: string | null
          interest_level: string | null
          is_active: boolean
          name: string
          notes: string | null
          organization: string | null
          position: string | null
          preferred_communication: string | null
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          engagement_frequency?: string | null
          id?: string
          influence_level?: string | null
          interest_level?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          organization?: string | null
          position?: string | null
          preferred_communication?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          engagement_frequency?: string | null
          id?: string
          influence_level?: string | null
          interest_level?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          organization?: string | null
          position?: string | null
          preferred_communication?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      strategic_associations: {
        Row: {
          associated_id: string
          associated_type: string
          bsc_objective_id: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          relationship_type: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          associated_id: string
          associated_type: string
          bsc_objective_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          associated_id?: string
          associated_type?: string
          bsc_objective_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      strategic_initiatives: {
        Row: {
          budget: number | null
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          end_date: string | null
          id: string
          priority: string | null
          progress_percentage: number | null
          responsible_user_id: string | null
          start_date: string | null
          status: string | null
          strategic_map_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          responsible_user_id?: string | null
          start_date?: string | null
          status?: string | null
          strategic_map_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          responsible_user_id?: string | null
          start_date?: string | null
          status?: string | null
          strategic_map_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      strategic_maps: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_evaluations: {
        Row: {
          comments: string | null
          created_at: string
          delivery_score: number | null
          evaluation_date: string
          evaluator_user_id: string | null
          id: string
          overall_score: number | null
          quality_score: number | null
          service_score: number | null
          supplier_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          delivery_score?: number | null
          evaluation_date: string
          evaluator_user_id?: string | null
          id?: string
          overall_score?: number | null
          quality_score?: number | null
          service_score?: number | null
          supplier_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          delivery_score?: number | null
          evaluation_date?: string
          evaluator_user_id?: string | null
          id?: string
          overall_score?: number | null
          quality_score?: number | null
          service_score?: number | null
          supplier_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          cnpj: string | null
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          qualification_status: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          cnpj?: string | null
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          qualification_status?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          cnpj?: string | null
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          qualification_status?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          company_id: string
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          ip_address: unknown | null
          response_data: Json
          stakeholder_category: string | null
          stakeholder_id: string | null
          stakeholder_organization: string | null
          started_at: string | null
          survey_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          response_data?: Json
          stakeholder_category?: string | null
          stakeholder_id?: string | null
          stakeholder_organization?: string | null
          started_at?: string | null
          survey_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          response_data?: Json
          stakeholder_category?: string | null
          stakeholder_id?: string | null
          stakeholder_organization?: string | null
          started_at?: string | null
          survey_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      swot_analysis: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          strategic_map_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          strategic_map_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          strategic_map_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      swot_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          impact_level: string | null
          item_text: string
          order_index: number | null
          swot_analysis_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          impact_level?: string | null
          item_text: string
          order_index?: number | null
          swot_analysis_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          impact_level?: string | null
          item_text?: string
          order_index?: number | null
          swot_analysis_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swot_items_swot_analysis_id_fkey"
            columns: ["swot_analysis_id"]
            isOneToOne: false
            referencedRelation: "swot_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          duration_hours: number | null
          id: string
          is_mandatory: boolean | null
          name: string
          status: string | null
          updated_at: string
          valid_for_months: number | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          status?: string | null
          updated_at?: string
          valid_for_months?: number | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          status?: string | null
          updated_at?: string
          valid_for_months?: number | null
        }
        Relationships: []
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
      turtle_diagrams: {
        Row: {
          created_at: string
          id: string
          inputs: Json | null
          measurements: Json | null
          methods: Json | null
          outputs: Json | null
          process_map_id: string
          process_step_id: string | null
          resources: Json | null
          risks: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inputs?: Json | null
          measurements?: Json | null
          methods?: Json | null
          outputs?: Json | null
          process_map_id: string
          process_step_id?: string | null
          resources?: Json | null
          risks?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json | null
          measurements?: Json | null
          methods?: Json | null
          outputs?: Json | null
          process_map_id?: string
          process_step_id?: string | null
          resources?: Json | null
          risks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turtle_diagrams_process_map_id_fkey"
            columns: ["process_map_id"]
            isOneToOne: false
            referencedRelation: "process_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turtle_diagrams_process_step_id_fkey"
            columns: ["process_step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
        ]
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
      waste_suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          company_id: string
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          license_expiry: string | null
          license_issuing_body: string | null
          license_number: string | null
          license_type: string | null
          notes: string | null
          rating: number | null
          status: string | null
          supplier_type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          company_id: string
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          license_expiry?: string | null
          license_issuing_body?: string | null
          license_number?: string | null
          license_type?: string | null
          notes?: string | null
          rating?: number | null
          status?: string | null
          supplier_type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          company_id?: string
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          license_expiry?: string | null
          license_issuing_body?: string | null
          license_number?: string | null
          license_type?: string | null
          notes?: string | null
          rating?: number | null
          status?: string | null
          supplier_type?: string
          updated_at?: string
        }
        Relationships: []
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
      whistleblower_reports: {
        Row: {
          assigned_to_user_id: string | null
          category: string
          closed_at: string | null
          company_id: string
          created_at: string
          description: string
          evidence_description: string | null
          id: string
          incident_date: string | null
          investigation_notes: string | null
          is_anonymous: boolean | null
          location: string | null
          people_involved: string | null
          priority: string | null
          report_code: string
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          resolution_summary: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          category: string
          closed_at?: string | null
          company_id: string
          created_at?: string
          description: string
          evidence_description?: string | null
          id?: string
          incident_date?: string | null
          investigation_notes?: string | null
          is_anonymous?: boolean | null
          location?: string | null
          people_involved?: string | null
          priority?: string | null
          report_code: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          resolution_summary?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          category?: string
          closed_at?: string | null
          company_id?: string
          created_at?: string
          description?: string
          evidence_description?: string | null
          id?: string
          incident_date?: string | null
          investigation_notes?: string | null
          is_anonymous?: boolean | null
          location?: string | null
          people_involved?: string | null
          priority?: string | null
          report_code?: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          resolution_summary?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_bsc_objective_progress: {
        Args: { p_objective_id: string }
        Returns: number
      }
      calculate_conservation_stats: {
        Args: { p_company_id: string }
        Returns: Json
      }
      calculate_gri_report_completion: {
        Args: { p_report_id: string }
        Returns: number
      }
      calculate_hierarchy_levels: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      calculate_license_status: {
        Args: {
          current_status: Database["public"]["Enums"]["license_status_enum"]
          expiration_date_param: string
          issue_date_param: string
        }
        Returns: Database["public"]["Enums"]["license_status_enum"]
      }
      calculate_risk_level: {
        Args: { p_impact: string; p_probability: string }
        Returns: string
      }
      calculate_risk_management_stats: {
        Args: { p_company_id: string }
        Returns: Json
      }
      calculate_simple_emissions: {
        Args: {
          p_activity_quantity: number
          p_activity_unit: string
          p_factor_ch4?: number
          p_factor_co2: number
          p_factor_n2o?: number
          p_factor_unit?: string
        }
        Returns: Json
      }
      exec_sql: {
        Args: { query: string }
        Returns: Json
      }
      get_conversion_factor: {
        Args: { p_category?: string; p_from_unit: string; p_to_unit: string }
        Returns: number
      }
      get_indicator_suggested_value: {
        Args: { p_company_id: string; p_indicator_code: string }
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
      policy_exists: {
        Args: { policy_name: string; table_name: string }
        Returns: boolean
      }
      update_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      approval_status_enum:
        | "rascunho"
        | "em_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "obsoleto"
      carbon_project_status_enum: "Ativo" | "Encerrado" | "Suspenso"
      compliance_task_status_enum:
        | "Pendente"
        | "Em Andamento"
        | "Concluído"
        | "Em Atraso"
      credit_status_enum: "Disponível" | "Aposentado" | "Reservado"
      document_type_enum: "interno" | "externo" | "registro" | "legal"
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
      gri_data_type_enum:
        | "Numérico"
        | "Percentual"
        | "Texto"
        | "Booleano"
        | "Data"
        | "Anexo"
      gri_indicator_type_enum:
        | "Universal"
        | "Econômico"
        | "Ambiental"
        | "Social"
        | "Governança"
      jurisdiction_enum: "Federal" | "Estadual" | "Municipal"
      license_status_enum: "Ativa" | "Em Renovação" | "Vencida" | "Suspensa"
      license_type_enum: "LP" | "LI" | "LO" | "LAS" | "LOC" | "Outra"
      permission_level_enum: "leitura" | "escrita" | "aprovacao" | "admin"
      report_gri_status_enum:
        | "Rascunho"
        | "Em Andamento"
        | "Em Revisão"
        | "Finalizado"
        | "Publicado"
      report_status_enum: "Rascunho" | "Gerando" | "Concluído"
      report_template_enum:
        | "GHG_PROTOCOL"
        | "GRI_STANDARD"
        | "GOALS_PERFORMANCE"
        | "CUSTOM_REPORT"
      review_frequency_enum:
        | "mensal"
        | "trimestral"
        | "semestral"
        | "anual"
        | "bienal"
      user_role_enum: "Admin" | "Editor" | "Leitor"
      waste_class_enum:
        | "Classe I - Perigoso"
        | "Classe II A - Não Inerte"
        | "Classe II B - Inerte"
      waste_status_enum: "Coletado" | "Em Trânsito" | "Destinação Finalizada"
      workflow_step_type_enum: "approval" | "review" | "notification"
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
      approval_status_enum: [
        "rascunho",
        "em_aprovacao",
        "aprovado",
        "rejeitado",
        "obsoleto",
      ],
      carbon_project_status_enum: ["Ativo", "Encerrado", "Suspenso"],
      compliance_task_status_enum: [
        "Pendente",
        "Em Andamento",
        "Concluído",
        "Em Atraso",
      ],
      credit_status_enum: ["Disponível", "Aposentado", "Reservado"],
      document_type_enum: ["interno", "externo", "registro", "legal"],
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
      gri_data_type_enum: [
        "Numérico",
        "Percentual",
        "Texto",
        "Booleano",
        "Data",
        "Anexo",
      ],
      gri_indicator_type_enum: [
        "Universal",
        "Econômico",
        "Ambiental",
        "Social",
        "Governança",
      ],
      jurisdiction_enum: ["Federal", "Estadual", "Municipal"],
      license_status_enum: ["Ativa", "Em Renovação", "Vencida", "Suspensa"],
      license_type_enum: ["LP", "LI", "LO", "LAS", "LOC", "Outra"],
      permission_level_enum: ["leitura", "escrita", "aprovacao", "admin"],
      report_gri_status_enum: [
        "Rascunho",
        "Em Andamento",
        "Em Revisão",
        "Finalizado",
        "Publicado",
      ],
      report_status_enum: ["Rascunho", "Gerando", "Concluído"],
      report_template_enum: [
        "GHG_PROTOCOL",
        "GRI_STANDARD",
        "GOALS_PERFORMANCE",
        "CUSTOM_REPORT",
      ],
      review_frequency_enum: [
        "mensal",
        "trimestral",
        "semestral",
        "anual",
        "bienal",
      ],
      user_role_enum: ["Admin", "Editor", "Leitor"],
      waste_class_enum: [
        "Classe I - Perigoso",
        "Classe II A - Não Inerte",
        "Classe II B - Inerte",
      ],
      waste_status_enum: ["Coletado", "Em Trânsito", "Destinação Finalizada"],
      workflow_step_type_enum: ["approval", "review", "notification"],
    },
  },
} as const
