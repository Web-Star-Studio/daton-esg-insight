import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManagePlatformRequest {
  action: 'listCompanies' | 'getCompanyDetails' | 'suspendCompany' | 
          'activateCompany' | 'updateCompanyPlan' | 'impersonateCompany' |
          'getPlatformStats' | 'listAllUsers' | 'auditLogs' | 'deleteUser';
  data?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      'https://dqlvioijqzlvnvvajmft.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é platform admin
    const { data: platformAdmin, error: adminError } = await supabaseClient
      .from('platform_admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !platformAdmin) {
      console.error('Access denied:', adminError);
      return new Response(JSON.stringify({ error: 'Acesso negado - apenas Platform Admins' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody: ManagePlatformRequest = await req.json();
    const { action, data } = requestBody;

    console.log(`Platform Admin Action: ${action}`, { adminId: user.id, data });

    // Log da ação
    await supabaseClient.from('platform_admin_actions').insert({
      admin_user_id: user.id,
      action_type: action,
      target_company_id: data?.companyId || null,
      target_user_id: data?.userId || null,
      details: data || {},
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
    });

    let result;

    switch (action) {
      case 'listCompanies': {
        const { data: companies, error } = await supabaseClient
          .from('companies')
          .select(`
            id,
            name,
            cnpj,
            logo_url,
            status,
            created_at,
            subscription_plan,
            subscription_status,
            trial_ends_at,
            profiles (count)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = { companies };
        break;
      }

      case 'getCompanyDetails': {
        const { companyId } = data;
        if (!companyId) throw new Error('companyId é obrigatório');

        const { data: company, error: companyError } = await supabaseClient
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError) throw companyError;

        const { count: usersCount } = await supabaseClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { data: recentActivity } = await supabaseClient
          .from('activity_logs')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(10);

        result = {
          company,
          stats: {
            totalUsers: usersCount || 0,
          },
          recentActivity,
        };
        break;
      }

      case 'suspendCompany': {
        const { companyId, reason } = data;
        if (!companyId) throw new Error('companyId é obrigatório');

        const { error } = await supabaseClient
          .from('companies')
          .update({ 
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspension_reason: reason 
          })
          .eq('id', companyId);

        if (error) throw error;
        result = { success: true, message: 'Empresa suspensa com sucesso' };
        break;
      }

      case 'activateCompany': {
        const { companyId } = data;
        if (!companyId) throw new Error('companyId é obrigatório');

        const { error } = await supabaseClient
          .from('companies')
          .update({ 
            status: 'active',
            suspended_at: null,
            suspension_reason: null 
          })
          .eq('id', companyId);

        if (error) throw error;
        result = { success: true, message: 'Empresa ativada com sucesso' };
        break;
      }

      case 'updateCompanyPlan': {
        const { companyId, plan } = data;
        if (!companyId || !plan) throw new Error('companyId e plan são obrigatórios');

        const { error } = await supabaseClient
          .from('companies')
          .update({ 
            subscription_plan: plan,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyId);

        if (error) throw error;
        result = { success: true, message: 'Plano atualizado com sucesso' };
        break;
      }

      case 'getPlatformStats': {
        const { count: totalCompanies } = await supabaseClient
          .from('companies')
          .select('*', { count: 'exact', head: true });

        const { count: activeCompanies } = await supabaseClient
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: totalUsers } = await supabaseClient
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        result = {
          totalCompanies: totalCompanies || 0,
          activeCompanies: activeCompanies || 0,
          suspendedCompanies: (totalCompanies || 0) - (activeCompanies || 0),
          totalUsers: totalUsers || 0,
        };
        break;
      }

      case 'listAllUsers': {
        const { data: users, error } = await supabaseClient
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            avatar_url,
            created_at,
            last_login_at,
            companies (name, cnpj)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        result = { users };
        break;
      }

      case 'auditLogs': {
        const { limit = 50, offset = 0 } = data || {};
        
        const { data: logs, error } = await supabaseClient
          .from('platform_admin_actions')
          .select(`
            id,
            action_type,
            created_at,
            details,
            ip_address,
            platform_admins!platform_admin_actions_admin_user_id_fkey (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        result = { logs };
        break;
      }

      case 'deleteUser': {
        const { userId } = data;
        if (!userId) throw new Error('userId é obrigatório');

        // Impedir exclusão de platform admins
        const { data: targetAdmin } = await supabaseClient
          .from('platform_admins')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (targetAdmin) {
          throw new Error('Não é permitido excluir um Platform Admin');
        }

        // Criar client com service role para deletar auth user
        const supabaseAdmin = createClient(
          'https://dqlvioijqzlvnvvajmft.supabase.co',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Limpar referências em user_roles.assigned_by_user_id
        await supabaseAdmin
          .from('user_roles')
          .update({ assigned_by_user_id: null })
          .eq('assigned_by_user_id', userId);

        // 2. Deletar registros em user_roles
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // 3. Deletar perfil
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        // 4. Deletar usuário em auth.users
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteAuthError) throw deleteAuthError;

        result = { success: true, message: 'Usuário excluído com sucesso' };
        break;
      }

      default:
        throw new Error(`Ação não suportada: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manage-platform:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
