import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Username validation regex
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// Protected roles that cannot be deleted
const PROTECTED_ROLES = ['platform_admin', 'super_admin'];

// Helper to log activity
async function logActivity(
  supabase: any,
  companyId: string,
  userId: string,
  actionType: string,
  description: string,
  detailsJson?: Record<string, any>
) {
  try {
    await supabase.rpc('log_activity', {
      p_company_id: companyId,
      p_user_id: userId,
      p_action_type: actionType,
      p_description: description,
      p_details_json: detailsJson || null
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Validate email uniqueness
async function validateEmailUnique(
  supabase: any,
  email: string,
  excludeUserId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Check in auth.users via admin API
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingUser = authUsers?.users.find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase() && u.id !== excludeUserId
  );
  
  if (existingUser) {
    return { valid: false, error: 'Este email já está em uso por outro usuário' };
  }
  
  return { valid: true };
}

// Validate username uniqueness and format
async function validateUsername(
  supabase: any,
  username: string,
  excludeUserId?: string
): Promise<{ valid: boolean; error?: string }> {
  if (!username) return { valid: true };
  
  // Check format
  if (!USERNAME_REGEX.test(username)) {
    return { 
      valid: false, 
      error: 'Username deve ter 3-30 caracteres e conter apenas letras, números, _ e -' 
    };
  }
  
  // Check uniqueness
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .is('deleted_at', null);
  
  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }
  
  const { data } = await query.maybeSingle();
  
  if (data) {
    return { valid: false, error: 'Este username já está em uso' };
  }
  
  return { valid: true };
}

// Security validation rules
function validateSecurityRules(
  callerUserId: string,
  callerRole: string,
  targetUserId: string,
  targetRole: string,
  action: string
): { valid: boolean; error?: string } {
  // 1. Prevent self-deletion
  if (action === 'delete' && callerUserId === targetUserId) {
    return { valid: false, error: 'Você não pode excluir sua própria conta' };
  }
  
  // 2. Prevent self-deactivation
  if (action === 'soft_delete' && callerUserId === targetUserId) {
    return { valid: false, error: 'Você não pode desativar sua própria conta' };
  }
  
  // 3. Prevent self-role edit
  if (action === 'update_role' && callerUserId === targetUserId) {
    return { valid: false, error: 'Você não pode alterar seu próprio papel' };
  }
  
  // 4. Protect platform_admin/super_admin from deletion
  if (PROTECTED_ROLES.includes(targetRole) && (action === 'delete' || action === 'soft_delete')) {
    return { valid: false, error: 'Administradores principais não podem ser excluídos' };
  }
  
  // 5. Only super_admin can create another super_admin
  if (action === 'create_super_admin' && callerRole !== 'super_admin') {
    return { valid: false, error: 'Apenas Super Admins podem criar outros Super Admins' };
  }
  
  return { valid: true };
}

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

    // SECURE: Check admin role from user_roles table
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      throw new Error('Failed to verify user permissions');
    }

    if (!userRole || !['admin', 'super_admin', 'platform_admin'].includes(userRole.role)) {
      throw new Error('Only admins can manage users');
    }

    const adminCompanyId = userRole.company_id;
    const callerRole = userRole.role;
    const isSuper = ['super_admin', 'platform_admin'].includes(callerRole);

    const { action, userData } = await req.json();

    switch (action) {
      case 'create': {
        // SECURITY: Validate company_id matches admin's company
        if (userData.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot create user in different company');
        }

        // Validate email uniqueness
        const emailValidation = await validateEmailUnique(supabaseClient, userData.email);
        if (!emailValidation.valid) {
          throw new Error(emailValidation.error);
        }

        // Validate username if provided
        if (userData.username) {
          const usernameValidation = await validateUsername(supabaseClient, userData.username);
          if (!usernameValidation.valid) {
            throw new Error(usernameValidation.error);
          }
        }

        // Security check for super_admin creation
        if (userData.role === 'super_admin') {
          const securityCheck = validateSecurityRules(user.id, callerRole, '', 'super_admin', 'create_super_admin');
          if (!securityCheck.valid) {
            throw new Error(securityCheck.error);
          }
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

        // Create profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: newUser.user.id,
            full_name: userData.full_name,
            username: userData.username || null,
            job_title: userData.job_title || userData.department,
            company_id: userData.company_id,
            is_active: true,
          });

        if (profileError) throw profileError;

        // Create role in user_roles table
        const { error: roleInsertError } = await supabaseClient
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: userData.role,
            company_id: userData.company_id,
            assigned_by_user_id: user.id,
          });

        if (roleInsertError) throw roleInsertError;

        // Log activity
        await logActivity(
          supabaseClient,
          adminCompanyId,
          user.id,
          'admin_user_created',
          `Usuário criado: ${userData.full_name} (${userData.email})`,
          { target_user_id: newUser.user.id, email: userData.email, role: userData.role }
        );

        return new Response(JSON.stringify({ success: true, user: newUser }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        // Get target user's role
        const { data: targetUserRole } = await supabaseClient
          .from('user_roles')
          .select('company_id, role')
          .eq('user_id', userData.id)
          .single();

        if (!targetUserRole) {
          throw new Error('Target user not found');
        }

        // SECURITY: Verify target user belongs to admin's company
        if (targetUserRole.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot update user from different company');
        }

        // Validate username if being updated
        if (userData.username) {
          const usernameValidation = await validateUsername(supabaseClient, userData.username, userData.id);
          if (!usernameValidation.valid) {
            throw new Error(usernameValidation.error);
          }
        }

        // Check if role is being changed
        const isRoleChange = userData.role && userData.role !== targetUserRole.role;
        
        if (isRoleChange) {
          // Security check for role changes
          const securityCheck = validateSecurityRules(
            user.id, 
            callerRole, 
            userData.id, 
            targetUserRole.role, 
            'update_role'
          );
          if (!securityCheck.valid) {
            throw new Error(securityCheck.error);
          }

          // Log role change specifically
          await logActivity(
            supabaseClient,
            adminCompanyId,
            user.id,
            'admin_user_role_changed',
            `Papel alterado: ${targetUserRole.role} → ${userData.role}`,
            { 
              target_user_id: userData.id, 
              old_role: targetUserRole.role, 
              new_role: userData.role 
            }
          );
        }

        // Update profile
        const updateData: Record<string, any> = {
          full_name: userData.full_name,
          job_title: userData.department || userData.job_title,
        };

        if (userData.username !== undefined) {
          updateData.username = userData.username || null;
        }

        if (userData.is_active !== undefined) {
          updateData.is_active = userData.is_active;
        }

        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('id', userData.id);

        if (updateError) throw updateError;

        // Update role if changed
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

        // Log activity
        await logActivity(
          supabaseClient,
          adminCompanyId,
          user.id,
          'admin_user_updated',
          `Usuário atualizado: ${userData.full_name}`,
          { target_user_id: userData.id, changes: updateData }
        );

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'soft_delete': {
        // Get target user's role
        const { data: targetUser } = await supabaseClient
          .from('user_roles')
          .select('company_id, role')
          .eq('user_id', userData.id)
          .single();

        if (!targetUser) {
          throw new Error('Target user not found');
        }

        // SECURITY: Verify target user belongs to admin's company
        if (targetUser.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot deactivate user from different company');
        }

        // Security validation
        const securityCheck = validateSecurityRules(
          user.id,
          callerRole,
          userData.id,
          targetUser.role,
          'soft_delete'
        );
        if (!securityCheck.valid) {
          throw new Error(securityCheck.error);
        }

        // Soft delete: update is_active and deleted_at
        const { error: softDeleteError } = await supabaseClient
          .from('profiles')
          .update({
            is_active: false,
            deleted_at: new Date().toISOString(),
            deleted_by_user_id: user.id,
          })
          .eq('id', userData.id);

        if (softDeleteError) throw softDeleteError;

        // Log activity
        await logActivity(
          supabaseClient,
          adminCompanyId,
          user.id,
          'admin_user_deactivated',
          `Usuário desativado: ${userData.full_name || userData.id}`,
          { 
            target_user_id: userData.id, 
            reason: userData.reason || 'Não informado' 
          }
        );

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'reactivate': {
        // Get target user's role
        const { data: targetUser } = await supabaseClient
          .from('user_roles')
          .select('company_id')
          .eq('user_id', userData.id)
          .single();

        if (!targetUser) {
          throw new Error('Target user not found');
        }

        // SECURITY: Verify target user belongs to admin's company
        if (targetUser.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot reactivate user from different company');
        }

        // Reactivate: clear deleted_at and set is_active
        const { error: reactivateError } = await supabaseClient
          .from('profiles')
          .update({
            is_active: true,
            deleted_at: null,
            deleted_by_user_id: null,
          })
          .eq('id', userData.id);

        if (reactivateError) throw reactivateError;

        // Log activity
        await logActivity(
          supabaseClient,
          adminCompanyId,
          user.id,
          'admin_user_reactivated',
          `Usuário reativado: ${userData.full_name || userData.id}`,
          { target_user_id: userData.id }
        );

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        // Get target user's role
        const { data: deleteTargetRole } = await supabaseClient
          .from('user_roles')
          .select('company_id, role')
          .eq('user_id', userData.id)
          .single();

        if (!deleteTargetRole) {
          throw new Error('Target user not found');
        }

        // SECURITY: Verify target user belongs to admin's company
        if (deleteTargetRole.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot delete user from different company');
        }

        // Security validation
        const securityCheck = validateSecurityRules(
          user.id,
          callerRole,
          userData.id,
          deleteTargetRole.role,
          'delete'
        );
        if (!securityCheck.valid) {
          throw new Error(securityCheck.error);
        }

        // Log activity BEFORE deletion
        await logActivity(
          supabaseClient,
          adminCompanyId,
          user.id,
          'admin_user_deleted',
          `Usuário excluído permanentemente: ${userData.full_name || userData.id}`,
          { 
            target_user_id: userData.id, 
            reason: userData.reason || 'Não informado' 
          }
        );

        // Delete user from auth (will cascade to profiles and user_roles)
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userData.id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'reset_password': {
        // Get target user's role
        const { data: targetUser } = await supabaseClient
          .from('user_roles')
          .select('company_id')
          .eq('user_id', userData.id)
          .single();

        if (!targetUser) {
          throw new Error('Target user not found');
        }

        // SECURITY: Verify target user belongs to admin's company
        if (targetUser.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot reset password for user from different company');
        }

        // Generate password reset link
        const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
          type: 'recovery',
          email: userData.email,
          options: {
            redirectTo: `${Deno.env.get('SITE_URL') || 'https://daton-esg-insight.lovable.app'}/reset-password`,
          }
        });

        if (linkError) throw linkError;

        // Log activity
        await logActivity(
          supabaseClient,
          adminCompanyId,
          user.id,
          'admin_password_reset_sent',
          `Link de reset de senha enviado para: ${userData.email}`,
          { target_user_id: userData.id, email: userData.email }
        );

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Link de recuperação enviado',
          // In production, you'd send this via email service
          // For now, return the link for testing
          link: linkData?.properties?.action_link
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_email_unique': {
        const validation = await validateEmailUnique(supabaseClient, userData.email, userData.excludeId);
        return new Response(JSON.stringify(validation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_username_unique': {
        const validation = await validateUsername(supabaseClient, userData.username, userData.excludeId);
        return new Response(JSON.stringify(validation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        // SECURITY: Validate company_id
        if (userData.company_id !== adminCompanyId && !isSuper) {
          throw new Error('Cannot list users from different company');
        }

        // Build query with filters
        let profilesQuery = supabaseClient
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('company_id', userData.company_id);

        // Status filter
        if (userData.status === 'active') {
          profilesQuery = profilesQuery.eq('is_active', true).is('deleted_at', null);
        } else if (userData.status === 'inactive') {
          profilesQuery = profilesQuery.or('is_active.eq.false,deleted_at.not.is.null');
        }

        // Search filter
        if (userData.search) {
          const searchTerm = `%${userData.search}%`;
          profilesQuery = profilesQuery.or(`full_name.ilike.${searchTerm},username.ilike.${searchTerm}`);
        }

        // Ordering
        const orderBy = userData.order_by || 'created_at';
        const orderDir = userData.order_dir === 'asc' ? true : false;
        profilesQuery = profilesQuery.order(orderBy, { ascending: orderDir });

        // Pagination
        const page = userData.page || 1;
        const limit = userData.limit || 20;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        profilesQuery = profilesQuery.range(from, to);

        const { data: profiles, error: profilesError, count } = await profilesQuery;

        if (profilesError) throw profilesError;

        // Get roles from user_roles table
        const userIds = profiles?.map(p => p.id) || [];
        const { data: userRolesList, error: rolesListError } = await supabaseClient
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesListError) throw rolesListError;

        const rolesMap = new Map(userRolesList?.map(ur => [ur.user_id, ur.role]) || []);

        // Filter by role if specified
        let filteredProfiles = profiles || [];
        if (userData.role_filter && userData.role_filter !== 'all') {
          filteredProfiles = filteredProfiles.filter(p => rolesMap.get(p.id) === userData.role_filter);
        }

        // Get auth users for emails
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();

        // Merge data
        const users = filteredProfiles.map(profile => {
          const authUser = authUsers?.users.find(u => u.id === profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: authUser?.email || 'N/A',
            username: profile.username,
            role: rolesMap.get(profile.id) || 'viewer',
            company_id: profile.company_id,
            created_at: profile.created_at,
            avatar_url: profile.avatar_url,
            phone: profile.phone,
            department: profile.job_title,
            is_active: profile.is_active ?? true,
            deleted_at: profile.deleted_at,
          };
        });

        const totalPages = Math.ceil((count || 0) / limit);

        return new Response(JSON.stringify({ 
          users,
          total: count || 0,
          page,
          limit,
          totalPages
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in manage-user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
