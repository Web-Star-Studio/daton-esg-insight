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

    // Check if user is admin using the new user_roles table
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      throw new Error('Failed to verify user permissions');
    }

    if (!userRole || userRole.role !== 'Admin') {
      throw new Error('Only admins can manage users');
    }

    const { action, userData } = await req.json();

    switch (action) {
      case 'create': {
        // Create user in auth
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: userData.email,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
          },
        });

        if (createError) throw createError;

        // Create profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: newUser.user.id,
            full_name: userData.full_name,
            company_id: userData.company_id,
          });

        if (profileError) throw profileError;

        // Create user role in separate table for security
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            company_id: userData.company_id,
            role: userData.role,
          });

        if (roleError) throw roleError;

        return new Response(JSON.stringify({ success: true, user: newUser }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        // Update profile
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            full_name: userData.full_name,
            job_title: userData.department,
          })
          .eq('id', userData.id);

        if (updateError) throw updateError;

        // Update role in user_roles table
        if (userData.role) {
          const { error: roleUpdateError } = await supabaseClient
            .from('user_roles')
            .update({
              role: userData.role,
            })
            .eq('user_id', userData.id);

          if (roleUpdateError) throw roleUpdateError;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        // Delete user from auth (will cascade to profiles)
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userData.id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        // Get company users with roles from user_roles table
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select(`
            *,
            user_roles!inner(role)
          `)
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get auth users for emails
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();

        // Merge data with role from user_roles table
        const users = profiles.map(profile => {
          const authUser = authUsers?.users.find(u => u.id === profile.id);
          const userRoles = profile.user_roles as any[];
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: authUser?.email || 'N/A',
            role: userRoles?.[0]?.role || 'Colaborador',
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
