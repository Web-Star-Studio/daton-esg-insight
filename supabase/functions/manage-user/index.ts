import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // SECURE: Check admin role from user_roles table (CRITICAL SECURITY FIX)
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      throw new Error('Failed to verify user permissions');
    }

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      throw new Error('Only admins can manage users');
    }

    const adminCompanyId = userRole.company_id;
    const isSuper = userRole.role === 'super_admin';

    const { action, userData } = await req.json();

    switch (action) {
      case 'create': {
        // SECURITY: Validate company_id matches admin's company
        if (userData.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot create user in different company');
        }

        // Create user in auth
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: userData.email,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
          },
        });

        if (createError) throw createError;

        // Create profile (without role)
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: newUser.user.id,
            full_name: userData.full_name,
            job_title: userData.job_title,
            company_id: userData.company_id,
          });

        if (profileError) throw profileError;

        // SECURE: Create role in user_roles table (CRITICAL SECURITY FIX)
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: userData.role,
            company_id: userData.company_id,
            assigned_by_user_id: user.id,
          });

        if (roleError) throw roleError;

        return new Response(JSON.stringify({ success: true, user: newUser }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        // SECURITY: Verify target user belongs to admin's company
        const { data: targetUserRole } = await supabaseClient
          .from('user_roles')
          .select('company_id')
          .eq('user_id', userData.id)
          .single();

        if (!targetUserRole) {
          throw new Error('Target user not found');
        }

        if (targetUserRole.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot update user from different company');
        }

        // Update profile (without role)
        const updateData: any = {
          full_name: userData.full_name,
          job_title: userData.department || userData.job_title,
        };

        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('id', userData.id);

        if (updateError) throw updateError;

        // SECURE: Update role in user_roles table (CRITICAL SECURITY FIX)
        if (userData.role) {
          const { error: roleUpdateError } = await supabaseClient
            .from('user_roles')
            .update({ 
              role: userData.role,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.id);

          if (roleUpdateError) throw roleUpdateError;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        // SECURITY: Verify target user belongs to admin's company
        const { data: deleteTargetRole } = await supabaseClient
          .from('user_roles')
          .select('company_id')
          .eq('user_id', userData.id)
          .single();

        if (!deleteTargetRole) {
          throw new Error('Target user not found');
        }

        if (deleteTargetRole.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot delete user from different company');
        }

        // Delete user from auth (will cascade to profiles and user_roles)
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userData.id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        // SECURITY: Validate company_id
        if (userData.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot list users from different company');
        }

        // Get company users profiles
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // SECURE: Get roles from user_roles table (CRITICAL SECURITY FIX)
        const userIds = profiles.map(p => p.id);
        const { data: userRolesList, error: rolesListError } = await supabaseClient
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesListError) throw rolesListError;

        const rolesMap = new Map(userRolesList.map(ur => [ur.user_id, ur.role]));

        // Get auth users for emails
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();

        // Merge data with role from user_roles table
        const users = profiles.map(profile => {
          const authUser = authUsers?.users.find(u => u.id === profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: authUser?.email || 'N/A',
            role: rolesMap.get(profile.id) || 'viewer',
            company_id: profile.company_id,
            created_at: profile.created_at,
            avatar_url: profile.avatar_url,
            phone: profile.phone,
            department: profile.job_title,
          };
        });

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
