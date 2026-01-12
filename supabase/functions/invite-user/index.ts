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
}

const handler = async (req: Request): Promise<Response> => {
  console.log("invite-user: Request received");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("invite-user: No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("invite-user: RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client with user's token (to validate permissions)
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !callingUser) {
      console.error("invite-user: Failed to get calling user", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("invite-user: Calling user:", callingUser.id);

    // Get calling user's profile and role
    const { data: callingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("company_id, full_name")
      .eq("id", callingUser.id)
      .single();

    if (profileError || !callingProfile?.company_id) {
      console.error("invite-user: Failed to get calling user profile", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if calling user is admin or super_admin
    const { data: callingUserRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .single();

    const allowedRoles = ["super_admin", "admin", "platform_admin"];
    if (roleError || !callingUserRole || !allowedRoles.includes(callingUserRole.role)) {
      console.error("invite-user: User not authorized to invite", roleError, callingUserRole);
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para convidar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, full_name, role, department, phone }: InviteUserRequest = await req.json();

    console.log("invite-user: Inviting user", { email, full_name, role, department });

    // Validate required fields
    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Email, nome e role são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    const validRoles = ["admin", "manager", "analyst", "operator", "viewer", "auditor"];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Role inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      console.log("invite-user: User already exists", existingUser.id);
      return new Response(
        JSON.stringify({ error: "Este email já está registrado no sistema" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company name
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", callingProfile.company_id)
      .single();

    const companyName = company?.name || "Daton";

    // Generate invite link using magic link
    const siteUrl = Deno.env.get("SUPABASE_URL")?.includes("localhost")
      ? "http://localhost:5173"
      : "https://dqlvioijqzlvnvvajmft.lovableproject.com";

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: `${siteUrl}/set-password`,
      },
    });

    if (linkError || !linkData) {
      console.error("invite-user: Failed to generate magic link", linkError);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar link de convite" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("invite-user: Magic link generated");

    // Create the user in auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: false,
      user_metadata: {
        full_name: full_name,
        invited_by: callingUser.id,
        company_id: callingProfile.company_id,
      },
    });

    if (createError || !newUser?.user) {
      console.error("invite-user: Failed to create user", createError);
      return new Response(
        JSON.stringify({ error: createError?.message || "Falha ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("invite-user: User created in auth", newUser.user.id);

    // Create profile
    const { error: profileCreateError } = await supabaseAdmin.from("profiles").insert({
      id: newUser.user.id,
      email: email,
      full_name: full_name,
      company_id: callingProfile.company_id,
      department: department || null,
      phone: phone || null,
      role: role,
    });

    if (profileCreateError) {
      console.error("invite-user: Failed to create profile", profileCreateError);
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: "Falha ao criar perfil do usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user_role
    const { error: roleCreateError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: role,
    });

    if (roleCreateError) {
      console.error("invite-user: Failed to create user_role", roleCreateError);
      // Continue anyway - role can be added manually
    }

    console.log("invite-user: Profile and role created");

    // Send invitation email using Resend
    const resend = new Resend(resendApiKey);

    // Get the invite link from linkData
    const inviteUrl = linkData.properties?.action_link || `${siteUrl}/set-password`;

    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      manager: "Gestor",
      analyst: "Analista",
      operator: "Operador",
      viewer: "Visualizador",
      auditor: "Auditor",
    };

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - ${companyName}</title>
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
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Olá, ${full_name}!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Você foi convidado(a) por <strong>${callingProfile.full_name}</strong> para fazer parte da equipe da <strong>${companyName}</strong> na plataforma Daton.
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  <strong>Seu papel:</strong> ${roleLabels[role] || role}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Para começar, clique no botão abaixo para definir sua senha e acessar a plataforma:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                Este link expira em 24 horas.
              </p>
              
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

    const { error: emailError } = await resend.emails.send({
      from: "Daton <onboarding@resend.dev>",
      to: [email],
      subject: `Você foi convidado para ${companyName} - Daton`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("invite-user: Failed to send email", emailError);
      // Don't fail the whole operation, user was created
      console.log("invite-user: User created but email failed");
    } else {
      console.log("invite-user: Invitation email sent successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Convite enviado com sucesso",
        user: {
          id: newUser.user.id,
          email: email,
          full_name: full_name,
          role: role,
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

serve(handler);
