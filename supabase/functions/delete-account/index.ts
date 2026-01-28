import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tables with company_id that need to be deleted when deleting a company
// Order matters - delete dependent tables first
const TABLES_WITH_COMPANY_ID = [
  // AI and chat
  'ai_chat_messages',
  'ai_chat_conversations',
  'ai_extraction_patterns',
  'ai_operation_feedback',
  'ai_operation_history',
  'ai_performance_metrics',
  
  // Accounting
  'accounting_entry_lines',
  'accounting_entries',
  'accounts_payable',
  'accounts_receivable',
  
  // Action plans
  'action_plan_items',
  'action_plans',
  
  // Activity and monitoring
  'activity_data',
  'activity_logs',
  'activity_monitoring',
  
  // Approval workflows
  'approval_steps',
  'approval_requests',
  'approval_workflows',
  
  // Articles
  'article_approvals',
  'article_bookmarks',
  'article_comments',
  'article_versions',
  
  // Assessments
  'assessment_attempts',
  'assessment_questions',
  'assessments',
  
  // Assets
  'asset_ownership_records',
  'assets',
  
  // Attendance
  'attendance_records',
  
  // Audits
  'audit_checklist_responses',
  'audit_area_assignments',
  'audit_areas',
  'audit_categories',
  'audit_checklists',
  'audit_documents',
  'audit_findings',
  'audit_notes',
  'audit_reports',
  'audit_team_members',
  'audits',
  
  // Bank
  'bank_accounts',
  'bank_transactions',
  
  // Biodiversity
  'biodiversity_monitoring',
  'biodiversity_records',
  
  // Branches
  'branches',
  
  // Budget
  'budget_items',
  'budgets',
  
  // Carbon
  'carbon_credit_transactions',
  'carbon_credits',
  'carbon_offset_projects',
  
  // Certifications
  'certification_renewals',
  'certifications',
  
  // Chart of accounts
  'chart_of_accounts',
  
  // Checklists
  'checklist_responses',
  'checklist_items',
  'checklists',
  
  // Compliance
  'compliance_assessments',
  'compliance_requirements',
  
  // Conservation
  'conservation_activities',
  'conservation_projects',
  
  // Contracts
  'contract_documents',
  'contracts',
  
  // Cost centers
  'cost_centers',
  
  // Courses
  'course_enrollments',
  'course_modules',
  'course_lessons',
  
  // Custom forms
  'custom_form_responses',
  'custom_form_fields',
  'custom_forms',
  
  // Dashboard
  'dashboard_widget_configs',
  
  // Data collection
  'data_collection_entries',
  'data_collection_templates',
  
  // Documents
  'document_versions',
  'document_tags',
  'document_shares',
  'document_processing_results',
  'document_folders',
  'document_category_mappings',
  'document_categories',
  'documents',
  
  // Emissions
  'emission_reductions',
  'emission_sources',
  
  // Employees
  'employee_trainings',
  'employee_documents',
  'employee_benefits',
  'employees',
  
  // Energy
  'energy_consumption',
  
  // Environmental
  'environmental_licenses',
  'environmental_monitoring',
  'environmental_parameters',
  
  // ESG
  'esg_action_items',
  'esg_assessments',
  'esg_data_entries',
  'esg_indicators',
  'esg_materiality_assessments',
  'esg_materiality_topics',
  'esg_reports',
  'esg_risk_controls',
  'esg_risks',
  'esg_scores',
  
  // Events
  'event_participants',
  'events',
  
  // Financial
  'financial_categories',
  'financial_transactions',
  
  // Fleet
  'fleet_vehicles',
  
  // Goals
  'goal_milestones',
  'goals',
  
  // GRI
  'gri_content_index',
  'gri_disclosure_responses',
  'gri_indicator_autofill_history',
  'gri_indicator_responses',
  'gri_report_configs',
  
  // HR
  'hr_benefits',
  'hr_departments',
  'hr_job_positions',
  
  // Indicators
  'indicator_data',
  'indicators',
  
  // Inspections
  'inspection_items',
  'inspections',
  
  // Intelligent alerts
  'intelligent_alerts',
  
  // Inventories
  'inventory_emissions',
  'inventories',
  
  // Invoices
  'invoice_items',
  'invoices',
  
  // Knowledge base
  'knowledge_articles',
  
  // LAIA
  'laia_action_plans',
  'laia_assessments',
  
  // Legal
  'legal_requirements',
  
  // Legislation
  'legislation_updates',
  'legislations',
  
  // Licenses
  'license_conditions',
  'license_documents',
  'license_renewals',
  'licenses',
  
  // Mailing
  'mailing_lists',
  'mailing_recipients',
  'mailing_sends',
  
  // Marketplace
  'marketplace_evaluations',
  'marketplace_interests',
  'marketplace_listings',
  
  // Meeting
  'meeting_action_items',
  'meeting_participants',
  'meetings',
  
  // MTR
  'mtr_records',
  
  // Non-conformities
  'non_conformity_actions',
  'non_conformity_attachments',
  'non_conformity_comments',
  'non_conformities',
  
  // Notifications
  'notification_settings',
  'notifications',
  
  // Onboarding
  'onboarding_selections',
  
  // Payroll
  'payroll_items',
  'payroll',
  
  // Performance
  'performance_reviews',
  
  // Projects
  'project_milestones',
  'project_tasks',
  'project_team_members',
  'projects',
  
  // Reports
  'report_templates',
  'report_schedules',
  'reports',
  
  // Risk
  'risk_assessments',
  'risk_controls',
  'risk_mitigations',
  'risks',
  
  // Scope 3
  'scope3_categories',
  'scope3_emissions',
  
  // SDG
  'sdg_alignments',
  
  // Stakeholders
  'stakeholder_engagements',
  'stakeholders',
  
  // Supplier
  'supplier_assessments',
  'supplier_certifications',
  'supplier_contacts',
  'supplier_documents',
  'supplier_questionnaires',
  'suppliers',
  
  // Tasks
  'task_comments',
  'tasks',
  
  // Training
  'training_attendance',
  'training_courses',
  'training_materials',
  'training_needs',
  'training_programs',
  'training_records',
  'training_sessions',
  
  // Waste
  'waste_disposals',
  'waste_records',
  
  // Water
  'water_consumption',
  
  // Workflows
  'workflow_instances',
  'workflow_steps',
  'workflows',
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client for user verification
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('Authenticated user:', userId);

    // Parse request body
    const { confirmText } = await req.json();

    // Get user profile and company
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, company_id, created_at')
      .eq('id', userId)
      .maybeSingle();

    // Handle orphaned user (exists in auth but not in profiles)
    if (!profile) {
      console.log('Orphaned user detected (no profile), deleting auth user only...');
      
      // Clear any assigned_by references this user might have
      const { error: assignedByError } = await supabaseAdmin
        .from('user_roles')
        .update({ assigned_by_user_id: null })
        .eq('assigned_by_user_id', userId);
      
      if (assignedByError) {
        console.warn('Error clearing assigned_by_user_id for orphaned user:', assignedByError);
      }
      
      // Delete any user_roles for this orphaned user
      const { error: roleDeleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleDeleteError) {
        console.warn('Error deleting roles for orphaned user:', roleDeleteError);
      }
      
      // Delete the auth user directly
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteAuthError) {
        console.error('Error deleting orphaned auth user:', deleteAuthError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao excluir conta',
            message: deleteAuthError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Orphaned user deleted successfully');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Conta excluída com sucesso',
          deletedUsers: 1,
          deletedTables: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyId = profile.company_id;

    // Get user role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    const role = userRole?.role || 'viewer';
    console.log('User role:', role);

    // Check if user is company owner (super_admin)
    const isOwner = role === 'super_admin';

    // Get company info and user count
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    const { data: companyUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('company_id', companyId);

    const userCount = companyUsers?.length || 0;

    // Validate confirmation text
    if (isOwner) {
      if (confirmText !== 'EXCLUIR TUDO') {
        return new Response(
          JSON.stringify({ 
            error: 'Confirmação inválida',
            message: 'Digite "EXCLUIR TUDO" para confirmar a exclusão da organização'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Starting deletion process...', { isOwner, companyId, userId });

    if (isOwner) {
      // Delete all company data
      console.log(`Deleting all data for company ${companyId}...`);
      
      let deletedTables = 0;
      let errorTables: string[] = [];

      for (const table of TABLES_WITH_COMPANY_ID) {
        try {
          const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('company_id', companyId);
          
          if (error) {
            // Log but continue - some tables might not exist or have different structure
            console.warn(`Warning deleting from ${table}:`, error.message);
            errorTables.push(table);
          } else {
            deletedTables++;
          }
        } catch (e) {
          console.warn(`Error processing table ${table}:`, e);
          errorTables.push(table);
        }
      }

      console.log(`Deleted data from ${deletedTables} tables. Errors in ${errorTables.length} tables.`);

      // Get all users from this company before deleting profiles
      const userIds = companyUsers?.map(u => u.id) || [];
      console.log(`Found ${userIds.length} users to delete`);

      // Clear assigned_by_user_id references for all users being deleted
      // This prevents FK constraint violations when deleting auth users
      for (const uid of userIds) {
        const { error: assignedByError } = await supabaseAdmin
          .from('user_roles')
          .update({ assigned_by_user_id: null })
          .eq('assigned_by_user_id', uid);
        
        if (assignedByError) {
          console.warn(`Error clearing assigned_by_user_id for ${uid}:`, assignedByError);
        }
      }

      // Delete all user_roles for company
      const { error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('company_id', companyId);
      
      if (rolesError) {
        console.warn('Error deleting user_roles:', rolesError);
      }

      // Delete all profiles for company
      const { error: profilesError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('company_id', companyId);
      
      if (profilesError) {
        console.warn('Error deleting profiles:', profilesError);
      }

      // Delete all auth users
      for (const uid of userIds) {
        try {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
          if (error) {
            console.warn(`Error deleting auth user ${uid}:`, error);
          }
        } catch (e) {
          console.warn(`Exception deleting auth user ${uid}:`, e);
        }
      }

      // Finally delete the company
      const { error: companyError } = await supabaseAdmin
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (companyError) {
        console.error('Error deleting company:', companyError);
        return new Response(
          JSON.stringify({ error: 'Erro ao excluir empresa', details: companyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Company and all data deleted successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Organização e todos os dados foram excluídos permanentemente',
          deletedUsers: userIds.length,
          deletedTables: deletedTables
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Delete only user data
      console.log(`Deleting user ${userId} data...`);

      // Clear assigned_by_user_id references before deleting user
      // This prevents FK constraint violations when deleting auth user
      const { error: assignedByError } = await supabaseAdmin
        .from('user_roles')
        .update({ assigned_by_user_id: null })
        .eq('assigned_by_user_id', userId);

      if (assignedByError) {
        console.warn('Error clearing assigned_by_user_id:', assignedByError);
      }

      // Delete user_role
      const { error: roleDeleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleDeleteError) {
        console.warn('Error deleting user role:', roleDeleteError);
      }

      // Delete profile
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.warn('Error deleting profile:', profileDeleteError);
      }

      // Delete auth user
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
        return new Response(
          JSON.stringify({ error: 'Erro ao excluir usuário', details: authDeleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User deleted successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sua conta foi excluída permanentemente'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
