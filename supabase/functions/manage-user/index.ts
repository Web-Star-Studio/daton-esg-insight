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

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

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
            role: userData.role,
          });

        if (profileError) throw profileError;

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
            role: userData.role,
            job_title: userData.department,
          })
          .eq('id', userData.id);

        if (updateError) throw updateError;

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
        // Get company users
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('*, user_roles(role)')
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get auth users for emails
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();

        // Merge data
        const users = profiles.map(profile => {
          const authUser = authUsers?.users.find(u => u.id === profile.id);
          return {
            ...profile,
            email: authUser?.email || 'N/A',
            role: profile.user_roles?.[0]?.role || profile.role,
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
