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
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      ai_chat_conversations: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          company_id: string
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          company_id?: string
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
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
      ai_operation_feedback: {
        Row: {
          company_id: string
          confidence_was: number | null
          created_at: string
          id: string
          operation_proposed: Json
          user_decision: string
          user_edits: Json | null
          user_id: string
        }
        Insert: {
          company_id: string
          confidence_was?: number | null
          created_at?: string
          id?: string
          operation_proposed: Json
          user_decision: string
          user_edits?: Json | null
          user_id: string
        }
        Update: {
          company_id?: string
          confidence_was?: number | null
          created_at?: string
          id?: string
          operation_proposed?: Json
          user_decision?: string
          user_edits?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_operation_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_operation_history: {
        Row: {
          company_id: string
          confidence: number | null
          created_at: string
          executed_at: string
          id: string
          operation_data: Json
          operation_type: string
          table_name: string
          user_id: string
        }
        Insert: {
          company_id: string
          confidence?: number | null
          created_at?: string
          executed_at?: string
          id?: string
          operation_data?: Json
          operation_type: string
          table_name: string
          user_id: string
        }
        Update: {
          company_id?: string
          confidence?: number | null
          created_at?: string
          executed_at?: string
          id?: string
          operation_data?: Json
          operation_type?: string
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_operation_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_metrics: {
        Row: {
          accuracy_rate: number | null
          auto_approved_count: number | null
          avg_confidence: number | null
          avg_processing_time_seconds: number | null
          company_id: string
          created_at: string | null
          documents_processed: number | null
          fields_corrected: number | null
          id: string
          manual_review_count: number | null
          metric_date: string
          rejected_count: number | null
          total_fields_extracted: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy_rate?: number | null
          auto_approved_count?: number | null
          avg_confidence?: number | null
          avg_processing_time_seconds?: number | null
          company_id: string
          created_at?: string | null
          documents_processed?: number | null
          fields_corrected?: number | null
          id?: string
          manual_review_count?: number | null
          metric_date?: string
          rejected_count?: number | null
          total_fields_extracted?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy_rate?: number | null
          auto_approved_count?: number | null
          avg_confidence?: number | null
          avg_processing_time_seconds?: number | null
          company_id?: string
          created_at?: string | null
          documents_processed?: number | null
          fields_corrected?: number | null
          id?: string
          manual_review_count?: number | null
          metric_date?: string
          rejected_count?: number | null
          total_fields_extracted?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      approval_requests: {
        Row: {
          company_id: string
          created_at: string
          current_step: number | null
          entity_id: string
          entity_type: string
          id: string
          requested_by_user_id: string
          status: string | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_step?: number | null
          entity_id: string
          entity_type: string
          id?: string
          requested_by_user_id: string
          status?: string | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_step?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          requested_by_user_id?: string
          status?: string | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: []
      }
      approval_steps: {
        Row: {
          approval_request_id: string
          approved_at: string | null
          approver_user_id: string
          comments: string | null
          created_at: string
          id: string
          status: string | null
          step_number: number
        }
        Insert: {
          approval_request_id: string
          approved_at?: string | null
          approver_user_id: string
          comments?: string | null
          created_at?: string
          id?: string
          status?: string | null
          step_number: number
        }
        Update: {
          approval_request_id?: string
          approved_at?: string | null
          approver_user_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          status?: string | null
          step_number?: number
        }
        Relationships: []
      }
      approval_workflows: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          steps: Json
          updated_at: string
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          steps?: Json
          updated_at?: string
          workflow_name: string
          workflow_type?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          steps?: Json
          updated_at?: string
          workflow_name?: string
          workflow_type?: string
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
      assessment_attempts: {
        Row: {
          answers: Json | null
          assessment_id: string
          attempt_number: number
          created_at: string | null
          end_time: string | null
          enrollment_id: string
          id: string
          max_score: number | null
          percentage: number | null
          score: number | null
          start_time: string | null
          status: string | null
          time_taken_minutes: number | null
        }
        Insert: {
          answers?: Json | null
          assessment_id: string
          attempt_number: number
          created_at?: string | null
          end_time?: string | null
          enrollment_id: string
          id?: string
          max_score?: number | null
          percentage?: number | null
          score?: number | null
          start_time?: string | null
          status?: string | null
          time_taken_minutes?: number | null
        }
        Update: {
          answers?: Json | null
          assessment_id?: string
          attempt_number?: number
          created_at?: string | null
          end_time?: string | null
          enrollment_id?: string
          id?: string
          max_score?: number | null
          percentage?: number | null
          score?: number | null
          start_time?: string | null
          status?: string | null
          time_taken_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_answer: Json | null
          created_at: string | null
          explanation: string | null
          id: string
          media_url: string | null
          options: Json | null
          order_index: number
          points: number | null
          question_text: string
          question_type: string | null
        }
        Insert: {
          assessment_id: string
          correct_answer?: Json | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          media_url?: string | null
          options?: Json | null
          order_index: number
          points?: number | null
          question_text: string
          question_type?: string | null
        }
        Update: {
          assessment_id?: string
          correct_answer?: Json | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          media_url?: string | null
          options?: Json | null
          order_index?: number
          points?: number | null
          question_text?: string
          question_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          allow_review: boolean | null
          assessment_type: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          id: string
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          randomize_questions: boolean | null
          show_correct_answers: boolean | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allow_review?: boolean | null
          assessment_type?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          randomize_questions?: boolean | null
          show_correct_answers?: boolean | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allow_review?: boolean | null
          assessment_type?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          randomize_questions?: boolean | null
          show_correct_answers?: boolean | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_ownership_records: {
        Row: {
          asset_id: string
          company_id: string
          contract_file_path: string | null
          contract_number: string | null
          created_at: string
          id: string
          insurance_coverage_amount: number | null
          insurance_policy_number: string | null
          maintenance_responsibility: string
          owner_company_name: string | null
          owner_contact_info: Json | null
          ownership_end_date: string | null
          ownership_start_date: string
          ownership_type: string
          responsible_user_id: string | null
          return_conditions: string | null
          updated_at: string
          usage_restrictions: string | null
        }
        Insert: {
          asset_id: string
          company_id: string
          contract_file_path?: string | null
          contract_number?: string | null
          created_at?: string
          id?: string
          insurance_coverage_amount?: number | null
          insurance_policy_number?: string | null
          maintenance_responsibility?: string
          owner_company_name?: string | null
          owner_contact_info?: Json | null
          ownership_end_date?: string | null
          ownership_start_date: string
          ownership_type?: string
          responsible_user_id?: string | null
          return_conditions?: string | null
          updated_at?: string
          usage_restrictions?: string | null
        }
        Update: {
          asset_id?: string
          company_id?: string
          contract_file_path?: string | null
          contract_number?: string | null
          created_at?: string
          id?: string
          insurance_coverage_amount?: number | null
          insurance_policy_number?: string | null
          maintenance_responsibility?: string
          owner_company_name?: string | null
          owner_contact_info?: Json | null
          ownership_end_date?: string | null
          ownership_start_date?: string
          ownership_type?: string
          responsible_user_id?: string | null
          return_conditions?: string | null
          updated_at?: string
          usage_restrictions?: string | null
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
      attendance_records: {
        Row: {
          break_end: string | null
          break_start: string | null
          check_in: string | null
          check_out: string | null
          company_id: string
          created_at: string | null
          date: string
          employee_id: string
          id: string
          notes: string | null
          overtime_hours: number | null
          status: string
          total_hours: number | null
          updated_at: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          check_in?: string | null
          check_out?: string | null
          company_id: string
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          status?: string
          total_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          check_in?: string | null
          check_out?: string | null
          company_id?: string
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          status?: string
          total_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          {
            foreignKeyName: "audit_findings_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      automation_rules: {
        Row: {
          action_parameters: Json | null
          action_type: string
          company_id: string
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          priority: number | null
          rule_name: string
          trigger_condition: Json
          updated_at: string | null
        }
        Insert: {
          action_parameters?: Json | null
          action_type: string
          company_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          rule_name: string
          trigger_condition?: Json
          updated_at?: string | null
        }
        Update: {
          action_parameters?: Json | null
          action_type?: string
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          rule_name?: string
          trigger_condition?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_enrollments: {
        Row: {
          benefit_id: string
          company_id: string
          created_at: string
          employee_id: string
          enrollment_date: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          benefit_id: string
          company_id: string
          created_at?: string
          employee_id: string
          enrollment_date?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          benefit_id?: string
          company_id?: string
          created_at?: string
          employee_id?: string
          enrollment_date?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_enrollments_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "employee_benefits"
            referencedColumns: ["id"]
          },
        ]
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
          biogenic_co2_kg: number | null
          biogenic_co2e: number | null
          calculation_date: string
          details_json: Json | null
          emission_factor_id: string
          fossil_co2e: number | null
          id: string
          is_biogenic_source: boolean | null
          total_co2e: number
        }
        Insert: {
          activity_data_id: string
          biogenic_co2_kg?: number | null
          biogenic_co2e?: number | null
          calculation_date?: string
          details_json?: Json | null
          emission_factor_id: string
          fossil_co2e?: number | null
          id?: string
          is_biogenic_source?: boolean | null
          total_co2e: number
        }
        Update: {
          activity_data_id?: string
          biogenic_co2_kg?: number | null
          biogenic_co2e?: number | null
          calculation_date?: string
          details_json?: Json | null
          emission_factor_id?: string
          fossil_co2e?: number | null
          id?: string
          is_biogenic_source?: boolean | null
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
      calibration_records: {
        Row: {
          actual_cost: number | null
          adjustments_made: string | null
          asset_id: string
          calibration_date: string
          calibration_provider: string | null
          calibration_result: string
          certificate_file_path: string | null
          certificate_number: string | null
          company_id: string
          created_at: string
          id: string
          measurements_after: Json | null
          measurements_before: Json | null
          next_calibration_date: string | null
          notes: string | null
          performed_by_user_id: string | null
          schedule_id: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          adjustments_made?: string | null
          asset_id: string
          calibration_date: string
          calibration_provider?: string | null
          calibration_result?: string
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id: string
          created_at?: string
          id?: string
          measurements_after?: Json | null
          measurements_before?: Json | null
          next_calibration_date?: string | null
          notes?: string | null
          performed_by_user_id?: string | null
          schedule_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          adjustments_made?: string | null
          asset_id?: string
          calibration_date?: string
          calibration_provider?: string | null
          calibration_result?: string
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id?: string
          created_at?: string
          id?: string
          measurements_after?: Json | null
          measurements_before?: Json | null
          next_calibration_date?: string | null
          notes?: string | null
          performed_by_user_id?: string | null
          schedule_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      calibration_schedules: {
        Row: {
          asset_id: string
          calibration_provider: string | null
          calibration_standard: string | null
          certificate_required: boolean
          company_id: string
          created_at: string
          estimated_cost: number | null
          frequency_months: number
          id: string
          is_active: boolean
          last_calibration_date: string | null
          next_calibration_date: string
          responsible_user_id: string | null
          tolerance_range: Json | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          calibration_provider?: string | null
          calibration_standard?: string | null
          certificate_required?: boolean
          company_id: string
          created_at?: string
          estimated_cost?: number | null
          frequency_months?: number
          id?: string
          is_active?: boolean
          last_calibration_date?: string | null
          next_calibration_date: string
          responsible_user_id?: string | null
          tolerance_range?: Json | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          calibration_provider?: string | null
          calibration_standard?: string | null
          certificate_required?: boolean
          company_id?: string
          created_at?: string
          estimated_cost?: number | null
          frequency_months?: number
          id?: string
          is_active?: boolean
          last_calibration_date?: string | null
          next_calibration_date?: string
          responsible_user_id?: string | null
          tolerance_range?: Json | null
          updated_at?: string
        }
        Relationships: []
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
      career_development_plans: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          current_position: string
          development_activities: Json
          employee_id: string
          goals: Json
          id: string
          mentor_id: string | null
          notes: string | null
          progress_percentage: number
          skills_to_develop: Json
          start_date: string
          status: string
          target_date: string
          target_position: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          current_position: string
          development_activities?: Json
          employee_id: string
          goals?: Json
          id?: string
          mentor_id?: string | null
          notes?: string | null
          progress_percentage?: number
          skills_to_develop?: Json
          start_date: string
          status?: string
          target_date: string
          target_position: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          current_position?: string
          development_activities?: Json
          employee_id?: string
          goals?: Json
          id?: string
          mentor_id?: string | null
          notes?: string | null
          progress_percentage?: number
          skills_to_develop?: Json
          start_date?: string
          status?: string
          target_date?: string
          target_position?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_development_plans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_development_plans_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cdp_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cdp_mentor"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_file_uploads: {
        Row: {
          company_id: string
          conversation_id: string
          created_at: string
          error_message: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          parsed_content: Json | null
          processing_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          conversation_id: string
          created_at?: string
          error_message?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          parsed_content?: Json | null
          processing_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          conversation_id?: string
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          parsed_content?: Json | null
          processing_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_file_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      circular_economy_assessments: {
        Row: {
          assessment_methodology: string | null
          assessment_name: string
          assessment_year: number
          business_model_innovation: Json | null
          circular_indicators: Json | null
          circular_strategies: Json | null
          circularity_rate: number | null
          company_id: string
          created_at: string
          id: string
          material_circular_input: number | null
          material_flows: Json | null
          material_input_total: number | null
          status: string | null
          updated_at: string
          value_retention_strategies: string[] | null
          waste_circular_output: number | null
          waste_generation_total: number | null
        }
        Insert: {
          assessment_methodology?: string | null
          assessment_name: string
          assessment_year: number
          business_model_innovation?: Json | null
          circular_indicators?: Json | null
          circular_strategies?: Json | null
          circularity_rate?: number | null
          company_id: string
          created_at?: string
          id?: string
          material_circular_input?: number | null
          material_flows?: Json | null
          material_input_total?: number | null
          status?: string | null
          updated_at?: string
          value_retention_strategies?: string[] | null
          waste_circular_output?: number | null
          waste_generation_total?: number | null
        }
        Update: {
          assessment_methodology?: string | null
          assessment_name?: string
          assessment_year?: number
          business_model_innovation?: Json | null
          circular_indicators?: Json | null
          circular_strategies?: Json | null
          circularity_rate?: number | null
          company_id?: string
          created_at?: string
          id?: string
          material_circular_input?: number | null
          material_flows?: Json | null
          material_input_total?: number | null
          status?: string | null
          updated_at?: string
          value_retention_strategies?: string[] | null
          waste_circular_output?: number | null
          waste_generation_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "circular_economy_assessments_company_id_fkey"
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
      competency_matrix: {
        Row: {
          company_id: string
          competency_category: string
          competency_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          levels: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          competency_category: string
          competency_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          levels?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          competency_category?: string
          competency_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          levels?: Json
          updated_at?: string
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
          {
            foreignKeyName: "compliance_tasks_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      correlation_analysis_results: {
        Row: {
          analysis_name: string
          analysis_period_end: string
          analysis_period_start: string
          company_id: string
          correlation_coefficient: number | null
          created_at: string
          data_points: Json | null
          id: string
          insights: string | null
          metric_x: string
          metric_y: string
        }
        Insert: {
          analysis_name: string
          analysis_period_end: string
          analysis_period_start: string
          company_id: string
          correlation_coefficient?: number | null
          created_at?: string
          data_points?: Json | null
          id?: string
          insights?: string | null
          metric_x: string
          metric_y: string
        }
        Update: {
          analysis_name?: string
          analysis_period_end?: string
          analysis_period_start?: string
          company_id?: string
          correlation_coefficient?: number | null
          created_at?: string
          data_points?: Json | null
          id?: string
          insights?: string | null
          metric_x?: string
          metric_y?: string
        }
        Relationships: [
          {
            foreignKeyName: "correlation_analysis_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          assigned_by_user_id: string | null
          company_id: string
          completion_date: string | null
          course_id: string
          created_at: string | null
          due_date: string | null
          employee_id: string
          enrollment_date: string | null
          id: string
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by_user_id?: string | null
          company_id: string
          completion_date?: string | null
          course_id: string
          created_at?: string | null
          due_date?: string | null
          employee_id: string
          enrollment_date?: string | null
          id?: string
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by_user_id?: string | null
          company_id?: string
          completion_date?: string | null
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          employee_id?: string
          enrollment_date?: string | null
          id?: string
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          content_text: string | null
          content_type: string | null
          content_url: string | null
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_required: boolean | null
          module_type: string | null
          order_index: number
          passing_score: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          module_type?: string | null
          order_index: number
          passing_score?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          module_type?: string | null
          order_index?: number
          passing_score?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
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
      custom_esg_indicators: {
        Row: {
          calculation_method: string | null
          category: string
          company_id: string
          created_at: string
          current_value: number | null
          data_sources: Json | null
          id: string
          indicator_code: string
          indicator_name: string
          is_active: boolean | null
          measurement_frequency: string | null
          responsible_user_id: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          calculation_method?: string | null
          category: string
          company_id: string
          created_at?: string
          current_value?: number | null
          data_sources?: Json | null
          id?: string
          indicator_code: string
          indicator_name: string
          is_active?: boolean | null
          measurement_frequency?: string | null
          responsible_user_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          calculation_method?: string | null
          category?: string
          company_id?: string
          created_at?: string
          current_value?: number | null
          data_sources?: Json | null
          id?: string
          indicator_code?: string
          indicator_name?: string
          is_active?: boolean | null
          measurement_frequency?: string | null
          responsible_user_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_esg_indicators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      customer_complaints: {
        Row: {
          assigned_to_user_id: string | null
          attachments: Json | null
          category: string
          communication_log: Json | null
          company_id: string
          complaint_number: string
          complaint_type: string
          created_at: string
          customer_document: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          customer_satisfaction_feedback: string | null
          customer_satisfaction_rating: number | null
          description: string
          escalated: boolean | null
          escalation_reason: string | null
          id: string
          priority: string | null
          resolution_date: string | null
          resolution_description: string | null
          resolution_target_date: string | null
          sla_met: boolean | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          attachments?: Json | null
          category: string
          communication_log?: Json | null
          company_id: string
          complaint_number: string
          complaint_type: string
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_satisfaction_feedback?: string | null
          customer_satisfaction_rating?: number | null
          description: string
          escalated?: boolean | null
          escalation_reason?: string | null
          id?: string
          priority?: string | null
          resolution_date?: string | null
          resolution_description?: string | null
          resolution_target_date?: string | null
          sla_met?: boolean | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          attachments?: Json | null
          category?: string
          communication_log?: Json | null
          company_id?: string
          complaint_number?: string
          complaint_type?: string
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_satisfaction_feedback?: string | null
          customer_satisfaction_rating?: number | null
          description?: string
          escalated?: boolean | null
          escalation_reason?: string | null
          id?: string
          priority?: string | null
          resolution_date?: string | null
          resolution_description?: string | null
          resolution_target_date?: string | null
          sla_met?: boolean | null
          status?: string | null
          subject?: string
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
          user_ip_address: unknown
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
          user_ip_address?: unknown
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
          user_ip_address?: unknown
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
      document_patterns: {
        Row: {
          company_id: string
          confidence_score: number | null
          created_at: string | null
          failure_count: number | null
          id: string
          last_used_at: string | null
          pattern_data: Json
          pattern_signature: string
          pattern_type: string
          success_count: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_used_at?: string | null
          pattern_data?: Json
          pattern_signature: string
          pattern_type: string
          success_count?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_used_at?: string | null
          pattern_data?: Json
          pattern_signature?: string
          pattern_type?: string
          success_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_patterns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          retention_period: unknown
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
          retention_period?: unknown
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
          retention_period?: unknown
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
      double_materiality_matrix: {
        Row: {
          assessment_date: string
          category: string
          company_id: string
          created_at: string
          description: string | null
          financial_materiality_score: number | null
          id: string
          impact_materiality_score: number | null
          is_material: boolean | null
          management_approach: string | null
          related_gri_indicators: string[] | null
          stakeholders_consulted: string[] | null
          topic_name: string
          updated_at: string
        }
        Insert: {
          assessment_date: string
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          financial_materiality_score?: number | null
          id?: string
          impact_materiality_score?: number | null
          is_material?: boolean | null
          management_approach?: string | null
          related_gri_indicators?: string[] | null
          stakeholders_consulted?: string[] | null
          topic_name: string
          updated_at?: string
        }
        Update: {
          assessment_date?: string
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          financial_materiality_score?: number | null
          id?: string
          impact_materiality_score?: number | null
          is_material?: boolean | null
          management_approach?: string | null
          related_gri_indicators?: string[] | null
          stakeholders_consulted?: string[] | null
          topic_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "double_materiality_matrix_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      emission_factors: {
        Row: {
          activity_unit: string
          biogenic_co2_factor: number | null
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
          is_biogenic: boolean | null
          n2o_factor: number | null
          name: string
          source: string
          type: Database["public"]["Enums"]["emission_factor_type_enum"]
          validation_status: string | null
          year_of_validity: number | null
        }
        Insert: {
          activity_unit: string
          biogenic_co2_factor?: number | null
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
          is_biogenic?: boolean | null
          n2o_factor?: number | null
          name: string
          source: string
          type?: Database["public"]["Enums"]["emission_factor_type_enum"]
          validation_status?: string | null
          year_of_validity?: number | null
        }
        Update: {
          activity_unit?: string
          biogenic_co2_factor?: number | null
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
          is_biogenic?: boolean | null
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
      emission_source_glossary: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_global: boolean | null
          main_term: string
          suggested_category: string | null
          suggested_scope: number | null
          synonyms: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          main_term: string
          suggested_category?: string | null
          suggested_scope?: number | null
          synonyms?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          main_term?: string
          suggested_category?: string | null
          suggested_scope?: number | null
          synonyms?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emission_source_glossary_company_id_fkey"
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
      emission_suppliers: {
        Row: {
          annual_emissions_estimate: number | null
          category: string
          cnpj: string | null
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          data_quality_score: number | null
          emission_data: Json | null
          has_inventory: boolean | null
          id: string
          last_report_date: string | null
          notes: string | null
          scope_3_category: string | null
          supplier_name: string
          updated_at: string
        }
        Insert: {
          annual_emissions_estimate?: number | null
          category: string
          cnpj?: string | null
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_quality_score?: number | null
          emission_data?: Json | null
          has_inventory?: boolean | null
          id?: string
          last_report_date?: string | null
          notes?: string | null
          scope_3_category?: string | null
          supplier_name: string
          updated_at?: string
        }
        Update: {
          annual_emissions_estimate?: number | null
          category?: string
          cnpj?: string | null
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_quality_score?: number | null
          emission_data?: Json | null
          has_inventory?: boolean | null
          id?: string
          last_report_date?: string | null
          notes?: string | null
          scope_3_category?: string | null
          supplier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emission_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          company_id: string
          contract_number: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          eligibility_rules: string | null
          id: string
          is_active: boolean
          monthly_cost: number
          name: string
          provider: string | null
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_number?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          eligibility_rules?: string | null
          id?: string
          is_active?: boolean
          monthly_cost?: number
          name: string
          provider?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_number?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          eligibility_rules?: string | null
          id?: string
          is_active?: boolean
          monthly_cost?: number
          name?: string
          provider?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_competency_assessments: {
        Row: {
          assessment_date: string
          assessor_user_id: string | null
          company_id: string
          competency_id: string
          created_at: string
          current_level: number
          development_plan: string | null
          employee_id: string
          id: string
          target_level: number
          updated_at: string
        }
        Insert: {
          assessment_date: string
          assessor_user_id?: string | null
          company_id: string
          competency_id: string
          created_at?: string
          current_level?: number
          development_plan?: string | null
          employee_id: string
          id?: string
          target_level?: number
          updated_at?: string
        }
        Update: {
          assessment_date?: string
          assessor_user_id?: string | null
          company_id?: string
          competency_id?: string
          created_at?: string
          current_level?: number
          development_plan?: string | null
          employee_id?: string
          id?: string
          target_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_competency_assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eca_competency"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competency_matrix"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eca_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedules: {
        Row: {
          company_id: string
          created_at: string | null
          employee_id: string
          end_date: string | null
          id: string
          is_active: boolean | null
          schedule_id: string
          start_date: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          schedule_id: string
          start_date: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          schedule_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedules_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
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
        Relationships: [
          {
            foreignKeyName: "employee_trainings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_training_program_id_fkey"
            columns: ["training_program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
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
      equipment_maintenance_schedules: {
        Row: {
          asset_id: string
          company_id: string
          created_at: string
          estimated_cost: number | null
          estimated_duration_hours: number | null
          frequency_days: number
          id: string
          is_active: boolean
          last_maintenance_date: string | null
          maintenance_checklist: Json | null
          maintenance_type: string
          next_maintenance_date: string
          priority: string
          responsible_user_id: string | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          company_id: string
          created_at?: string
          estimated_cost?: number | null
          estimated_duration_hours?: number | null
          frequency_days: number
          id?: string
          is_active?: boolean
          last_maintenance_date?: string | null
          maintenance_checklist?: Json | null
          maintenance_type?: string
          next_maintenance_date: string
          priority?: string
          responsible_user_id?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          company_id?: string
          created_at?: string
          estimated_cost?: number | null
          estimated_duration_hours?: number | null
          frequency_days?: number
          id?: string
          is_active?: boolean
          last_maintenance_date?: string | null
          maintenance_checklist?: Json | null
          maintenance_type?: string
          next_maintenance_date?: string
          priority?: string
          responsible_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      esg_indicator_cache: {
        Row: {
          calculated_at: string
          calculation_period_end: string | null
          calculation_period_start: string | null
          company_id: string
          data_quality_score: number | null
          id: string
          indicators: Json
          metadata: Json | null
        }
        Insert: {
          calculated_at?: string
          calculation_period_end?: string | null
          calculation_period_start?: string | null
          company_id: string
          data_quality_score?: number | null
          id?: string
          indicators?: Json
          metadata?: Json | null
        }
        Update: {
          calculated_at?: string
          calculation_period_end?: string | null
          calculation_period_start?: string | null
          company_id?: string
          data_quality_score?: number | null
          id?: string
          indicators?: Json
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "esg_indicator_cache_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_insights_log: {
        Row: {
          action_items: Json | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          insight_type: string
          is_resolved: boolean | null
          priority: string | null
          related_module: string | null
          resolved_at: string | null
          title: string
        }
        Insert: {
          action_items?: Json | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          insight_type: string
          is_resolved?: boolean | null
          priority?: string | null
          related_module?: string | null
          resolved_at?: string | null
          title: string
        }
        Update: {
          action_items?: Json | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          insight_type?: string
          is_resolved?: boolean | null
          priority?: string | null
          related_module?: string | null
          resolved_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "esg_insights_log_company_id_fkey"
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
      esrs_disclosures: {
        Row: {
          assurance_level: string | null
          company_id: string
          created_at: string
          data_sources: string[] | null
          disclosure_content: string | null
          disclosure_requirement: string
          disclosure_title: string
          double_materiality_assessment: boolean | null
          esrs_standard: string
          id: string
          materiality_assessment: Json | null
          policies_actions: Json | null
          quantitative_data: Json | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          status: string | null
          sustainability_matter: string
          targets_measures: Json | null
          updated_at: string
        }
        Insert: {
          assurance_level?: string | null
          company_id: string
          created_at?: string
          data_sources?: string[] | null
          disclosure_content?: string | null
          disclosure_requirement: string
          disclosure_title: string
          double_materiality_assessment?: boolean | null
          esrs_standard: string
          id?: string
          materiality_assessment?: Json | null
          policies_actions?: Json | null
          quantitative_data?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          status?: string | null
          sustainability_matter: string
          targets_measures?: Json | null
          updated_at?: string
        }
        Update: {
          assurance_level?: string | null
          company_id?: string
          created_at?: string
          data_sources?: string[] | null
          disclosure_content?: string | null
          disclosure_requirement?: string
          disclosure_title?: string
          double_materiality_assessment?: boolean | null
          esrs_standard?: string
          id?: string
          materiality_assessment?: Json | null
          policies_actions?: Json | null
          quantitative_data?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          status?: string | null
          sustainability_matter?: string
          targets_measures?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esrs_disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_score: number
          name: string
          weight: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_score?: number
          name: string
          weight?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_score?: number
          name?: string
          weight?: number
        }
        Relationships: []
      }
      evaluation_scores: {
        Row: {
          comments: string | null
          created_at: string
          criteria_id: string
          evaluation_id: string
          final_score: number | null
          id: string
          manager_score: number | null
          self_score: number | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          criteria_id: string
          evaluation_id: string
          final_score?: number | null
          id?: string
          manager_score?: number | null
          self_score?: number | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          criteria_id?: string
          evaluation_id?: string
          final_score?: number | null
          id?: string
          manager_score?: number | null
          self_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
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
      extraction_approval_log: {
        Row: {
          action: string
          approval_notes: string | null
          approved_by_user_id: string
          company_id: string
          created_at: string
          edited_fields: Json | null
          extraction_id: string | null
          file_id: string | null
          high_confidence_count: number | null
          id: string
          items_count: number
          job_id: string | null
          preview_id: string | null
          processing_time_seconds: number | null
        }
        Insert: {
          action: string
          approval_notes?: string | null
          approved_by_user_id: string
          company_id: string
          created_at?: string
          edited_fields?: Json | null
          extraction_id?: string | null
          file_id?: string | null
          high_confidence_count?: number | null
          id?: string
          items_count?: number
          job_id?: string | null
          preview_id?: string | null
          processing_time_seconds?: number | null
        }
        Update: {
          action?: string
          approval_notes?: string | null
          approved_by_user_id?: string
          company_id?: string
          created_at?: string
          edited_fields?: Json | null
          extraction_id?: string | null
          file_id?: string | null
          high_confidence_count?: number | null
          id?: string
          items_count?: number
          job_id?: string | null
          preview_id?: string | null
          processing_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_approval_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_approval_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "document_extraction_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_approval_log_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "extracted_data_preview"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_feedback: {
        Row: {
          accuracy_score: number | null
          company_id: string
          created_at: string | null
          document_id: string | null
          feedback_type: string
          fields_corrected: number | null
          id: string
          issues: Json | null
          preview_id: string | null
          suggestions: string | null
          time_to_review_seconds: number | null
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          company_id: string
          created_at?: string | null
          document_id?: string | null
          feedback_type: string
          fields_corrected?: number | null
          id?: string
          issues?: Json | null
          preview_id?: string | null
          suggestions?: string | null
          time_to_review_seconds?: number | null
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          company_id?: string
          created_at?: string | null
          document_id?: string | null
          feedback_type?: string
          fields_corrected?: number | null
          id?: string
          issues?: Json | null
          preview_id?: string | null
          suggestions?: string | null
          time_to_review_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_feedback_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_feedback_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "extracted_data_preview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      financed_emissions: {
        Row: {
          asset_class: string
          attribution_factor: number | null
          company_id: string
          counterparty_geography: string | null
          counterparty_name: string | null
          counterparty_sector: string | null
          created_at: string
          data_quality_score: number | null
          data_sources: string[] | null
          emissions_scope1: number | null
          emissions_scope2: number | null
          emissions_scope3: number | null
          financed_emissions: number | null
          id: string
          methodology_used: string | null
          outstanding_amount: number
          pcaf_assessment_id: string | null
          total_emissions: number | null
          updated_at: string
        }
        Insert: {
          asset_class: string
          attribution_factor?: number | null
          company_id: string
          counterparty_geography?: string | null
          counterparty_name?: string | null
          counterparty_sector?: string | null
          created_at?: string
          data_quality_score?: number | null
          data_sources?: string[] | null
          emissions_scope1?: number | null
          emissions_scope2?: number | null
          emissions_scope3?: number | null
          financed_emissions?: number | null
          id?: string
          methodology_used?: string | null
          outstanding_amount: number
          pcaf_assessment_id?: string | null
          total_emissions?: number | null
          updated_at?: string
        }
        Update: {
          asset_class?: string
          attribution_factor?: number | null
          company_id?: string
          counterparty_geography?: string | null
          counterparty_name?: string | null
          counterparty_sector?: string | null
          created_at?: string
          data_quality_score?: number | null
          data_sources?: string[] | null
          emissions_scope1?: number | null
          emissions_scope2?: number | null
          emissions_scope3?: number | null
          financed_emissions?: number | null
          id?: string
          methodology_used?: string | null
          outstanding_amount?: number
          pcaf_assessment_id?: string | null
          total_emissions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financed_emissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financed_emissions_pcaf_assessment_id_fkey"
            columns: ["pcaf_assessment_id"]
            isOneToOne: false
            referencedRelation: "pcaf_assessments"
            referencedColumns: ["id"]
          },
        ]
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
      framework_controls: {
        Row: {
          company_id: string
          control_category: string | null
          control_description: string | null
          control_id: string
          control_name: string
          control_type: string | null
          created_at: string
          effectiveness_rating: string | null
          evidence_files: string[] | null
          framework_id: string | null
          id: string
          implementation_status: string | null
          last_tested_date: string | null
          management_standard_id: string | null
          next_test_date: string | null
          notes: string | null
          responsible_user_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          control_category?: string | null
          control_description?: string | null
          control_id: string
          control_name: string
          control_type?: string | null
          created_at?: string
          effectiveness_rating?: string | null
          evidence_files?: string[] | null
          framework_id?: string | null
          id?: string
          implementation_status?: string | null
          last_tested_date?: string | null
          management_standard_id?: string | null
          next_test_date?: string | null
          notes?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          control_category?: string | null
          control_description?: string | null
          control_id?: string
          control_name?: string
          control_type?: string | null
          created_at?: string
          effectiveness_rating?: string | null
          evidence_files?: string[] | null
          framework_id?: string | null
          id?: string
          implementation_status?: string | null
          last_tested_date?: string | null
          management_standard_id?: string | null
          next_test_date?: string | null
          notes?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "framework_controls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "framework_controls_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "security_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "framework_controls_management_standard_id_fkey"
            columns: ["management_standard_id"]
            isOneToOne: false
            referencedRelation: "management_standards"
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
      ghg_inventory_summary: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          base_year: number | null
          biogenic_emissions: number | null
          calculation_method: string | null
          company_id: string
          completeness_percentage: number | null
          created_at: string | null
          data_quality_score: number | null
          ghg_protocol_seal: string | null
          id: string
          inventory_year: number
          is_third_party_verified: boolean | null
          methodology: string | null
          notes: string | null
          reporting_period_end: string
          reporting_period_start: string
          scope_1_agriculture: number | null
          scope_1_fugitive_emissions: number | null
          scope_1_industrial_processes: number | null
          scope_1_mobile_combustion: number | null
          scope_1_stationary_combustion: number | null
          scope_1_total: number | null
          scope_2_cooling: number | null
          scope_2_electricity_location: number | null
          scope_2_electricity_market: number | null
          scope_2_heat_steam: number | null
          scope_2_total: number | null
          scope_3_business_travel: number | null
          scope_3_capital_goods: number | null
          scope_3_downstream_transport: number | null
          scope_3_employee_commuting: number | null
          scope_3_end_of_life: number | null
          scope_3_fuel_energy: number | null
          scope_3_leased_assets: number | null
          scope_3_other: number | null
          scope_3_product_use: number | null
          scope_3_purchased_goods: number | null
          scope_3_total: number | null
          scope_3_upstream_transport: number | null
          scope_3_waste: number | null
          status: string | null
          total_emissions: number | null
          updated_at: string | null
          verification_body: string | null
          verification_date: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          base_year?: number | null
          biogenic_emissions?: number | null
          calculation_method?: string | null
          company_id: string
          completeness_percentage?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          ghg_protocol_seal?: string | null
          id?: string
          inventory_year: number
          is_third_party_verified?: boolean | null
          methodology?: string | null
          notes?: string | null
          reporting_period_end: string
          reporting_period_start: string
          scope_1_agriculture?: number | null
          scope_1_fugitive_emissions?: number | null
          scope_1_industrial_processes?: number | null
          scope_1_mobile_combustion?: number | null
          scope_1_stationary_combustion?: number | null
          scope_1_total?: number | null
          scope_2_cooling?: number | null
          scope_2_electricity_location?: number | null
          scope_2_electricity_market?: number | null
          scope_2_heat_steam?: number | null
          scope_2_total?: number | null
          scope_3_business_travel?: number | null
          scope_3_capital_goods?: number | null
          scope_3_downstream_transport?: number | null
          scope_3_employee_commuting?: number | null
          scope_3_end_of_life?: number | null
          scope_3_fuel_energy?: number | null
          scope_3_leased_assets?: number | null
          scope_3_other?: number | null
          scope_3_product_use?: number | null
          scope_3_purchased_goods?: number | null
          scope_3_total?: number | null
          scope_3_upstream_transport?: number | null
          scope_3_waste?: number | null
          status?: string | null
          total_emissions?: number | null
          updated_at?: string | null
          verification_body?: string | null
          verification_date?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          base_year?: number | null
          biogenic_emissions?: number | null
          calculation_method?: string | null
          company_id?: string
          completeness_percentage?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          ghg_protocol_seal?: string | null
          id?: string
          inventory_year?: number
          is_third_party_verified?: boolean | null
          methodology?: string | null
          notes?: string | null
          reporting_period_end?: string
          reporting_period_start?: string
          scope_1_agriculture?: number | null
          scope_1_fugitive_emissions?: number | null
          scope_1_industrial_processes?: number | null
          scope_1_mobile_combustion?: number | null
          scope_1_stationary_combustion?: number | null
          scope_1_total?: number | null
          scope_2_cooling?: number | null
          scope_2_electricity_location?: number | null
          scope_2_electricity_market?: number | null
          scope_2_heat_steam?: number | null
          scope_2_total?: number | null
          scope_3_business_travel?: number | null
          scope_3_capital_goods?: number | null
          scope_3_downstream_transport?: number | null
          scope_3_employee_commuting?: number | null
          scope_3_end_of_life?: number | null
          scope_3_fuel_energy?: number | null
          scope_3_leased_assets?: number | null
          scope_3_other?: number | null
          scope_3_product_use?: number | null
          scope_3_purchased_goods?: number | null
          scope_3_total?: number | null
          scope_3_upstream_transport?: number | null
          scope_3_waste?: number | null
          status?: string | null
          total_emissions?: number | null
          updated_at?: string | null
          verification_body?: string | null
          verification_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghg_inventory_summary_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      gri_audits_assessments_data: {
        Row: {
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          ai_last_analyzed_at: string | null
          annual_audit_budget: number | null
          annual_certification_costs: number | null
          assessment_certifier: string | null
          audit_coverage_percentage: number | null
          audit_frequency: string | null
          audit_maturity_level: string | null
          audit_schedule_exists: boolean | null
          audits_by_area: Json | null
          audits_evolution: Json | null
          audits_list: Json | null
          audits_notes: string | null
          average_closure_time_days: number | null
          awards_for_quality_esg: number | null
          b_corp_certified: boolean | null
          biodiversity_assessment_done: boolean | null
          carbon_footprint_calculated: boolean | null
          carbon_neutral_certified: boolean | null
          certifications_count: number | null
          certifications_list: Json | null
          certifications_notes: string | null
          closed_non_conformities: number | null
          company_id: string
          completion_percentage: number | null
          continuous_improvement_initiatives: number | null
          corrective_action_notes: string | null
          corrective_actions_completed: number | null
          corrective_actions_count: number | null
          corrective_actions_in_progress: number | null
          corrective_actions_overdue: number | null
          cost_savings_from_improvements: number | null
          created_at: string | null
          days_without_regulatory_incidents: number | null
          documents_checklist: Json | null
          environmental_impact_assessment_done: boolean | null
          esg_rating_agency: string | null
          esg_rating_date: string | null
          esg_rating_level: string | null
          esg_rating_score: number | null
          external_auditors: string[] | null
          external_audits_count: number | null
          fsc_certified: boolean | null
          governance_involvement: boolean | null
          green_seal_certified: boolean | null
          has_certifications: boolean | null
          has_corrective_action_plans: boolean | null
          has_external_verification: boolean | null
          has_impact_assessments: boolean | null
          has_periodic_audits: boolean | null
          human_rights_impact_assessment_done: boolean | null
          id: string
          impact_assessment_methodologies: string[] | null
          impact_assessments_count: number | null
          impact_assessments_list: Json | null
          impact_assessments_notes: string | null
          internal_audit_team_size: number | null
          internal_audits_count: number | null
          iso_14001_certified: boolean | null
          iso_14001_expiry_date: string | null
          iso_14001_issue_date: string | null
          iso_26000_adherence: boolean | null
          iso_27001_certified: boolean | null
          iso_27001_expiry_date: string | null
          iso_27001_issue_date: string | null
          iso_37001_certified: boolean | null
          iso_37001_expiry_date: string | null
          iso_37001_issue_date: string | null
          iso_45001_certified: boolean | null
          iso_45001_expiry_date: string | null
          iso_45001_issue_date: string | null
          iso_50001_certified: boolean | null
          iso_50001_expiry_date: string | null
          iso_50001_issue_date: string | null
          iso_9001_certified: boolean | null
          iso_9001_expiry_date: string | null
          iso_9001_issue_date: string | null
          last_external_audit_date: string | null
          last_internal_audit_date: string | null
          leed_certified: boolean | null
          leed_level: string | null
          lifecycle_assessment_done: boolean | null
          linked_audits: string[] | null
          new_contracts_due_certifications: number | null
          non_conformities_by_severity: Json | null
          non_conformities_closure_rate: number | null
          open_non_conformities: number | null
          positive_client_audits_count: number | null
          preventive_actions_implemented: number | null
          procel_certified: boolean | null
          process_improvements_from_audits: number | null
          regulatory_audits_count: number | null
          regulatory_fines_received: number | null
          regulatory_fines_total_value: number | null
          report_id: string
          roi_from_certifications: string | null
          sa_8000_certified: boolean | null
          sa_8000_expiry_date: string | null
          sa_8000_issue_date: string | null
          social_impact_assessment_done: boolean | null
          status: string | null
          supplier_audit_score: number | null
          third_party_assessment: boolean | null
          total_non_conformities: number | null
          updated_at: string | null
          verification_coverage_percentage: number | null
          verification_date: string | null
          verification_level: string | null
          verification_provider: string | null
          verification_report_available: boolean | null
          verification_scope: string | null
          verification_standard: string | null
          verification_statement_url: string | null
          verified_indicators_count: number | null
          verified_indicators_list: string[] | null
          water_footprint_calculated: boolean | null
          years_with_systematic_audits: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          annual_audit_budget?: number | null
          annual_certification_costs?: number | null
          assessment_certifier?: string | null
          audit_coverage_percentage?: number | null
          audit_frequency?: string | null
          audit_maturity_level?: string | null
          audit_schedule_exists?: boolean | null
          audits_by_area?: Json | null
          audits_evolution?: Json | null
          audits_list?: Json | null
          audits_notes?: string | null
          average_closure_time_days?: number | null
          awards_for_quality_esg?: number | null
          b_corp_certified?: boolean | null
          biodiversity_assessment_done?: boolean | null
          carbon_footprint_calculated?: boolean | null
          carbon_neutral_certified?: boolean | null
          certifications_count?: number | null
          certifications_list?: Json | null
          certifications_notes?: string | null
          closed_non_conformities?: number | null
          company_id: string
          completion_percentage?: number | null
          continuous_improvement_initiatives?: number | null
          corrective_action_notes?: string | null
          corrective_actions_completed?: number | null
          corrective_actions_count?: number | null
          corrective_actions_in_progress?: number | null
          corrective_actions_overdue?: number | null
          cost_savings_from_improvements?: number | null
          created_at?: string | null
          days_without_regulatory_incidents?: number | null
          documents_checklist?: Json | null
          environmental_impact_assessment_done?: boolean | null
          esg_rating_agency?: string | null
          esg_rating_date?: string | null
          esg_rating_level?: string | null
          esg_rating_score?: number | null
          external_auditors?: string[] | null
          external_audits_count?: number | null
          fsc_certified?: boolean | null
          governance_involvement?: boolean | null
          green_seal_certified?: boolean | null
          has_certifications?: boolean | null
          has_corrective_action_plans?: boolean | null
          has_external_verification?: boolean | null
          has_impact_assessments?: boolean | null
          has_periodic_audits?: boolean | null
          human_rights_impact_assessment_done?: boolean | null
          id?: string
          impact_assessment_methodologies?: string[] | null
          impact_assessments_count?: number | null
          impact_assessments_list?: Json | null
          impact_assessments_notes?: string | null
          internal_audit_team_size?: number | null
          internal_audits_count?: number | null
          iso_14001_certified?: boolean | null
          iso_14001_expiry_date?: string | null
          iso_14001_issue_date?: string | null
          iso_26000_adherence?: boolean | null
          iso_27001_certified?: boolean | null
          iso_27001_expiry_date?: string | null
          iso_27001_issue_date?: string | null
          iso_37001_certified?: boolean | null
          iso_37001_expiry_date?: string | null
          iso_37001_issue_date?: string | null
          iso_45001_certified?: boolean | null
          iso_45001_expiry_date?: string | null
          iso_45001_issue_date?: string | null
          iso_50001_certified?: boolean | null
          iso_50001_expiry_date?: string | null
          iso_50001_issue_date?: string | null
          iso_9001_certified?: boolean | null
          iso_9001_expiry_date?: string | null
          iso_9001_issue_date?: string | null
          last_external_audit_date?: string | null
          last_internal_audit_date?: string | null
          leed_certified?: boolean | null
          leed_level?: string | null
          lifecycle_assessment_done?: boolean | null
          linked_audits?: string[] | null
          new_contracts_due_certifications?: number | null
          non_conformities_by_severity?: Json | null
          non_conformities_closure_rate?: number | null
          open_non_conformities?: number | null
          positive_client_audits_count?: number | null
          preventive_actions_implemented?: number | null
          procel_certified?: boolean | null
          process_improvements_from_audits?: number | null
          regulatory_audits_count?: number | null
          regulatory_fines_received?: number | null
          regulatory_fines_total_value?: number | null
          report_id: string
          roi_from_certifications?: string | null
          sa_8000_certified?: boolean | null
          sa_8000_expiry_date?: string | null
          sa_8000_issue_date?: string | null
          social_impact_assessment_done?: boolean | null
          status?: string | null
          supplier_audit_score?: number | null
          third_party_assessment?: boolean | null
          total_non_conformities?: number | null
          updated_at?: string | null
          verification_coverage_percentage?: number | null
          verification_date?: string | null
          verification_level?: string | null
          verification_provider?: string | null
          verification_report_available?: boolean | null
          verification_scope?: string | null
          verification_standard?: string | null
          verification_statement_url?: string | null
          verified_indicators_count?: number | null
          verified_indicators_list?: string[] | null
          water_footprint_calculated?: boolean | null
          years_with_systematic_audits?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          annual_audit_budget?: number | null
          annual_certification_costs?: number | null
          assessment_certifier?: string | null
          audit_coverage_percentage?: number | null
          audit_frequency?: string | null
          audit_maturity_level?: string | null
          audit_schedule_exists?: boolean | null
          audits_by_area?: Json | null
          audits_evolution?: Json | null
          audits_list?: Json | null
          audits_notes?: string | null
          average_closure_time_days?: number | null
          awards_for_quality_esg?: number | null
          b_corp_certified?: boolean | null
          biodiversity_assessment_done?: boolean | null
          carbon_footprint_calculated?: boolean | null
          carbon_neutral_certified?: boolean | null
          certifications_count?: number | null
          certifications_list?: Json | null
          certifications_notes?: string | null
          closed_non_conformities?: number | null
          company_id?: string
          completion_percentage?: number | null
          continuous_improvement_initiatives?: number | null
          corrective_action_notes?: string | null
          corrective_actions_completed?: number | null
          corrective_actions_count?: number | null
          corrective_actions_in_progress?: number | null
          corrective_actions_overdue?: number | null
          cost_savings_from_improvements?: number | null
          created_at?: string | null
          days_without_regulatory_incidents?: number | null
          documents_checklist?: Json | null
          environmental_impact_assessment_done?: boolean | null
          esg_rating_agency?: string | null
          esg_rating_date?: string | null
          esg_rating_level?: string | null
          esg_rating_score?: number | null
          external_auditors?: string[] | null
          external_audits_count?: number | null
          fsc_certified?: boolean | null
          governance_involvement?: boolean | null
          green_seal_certified?: boolean | null
          has_certifications?: boolean | null
          has_corrective_action_plans?: boolean | null
          has_external_verification?: boolean | null
          has_impact_assessments?: boolean | null
          has_periodic_audits?: boolean | null
          human_rights_impact_assessment_done?: boolean | null
          id?: string
          impact_assessment_methodologies?: string[] | null
          impact_assessments_count?: number | null
          impact_assessments_list?: Json | null
          impact_assessments_notes?: string | null
          internal_audit_team_size?: number | null
          internal_audits_count?: number | null
          iso_14001_certified?: boolean | null
          iso_14001_expiry_date?: string | null
          iso_14001_issue_date?: string | null
          iso_26000_adherence?: boolean | null
          iso_27001_certified?: boolean | null
          iso_27001_expiry_date?: string | null
          iso_27001_issue_date?: string | null
          iso_37001_certified?: boolean | null
          iso_37001_expiry_date?: string | null
          iso_37001_issue_date?: string | null
          iso_45001_certified?: boolean | null
          iso_45001_expiry_date?: string | null
          iso_45001_issue_date?: string | null
          iso_50001_certified?: boolean | null
          iso_50001_expiry_date?: string | null
          iso_50001_issue_date?: string | null
          iso_9001_certified?: boolean | null
          iso_9001_expiry_date?: string | null
          iso_9001_issue_date?: string | null
          last_external_audit_date?: string | null
          last_internal_audit_date?: string | null
          leed_certified?: boolean | null
          leed_level?: string | null
          lifecycle_assessment_done?: boolean | null
          linked_audits?: string[] | null
          new_contracts_due_certifications?: number | null
          non_conformities_by_severity?: Json | null
          non_conformities_closure_rate?: number | null
          open_non_conformities?: number | null
          positive_client_audits_count?: number | null
          preventive_actions_implemented?: number | null
          procel_certified?: boolean | null
          process_improvements_from_audits?: number | null
          regulatory_audits_count?: number | null
          regulatory_fines_received?: number | null
          regulatory_fines_total_value?: number | null
          report_id?: string
          roi_from_certifications?: string | null
          sa_8000_certified?: boolean | null
          sa_8000_expiry_date?: string | null
          sa_8000_issue_date?: string | null
          social_impact_assessment_done?: boolean | null
          status?: string | null
          supplier_audit_score?: number | null
          third_party_assessment?: boolean | null
          total_non_conformities?: number | null
          updated_at?: string | null
          verification_coverage_percentage?: number | null
          verification_date?: string | null
          verification_level?: string | null
          verification_provider?: string | null
          verification_report_available?: boolean | null
          verification_scope?: string | null
          verification_standard?: string | null
          verification_statement_url?: string | null
          verified_indicators_count?: number | null
          verified_indicators_list?: string[] | null
          water_footprint_calculated?: boolean | null
          years_with_systematic_audits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_audits_assessments_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_audits_assessments_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_content_index_items: {
        Row: {
          ai_confidence_score: number | null
          ai_identified: boolean | null
          created_at: string | null
          created_by: string | null
          direct_url: string | null
          disclosure_status: string
          id: string
          indicator_code: string
          indicator_description: string | null
          indicator_id: string
          indicator_title: string
          last_updated_by: string | null
          manually_verified: boolean | null
          omission_reason: string | null
          page_number: number | null
          related_content: string | null
          report_id: string
          report_section_id: string | null
          section_reference: string | null
          supporting_documents: Json | null
          updated_at: string | null
          verification_notes: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_identified?: boolean | null
          created_at?: string | null
          created_by?: string | null
          direct_url?: string | null
          disclosure_status?: string
          id?: string
          indicator_code: string
          indicator_description?: string | null
          indicator_id: string
          indicator_title: string
          last_updated_by?: string | null
          manually_verified?: boolean | null
          omission_reason?: string | null
          page_number?: number | null
          related_content?: string | null
          report_id: string
          report_section_id?: string | null
          section_reference?: string | null
          supporting_documents?: Json | null
          updated_at?: string | null
          verification_notes?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_identified?: boolean | null
          created_at?: string | null
          created_by?: string | null
          direct_url?: string | null
          disclosure_status?: string
          id?: string
          indicator_code?: string
          indicator_description?: string | null
          indicator_id?: string
          indicator_title?: string
          last_updated_by?: string | null
          manually_verified?: boolean | null
          omission_reason?: string | null
          page_number?: number | null
          related_content?: string | null
          report_id?: string
          report_section_id?: string | null
          section_reference?: string | null
          supporting_documents?: Json | null
          updated_at?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_content_index_items_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "gri_indicators_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_content_index_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_content_index_items_report_section_id_fkey"
            columns: ["report_section_id"]
            isOneToOne: false
            referencedRelation: "gri_report_sections"
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
      gri_document_uploads: {
        Row: {
          ai_analysis: Json | null
          category: string | null
          company_id: string | null
          confidence_score: number | null
          created_at: string | null
          extracted_metrics: Json | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size_kb: number | null
          file_type: string
          id: string
          processed_at: string | null
          processing_status: string | null
          report_id: string | null
          suggested_indicators: Json | null
          updated_at: string | null
          uploaded_by_user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          category?: string | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          extracted_metrics?: Json | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size_kb?: number | null
          file_type: string
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          report_id?: string | null
          suggested_indicators?: Json | null
          updated_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          category?: string | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          extracted_metrics?: Json | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size_kb?: number | null
          file_type?: string
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          report_id?: string | null
          suggested_indicators?: Json | null
          updated_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_document_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_document_uploads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_economic_data_collection: {
        Row: {
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          balance_sheet_date: string | null
          climate_related_risks_identified: number | null
          company_id: string
          completion_percentage: number | null
          created_at: string | null
          ebitda: number | null
          ebitda_margin: number | null
          employee_wages_benefits: number | null
          has_financial_statements: boolean | null
          id: string
          local_procurement_percentage: number | null
          local_suppliers_count: number | null
          net_profit_margin: number | null
          operating_costs: number | null
          report_id: string
          reporting_period_end: string | null
          reporting_period_start: string | null
          revenue_per_employee: number | null
          revenue_total: number | null
          total_suppliers_count: number | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          balance_sheet_date?: string | null
          climate_related_risks_identified?: number | null
          company_id: string
          completion_percentage?: number | null
          created_at?: string | null
          ebitda?: number | null
          ebitda_margin?: number | null
          employee_wages_benefits?: number | null
          has_financial_statements?: boolean | null
          id?: string
          local_procurement_percentage?: number | null
          local_suppliers_count?: number | null
          net_profit_margin?: number | null
          operating_costs?: number | null
          report_id: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          revenue_per_employee?: number | null
          revenue_total?: number | null
          total_suppliers_count?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          balance_sheet_date?: string | null
          climate_related_risks_identified?: number | null
          company_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          ebitda?: number | null
          ebitda_margin?: number | null
          employee_wages_benefits?: number | null
          has_financial_statements?: boolean | null
          id?: string
          local_procurement_percentage?: number | null
          local_suppliers_count?: number | null
          net_profit_margin?: number | null
          operating_costs?: number | null
          report_id?: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          revenue_per_employee?: number | null
          revenue_total?: number | null
          total_suppliers_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_economic_data_collection_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_economic_data_collection_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_environmental_data_collection: {
        Row: {
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          ai_last_analyzed_at: string | null
          company_id: string
          completion_percentage: number | null
          created_at: string | null
          documents_checklist: Json | null
          effluent_treatment_type: string | null
          emissions_biogenic_tco2: number | null
          emissions_intensity_tco2e_per_revenue: number | null
          emissions_scope1_tco2e: number | null
          emissions_scope2_tco2e: number | null
          emissions_scope3_tco2e: number | null
          emissions_total_tco2e: number | null
          energy_control_notes: string | null
          energy_intensity_kwh_per_km: number | null
          energy_intensity_kwh_per_m2: number | null
          energy_intensity_kwh_per_revenue: number | null
          energy_intensity_kwh_per_unit: number | null
          energy_intensity_unit: string | null
          energy_monitoring_systems: string[] | null
          energy_renewable_percentage: number | null
          energy_total_consumption_kwh: number | null
          ghg_base_year: number | null
          ghg_biogenic_emissions: number | null
          ghg_inventory_last_update: string | null
          ghg_inventory_methodology: string | null
          ghg_inventory_notes: string | null
          ghg_inventory_year: number | null
          ghg_methodology: string | null
          ghg_protocol_seal: string | null
          ghg_scope_1_total: number | null
          ghg_scope_2_total: number | null
          ghg_scope_3_total: number | null
          ghg_total_emissions: number | null
          has_effluent_treatment: boolean | null
          has_energy_controls: boolean | null
          has_environmental_licenses: boolean | null
          has_ghg_inventory: boolean | null
          has_iso_14001: boolean | null
          has_waste_controls: boolean | null
          has_water_monitoring: boolean | null
          id: string
          iso_14001_certification_date: string | null
          iso_14001_certifier: string | null
          licenses_notes: string | null
          production_unit_reference: string | null
          production_volume_reference: number | null
          report_id: string
          sector_average_emissions_intensity: number | null
          sector_average_energy_intensity: number | null
          sector_average_recycling_rate: number | null
          status: string | null
          updated_at: string | null
          waste_hazardous_tonnes: number | null
          waste_incineration_percentage: number | null
          waste_landfill_percentage: number | null
          waste_management_plan_exists: boolean | null
          waste_non_hazardous_tonnes: number | null
          waste_notes: string | null
          waste_recycled_percentage: number | null
          waste_segregation_practices: string[] | null
          waste_total_generated_tonnes: number | null
          water_consumption_m3: number | null
          water_intensity_m3_per_product: number | null
          water_notes: string | null
          water_recycled_percentage: number | null
          water_sources: string[] | null
          water_total_withdrawal_m3: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          company_id: string
          completion_percentage?: number | null
          created_at?: string | null
          documents_checklist?: Json | null
          effluent_treatment_type?: string | null
          emissions_biogenic_tco2?: number | null
          emissions_intensity_tco2e_per_revenue?: number | null
          emissions_scope1_tco2e?: number | null
          emissions_scope2_tco2e?: number | null
          emissions_scope3_tco2e?: number | null
          emissions_total_tco2e?: number | null
          energy_control_notes?: string | null
          energy_intensity_kwh_per_km?: number | null
          energy_intensity_kwh_per_m2?: number | null
          energy_intensity_kwh_per_revenue?: number | null
          energy_intensity_kwh_per_unit?: number | null
          energy_intensity_unit?: string | null
          energy_monitoring_systems?: string[] | null
          energy_renewable_percentage?: number | null
          energy_total_consumption_kwh?: number | null
          ghg_base_year?: number | null
          ghg_biogenic_emissions?: number | null
          ghg_inventory_last_update?: string | null
          ghg_inventory_methodology?: string | null
          ghg_inventory_notes?: string | null
          ghg_inventory_year?: number | null
          ghg_methodology?: string | null
          ghg_protocol_seal?: string | null
          ghg_scope_1_total?: number | null
          ghg_scope_2_total?: number | null
          ghg_scope_3_total?: number | null
          ghg_total_emissions?: number | null
          has_effluent_treatment?: boolean | null
          has_energy_controls?: boolean | null
          has_environmental_licenses?: boolean | null
          has_ghg_inventory?: boolean | null
          has_iso_14001?: boolean | null
          has_waste_controls?: boolean | null
          has_water_monitoring?: boolean | null
          id?: string
          iso_14001_certification_date?: string | null
          iso_14001_certifier?: string | null
          licenses_notes?: string | null
          production_unit_reference?: string | null
          production_volume_reference?: number | null
          report_id: string
          sector_average_emissions_intensity?: number | null
          sector_average_energy_intensity?: number | null
          sector_average_recycling_rate?: number | null
          status?: string | null
          updated_at?: string | null
          waste_hazardous_tonnes?: number | null
          waste_incineration_percentage?: number | null
          waste_landfill_percentage?: number | null
          waste_management_plan_exists?: boolean | null
          waste_non_hazardous_tonnes?: number | null
          waste_notes?: string | null
          waste_recycled_percentage?: number | null
          waste_segregation_practices?: string[] | null
          waste_total_generated_tonnes?: number | null
          water_consumption_m3?: number | null
          water_intensity_m3_per_product?: number | null
          water_notes?: string | null
          water_recycled_percentage?: number | null
          water_sources?: string[] | null
          water_total_withdrawal_m3?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          company_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          documents_checklist?: Json | null
          effluent_treatment_type?: string | null
          emissions_biogenic_tco2?: number | null
          emissions_intensity_tco2e_per_revenue?: number | null
          emissions_scope1_tco2e?: number | null
          emissions_scope2_tco2e?: number | null
          emissions_scope3_tco2e?: number | null
          emissions_total_tco2e?: number | null
          energy_control_notes?: string | null
          energy_intensity_kwh_per_km?: number | null
          energy_intensity_kwh_per_m2?: number | null
          energy_intensity_kwh_per_revenue?: number | null
          energy_intensity_kwh_per_unit?: number | null
          energy_intensity_unit?: string | null
          energy_monitoring_systems?: string[] | null
          energy_renewable_percentage?: number | null
          energy_total_consumption_kwh?: number | null
          ghg_base_year?: number | null
          ghg_biogenic_emissions?: number | null
          ghg_inventory_last_update?: string | null
          ghg_inventory_methodology?: string | null
          ghg_inventory_notes?: string | null
          ghg_inventory_year?: number | null
          ghg_methodology?: string | null
          ghg_protocol_seal?: string | null
          ghg_scope_1_total?: number | null
          ghg_scope_2_total?: number | null
          ghg_scope_3_total?: number | null
          ghg_total_emissions?: number | null
          has_effluent_treatment?: boolean | null
          has_energy_controls?: boolean | null
          has_environmental_licenses?: boolean | null
          has_ghg_inventory?: boolean | null
          has_iso_14001?: boolean | null
          has_waste_controls?: boolean | null
          has_water_monitoring?: boolean | null
          id?: string
          iso_14001_certification_date?: string | null
          iso_14001_certifier?: string | null
          licenses_notes?: string | null
          production_unit_reference?: string | null
          production_volume_reference?: number | null
          report_id?: string
          sector_average_emissions_intensity?: number | null
          sector_average_energy_intensity?: number | null
          sector_average_recycling_rate?: number | null
          status?: string | null
          updated_at?: string | null
          waste_hazardous_tonnes?: number | null
          waste_incineration_percentage?: number | null
          waste_landfill_percentage?: number | null
          waste_management_plan_exists?: boolean | null
          waste_non_hazardous_tonnes?: number | null
          waste_notes?: string | null
          waste_recycled_percentage?: number | null
          waste_segregation_practices?: string[] | null
          waste_total_generated_tonnes?: number | null
          water_consumption_m3?: number | null
          water_intensity_m3_per_product?: number | null
          water_notes?: string | null
          water_recycled_percentage?: number | null
          water_sources?: string[] | null
          water_total_withdrawal_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_environmental_data_collection_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_environmental_data_collection_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_governance_data_collection: {
        Row: {
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          ai_last_analyzed_at: string | null
          board_30_50_percentage: number | null
          board_diversity_ethnicity: Json | null
          board_diversity_vulnerable_groups: number | null
          board_independent_members: number | null
          board_over_50_percentage: number | null
          board_total_members: number | null
          board_under_30_percentage: number | null
          board_women_percentage: number | null
          bylaws_last_update_date: string | null
          bylaws_notes: string | null
          bylaws_publicly_accessible: boolean | null
          code_applies_to: string[] | null
          code_notes: string | null
          code_of_conduct_approval_date: string | null
          code_training_mandatory: boolean | null
          company_id: string
          completion_percentage: number | null
          compliance_notes: string | null
          compliance_policies_list: string[] | null
          compliance_training_frequency: string | null
          created_at: string | null
          decision_flows_documented: boolean | null
          documents_checklist: Json | null
          ethics_training_employees_trained: number | null
          ethics_training_hours_total: number | null
          has_bylaws_updated: boolean | null
          has_code_of_conduct: boolean | null
          has_compliance_policies: boolean | null
          has_formal_org_chart: boolean | null
          has_transparency_practices: boolean | null
          has_whistleblower_channel: boolean | null
          highest_to_median_salary_ratio: number | null
          id: string
          org_chart_last_update_date: string | null
          org_chart_notes: string | null
          remuneration_linked_to_esg: boolean | null
          remuneration_policy_approved: boolean | null
          report_id: string
          risk_assessment_frequency: string | null
          risk_committee_exists: boolean | null
          status: string | null
          transparency_mechanisms: string[] | null
          transparency_notes: string | null
          updated_at: string | null
          whistleblower_channel_url: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          board_30_50_percentage?: number | null
          board_diversity_ethnicity?: Json | null
          board_diversity_vulnerable_groups?: number | null
          board_independent_members?: number | null
          board_over_50_percentage?: number | null
          board_total_members?: number | null
          board_under_30_percentage?: number | null
          board_women_percentage?: number | null
          bylaws_last_update_date?: string | null
          bylaws_notes?: string | null
          bylaws_publicly_accessible?: boolean | null
          code_applies_to?: string[] | null
          code_notes?: string | null
          code_of_conduct_approval_date?: string | null
          code_training_mandatory?: boolean | null
          company_id: string
          completion_percentage?: number | null
          compliance_notes?: string | null
          compliance_policies_list?: string[] | null
          compliance_training_frequency?: string | null
          created_at?: string | null
          decision_flows_documented?: boolean | null
          documents_checklist?: Json | null
          ethics_training_employees_trained?: number | null
          ethics_training_hours_total?: number | null
          has_bylaws_updated?: boolean | null
          has_code_of_conduct?: boolean | null
          has_compliance_policies?: boolean | null
          has_formal_org_chart?: boolean | null
          has_transparency_practices?: boolean | null
          has_whistleblower_channel?: boolean | null
          highest_to_median_salary_ratio?: number | null
          id?: string
          org_chart_last_update_date?: string | null
          org_chart_notes?: string | null
          remuneration_linked_to_esg?: boolean | null
          remuneration_policy_approved?: boolean | null
          report_id: string
          risk_assessment_frequency?: string | null
          risk_committee_exists?: boolean | null
          status?: string | null
          transparency_mechanisms?: string[] | null
          transparency_notes?: string | null
          updated_at?: string | null
          whistleblower_channel_url?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          board_30_50_percentage?: number | null
          board_diversity_ethnicity?: Json | null
          board_diversity_vulnerable_groups?: number | null
          board_independent_members?: number | null
          board_over_50_percentage?: number | null
          board_total_members?: number | null
          board_under_30_percentage?: number | null
          board_women_percentage?: number | null
          bylaws_last_update_date?: string | null
          bylaws_notes?: string | null
          bylaws_publicly_accessible?: boolean | null
          code_applies_to?: string[] | null
          code_notes?: string | null
          code_of_conduct_approval_date?: string | null
          code_training_mandatory?: boolean | null
          company_id?: string
          completion_percentage?: number | null
          compliance_notes?: string | null
          compliance_policies_list?: string[] | null
          compliance_training_frequency?: string | null
          created_at?: string | null
          decision_flows_documented?: boolean | null
          documents_checklist?: Json | null
          ethics_training_employees_trained?: number | null
          ethics_training_hours_total?: number | null
          has_bylaws_updated?: boolean | null
          has_code_of_conduct?: boolean | null
          has_compliance_policies?: boolean | null
          has_formal_org_chart?: boolean | null
          has_transparency_practices?: boolean | null
          has_whistleblower_channel?: boolean | null
          highest_to_median_salary_ratio?: number | null
          id?: string
          org_chart_last_update_date?: string | null
          org_chart_notes?: string | null
          remuneration_linked_to_esg?: boolean | null
          remuneration_policy_approved?: boolean | null
          report_id?: string
          risk_assessment_frequency?: string | null
          risk_committee_exists?: boolean | null
          status?: string | null
          transparency_mechanisms?: string[] | null
          transparency_notes?: string | null
          updated_at?: string | null
          whistleblower_channel_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_governance_data_collection_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_governance_data_collection_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
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
          covered_indicators: string[] | null
          created_at: string
          id: string
          is_complete: boolean | null
          last_ai_update: string | null
          order_index: number | null
          page_number_end: number | null
          page_number_start: number | null
          report_id: string
          section_key: string
          template_used: string | null
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          ai_generated_content?: boolean | null
          completion_percentage?: number | null
          content?: string | null
          covered_indicators?: string[] | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          last_ai_update?: string | null
          order_index?: number | null
          page_number_end?: number | null
          page_number_start?: number | null
          report_id: string
          section_key: string
          template_used?: string | null
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          ai_generated_content?: boolean | null
          completion_percentage?: number | null
          content?: string | null
          covered_indicators?: string[] | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          last_ai_update?: string | null
          order_index?: number | null
          page_number_end?: number | null
          page_number_start?: number | null
          report_id?: string
          section_key?: string
          template_used?: string | null
          title?: string
          updated_at?: string
          word_count?: number | null
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
      gri_reporting_standards_data: {
        Row: {
          abnt_pr2030_adherence_level: string | null
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          ai_last_analyzed_at: string | null
          assurance_certificate_date: string | null
          assurance_coverage_percentage: number | null
          assurance_level: string | null
          assurance_provider: string | null
          assurance_scope: string | null
          assurance_standards: string | null
          benchmarking_insights: Json | null
          benchmarking_notes: string | null
          benchmarking_sources: string[] | null
          company_id: string
          company_score: number | null
          competitive_advantages: string[] | null
          completion_percentage: number | null
          created_at: string | null
          data_quality_score: number | null
          documents_checklist: Json | null
          first_report_year: number | null
          frameworks_adopted: string[] | null
          frameworks_alignment_matrix: Json | null
          frameworks_notes: string | null
          gri_application_level: string | null
          gri_topic_standards_coverage: number | null
          gri_universal_standards_coverage: number | null
          gri_version_used: string | null
          has_aligned_policies: boolean | null
          has_benchmarking_studies: boolean | null
          has_external_assurance: boolean | null
          has_framework_adherence: boolean | null
          has_previous_reports: boolean | null
          has_restatements: boolean | null
          id: string
          improvement_opportunities: string[] | null
          indicators_disclosed_count: number | null
          indicators_disclosed_evolution: Json | null
          kpis_by_framework: Json | null
          kpis_evolution: Json | null
          last_report_publication_date: string | null
          mandatory_indicators_reported: number | null
          next_report_expected_date: string | null
          optional_indicators_reported: number | null
          pages_published_evolution: Json | null
          policies_by_category: Json | null
          policies_notes: string | null
          previous_reports_list: Json | null
          report_frequency: string | null
          report_id: string
          reporting_awards_list: Json | null
          reporting_awards_received: number | null
          reporting_cycle_duration_months: number | null
          reporting_evolution_notes: string | null
          reporting_maturity_level: string | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          restatements_count: number | null
          restatements_details: Json | null
          restatements_impact: string | null
          sasb_industry_standard: string | null
          sector_average_score: number | null
          sector_position_ranking: number | null
          status: string | null
          tcfd_implementation_status: string | null
          top_performer_score: number | null
          total_gri_indicators_reported: number | null
          total_kpis_tracked: number | null
          total_policies_documented: number | null
          total_reports_published: number | null
          updated_at: string | null
          years_of_reporting: number | null
        }
        Insert: {
          abnt_pr2030_adherence_level?: string | null
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          assurance_certificate_date?: string | null
          assurance_coverage_percentage?: number | null
          assurance_level?: string | null
          assurance_provider?: string | null
          assurance_scope?: string | null
          assurance_standards?: string | null
          benchmarking_insights?: Json | null
          benchmarking_notes?: string | null
          benchmarking_sources?: string[] | null
          company_id: string
          company_score?: number | null
          competitive_advantages?: string[] | null
          completion_percentage?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          documents_checklist?: Json | null
          first_report_year?: number | null
          frameworks_adopted?: string[] | null
          frameworks_alignment_matrix?: Json | null
          frameworks_notes?: string | null
          gri_application_level?: string | null
          gri_topic_standards_coverage?: number | null
          gri_universal_standards_coverage?: number | null
          gri_version_used?: string | null
          has_aligned_policies?: boolean | null
          has_benchmarking_studies?: boolean | null
          has_external_assurance?: boolean | null
          has_framework_adherence?: boolean | null
          has_previous_reports?: boolean | null
          has_restatements?: boolean | null
          id?: string
          improvement_opportunities?: string[] | null
          indicators_disclosed_count?: number | null
          indicators_disclosed_evolution?: Json | null
          kpis_by_framework?: Json | null
          kpis_evolution?: Json | null
          last_report_publication_date?: string | null
          mandatory_indicators_reported?: number | null
          next_report_expected_date?: string | null
          optional_indicators_reported?: number | null
          pages_published_evolution?: Json | null
          policies_by_category?: Json | null
          policies_notes?: string | null
          previous_reports_list?: Json | null
          report_frequency?: string | null
          report_id: string
          reporting_awards_list?: Json | null
          reporting_awards_received?: number | null
          reporting_cycle_duration_months?: number | null
          reporting_evolution_notes?: string | null
          reporting_maturity_level?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          restatements_count?: number | null
          restatements_details?: Json | null
          restatements_impact?: string | null
          sasb_industry_standard?: string | null
          sector_average_score?: number | null
          sector_position_ranking?: number | null
          status?: string | null
          tcfd_implementation_status?: string | null
          top_performer_score?: number | null
          total_gri_indicators_reported?: number | null
          total_kpis_tracked?: number | null
          total_policies_documented?: number | null
          total_reports_published?: number | null
          updated_at?: string | null
          years_of_reporting?: number | null
        }
        Update: {
          abnt_pr2030_adherence_level?: string | null
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          assurance_certificate_date?: string | null
          assurance_coverage_percentage?: number | null
          assurance_level?: string | null
          assurance_provider?: string | null
          assurance_scope?: string | null
          assurance_standards?: string | null
          benchmarking_insights?: Json | null
          benchmarking_notes?: string | null
          benchmarking_sources?: string[] | null
          company_id?: string
          company_score?: number | null
          competitive_advantages?: string[] | null
          completion_percentage?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          documents_checklist?: Json | null
          first_report_year?: number | null
          frameworks_adopted?: string[] | null
          frameworks_alignment_matrix?: Json | null
          frameworks_notes?: string | null
          gri_application_level?: string | null
          gri_topic_standards_coverage?: number | null
          gri_universal_standards_coverage?: number | null
          gri_version_used?: string | null
          has_aligned_policies?: boolean | null
          has_benchmarking_studies?: boolean | null
          has_external_assurance?: boolean | null
          has_framework_adherence?: boolean | null
          has_previous_reports?: boolean | null
          has_restatements?: boolean | null
          id?: string
          improvement_opportunities?: string[] | null
          indicators_disclosed_count?: number | null
          indicators_disclosed_evolution?: Json | null
          kpis_by_framework?: Json | null
          kpis_evolution?: Json | null
          last_report_publication_date?: string | null
          mandatory_indicators_reported?: number | null
          next_report_expected_date?: string | null
          optional_indicators_reported?: number | null
          pages_published_evolution?: Json | null
          policies_by_category?: Json | null
          policies_notes?: string | null
          previous_reports_list?: Json | null
          report_frequency?: string | null
          report_id?: string
          reporting_awards_list?: Json | null
          reporting_awards_received?: number | null
          reporting_cycle_duration_months?: number | null
          reporting_evolution_notes?: string | null
          reporting_maturity_level?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          restatements_count?: number | null
          restatements_details?: Json | null
          restatements_impact?: string | null
          sasb_industry_standard?: string | null
          sector_average_score?: number | null
          sector_position_ranking?: number | null
          status?: string | null
          tcfd_implementation_status?: string | null
          top_performer_score?: number | null
          total_gri_indicators_reported?: number | null
          total_kpis_tracked?: number | null
          total_policies_documented?: number | null
          total_reports_published?: number | null
          updated_at?: string | null
          years_of_reporting?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_reporting_standards_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_reporting_standards_data_report_id_fkey"
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
          guidelines_file_path: string | null
          id: string
          materiality_assessment: Json | null
          methodology: string | null
          organization_purpose: string | null
          publication_date: string | null
          published_at: string | null
          report_objective: string | null
          reporting_period_end: string
          reporting_period_start: string
          stakeholder_engagement: Json | null
          status: Database["public"]["Enums"]["report_gri_status_enum"]
          target_audience: string[] | null
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
          guidelines_file_path?: string | null
          id?: string
          materiality_assessment?: Json | null
          methodology?: string | null
          organization_purpose?: string | null
          publication_date?: string | null
          published_at?: string | null
          report_objective?: string | null
          reporting_period_end: string
          reporting_period_start: string
          stakeholder_engagement?: Json | null
          status?: Database["public"]["Enums"]["report_gri_status_enum"]
          target_audience?: string[] | null
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
          guidelines_file_path?: string | null
          id?: string
          materiality_assessment?: Json | null
          methodology?: string | null
          organization_purpose?: string | null
          publication_date?: string | null
          published_at?: string | null
          report_objective?: string | null
          reporting_period_end?: string
          reporting_period_start?: string
          stakeholder_engagement?: Json | null
          status?: Database["public"]["Enums"]["report_gri_status_enum"]
          target_audience?: string[] | null
          template_config?: Json | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      gri_social_data_collection: {
        Row: {
          absenteeism_rate: number | null
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          ai_last_analyzed_at: string | null
          average_training_hours_per_employee: number | null
          beneficiaries_count: number | null
          benefits_notes: string | null
          benefits_offered: string[] | null
          company_id: string
          completion_percentage: number | null
          created_at: string | null
          days_lost: number | null
          discrimination_incidents_reported: number | null
          discrimination_incidents_resolved: number | null
          diversity_initiatives: string[] | null
          diversity_policy_approval_date: string | null
          diversity_policy_notes: string | null
          documents_checklist: Json | null
          employees_30_50: number | null
          employees_ethnic_minorities: number | null
          employees_full_time: number | null
          employees_men: number | null
          employees_non_binary: number | null
          employees_over_50: number | null
          employees_part_time: number | null
          employees_pcd: number | null
          employees_permanent: number | null
          employees_temporary: number | null
          employees_trained: number | null
          employees_under_30: number | null
          employees_with_health_insurance: number | null
          employees_with_life_insurance: number | null
          employees_with_retirement_plan: number | null
          employees_women: number | null
          fatalities: number | null
          has_benefits_program: boolean | null
          has_cipa: boolean | null
          has_diversity_policy: boolean | null
          has_health_safety_programs: boolean | null
          has_occupational_health_service: boolean | null
          has_performance_bonus: boolean | null
          has_safety_training_program: boolean | null
          has_social_projects: boolean | null
          has_training_effectiveness_evaluation: boolean | null
          has_training_records: boolean | null
          health_safety_certifications: string[] | null
          health_safety_notes: string | null
          id: string
          incident_rate: number | null
          indicators_notes: string | null
          indicators_tracked: string[] | null
          leadership_women_percentage: number | null
          lost_time_incident_rate: number | null
          lost_time_incidents: number | null
          new_hires_rate: number | null
          new_hires_total: number | null
          occupational_diseases_cases: number | null
          parental_leave_female_eligible: number | null
          parental_leave_female_taken: number | null
          parental_leave_male_eligible: number | null
          parental_leave_male_taken: number | null
          report_id: string
          reporting_frequency: string | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          sector_average_incident_rate: number | null
          sector_average_training_hours: number | null
          sector_average_turnover_rate: number | null
          sector_average_women_leadership: number | null
          social_investment_annual: number | null
          social_project_types: string[] | null
          social_projects_notes: string | null
          status: string | null
          total_employees: number | null
          total_safety_incidents: number | null
          total_training_hours: number | null
          tracks_social_indicators: boolean | null
          training_coverage_rate: number | null
          training_hours_men: number | null
          training_hours_women: number | null
          training_investment_total: number | null
          training_notes: string | null
          training_types: string[] | null
          turnover_rate: number | null
          turnover_total: number | null
          updated_at: string | null
          wage_gap_gender: number | null
        }
        Insert: {
          absenteeism_rate?: number | null
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          average_training_hours_per_employee?: number | null
          beneficiaries_count?: number | null
          benefits_notes?: string | null
          benefits_offered?: string[] | null
          company_id: string
          completion_percentage?: number | null
          created_at?: string | null
          days_lost?: number | null
          discrimination_incidents_reported?: number | null
          discrimination_incidents_resolved?: number | null
          diversity_initiatives?: string[] | null
          diversity_policy_approval_date?: string | null
          diversity_policy_notes?: string | null
          documents_checklist?: Json | null
          employees_30_50?: number | null
          employees_ethnic_minorities?: number | null
          employees_full_time?: number | null
          employees_men?: number | null
          employees_non_binary?: number | null
          employees_over_50?: number | null
          employees_part_time?: number | null
          employees_pcd?: number | null
          employees_permanent?: number | null
          employees_temporary?: number | null
          employees_trained?: number | null
          employees_under_30?: number | null
          employees_with_health_insurance?: number | null
          employees_with_life_insurance?: number | null
          employees_with_retirement_plan?: number | null
          employees_women?: number | null
          fatalities?: number | null
          has_benefits_program?: boolean | null
          has_cipa?: boolean | null
          has_diversity_policy?: boolean | null
          has_health_safety_programs?: boolean | null
          has_occupational_health_service?: boolean | null
          has_performance_bonus?: boolean | null
          has_safety_training_program?: boolean | null
          has_social_projects?: boolean | null
          has_training_effectiveness_evaluation?: boolean | null
          has_training_records?: boolean | null
          health_safety_certifications?: string[] | null
          health_safety_notes?: string | null
          id?: string
          incident_rate?: number | null
          indicators_notes?: string | null
          indicators_tracked?: string[] | null
          leadership_women_percentage?: number | null
          lost_time_incident_rate?: number | null
          lost_time_incidents?: number | null
          new_hires_rate?: number | null
          new_hires_total?: number | null
          occupational_diseases_cases?: number | null
          parental_leave_female_eligible?: number | null
          parental_leave_female_taken?: number | null
          parental_leave_male_eligible?: number | null
          parental_leave_male_taken?: number | null
          report_id: string
          reporting_frequency?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          sector_average_incident_rate?: number | null
          sector_average_training_hours?: number | null
          sector_average_turnover_rate?: number | null
          sector_average_women_leadership?: number | null
          social_investment_annual?: number | null
          social_project_types?: string[] | null
          social_projects_notes?: string | null
          status?: string | null
          total_employees?: number | null
          total_safety_incidents?: number | null
          total_training_hours?: number | null
          tracks_social_indicators?: boolean | null
          training_coverage_rate?: number | null
          training_hours_men?: number | null
          training_hours_women?: number | null
          training_investment_total?: number | null
          training_notes?: string | null
          training_types?: string[] | null
          turnover_rate?: number | null
          turnover_total?: number | null
          updated_at?: string | null
          wage_gap_gender?: number | null
        }
        Update: {
          absenteeism_rate?: number | null
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          average_training_hours_per_employee?: number | null
          beneficiaries_count?: number | null
          benefits_notes?: string | null
          benefits_offered?: string[] | null
          company_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          days_lost?: number | null
          discrimination_incidents_reported?: number | null
          discrimination_incidents_resolved?: number | null
          diversity_initiatives?: string[] | null
          diversity_policy_approval_date?: string | null
          diversity_policy_notes?: string | null
          documents_checklist?: Json | null
          employees_30_50?: number | null
          employees_ethnic_minorities?: number | null
          employees_full_time?: number | null
          employees_men?: number | null
          employees_non_binary?: number | null
          employees_over_50?: number | null
          employees_part_time?: number | null
          employees_pcd?: number | null
          employees_permanent?: number | null
          employees_temporary?: number | null
          employees_trained?: number | null
          employees_under_30?: number | null
          employees_with_health_insurance?: number | null
          employees_with_life_insurance?: number | null
          employees_with_retirement_plan?: number | null
          employees_women?: number | null
          fatalities?: number | null
          has_benefits_program?: boolean | null
          has_cipa?: boolean | null
          has_diversity_policy?: boolean | null
          has_health_safety_programs?: boolean | null
          has_occupational_health_service?: boolean | null
          has_performance_bonus?: boolean | null
          has_safety_training_program?: boolean | null
          has_social_projects?: boolean | null
          has_training_effectiveness_evaluation?: boolean | null
          has_training_records?: boolean | null
          health_safety_certifications?: string[] | null
          health_safety_notes?: string | null
          id?: string
          incident_rate?: number | null
          indicators_notes?: string | null
          indicators_tracked?: string[] | null
          leadership_women_percentage?: number | null
          lost_time_incident_rate?: number | null
          lost_time_incidents?: number | null
          new_hires_rate?: number | null
          new_hires_total?: number | null
          occupational_diseases_cases?: number | null
          parental_leave_female_eligible?: number | null
          parental_leave_female_taken?: number | null
          parental_leave_male_eligible?: number | null
          parental_leave_male_taken?: number | null
          report_id?: string
          reporting_frequency?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          sector_average_incident_rate?: number | null
          sector_average_training_hours?: number | null
          sector_average_turnover_rate?: number | null
          sector_average_women_leadership?: number | null
          social_investment_annual?: number | null
          social_project_types?: string[] | null
          social_projects_notes?: string | null
          status?: string | null
          total_employees?: number | null
          total_safety_incidents?: number | null
          total_training_hours?: number | null
          tracks_social_indicators?: boolean | null
          training_coverage_rate?: number | null
          training_hours_men?: number | null
          training_hours_women?: number | null
          training_investment_total?: number | null
          training_notes?: string | null
          training_types?: string[] | null
          turnover_rate?: number | null
          turnover_total?: number | null
          updated_at?: string | null
          wage_gap_gender?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_social_data_collection_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_social_data_collection_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_stakeholder_engagement_data: {
        Row: {
          active_partnerships: number | null
          active_partnerships_count: number | null
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          ai_last_analyzed_at: string | null
          average_engagement_score: number | null
          average_meeting_frequency: number | null
          average_satisfaction_score: number | null
          collaborative_projects: number | null
          communication_channels: string[] | null
          company_id: string
          completion_percentage: number | null
          created_at: string | null
          critical_stakeholders: number | null
          critical_stakeholders_count: number | null
          documents_checklist: Json | null
          engagement_frequency_by_group: Json | null
          engagement_hours_total: number | null
          engagement_record_types: string[] | null
          engagement_records_notes: string | null
          grievance_resolution_rate: number | null
          grievances_received: number | null
          grievances_resolved: number | null
          has_engagement_records: boolean | null
          has_formal_grievance_mechanism: boolean | null
          has_partnerships: boolean | null
          has_stakeholder_mapping: boolean | null
          has_stakeholder_surveys: boolean | null
          high_influence_stakeholders: number | null
          high_interest_stakeholders: number | null
          id: string
          partnership_types: string[] | null
          partnerships_list: Json | null
          partnerships_notes: string | null
          preferred_communication_channels: Json | null
          report_id: string
          reporting_period_end: string | null
          reporting_period_start: string | null
          sector_average_engagement_score: number | null
          sector_average_stakeholder_count: number | null
          sector_average_survey_response_rate: number | null
          sectoral_forums: string[] | null
          sectoral_memberships: number | null
          stakeholder_mapping_frequency: string | null
          stakeholder_mapping_last_update: string | null
          stakeholder_mapping_methodology: string | null
          stakeholder_mapping_notes: string | null
          stakeholders_annual_engagement: number | null
          stakeholders_biannual_engagement: number | null
          stakeholders_by_category: Json | null
          stakeholders_high_influence: number | null
          stakeholders_high_interest: number | null
          stakeholders_low_influence: number | null
          stakeholders_low_interest: number | null
          stakeholders_medium_influence: number | null
          stakeholders_medium_interest: number | null
          stakeholders_monthly_engagement: number | null
          stakeholders_quarterly_engagement: number | null
          status: string | null
          survey_last_conducted_date: string | null
          survey_response_rate: number | null
          survey_response_rate_calculated: number | null
          survey_results_summary: string | null
          survey_types: string[] | null
          surveys_conducted_count: number | null
          surveys_notes: string | null
          total_engagement_events: number | null
          total_meetings_held: number | null
          total_participants: number | null
          total_stakeholder_groups: number | null
          total_stakeholders_mapped: number | null
          total_survey_responses: number | null
          total_surveys_sent: number | null
          updated_at: string | null
        }
        Insert: {
          active_partnerships?: number | null
          active_partnerships_count?: number | null
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          average_engagement_score?: number | null
          average_meeting_frequency?: number | null
          average_satisfaction_score?: number | null
          collaborative_projects?: number | null
          communication_channels?: string[] | null
          company_id: string
          completion_percentage?: number | null
          created_at?: string | null
          critical_stakeholders?: number | null
          critical_stakeholders_count?: number | null
          documents_checklist?: Json | null
          engagement_frequency_by_group?: Json | null
          engagement_hours_total?: number | null
          engagement_record_types?: string[] | null
          engagement_records_notes?: string | null
          grievance_resolution_rate?: number | null
          grievances_received?: number | null
          grievances_resolved?: number | null
          has_engagement_records?: boolean | null
          has_formal_grievance_mechanism?: boolean | null
          has_partnerships?: boolean | null
          has_stakeholder_mapping?: boolean | null
          has_stakeholder_surveys?: boolean | null
          high_influence_stakeholders?: number | null
          high_interest_stakeholders?: number | null
          id?: string
          partnership_types?: string[] | null
          partnerships_list?: Json | null
          partnerships_notes?: string | null
          preferred_communication_channels?: Json | null
          report_id: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          sector_average_engagement_score?: number | null
          sector_average_stakeholder_count?: number | null
          sector_average_survey_response_rate?: number | null
          sectoral_forums?: string[] | null
          sectoral_memberships?: number | null
          stakeholder_mapping_frequency?: string | null
          stakeholder_mapping_last_update?: string | null
          stakeholder_mapping_methodology?: string | null
          stakeholder_mapping_notes?: string | null
          stakeholders_annual_engagement?: number | null
          stakeholders_biannual_engagement?: number | null
          stakeholders_by_category?: Json | null
          stakeholders_high_influence?: number | null
          stakeholders_high_interest?: number | null
          stakeholders_low_influence?: number | null
          stakeholders_low_interest?: number | null
          stakeholders_medium_influence?: number | null
          stakeholders_medium_interest?: number | null
          stakeholders_monthly_engagement?: number | null
          stakeholders_quarterly_engagement?: number | null
          status?: string | null
          survey_last_conducted_date?: string | null
          survey_response_rate?: number | null
          survey_response_rate_calculated?: number | null
          survey_results_summary?: string | null
          survey_types?: string[] | null
          surveys_conducted_count?: number | null
          surveys_notes?: string | null
          total_engagement_events?: number | null
          total_meetings_held?: number | null
          total_participants?: number | null
          total_stakeholder_groups?: number | null
          total_stakeholders_mapped?: number | null
          total_survey_responses?: number | null
          total_surveys_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          active_partnerships?: number | null
          active_partnerships_count?: number | null
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          average_engagement_score?: number | null
          average_meeting_frequency?: number | null
          average_satisfaction_score?: number | null
          collaborative_projects?: number | null
          communication_channels?: string[] | null
          company_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          critical_stakeholders?: number | null
          critical_stakeholders_count?: number | null
          documents_checklist?: Json | null
          engagement_frequency_by_group?: Json | null
          engagement_hours_total?: number | null
          engagement_record_types?: string[] | null
          engagement_records_notes?: string | null
          grievance_resolution_rate?: number | null
          grievances_received?: number | null
          grievances_resolved?: number | null
          has_engagement_records?: boolean | null
          has_formal_grievance_mechanism?: boolean | null
          has_partnerships?: boolean | null
          has_stakeholder_mapping?: boolean | null
          has_stakeholder_surveys?: boolean | null
          high_influence_stakeholders?: number | null
          high_interest_stakeholders?: number | null
          id?: string
          partnership_types?: string[] | null
          partnerships_list?: Json | null
          partnerships_notes?: string | null
          preferred_communication_channels?: Json | null
          report_id?: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          sector_average_engagement_score?: number | null
          sector_average_stakeholder_count?: number | null
          sector_average_survey_response_rate?: number | null
          sectoral_forums?: string[] | null
          sectoral_memberships?: number | null
          stakeholder_mapping_frequency?: string | null
          stakeholder_mapping_last_update?: string | null
          stakeholder_mapping_methodology?: string | null
          stakeholder_mapping_notes?: string | null
          stakeholders_annual_engagement?: number | null
          stakeholders_biannual_engagement?: number | null
          stakeholders_by_category?: Json | null
          stakeholders_high_influence?: number | null
          stakeholders_high_interest?: number | null
          stakeholders_low_influence?: number | null
          stakeholders_low_interest?: number | null
          stakeholders_medium_influence?: number | null
          stakeholders_medium_interest?: number | null
          stakeholders_monthly_engagement?: number | null
          stakeholders_quarterly_engagement?: number | null
          status?: string | null
          survey_last_conducted_date?: string | null
          survey_response_rate?: number | null
          survey_response_rate_calculated?: number | null
          survey_results_summary?: string | null
          survey_types?: string[] | null
          surveys_conducted_count?: number | null
          surveys_notes?: string | null
          total_engagement_events?: number | null
          total_meetings_held?: number | null
          total_participants?: number | null
          total_stakeholder_groups?: number | null
          total_stakeholders_mapped?: number | null
          total_survey_responses?: number | null
          total_surveys_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_stakeholder_engagement_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_stakeholder_engagement_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gri_strategy_data_collection: {
        Row: {
          ai_analysis: Json | null
          ai_confidence_score: number | null
          ai_generated_text: string | null
          ai_last_analyzed_at: string | null
          company_id: string
          completion_percentage: number | null
          created_at: string | null
          documents_checklist: Json | null
          has_mission_vision_values: boolean | null
          has_previous_results: boolean | null
          has_public_commitments: boolean | null
          has_strategic_plan_esg: boolean | null
          has_sustainability_policy: boolean | null
          id: string
          mission_vision_values_notes: string | null
          mission_vision_values_updated_date: string | null
          previous_results_summary: string | null
          public_commitments_list: string[] | null
          public_commitments_notes: string | null
          report_id: string
          status: string | null
          strategic_plan_notes: string | null
          strategic_plan_period: string | null
          sustainability_policy_approval_date: string | null
          sustainability_policy_notes: string | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          company_id: string
          completion_percentage?: number | null
          created_at?: string | null
          documents_checklist?: Json | null
          has_mission_vision_values?: boolean | null
          has_previous_results?: boolean | null
          has_public_commitments?: boolean | null
          has_strategic_plan_esg?: boolean | null
          has_sustainability_policy?: boolean | null
          id?: string
          mission_vision_values_notes?: string | null
          mission_vision_values_updated_date?: string | null
          previous_results_summary?: string | null
          public_commitments_list?: string[] | null
          public_commitments_notes?: string | null
          report_id: string
          status?: string | null
          strategic_plan_notes?: string | null
          strategic_plan_period?: string | null
          sustainability_policy_approval_date?: string | null
          sustainability_policy_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          ai_generated_text?: string | null
          ai_last_analyzed_at?: string | null
          company_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          documents_checklist?: Json | null
          has_mission_vision_values?: boolean | null
          has_previous_results?: boolean | null
          has_public_commitments?: boolean | null
          has_strategic_plan_esg?: boolean | null
          has_sustainability_policy?: boolean | null
          id?: string
          mission_vision_values_notes?: string | null
          mission_vision_values_updated_date?: string | null
          previous_results_summary?: string | null
          public_commitments_list?: string[] | null
          public_commitments_notes?: string | null
          report_id?: string
          status?: string | null
          strategic_plan_notes?: string | null
          strategic_plan_period?: string | null
          sustainability_policy_approval_date?: string | null
          sustainability_policy_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_strategy_data_collection_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gri_strategy_data_collection_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ifrs_disclosures: {
        Row: {
          assurance_level: string | null
          category: string
          company_id: string
          completeness_score: number | null
          created_at: string
          data_sources: string[] | null
          disclosure_content: string | null
          disclosure_id: string
          disclosure_name: string
          id: string
          last_reviewed_at: string | null
          qualitative_description: string | null
          quality_score: number | null
          quantitative_data: Json | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          requirement_type: string
          reviewed_by_user_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assurance_level?: string | null
          category: string
          company_id: string
          completeness_score?: number | null
          created_at?: string
          data_sources?: string[] | null
          disclosure_content?: string | null
          disclosure_id: string
          disclosure_name: string
          id?: string
          last_reviewed_at?: string | null
          qualitative_description?: string | null
          quality_score?: number | null
          quantitative_data?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          requirement_type: string
          reviewed_by_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assurance_level?: string | null
          category?: string
          company_id?: string
          completeness_score?: number | null
          created_at?: string
          data_sources?: string[] | null
          disclosure_content?: string | null
          disclosure_id?: string
          disclosure_name?: string
          id?: string
          last_reviewed_at?: string | null
          qualitative_description?: string | null
          quality_score?: number | null
          quantitative_data?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          requirement_type?: string
          reviewed_by_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ifrs_disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by_user_id: string | null
          alert_level: string
          alert_message: string
          alert_type: string
          created_at: string
          id: string
          indicator_id: string
          is_acknowledged: boolean
          is_resolved: boolean
          measurement_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by_user_id?: string | null
          alert_level: string
          alert_message: string
          alert_type: string
          created_at?: string
          id?: string
          indicator_id: string
          is_acknowledged?: boolean
          is_resolved?: boolean
          measurement_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by_user_id?: string | null
          alert_level?: string
          alert_message?: string
          alert_type?: string
          created_at?: string
          id?: string
          indicator_id?: string
          is_acknowledged?: boolean
          is_resolved?: boolean
          measurement_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_alerts_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_alerts_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "indicator_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_analysis: {
        Row: {
          analysis_conclusion: string | null
          analysis_date: string
          analysis_type: string
          analyzed_by_user_id: string
          approval_date: string | null
          approval_notes: string | null
          approval_status: string
          approved_by_user_id: string | null
          corrective_actions: Json | null
          created_at: string
          deviation_description: string | null
          effectiveness_verification_date: string | null
          effectiveness_verified: boolean | null
          id: string
          indicator_id: string
          preventive_actions: Json | null
          root_cause_analysis: Json | null
          trigger_measurement_id: string | null
          updated_at: string
        }
        Insert: {
          analysis_conclusion?: string | null
          analysis_date: string
          analysis_type: string
          analyzed_by_user_id: string
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string
          approved_by_user_id?: string | null
          corrective_actions?: Json | null
          created_at?: string
          deviation_description?: string | null
          effectiveness_verification_date?: string | null
          effectiveness_verified?: boolean | null
          id?: string
          indicator_id: string
          preventive_actions?: Json | null
          root_cause_analysis?: Json | null
          trigger_measurement_id?: string | null
          updated_at?: string
        }
        Update: {
          analysis_conclusion?: string | null
          analysis_date?: string
          analysis_type?: string
          analyzed_by_user_id?: string
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string
          approved_by_user_id?: string | null
          corrective_actions?: Json | null
          created_at?: string
          deviation_description?: string | null
          effectiveness_verification_date?: string | null
          effectiveness_verified?: boolean | null
          id?: string
          indicator_id?: string
          preventive_actions?: Json | null
          root_cause_analysis?: Json | null
          trigger_measurement_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_analysis_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_analysis_trigger_measurement_id_fkey"
            columns: ["trigger_measurement_id"]
            isOneToOne: false
            referencedRelation: "indicator_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_measurements: {
        Row: {
          collected_by_user_id: string | null
          created_at: string
          data_source_reference: string | null
          deviation_level: string | null
          id: string
          indicator_id: string
          measured_value: number
          measurement_date: string
          measurement_period_end: string | null
          measurement_period_start: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          collected_by_user_id?: string | null
          created_at?: string
          data_source_reference?: string | null
          deviation_level?: string | null
          id?: string
          indicator_id: string
          measured_value: number
          measurement_date: string
          measurement_period_end?: string | null
          measurement_period_start?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          collected_by_user_id?: string | null
          created_at?: string
          data_source_reference?: string | null
          deviation_level?: string | null
          id?: string
          indicator_id?: string
          measured_value?: number
          measurement_date?: string
          measurement_period_end?: string | null
          measurement_period_start?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_measurements_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_occurrences: {
        Row: {
          attachments: Json | null
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string
          id: string
          immediate_actions: string | null
          impact_description: string | null
          indicator_id: string | null
          lessons_learned: string | null
          occurrence_date: string
          occurrence_type: string
          resolution_date: string | null
          resolution_description: string | null
          responsible_user_id: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          description: string
          id?: string
          immediate_actions?: string | null
          impact_description?: string | null
          indicator_id?: string | null
          lessons_learned?: string | null
          occurrence_date: string
          occurrence_type: string
          resolution_date?: string | null
          resolution_description?: string | null
          responsible_user_id?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string
          id?: string
          immediate_actions?: string | null
          impact_description?: string | null
          indicator_id?: string | null
          lessons_learned?: string | null
          occurrence_date?: string
          occurrence_type?: string
          resolution_date?: string | null
          resolution_description?: string | null
          responsible_user_id?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_occurrences_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_targets: {
        Row: {
          created_at: string
          critical_lower_limit: number | null
          critical_upper_limit: number | null
          id: string
          indicator_id: string
          is_active: boolean
          lower_limit: number | null
          target_value: number
          upper_limit: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          critical_lower_limit?: number | null
          critical_upper_limit?: number | null
          id?: string
          indicator_id: string
          is_active?: boolean
          lower_limit?: number | null
          target_value: number
          upper_limit?: number | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          critical_lower_limit?: number | null
          critical_upper_limit?: number | null
          id?: string
          indicator_id?: string
          is_active?: boolean
          lower_limit?: number | null
          target_value?: number
          upper_limit?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_targets_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
        ]
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
      internal_agreements: {
        Row: {
          agreement_number: string
          agreement_type: string
          approval_workflow: Json | null
          client_company_id: string | null
          company_id: string
          created_at: string
          deliverables: Json | null
          description: string | null
          end_date: string | null
          file_path: string | null
          id: string
          milestones: Json | null
          parent_agreement_id: string | null
          responsible_user_id: string | null
          scope: string | null
          signatures: Json | null
          start_date: string
          status: string | null
          supplier_company_id: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          agreement_number: string
          agreement_type?: string
          approval_workflow?: Json | null
          client_company_id?: string | null
          company_id: string
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          end_date?: string | null
          file_path?: string | null
          id?: string
          milestones?: Json | null
          parent_agreement_id?: string | null
          responsible_user_id?: string | null
          scope?: string | null
          signatures?: Json | null
          start_date: string
          status?: string | null
          supplier_company_id?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          agreement_number?: string
          agreement_type?: string
          approval_workflow?: Json | null
          client_company_id?: string | null
          company_id?: string
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          end_date?: string | null
          file_path?: string | null
          id?: string
          milestones?: Json | null
          parent_agreement_id?: string | null
          responsible_user_id?: string | null
          scope?: string | null
          signatures?: Json | null
          start_date?: string
          status?: string | null
          supplier_company_id?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      internal_client_evaluations: {
        Row: {
          communication_score: number | null
          company_id: string
          created_at: string
          evaluated_by_user_id: string
          evaluation_period_end: string
          evaluation_period_start: string
          feedback_text: string | null
          id: string
          improvement_suggestions: string | null
          nps_score: number | null
          overall_satisfaction_score: number | null
          problem_resolution_score: number | null
          relationship_id: string
          response_time_score: number | null
          service_quality_score: number | null
          updated_at: string
        }
        Insert: {
          communication_score?: number | null
          company_id: string
          created_at?: string
          evaluated_by_user_id: string
          evaluation_period_end: string
          evaluation_period_start: string
          feedback_text?: string | null
          id?: string
          improvement_suggestions?: string | null
          nps_score?: number | null
          overall_satisfaction_score?: number | null
          problem_resolution_score?: number | null
          relationship_id: string
          response_time_score?: number | null
          service_quality_score?: number | null
          updated_at?: string
        }
        Update: {
          communication_score?: number | null
          company_id?: string
          created_at?: string
          evaluated_by_user_id?: string
          evaluation_period_end?: string
          evaluation_period_start?: string
          feedback_text?: string | null
          id?: string
          improvement_suggestions?: string | null
          nps_score?: number | null
          overall_satisfaction_score?: number | null
          problem_resolution_score?: number | null
          relationship_id?: string
          response_time_score?: number | null
          service_quality_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      internal_client_supplier_relationships: {
        Row: {
          client_department: string
          communication_protocol: string | null
          company_id: string
          created_at: string
          escalation_matrix: Json | null
          id: string
          is_active: boolean
          performance_indicators: Json | null
          relationship_manager_user_id: string | null
          service_description: string
          sla_requirements: Json | null
          supplier_department: string
          updated_at: string
        }
        Insert: {
          client_department: string
          communication_protocol?: string | null
          company_id: string
          created_at?: string
          escalation_matrix?: Json | null
          id?: string
          is_active?: boolean
          performance_indicators?: Json | null
          relationship_manager_user_id?: string | null
          service_description: string
          sla_requirements?: Json | null
          supplier_department: string
          updated_at?: string
        }
        Update: {
          client_department?: string
          communication_protocol?: string | null
          company_id?: string
          created_at?: string
          escalation_matrix?: Json | null
          id?: string
          is_active?: boolean
          performance_indicators?: Json | null
          relationship_manager_user_id?: string | null
          service_description?: string
          sla_requirements?: Json | null
          supplier_department?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_job_postings: {
        Row: {
          application_deadline: string
          benefits: Json | null
          company_id: string
          created_at: string
          created_by_user_id: string
          department: string
          description: string | null
          employment_type: string
          id: string
          level: string
          location: string | null
          priority: string | null
          requirements: Json | null
          salary_range_max: number | null
          salary_range_min: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline: string
          benefits?: Json | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          department: string
          description?: string | null
          employment_type?: string
          id?: string
          level: string
          location?: string | null
          priority?: string | null
          requirements?: Json | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string
          benefits?: Json | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          department?: string
          description?: string | null
          employment_type?: string
          id?: string
          level?: string
          location?: string | null
          priority?: string | null
          requirements?: Json | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_type: string
          interviewer_user_id: string | null
          job_application_id: string
          location_type: string
          meeting_link: string | null
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string
          interviewer_user_id?: string | null
          job_application_id: string
          location_type?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string
          interviewer_user_id?: string | null
          job_application_id?: string
          location_type?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          additional_info: Json | null
          application_date: string
          candidate_email: string | null
          candidate_location: string | null
          candidate_name: string | null
          candidate_phone: string | null
          cover_letter: string | null
          created_at: string
          current_stage: string | null
          employee_id: string
          experience_years: number | null
          id: string
          job_posting_id: string
          notes: string | null
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_info?: Json | null
          application_date?: string
          candidate_email?: string | null
          candidate_location?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          current_stage?: string | null
          employee_id: string
          experience_years?: number | null
          id?: string
          job_posting_id: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_info?: Json | null
          application_date?: string
          candidate_email?: string | null
          candidate_location?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          current_stage?: string | null
          employee_id?: string
          experience_years?: number | null
          id?: string
          job_posting_id?: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ja_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ja_job_posting"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "internal_job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
      learning_paths: {
        Row: {
          company_id: string
          courses: Json | null
          created_at: string | null
          created_by_user_id: string
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          courses?: Json | null
          created_at?: string | null
          created_by_user_id: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          courses?: Json | null
          created_at?: string | null
          created_by_user_id?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          company_id: string
          created_at: string | null
          days_count: number
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          reason: string | null
          requested_by_user_id: string
          start_date: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          company_id: string
          created_at?: string | null
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          reason?: string | null
          requested_by_user_id: string
          start_date: string
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          company_id?: string
          created_at?: string | null
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          reason?: string | null
          requested_by_user_id?: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          advance_notice_days: number | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_days_per_year: number | null
          name: string
          requires_approval: boolean | null
        }
        Insert: {
          advance_notice_days?: number | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_days_per_year?: number | null
          name: string
          requires_approval?: boolean | null
        }
        Update: {
          advance_notice_days?: number | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_days_per_year?: number | null
          name?: string
          requires_approval?: boolean | null
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
      license_action_history: {
        Row: {
          action_target_id: string
          action_target_type: string
          action_type: string
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          license_id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action_target_id: string
          action_target_type: string
          action_type: string
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          license_id: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action_target_id?: string
          action_target_type?: string
          action_type?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          license_id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_action_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_action_history_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_action_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      license_alert_comments: {
        Row: {
          alert_id: string | null
          comment_text: string
          company_id: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          observation_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          comment_text: string
          company_id: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          observation_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string | null
          comment_text?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          observation_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_alert_comments_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "license_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_alert_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_alert_comments_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "license_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_alert_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      license_alerts: {
        Row: {
          action_required: boolean
          alert_type: string
          assigned_to_user_id: string | null
          auto_generated: boolean | null
          category: string | null
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          is_resolved: boolean
          license_id: string
          message: string
          metadata: Json | null
          notification_sent: boolean | null
          priority: string | null
          related_observation_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          severity: string
          snooze_until: string | null
          source_condition_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          action_required?: boolean
          alert_type: string
          assigned_to_user_id?: string | null
          auto_generated?: boolean | null
          category?: string | null
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_resolved?: boolean
          license_id: string
          message: string
          metadata?: Json | null
          notification_sent?: boolean | null
          priority?: string | null
          related_observation_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string
          snooze_until?: string | null
          source_condition_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          action_required?: boolean
          alert_type?: string
          assigned_to_user_id?: string | null
          auto_generated?: boolean | null
          category?: string | null
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_resolved?: boolean
          license_id?: string
          message?: string
          metadata?: Json | null
          notification_sent?: boolean | null
          priority?: string | null
          related_observation_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string
          snooze_until?: string | null
          source_condition_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_alerts_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_alerts_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_alerts_related_observation_id_fkey"
            columns: ["related_observation_id"]
            isOneToOne: false
            referencedRelation: "license_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_alerts_source_condition_id_fkey"
            columns: ["source_condition_id"]
            isOneToOne: false
            referencedRelation: "license_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      license_conditions: {
        Row: {
          ai_confidence: number | null
          ai_extracted: boolean
          approval_date: string | null
          approved_by_user_id: string | null
          attachment_urls: Json | null
          company_id: string
          completion_date: string | null
          completion_notes: string | null
          compliance_impact: string | null
          condition_category: string | null
          condition_text: string
          created_at: string
          due_date: string | null
          frequency: Database["public"]["Enums"]["frequency_enum"] | null
          id: string
          last_notification_sent: string | null
          license_id: string
          notification_days_before: number | null
          priority: string
          related_alert_id: string | null
          related_observation_ids: Json | null
          requires_approval: boolean | null
          responsible_user_id: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_extracted?: boolean
          approval_date?: string | null
          approved_by_user_id?: string | null
          attachment_urls?: Json | null
          company_id: string
          completion_date?: string | null
          completion_notes?: string | null
          compliance_impact?: string | null
          condition_category?: string | null
          condition_text: string
          created_at?: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"] | null
          id?: string
          last_notification_sent?: string | null
          license_id: string
          notification_days_before?: number | null
          priority?: string
          related_alert_id?: string | null
          related_observation_ids?: Json | null
          requires_approval?: boolean | null
          responsible_user_id?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_extracted?: boolean
          approval_date?: string | null
          approved_by_user_id?: string | null
          attachment_urls?: Json | null
          company_id?: string
          completion_date?: string | null
          completion_notes?: string | null
          compliance_impact?: string | null
          condition_category?: string | null
          condition_text?: string
          created_at?: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"] | null
          id?: string
          last_notification_sent?: string | null
          license_id?: string
          notification_days_before?: number | null
          priority?: string
          related_alert_id?: string | null
          related_observation_ids?: Json | null
          requires_approval?: boolean | null
          responsible_user_id?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_conditions_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_conditions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_conditions_related_alert_id_fkey"
            columns: ["related_alert_id"]
            isOneToOne: false
            referencedRelation: "license_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      license_observations: {
        Row: {
          archived_at: string | null
          attachments: Json | null
          category: string | null
          company_id: string
          created_at: string | null
          created_by_user_id: string
          followup_assigned_to: string | null
          followup_date: string | null
          id: string
          is_archived: boolean | null
          license_id: string
          metadata: Json | null
          observation_text: string
          observation_type: string
          priority: string | null
          related_alert_id: string | null
          related_condition_id: string | null
          related_document_ids: Json | null
          requires_followup: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          archived_at?: string | null
          attachments?: Json | null
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by_user_id: string
          followup_assigned_to?: string | null
          followup_date?: string | null
          id?: string
          is_archived?: boolean | null
          license_id: string
          metadata?: Json | null
          observation_text: string
          observation_type: string
          priority?: string | null
          related_alert_id?: string | null
          related_condition_id?: string | null
          related_document_ids?: Json | null
          requires_followup?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          archived_at?: string | null
          attachments?: Json | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string
          followup_assigned_to?: string | null
          followup_date?: string | null
          id?: string
          is_archived?: boolean | null
          license_id?: string
          metadata?: Json | null
          observation_text?: string
          observation_type?: string
          priority?: string | null
          related_alert_id?: string | null
          related_condition_id?: string | null
          related_document_ids?: Json | null
          requires_followup?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_observations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_observations_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_observations_followup_assigned_to_fkey"
            columns: ["followup_assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_observations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_observations_related_alert_id_fkey"
            columns: ["related_alert_id"]
            isOneToOne: false
            referencedRelation: "license_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_observations_related_condition_id_fkey"
            columns: ["related_condition_id"]
            isOneToOne: false
            referencedRelation: "license_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      license_renewal_schedules: {
        Row: {
          assigned_to_user_id: string | null
          company_id: string
          created_at: string
          created_by_user_id: string
          expected_completion_date: string | null
          id: string
          license_id: string
          notification_config: Json | null
          protocol_deadline: string
          scheduled_start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          expected_completion_date?: string | null
          id?: string
          license_id: string
          notification_config?: Json | null
          protocol_deadline: string
          scheduled_start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          expected_completion_date?: string | null
          id?: string
          license_id?: string
          notification_config?: Json | null
          protocol_deadline?: string
          scheduled_start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_renewal_schedules_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_renewal_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_renewal_schedules_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_renewal_schedules_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_report_history: {
        Row: {
          company_id: string
          created_at: string
          file_path_pdf: string | null
          file_path_xlsx: string | null
          generated_at: string
          generated_by_user_id: string
          id: string
          license_id: string
          report_config: Json
          report_type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          file_path_pdf?: string | null
          file_path_xlsx?: string | null
          generated_at?: string
          generated_by_user_id: string
          id?: string
          license_id: string
          report_config?: Json
          report_type: string
        }
        Update: {
          company_id?: string
          created_at?: string
          file_path_pdf?: string | null
          file_path_xlsx?: string | null
          generated_at?: string
          generated_by_user_id?: string
          id?: string
          license_id?: string
          report_config?: Json
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_report_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_report_history_generated_by_user_id_fkey"
            columns: ["generated_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_report_history_license_id_fkey"
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
      loan_agreements: {
        Row: {
          agreement_type: string
          asset_id: string
          borrower_company_name: string
          company_id: string
          created_at: string
          id: string
          insurance_requirements: string | null
          lender_company_name: string
          loan_end_date: string | null
          loan_start_date: string
          penalty_conditions: string | null
          renewal_terms: string | null
          responsible_user_id: string | null
          return_condition_requirements: string | null
          status: string
          updated_at: string
          usage_limitations: string | null
        }
        Insert: {
          agreement_type?: string
          asset_id: string
          borrower_company_name: string
          company_id: string
          created_at?: string
          id?: string
          insurance_requirements?: string | null
          lender_company_name: string
          loan_end_date?: string | null
          loan_start_date: string
          penalty_conditions?: string | null
          renewal_terms?: string | null
          responsible_user_id?: string | null
          return_condition_requirements?: string | null
          status?: string
          updated_at?: string
          usage_limitations?: string | null
        }
        Update: {
          agreement_type?: string
          asset_id?: string
          borrower_company_name?: string
          company_id?: string
          created_at?: string
          id?: string
          insurance_requirements?: string | null
          lender_company_name?: string
          loan_end_date?: string | null
          loan_start_date?: string
          penalty_conditions?: string | null
          renewal_terms?: string | null
          responsible_user_id?: string | null
          return_condition_requirements?: string | null
          status?: string
          updated_at?: string
          usage_limitations?: string | null
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          actual_cost: number | null
          actual_duration_hours: number | null
          asset_id: string
          company_id: string
          created_at: string
          description: string | null
          evidence_files: Json | null
          id: string
          issues_found: string | null
          maintenance_date: string
          maintenance_type: string
          next_recommended_date: string | null
          parts_replaced: Json | null
          performed_by_user_id: string | null
          schedule_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          actual_duration_hours?: number | null
          asset_id: string
          company_id: string
          created_at?: string
          description?: string | null
          evidence_files?: Json | null
          id?: string
          issues_found?: string | null
          maintenance_date: string
          maintenance_type: string
          next_recommended_date?: string | null
          parts_replaced?: Json | null
          performed_by_user_id?: string | null
          schedule_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          actual_duration_hours?: number | null
          asset_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          evidence_files?: Json | null
          id?: string
          issues_found?: string | null
          maintenance_date?: string
          maintenance_type?: string
          next_recommended_date?: string | null
          parts_replaced?: Json | null
          performed_by_user_id?: string | null
          schedule_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      management_standards: {
        Row: {
          audit_findings_count: number | null
          certificate_expiry_date: string | null
          certificate_number: string | null
          certification_body: string | null
          certification_date: string | null
          certification_status: string | null
          company_id: string
          created_at: string
          id: string
          implementation_date: string | null
          implementation_status: string | null
          improvement_opportunities_count: number | null
          last_audit_date: string | null
          maturity_level: string | null
          next_audit_date: string | null
          non_conformities_count: number | null
          responsible_user_id: string | null
          scope_description: string | null
          standard_name: string
          standard_version: string | null
          updated_at: string
        }
        Insert: {
          audit_findings_count?: number | null
          certificate_expiry_date?: string | null
          certificate_number?: string | null
          certification_body?: string | null
          certification_date?: string | null
          certification_status?: string | null
          company_id: string
          created_at?: string
          id?: string
          implementation_date?: string | null
          implementation_status?: string | null
          improvement_opportunities_count?: number | null
          last_audit_date?: string | null
          maturity_level?: string | null
          next_audit_date?: string | null
          non_conformities_count?: number | null
          responsible_user_id?: string | null
          scope_description?: string | null
          standard_name: string
          standard_version?: string | null
          updated_at?: string
        }
        Update: {
          audit_findings_count?: number | null
          certificate_expiry_date?: string | null
          certificate_number?: string | null
          certification_body?: string | null
          certification_date?: string | null
          certification_status?: string | null
          company_id?: string
          created_at?: string
          id?: string
          implementation_date?: string | null
          implementation_status?: string | null
          improvement_opportunities_count?: number | null
          last_audit_date?: string | null
          maturity_level?: string | null
          next_audit_date?: string | null
          non_conformities_count?: number | null
          responsible_user_id?: string | null
          scope_description?: string | null
          standard_name?: string
          standard_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_standards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      material_flows: {
        Row: {
          assessment_id: string | null
          circular_strategy: string | null
          circularity_potential: number | null
          company_id: string
          created_at: string
          economic_value: number | null
          environmental_impact: Json | null
          flow_type: string
          id: string
          material_category: string
          quantity: number
          source_destination: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          assessment_id?: string | null
          circular_strategy?: string | null
          circularity_potential?: number | null
          company_id: string
          created_at?: string
          economic_value?: number | null
          environmental_impact?: Json | null
          flow_type: string
          id?: string
          material_category: string
          quantity: number
          source_destination?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string | null
          circular_strategy?: string | null
          circularity_potential?: number | null
          company_id?: string
          created_at?: string
          economic_value?: number | null
          environmental_impact?: Json | null
          flow_type?: string
          id?: string
          material_category?: string
          quantity?: number
          source_destination?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_flows_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "circular_economy_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_flows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      mentoring_relationships: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          end_date: string | null
          id: string
          meeting_frequency: string | null
          mentee_id: string
          mentor_id: string
          objectives: Json | null
          program_name: string
          progress_notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          end_date?: string | null
          id?: string
          meeting_frequency?: string | null
          mentee_id: string
          mentor_id: string
          objectives?: Json | null
          program_name: string
          progress_notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          end_date?: string | null
          id?: string
          meeting_frequency?: string | null
          mentee_id?: string
          mentor_id?: string
          objectives?: Json | null
          program_name?: string
          progress_notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mr_mentee"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mr_mentor"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentoring_relationships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentoring_relationships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completion_date: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          module_id: string
          score: number | null
          start_date: string | null
          status: string | null
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          module_id: string
          score?: number | null
          start_date?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          module_id?: string
          score?: number | null
          start_date?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
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
          approval_date: string | null
          approval_notes: string | null
          approved_by_user_id: string | null
          attachments: Json | null
          category: string | null
          company_id: string
          completion_date: string | null
          corrective_actions: string | null
          created_at: string
          damage_level: string | null
          description: string
          detected_by_user_id: string | null
          detected_date: string
          due_date: string | null
          effectiveness_date: string | null
          effectiveness_evaluation: string | null
          id: string
          impact_analysis: string | null
          nc_number: string
          preventive_actions: string | null
          recurrence_count: number | null
          responsible_user_id: string | null
          root_cause_analysis: string | null
          severity: string
          similar_nc_ids: Json | null
          source: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approval_notes?: string | null
          approved_by_user_id?: string | null
          attachments?: Json | null
          category?: string | null
          company_id: string
          completion_date?: string | null
          corrective_actions?: string | null
          created_at?: string
          damage_level?: string | null
          description: string
          detected_by_user_id?: string | null
          detected_date: string
          due_date?: string | null
          effectiveness_date?: string | null
          effectiveness_evaluation?: string | null
          id?: string
          impact_analysis?: string | null
          nc_number: string
          preventive_actions?: string | null
          recurrence_count?: number | null
          responsible_user_id?: string | null
          root_cause_analysis?: string | null
          severity: string
          similar_nc_ids?: Json | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approval_notes?: string | null
          approved_by_user_id?: string | null
          attachments?: Json | null
          category?: string | null
          company_id?: string
          completion_date?: string | null
          corrective_actions?: string | null
          created_at?: string
          damage_level?: string | null
          description?: string
          detected_by_user_id?: string | null
          detected_date?: string
          due_date?: string | null
          effectiveness_date?: string | null
          effectiveness_evaluation?: string | null
          id?: string
          impact_analysis?: string | null
          nc_number?: string
          preventive_actions?: string | null
          recurrence_count?: number | null
          responsible_user_id?: string | null
          root_cause_analysis?: string | null
          severity?: string
          similar_nc_ids?: Json | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      non_conformity_timeline: {
        Row: {
          action_description: string
          action_type: string
          attachments: Json | null
          company_id: string
          created_at: string
          id: string
          new_values: Json | null
          non_conformity_id: string
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          attachments?: Json | null
          company_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          non_conformity_id: string
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          attachments?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          non_conformity_id?: string
          old_values?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_data: Json | null
          action_type: string | null
          action_url: string | null
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          action_url?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          action_url?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string | null
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
      onboarding_selections: {
        Row: {
          company_id: string
          company_profile: Json | null
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          is_completed: boolean
          module_configurations: Json
          selected_modules: string[]
          total_steps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          company_profile?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          module_configurations?: Json
          selected_modules?: string[]
          total_steps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          company_profile?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          module_configurations?: Json
          selected_modules?: string[]
          total_steps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_selections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_metrics: {
        Row: {
          company_id: string
          created_at: string | null
          data_source: string | null
          distance_traveled_km: number | null
          id: string
          month: number | null
          notes: string | null
          operational_area_m2: number | null
          operational_hours: number | null
          period_end_date: string
          period_start_date: string
          production_type: string | null
          production_unit: string | null
          production_volume: number | null
          revenue_brl: number | null
          revenue_currency: string | null
          service_units: number | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string | null
          data_source?: string | null
          distance_traveled_km?: number | null
          id?: string
          month?: number | null
          notes?: string | null
          operational_area_m2?: number | null
          operational_hours?: number | null
          period_end_date: string
          period_start_date: string
          production_type?: string | null
          production_unit?: string | null
          production_volume?: number | null
          revenue_brl?: number | null
          revenue_currency?: string | null
          service_units?: number | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string | null
          data_source?: string | null
          distance_traveled_km?: number | null
          id?: string
          month?: number | null
          notes?: string | null
          operational_area_m2?: number | null
          operational_hours?: number | null
          period_end_date?: string
          period_start_date?: string
          production_type?: string | null
          production_unit?: string | null
          production_volume?: number | null
          revenue_brl?: number | null
          revenue_currency?: string | null
          service_units?: number | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "operational_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      pcaf_assessments: {
        Row: {
          assessment_name: string
          asset_class_breakdown: Json | null
          carbon_intensity: number | null
          company_id: string
          coverage_percentage: number | null
          created_at: string
          data_quality_score: number | null
          geography_breakdown: Json | null
          id: string
          methodology_version: string | null
          portfolio_type: string
          quality_flags: Json | null
          reporting_year: number
          sector_breakdown: Json | null
          total_financed_emissions: number | null
          total_outstanding_amount: number | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          assessment_name: string
          asset_class_breakdown?: Json | null
          carbon_intensity?: number | null
          company_id: string
          coverage_percentage?: number | null
          created_at?: string
          data_quality_score?: number | null
          geography_breakdown?: Json | null
          id?: string
          methodology_version?: string | null
          portfolio_type: string
          quality_flags?: Json | null
          reporting_year: number
          sector_breakdown?: Json | null
          total_financed_emissions?: number | null
          total_outstanding_amount?: number | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          assessment_name?: string
          asset_class_breakdown?: Json | null
          carbon_intensity?: number | null
          company_id?: string
          coverage_percentage?: number | null
          created_at?: string
          data_quality_score?: number | null
          geography_breakdown?: Json | null
          id?: string
          methodology_version?: string | null
          portfolio_type?: string
          quality_flags?: Json | null
          reporting_year?: number
          sector_breakdown?: Json | null
          total_financed_emissions?: number | null
          total_outstanding_amount?: number | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pcaf_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_evaluation_cycles: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          end_date: string
          evaluation_type: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          end_date: string
          evaluation_type?: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          evaluation_type?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_evaluations: {
        Row: {
          areas_for_improvement: string | null
          comments: string | null
          company_id: string
          created_at: string
          cycle_id: string | null
          development_plan: string | null
          employee_id: string
          evaluator_id: string
          final_review_completed: boolean | null
          id: string
          manager_evaluation_completed: boolean | null
          overall_score: number | null
          period_end: string
          period_start: string
          self_evaluation_completed: boolean | null
          status: string
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          comments?: string | null
          company_id: string
          created_at?: string
          cycle_id?: string | null
          development_plan?: string | null
          employee_id: string
          evaluator_id: string
          final_review_completed?: boolean | null
          id?: string
          manager_evaluation_completed?: boolean | null
          overall_score?: number | null
          period_end: string
          period_start: string
          self_evaluation_completed?: boolean | null
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          comments?: string | null
          company_id?: string
          created_at?: string
          cycle_id?: string | null
          development_plan?: string | null
          employee_id?: string
          evaluator_id?: string
          final_review_completed?: boolean | null
          id?: string
          manager_evaluation_completed?: boolean | null
          overall_score?: number | null
          period_end?: string
          period_start?: string
          self_evaluation_completed?: boolean | null
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audit_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
          dashboard_preferences: Json | null
          full_name: string
          has_completed_onboarding: boolean | null
          id: string
          job_title: string | null
          role: Database["public"]["Enums"]["user_role_type"]
        }
        Insert: {
          company_id: string
          created_at?: string
          dashboard_preferences?: Json | null
          full_name: string
          has_completed_onboarding?: boolean | null
          id: string
          job_title?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
        }
        Update: {
          company_id?: string
          created_at?: string
          dashboard_preferences?: Json | null
          full_name?: string
          has_completed_onboarding?: boolean | null
          id?: string
          job_title?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
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
      quality_indicators: {
        Row: {
          calculation_formula: string | null
          category: string
          collection_method: string | null
          company_id: string
          created_at: string
          created_by_user_id: string
          data_source: string | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          measurement_type: string
          measurement_unit: string
          name: string
          responsible_user_id: string | null
          updated_at: string
        }
        Insert: {
          calculation_formula?: string | null
          category: string
          collection_method?: string | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          data_source?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          measurement_type?: string
          measurement_unit: string
          name: string
          responsible_user_id?: string | null
          updated_at?: string
        }
        Update: {
          calculation_formula?: string | null
          category?: string
          collection_method?: string | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          data_source?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          measurement_type?: string
          measurement_unit?: string
          name?: string
          responsible_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
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
      report_approvals: {
        Row: {
          approval_level: string
          approved_at: string | null
          approver_user_id: string
          comments: string | null
          created_at: string | null
          id: string
          report_id: string | null
          status: string | null
        }
        Insert: {
          approval_level: string
          approved_at?: string | null
          approver_user_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          report_id?: string | null
          status?: string | null
        }
        Update: {
          approval_level?: string
          approved_at?: string | null
          approver_user_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          report_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_approvals_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_comments: {
        Row: {
          comment_text: string
          comment_type: string | null
          created_at: string | null
          created_by_user_id: string | null
          id: string
          report_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          section_key: string | null
        }
        Insert: {
          comment_text: string
          comment_type?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          report_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          section_key?: string | null
        }
        Update: {
          comment_text?: string
          comment_type?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          report_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          section_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_generated_sections: {
        Row: {
          ai_generated: boolean | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          data_sources_used: string[] | null
          editor_notes: string | null
          generated_text: string | null
          generated_visuals: Json | null
          generation_timestamp: string | null
          id: string
          last_data_refresh: string | null
          manually_edited: boolean | null
          report_id: string
          section_content: Json | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          data_sources_used?: string[] | null
          editor_notes?: string | null
          generated_text?: string | null
          generated_visuals?: Json | null
          generation_timestamp?: string | null
          id?: string
          last_data_refresh?: string | null
          manually_edited?: boolean | null
          report_id: string
          section_content?: Json | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          data_sources_used?: string[] | null
          editor_notes?: string | null
          generated_text?: string | null
          generated_visuals?: Json | null
          generation_timestamp?: string | null
          id?: string
          last_data_refresh?: string | null
          manually_edited?: boolean | null
          report_id?: string
          section_content?: Json | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_generated_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_generated_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_section_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_generation_jobs: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_completion: string | null
          id: string
          insights: Json | null
          output_urls: Json | null
          parameters: Json
          progress: number | null
          started_at: string | null
          status: string
          template_id: string
          template_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          id?: string
          insights?: Json | null
          output_urls?: Json | null
          parameters?: Json
          progress?: number | null
          started_at?: string | null
          status: string
          template_id: string
          template_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          id?: string
          insights?: Json | null
          output_urls?: Json | null
          parameters?: Json
          progress?: number | null
          started_at?: string | null
          status?: string
          template_id?: string
          template_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_generation_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      report_section_templates: {
        Row: {
          ai_prompt_template: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          required_data_sources: string[] | null
          section_order: number
          subsections: Json | null
          template_key: string
          template_name: string
          updated_at: string | null
          visual_types: string[] | null
        }
        Insert: {
          ai_prompt_template?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          required_data_sources?: string[] | null
          section_order: number
          subsections?: Json | null
          template_key: string
          template_name: string
          updated_at?: string | null
          visual_types?: string[] | null
        }
        Update: {
          ai_prompt_template?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          required_data_sources?: string[] | null
          section_order?: number
          subsections?: Json | null
          template_key?: string
          template_name?: string
          updated_at?: string | null
          visual_types?: string[] | null
        }
        Relationships: []
      }
      report_visualizations: {
        Row: {
          chart_config: Json
          created_at: string | null
          data_source_query: string | null
          id: string
          is_visible: boolean | null
          order_index: number | null
          report_id: string | null
          section_key: string
          title: string
          updated_at: string | null
          visualization_type: string
        }
        Insert: {
          chart_config: Json
          created_at?: string | null
          data_source_query?: string | null
          id?: string
          is_visible?: boolean | null
          order_index?: number | null
          report_id?: string | null
          section_key: string
          title: string
          updated_at?: string | null
          visualization_type: string
        }
        Update: {
          chart_config?: Json
          created_at?: string | null
          data_source_query?: string | null
          id?: string
          is_visible?: boolean | null
          order_index?: number | null
          report_id?: string | null
          section_key?: string
          title?: string
          updated_at?: string | null
          visualization_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_visualizations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "gri_reports"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_risk_occurrences_esg_risks"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "esg_risks"
            referencedColumns: ["id"]
          },
        ]
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
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role_type"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
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
      sasb_metrics: {
        Row: {
          accounting_metric: string
          company_id: string
          created_at: string
          data_source: string | null
          disclosure_topic: string
          id: string
          industry_code: string
          methodology: string | null
          metric_code: string
          metric_name: string
          qualitative_description: string | null
          quantitative_value: number | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          status: string | null
          sustainability_dimension: string
          unit_of_measure: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          accounting_metric: string
          company_id: string
          created_at?: string
          data_source?: string | null
          disclosure_topic: string
          id?: string
          industry_code: string
          methodology?: string | null
          metric_code: string
          metric_name: string
          qualitative_description?: string | null
          quantitative_value?: number | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          status?: string | null
          sustainability_dimension: string
          unit_of_measure?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          accounting_metric?: string
          company_id?: string
          created_at?: string
          data_source?: string | null
          disclosure_topic?: string
          id?: string
          industry_code?: string
          methodology?: string | null
          metric_code?: string
          metric_name?: string
          qualitative_description?: string | null
          quantitative_value?: number | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          status?: string | null
          sustainability_dimension?: string
          unit_of_measure?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sasb_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          anonymous: boolean | null
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          end_date: string | null
          id: string
          questions: Json
          settings: Json | null
          start_date: string | null
          status: string | null
          survey_type: string
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          anonymous?: boolean | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          questions?: Json
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          survey_type?: string
          target_audience: string
          title: string
          updated_at?: string
        }
        Update: {
          anonymous?: boolean | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          questions?: Json
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          survey_type?: string
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sbt_progress: {
        Row: {
          actual_emissions_scope1: number | null
          actual_emissions_scope2: number | null
          actual_emissions_scope3: number | null
          company_id: string
          created_at: string
          explanatory_notes: string | null
          id: string
          on_track: boolean | null
          progress_percentage: number | null
          reporting_year: number
          target_id: string
          verification_status: string | null
        }
        Insert: {
          actual_emissions_scope1?: number | null
          actual_emissions_scope2?: number | null
          actual_emissions_scope3?: number | null
          company_id: string
          created_at?: string
          explanatory_notes?: string | null
          id?: string
          on_track?: boolean | null
          progress_percentage?: number | null
          reporting_year: number
          target_id: string
          verification_status?: string | null
        }
        Update: {
          actual_emissions_scope1?: number | null
          actual_emissions_scope2?: number | null
          actual_emissions_scope3?: number | null
          company_id?: string
          created_at?: string
          explanatory_notes?: string | null
          id?: string
          on_track?: boolean | null
          progress_percentage?: number | null
          reporting_year?: number
          target_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sbt_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sbt_progress_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "science_based_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      science_based_targets: {
        Row: {
          annual_reduction_rate: number | null
          baseline_emissions: number
          baseline_year: number
          boundary_description: string | null
          company_id: string
          created_at: string
          current_emissions: number | null
          id: string
          methodology: string | null
          progress_percentage: number | null
          sbti_commitment_date: string | null
          sbti_validation_date: string | null
          scope: string
          target_description: string
          target_emissions: number | null
          target_reduction_percentage: number
          target_type: string
          target_year: number
          temperature_alignment: number | null
          updated_at: string
          validation_status: string | null
        }
        Insert: {
          annual_reduction_rate?: number | null
          baseline_emissions: number
          baseline_year: number
          boundary_description?: string | null
          company_id: string
          created_at?: string
          current_emissions?: number | null
          id?: string
          methodology?: string | null
          progress_percentage?: number | null
          sbti_commitment_date?: string | null
          sbti_validation_date?: string | null
          scope: string
          target_description: string
          target_emissions?: number | null
          target_reduction_percentage: number
          target_type: string
          target_year: number
          temperature_alignment?: number | null
          updated_at?: string
          validation_status?: string | null
        }
        Update: {
          annual_reduction_rate?: number | null
          baseline_emissions?: number
          baseline_year?: number
          boundary_description?: string | null
          company_id?: string
          created_at?: string
          current_emissions?: number | null
          id?: string
          methodology?: string | null
          progress_percentage?: number | null
          sbti_commitment_date?: string | null
          sbti_validation_date?: string | null
          scope?: string
          target_description?: string
          target_emissions?: number | null
          target_reduction_percentage?: number
          target_type?: string
          target_year?: number
          temperature_alignment?: number | null
          updated_at?: string
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "science_based_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sdg_alignment: {
        Row: {
          actions_taken: string | null
          contribution_level: string | null
          created_at: string
          description: string | null
          evidence_documents: Json | null
          future_commitments: string | null
          id: string
          impact_level: string | null
          kpis: Json | null
          report_id: string
          results_achieved: string | null
          sdg_number: number
          sdg_target: string | null
          selected_targets: string[] | null
          updated_at: string | null
        }
        Insert: {
          actions_taken?: string | null
          contribution_level?: string | null
          created_at?: string
          description?: string | null
          evidence_documents?: Json | null
          future_commitments?: string | null
          id?: string
          impact_level?: string | null
          kpis?: Json | null
          report_id: string
          results_achieved?: string | null
          sdg_number: number
          sdg_target?: string | null
          selected_targets?: string[] | null
          updated_at?: string | null
        }
        Update: {
          actions_taken?: string | null
          contribution_level?: string | null
          created_at?: string
          description?: string | null
          evidence_documents?: Json | null
          future_commitments?: string | null
          id?: string
          impact_level?: string | null
          kpis?: Json | null
          report_id?: string
          results_achieved?: string | null
          sdg_number?: number
          sdg_target?: string | null
          selected_targets?: string[] | null
          updated_at?: string | null
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
      sdg_library: {
        Row: {
          color: string
          created_at: string | null
          description: string
          global_pact_principles: number[] | null
          icon: string
          id: string
          long_description: string | null
          name: string
          sdg_number: number
          short_name: string
          targets: Json
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          description: string
          global_pact_principles?: number[] | null
          icon: string
          id?: string
          long_description?: string | null
          name: string
          sdg_number: number
          short_name: string
          targets?: Json
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string
          global_pact_principles?: number[] | null
          icon?: string
          id?: string
          long_description?: string | null
          name?: string
          sdg_number?: number
          short_name?: string
          targets?: Json
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_frameworks: {
        Row: {
          certificate_expiry_date: string | null
          certification_status: string | null
          company_id: string
          compliance_percentage: number | null
          control_effectiveness: number | null
          created_at: string
          framework_name: string
          framework_version: string | null
          id: string
          implementation_status: string | null
          incident_count: number | null
          last_assessment_date: string | null
          next_assessment_date: string | null
          responsible_user_id: string | null
          risk_rating: string | null
          updated_at: string
        }
        Insert: {
          certificate_expiry_date?: string | null
          certification_status?: string | null
          company_id: string
          compliance_percentage?: number | null
          control_effectiveness?: number | null
          created_at?: string
          framework_name: string
          framework_version?: string | null
          id?: string
          implementation_status?: string | null
          incident_count?: number | null
          last_assessment_date?: string | null
          next_assessment_date?: string | null
          responsible_user_id?: string | null
          risk_rating?: string | null
          updated_at?: string
        }
        Update: {
          certificate_expiry_date?: string | null
          certification_status?: string | null
          company_id?: string
          compliance_percentage?: number | null
          control_effectiveness?: number | null
          created_at?: string
          framework_name?: string
          framework_version?: string | null
          id?: string
          implementation_status?: string | null
          incident_count?: number | null
          last_assessment_date?: string | null
          next_assessment_date?: string | null
          responsible_user_id?: string | null
          risk_rating?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_frameworks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      stakeholder_communications: {
        Row: {
          attachments: Json | null
          company_id: string
          content: string
          created_at: string
          created_by_user_id: string
          direction: string
          id: string
          priority: string
          scheduled_date: string | null
          sent_date: string | null
          stakeholder_id: string
          status: string
          subject: string
          tags: string[] | null
          template_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          content: string
          created_at?: string
          created_by_user_id: string
          direction?: string
          id?: string
          priority?: string
          scheduled_date?: string | null
          sent_date?: string | null
          stakeholder_id: string
          status?: string
          subject: string
          tags?: string[] | null
          template_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          content?: string
          created_at?: string
          created_by_user_id?: string
          direction?: string
          id?: string
          priority?: string
          scheduled_date?: string | null
          sent_date?: string | null
          stakeholder_id?: string
          status?: string
          subject?: string
          tags?: string[] | null
          template_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_communications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholder_communications_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
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
      succession_candidates: {
        Row: {
          created_at: string
          development_needs: Json | null
          employee_id: string
          id: string
          notes: string | null
          readiness_level: string
          readiness_score: number
          succession_plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          development_needs?: Json | null
          employee_id: string
          id?: string
          notes?: string | null
          readiness_level?: string
          readiness_score?: number
          succession_plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          development_needs?: Json | null
          employee_id?: string
          id?: string
          notes?: string | null
          readiness_level?: string
          readiness_score?: number
          succession_plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sc_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sc_succession_plan"
            columns: ["succession_plan_id"]
            isOneToOne: false
            referencedRelation: "succession_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_candidates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      succession_plans: {
        Row: {
          company_id: string
          created_at: string
          created_by_user_id: string
          critical_level: string
          current_holder_id: string | null
          department: string
          expected_retirement_date: string | null
          id: string
          position_title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_user_id: string
          critical_level?: string
          current_holder_id?: string | null
          department: string
          expected_retirement_date?: string | null
          id?: string
          position_title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          critical_level?: string
          current_holder_id?: string | null
          department?: string
          expected_retirement_date?: string | null
          id?: string
          position_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sp_current_holder"
            columns: ["current_holder_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_plans_current_holder_id_fkey"
            columns: ["current_holder_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contracts: {
        Row: {
          auto_renewal: boolean | null
          company_id: string
          contract_number: string
          contract_type: string
          created_at: string
          currency: string | null
          description: string | null
          end_date: string
          file_path: string | null
          id: string
          payment_terms: string | null
          renewal_notice_days: number | null
          responsible_user_id: string | null
          sla_requirements: Json | null
          start_date: string
          status: string | null
          supplier_id: string
          terms_conditions: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          auto_renewal?: boolean | null
          company_id: string
          contract_number: string
          contract_type?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date: string
          file_path?: string | null
          id?: string
          payment_terms?: string | null
          renewal_notice_days?: number | null
          responsible_user_id?: string | null
          sla_requirements?: Json | null
          start_date: string
          status?: string | null
          supplier_id: string
          terms_conditions?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          auto_renewal?: boolean | null
          company_id?: string
          contract_number?: string
          contract_type?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string
          file_path?: string | null
          id?: string
          payment_terms?: string | null
          renewal_notice_days?: number | null
          responsible_user_id?: string | null
          sla_requirements?: Json | null
          start_date?: string
          status?: string | null
          supplier_id?: string
          terms_conditions?: string | null
          title?: string
          updated_at?: string
          value?: number | null
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
      supplier_performance_metrics: {
        Row: {
          company_id: string
          complaints_count: number | null
          contracts_active: number | null
          contracts_total: number | null
          cost_performance_score: number | null
          created_at: string
          delivery_score: number | null
          id: string
          incidents_count: number | null
          metrics_data: Json | null
          overall_score: number | null
          period_end: string
          period_start: string
          quality_score: number | null
          service_level_score: number | null
          sla_compliance_percentage: number | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          complaints_count?: number | null
          contracts_active?: number | null
          contracts_total?: number | null
          cost_performance_score?: number | null
          created_at?: string
          delivery_score?: number | null
          id?: string
          incidents_count?: number | null
          metrics_data?: Json | null
          overall_score?: number | null
          period_end: string
          period_start: string
          quality_score?: number | null
          service_level_score?: number | null
          sla_compliance_percentage?: number | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          complaints_count?: number | null
          contracts_active?: number | null
          contracts_total?: number | null
          cost_performance_score?: number | null
          created_at?: string
          delivery_score?: number | null
          id?: string
          incidents_count?: number | null
          metrics_data?: Json | null
          overall_score?: number | null
          period_end?: string
          period_start?: string
          quality_score?: number | null
          service_level_score?: number | null
          sla_compliance_percentage?: number | null
          supplier_id?: string
          updated_at?: string
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
          notes: string | null
          qualification_status: string | null
          rating: number | null
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
          notes?: string | null
          qualification_status?: string | null
          rating?: number | null
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
          notes?: string | null
          qualification_status?: string | null
          rating?: number | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      system_audit_logs: {
        Row: {
          action_type: string
          company_id: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          request_id: string | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          company_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tcfd_disclosures: {
        Row: {
          company_id: string
          created_at: string
          disclosure_content: string | null
          id: string
          implementation_status: string | null
          maturity_level: string | null
          pillar: string
          quantitative_metrics: Json | null
          recommendation_id: string
          recommendation_title: string
          reporting_period_end: string | null
          reporting_period_start: string | null
          scenario_analysis: Json | null
          status: string | null
          supporting_evidence: string[] | null
          time_horizon: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          disclosure_content?: string | null
          id?: string
          implementation_status?: string | null
          maturity_level?: string | null
          pillar: string
          quantitative_metrics?: Json | null
          recommendation_id: string
          recommendation_title: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          scenario_analysis?: Json | null
          status?: string | null
          supporting_evidence?: string[] | null
          time_horizon?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          disclosure_content?: string | null
          id?: string
          implementation_status?: string | null
          maturity_level?: string | null
          pillar?: string
          quantitative_metrics?: Json | null
          recommendation_id?: string
          recommendation_title?: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          scenario_analysis?: Json | null
          status?: string | null
          supporting_evidence?: string[] | null
          time_horizon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tcfd_disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tnfd_disclosures: {
        Row: {
          biomes_ecosystems: string[] | null
          company_id: string
          created_at: string
          disclosure_content: string | null
          disclosure_id: string
          disclosure_title: string
          id: string
          leap_approach: Json | null
          nature_dependencies: Json | null
          nature_impacts: Json | null
          nature_opportunities: Json | null
          nature_related_topic: string
          nature_risks: Json | null
          pillar: string
          quantitative_metrics: Json | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          scenario_analysis: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          biomes_ecosystems?: string[] | null
          company_id: string
          created_at?: string
          disclosure_content?: string | null
          disclosure_id: string
          disclosure_title: string
          id?: string
          leap_approach?: Json | null
          nature_dependencies?: Json | null
          nature_impacts?: Json | null
          nature_opportunities?: Json | null
          nature_related_topic: string
          nature_risks?: Json | null
          pillar: string
          quantitative_metrics?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          scenario_analysis?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          biomes_ecosystems?: string[] | null
          company_id?: string
          created_at?: string
          disclosure_content?: string | null
          disclosure_id?: string
          disclosure_title?: string
          id?: string
          leap_approach?: Json | null
          nature_dependencies?: Json | null
          nature_impacts?: Json | null
          nature_opportunities?: Json | null
          nature_related_topic?: string
          nature_risks?: Json | null
          pillar?: string
          quantitative_metrics?: Json | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          scenario_analysis?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tnfd_disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          created_by_user_id: string
          description: string | null
          difficulty_level: string | null
          estimated_duration_hours: number | null
          id: string
          is_mandatory: boolean | null
          learning_objectives: Json | null
          prerequisites: Json | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by_user_id: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          learning_objectives?: Json | null
          prerequisites?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          learning_objectives?: Json | null
          prerequisites?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      unclassified_data: {
        Row: {
          ai_confidence: number | null
          ai_suggestions: Json | null
          company_id: string
          created_at: string | null
          data_category: string | null
          decided_at: string | null
          decided_by_user_id: string | null
          document_id: string | null
          extracted_data: Json
          id: string
          potential_tables: string[] | null
          updated_at: string | null
          user_decision: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_suggestions?: Json | null
          company_id: string
          created_at?: string | null
          data_category?: string | null
          decided_at?: string | null
          decided_by_user_id?: string | null
          document_id?: string | null
          extracted_data?: Json
          id?: string
          potential_tables?: string[] | null
          updated_at?: string | null
          user_decision?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_suggestions?: Json | null
          company_id?: string
          created_at?: string | null
          data_category?: string | null
          decided_at?: string | null
          decided_by_user_id?: string | null
          document_id?: string | null
          extracted_data?: Json
          id?: string
          potential_tables?: string[] | null
          updated_at?: string | null
          user_decision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unclassified_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unclassified_data_decided_by_user_id_fkey"
            columns: ["decided_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unclassified_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_permissions: {
        Row: {
          company_id: string
          created_at: string
          granted: boolean
          granted_by_user_id: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          granted?: boolean
          granted_by_user_id?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          granted?: boolean
          granted_by_user_id?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_custom_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by_user_id: string | null
          company_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      value_chain_mapping: {
        Row: {
          company_id: string
          created_at: string
          external_clients: Json | null
          external_suppliers: Json | null
          id: string
          input_description: string | null
          internal_client: string | null
          internal_supplier: string | null
          kpis: Json | null
          output_description: string | null
          process_name: string
          process_owner_user_id: string | null
          process_type: string
          requirements: Json | null
          responsible_user_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          external_clients?: Json | null
          external_suppliers?: Json | null
          id?: string
          input_description?: string | null
          internal_client?: string | null
          internal_supplier?: string | null
          kpis?: Json | null
          output_description?: string | null
          process_name: string
          process_owner_user_id?: string | null
          process_type?: string
          requirements?: Json | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          external_clients?: Json | null
          external_suppliers?: Json | null
          id?: string
          input_description?: string | null
          internal_client?: string | null
          internal_supplier?: string | null
          kpis?: Json | null
          output_description?: string | null
          process_name?: string
          process_owner_user_id?: string | null
          process_type?: string
          requirements?: Json | null
          responsible_user_id?: string | null
          updated_at?: string
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
      work_schedules: {
        Row: {
          break_duration: number | null
          company_id: string
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          start_time: string
          updated_at: string | null
          work_days: number[] | null
        }
        Insert: {
          break_duration?: number | null
          company_id: string
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          start_time: string
          updated_at?: string | null
          work_days?: number[] | null
        }
        Update: {
          break_duration?: number | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_time?: string
          updated_at?: string | null
          work_days?: number[] | null
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
      calculate_indicator_deviation: {
        Args: {
          p_critical_lower_limit: number
          p_critical_upper_limit: number
          p_lower_limit: number
          p_measured_value: number
          p_target_value: number
          p_upper_limit: number
        }
        Returns: string
      }
      calculate_indicator_statistics: {
        Args: {
          p_end_date?: string
          p_indicator_id: string
          p_start_date?: string
        }
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
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      debug_auth_status: { Args: never; Returns: Json }
      exec_sql: { Args: { query: string }; Returns: Json }
      get_conversion_factor:
        | {
            Args: {
              p_category?: string
              p_from_unit: string
              p_to_unit: string
            }
            Returns: number
          }
        | {
            Args: { p_emission_source_id: string; p_unit: string }
            Returns: number
          }
      get_dashboard_analytics: { Args: { p_company_id: string }; Returns: Json }
      get_indicator_suggested_value:
        | {
            Args: { p_company_id: string; p_indicator_code: string }
            Returns: Json
          }
        | {
            Args: { p_company_id: string; p_indicator_id: string }
            Returns: Json
          }
      get_user_company_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role_type"]
      }
      has_company_access: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role_type"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_glossary_usage: {
        Args: { term_id: string }
        Returns: undefined
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
      log_audit_event: {
        Args: {
          p_action_type: string
          p_company_id: string
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_severity?: string
          p_user_id: string
        }
        Returns: string
      }
      policy_exists: {
        Args: { policy_name: string; table_name: string }
        Returns: boolean
      }
      search_across_tables: {
        Args: {
          result_limit?: number
          search_query: string
          user_company_id: string
        }
        Returns: {
          category: string
          description: string
          id: string
          last_modified: string
          relevance: number
          tags: string[]
          title: string
          type: string
          url: string
        }[]
      }
      update_overdue_tasks: { Args: never; Returns: undefined }
      user_has_company_access: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { p_permission_code: string; p_user_id: string }
        Returns: boolean
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
      user_role_type:
        | "super_admin"
        | "admin"
        | "manager"
        | "analyst"
        | "operator"
        | "viewer"
        | "auditor"
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
      user_role_type: [
        "super_admin",
        "admin",
        "manager",
        "analyst",
        "operator",
        "viewer",
        "auditor",
      ],
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
