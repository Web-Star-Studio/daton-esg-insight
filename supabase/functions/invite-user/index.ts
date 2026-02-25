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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Daton</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 14px;">Plataforma de Gestão ESG</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Olá, ${userName}!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${greeting}
              </p>

              ${isResend ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Reenviado por:</strong> ${inviterName}
                </p>
              </div>
              ` : ''}
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  <strong>Seu papel:</strong> ${roleName}
                </p>
              </div>

              <!-- Credentials -->
              <div style="background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">🔑 Seus dados de acesso:</h3>
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 4px 0; color: #374151; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="padding: 4px 0; color: #374151; font-size: 14px;">${params.userName === userName ? '' : ''}${siteUrl.includes('localhost') ? '' : ''}</td>
                  </tr>
                </table>
                <p style="margin: 8px 0 4px; color: #374151; font-size: 14px;"><strong>Senha temporária:</strong></p>
                <p style="margin: 4px 0 0; background-color: #ffffff; border: 1px solid #d1d5db; padding: 10px 14px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; color: #1f2937; word-break: break-all;">
                  ${escapeHtml(password)}
                </p>
                <p style="margin: 12px 0 0; color: #dc2626; font-size: 13px;">
                  ⚠️ <strong>Importante:</strong> Altere sua senha após o primeiro acesso em Configurações &gt; Segurança.
                </p>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <a href="${siteUrl}/auth" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                Se você não solicitou este convite, por favor ignore este email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Daton - Plataforma de Gestão ESG
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
