import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  full_name: string;
  role: string;
  department?: string;
  phone?: string;
  username?: string;
  isResend?: boolean;
  user_id?: string;
  module_access?: Record<string, boolean>;
}

function generateRandomPassword(length = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%*?";
  const all = upper + lower + digits + symbols;

  // Ensure at least one of each type
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  let password = "";
  password += upper[randomBytes[0] % upper.length];
  password += lower[randomBytes[1] % lower.length];
  password += digits[randomBytes[2] % digits.length];
  password += symbols[randomBytes[3] % symbols.length];

  for (let i = 4; i < length; i++) {
    password += all[randomBytes[i] % all.length];
  }

  // Shuffle
  const arr = password.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomBytes[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const handler = async (req: Request): Promise<Response> => {
  console.warn("invite-user: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user: callingUser }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("company_id, full_name")
      .eq("id", callingUser.id)
      .single();

    if (profileError || !callingProfile?.company_id) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callingUserRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .single();

    const allowedRoles = ["super_admin", "admin", "platform_admin"];
    if (roleError || !callingUserRole || !allowedRoles.includes(callingUserRole.role)) {
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para convidar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, full_name, role, department, phone, username, isResend, user_id, module_access }: InviteUserRequest = await req.json();

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Email, nome e role são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validRoles = ["admin", "manager", "analyst", "operator", "viewer", "auditor"];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Role inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", callingProfile.company_id)
      .single();

    const companyName = company?.name || "Daton";

    const siteUrl = Deno.env.get("SUPABASE_URL")?.includes("localhost")
      ? "http://localhost:5173"
      : "https://daton-esg-insight.lovable.app";

    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      manager: "Gestor",
      analyst: "Analista",
      operator: "Operador",
      viewer: "Visualizador",
      auditor: "Auditor",
    };

    // ====== RESEND INVITE FLOW ======
    if (isResend && user_id) {
      console.warn("invite-user: Resending invite for user", user_id);

      const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, company_id")
        .eq("id", user_id)
        .single();

      if (existingProfileError || !existingProfile) {
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingProfile.company_id !== callingProfile.company_id) {
        return new Response(
          JSON.stringify({ error: "Você não tem permissão para reenviar convite para este usuário" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate new temporary password for resend
      const newPassword = generateRandomPassword();
      
      // Update user password
      const { error: updatePassError } = await supabaseAdmin.auth.admin.updateUser(user_id, {
        password: newPassword,
      });

      if (updatePassError) {
        console.error("invite-user: Failed to update password for resend", updatePassError);
        return new Response(
          JSON.stringify({ error: "Falha ao gerar nova senha temporária" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resendClient = new Resend(resendApiKey);

      const resendEmailHtml = buildEmailHtml({
        userName: existingProfile.full_name,
        companyName,
        inviterName: callingProfile.full_name,
        roleName: roleLabels[role] || role,
        siteUrl,
        password: newPassword,
        isResend: true,
      });

      const { error: emailError } = await resendClient.emails.send({
        from: "Daton <plataforma@daton.com.br>",
        to: [existingProfile.email],
        subject: `Lembrete: Você foi convidado para ${companyName} - Daton`,
        html: resendEmailHtml,
      });

      if (emailError) {
        console.error("invite-user: Failed to send resend email", emailError);
        return new Response(
          JSON.stringify({ error: "Falha ao enviar email de convite" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Convite reenviado com sucesso",
          user: { id: user_id, email: existingProfile.email, full_name: existingProfile.full_name },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== NEW INVITE FLOW ======
    const tempPassword = generateRandomPassword();

    // Create the user with a password and email already confirmed
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        invited_by: callingUser.id,
        company_id: callingProfile.company_id,
        role,
        department: department || null,
        phone: phone || null,
        is_approved: true,
        has_completed_onboarding: true,
        skip_trigger: true,
      },
    });

    if (createError) {
      if (createError.message?.includes("already been registered") || 
          createError.message?.includes("email_exists")) {
        return new Response(
          JSON.stringify({ error: "Este email já está registrado no sistema" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("invite-user: Failed to create user", createError);
      return new Response(
        JSON.stringify({ error: createError?.message || "Falha ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newUser?.user) {
      return new Response(
        JSON.stringify({ error: "Falha ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.warn("invite-user: User created", newUser.user.id);

    // Create profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", newUser.user.id)
      .single();

    if (!existingProfile) {
      const { error: profileCreateError } = await supabaseAdmin.from("profiles").insert({
        id: newUser.user.id,
        email,
        full_name,
        company_id: callingProfile.company_id,
        department: department || null,
        phone: phone || null,
        role,
        has_completed_onboarding: true,
        is_approved: true,
        username: username || null,
      });

      if (profileCreateError) {
        console.error("invite-user: Failed to create profile", profileCreateError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(
          JSON.stringify({ error: "Falha ao criar perfil do usuário" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Update existing profile to mark as approved
      await supabaseAdmin.from("profiles").update({
        has_completed_onboarding: true,
        is_approved: true,
        company_id: callingProfile.company_id,
        full_name,
        department: department || null,
        phone: phone || null,
        role,
      }).eq("id", newUser.user.id);
    }

    // Create user_role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", newUser.user.id)
      .single();

    if (!existingRole) {
      const { error: roleCreateError } = await supabaseAdmin.from("user_roles").insert({
        user_id: newUser.user.id,
        role,
        company_id: callingProfile.company_id,
        assigned_by_user_id: callingUser.id,
      });

      if (roleCreateError) {
        console.error("invite-user: Failed to create user_role", roleCreateError);
      }
    }

    // Save module access restrictions
    if (module_access) {
      const restrictedModules = Object.entries(module_access)
        .filter(([_, hasAccess]) => !hasAccess)
        .map(([moduleKey]) => ({
          user_id: newUser.user.id,
          module_key: moduleKey,
          has_access: false,
          granted_by: callingUser.id,
        }));

      if (restrictedModules.length > 0) {
        const { error: moduleError } = await supabaseAdmin
          .from("user_module_access")
          .insert(restrictedModules);

        if (moduleError) {
          console.error("invite-user: Failed to save module access", moduleError);
          // Non-critical, continue
        }
      }
    }

    // Send invitation email with temporary password
    const resend = new Resend(resendApiKey);

    const emailHtml = buildEmailHtml({
      userName: full_name,
      companyName,
      inviterName: callingProfile.full_name,
      roleName: roleLabels[role] || role,
      siteUrl,
      password: tempPassword,
      isResend: false,
    });

    const { error: emailError } = await resend.emails.send({
      from: "Daton <plataforma@daton.com.br>",
      to: [email],
      subject: `Você foi convidado para ${companyName} - Daton`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("invite-user: Failed to send email", emailError);
    } else {
      console.warn("invite-user: Invitation email sent successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Convite enviado com sucesso",
        user: {
          id: newUser.user.id,
          email,
          full_name,
          role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("invite-user: Unexpected error", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function buildEmailHtml(params: {
  userName: string;
  companyName: string;
  inviterName: string;
  roleName: string;
  siteUrl: string;
  password: string;
  isResend: boolean;
}): string {
  const { userName, companyName, inviterName, roleName, siteUrl, password, isResend } = params;
  const title = isResend ? `Lembrete de Convite - ${companyName}` : `Convite - ${companyName}`;
  const greeting = isResend
    ? `Este é um lembrete do seu convite para fazer parte da equipe da <strong>${companyName}</strong> na plataforma Daton.`
    : `Você foi convidado(a) por <strong>${inviterName}</strong> para fazer parte da equipe da <strong>${companyName}</strong> na plataforma Daton.`;

  const emailAddress = siteUrl.includes('localhost') ? 'usuário' : userName;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
          <!-- Logo -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; text-align: center; border-bottom: 1px solid #f3f4f6;">
              <img src="${siteUrl}/logo-email.png" alt="Daton" height="36" style="display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px 40px 40px;">
              <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Olá, <strong>${userName}</strong>.
              </p>
              
              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 8px 0;">
                ${greeting}
              </p>

              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Papel atribuído: <strong>${roleName}</strong>
              </p>

              <!-- Credentials -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Dados de acesso</p>
                    <p style="margin: 0 0 12px 0; color: #111827; font-size: 14px;">
                      <strong>Senha temporária:</strong>
                    </p>
                    <p style="margin: 0; background-color: #ffffff; border: 1px solid #e5e7eb; padding: 10px 14px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 15px; letter-spacing: 0.5px; color: #111827; word-break: break-all;">
                      ${escapeHtml(password)}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 28px 0;">
                Altere sua senha após o primeiro acesso em <strong>Configurações &gt; Segurança</strong>.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/auth" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Daton
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

serve(handler);
