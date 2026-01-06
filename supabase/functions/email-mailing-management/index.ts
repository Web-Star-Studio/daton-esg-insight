import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MailingList {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_by_user_id: string;
}

interface Contact {
  email: string;
  name?: string;           // Nome do contato (CONTATO)
  companyName?: string;    // Nome da empresa (NOME)
  metadata?: Record<string, any>;
}

// Create nodemailer transporter
function createTransporter() {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail credentials not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD secrets.");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

// Get CSV Template
function getCsvTemplate(): string {
  return `nome,contato,email
Empresa ABC,João Silva,joao@empresa.com
Corporação XYZ,Maria Santos,maria@corp.com
Tech Solutions,Carlos Oliveira,carlos@tech.com`;
}

// Parse CSV content - supports both comma and semicolon delimiters
function parseCSV(csvContent: string): Contact[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  // Detect delimiter automatically (semicolon or comma)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";
  
  console.log(`[parseCSV] Detected delimiter: "${delimiter}"`);

  const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase());
  const emailIndex = headers.indexOf("email");

  if (emailIndex === -1) {
    throw new Error("CSV deve conter uma coluna 'email'");
  }

  const companyNameIndex = headers.indexOf("nome");
  const contactNameIndex = headers.indexOf("contato");
  const contacts: Contact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim());
    const email = values[emailIndex];

    if (!email || !email.includes("@")) continue;

    const metadata: Record<string, any> = {};
    headers.forEach((header, idx) => {
      if (idx !== emailIndex && idx !== companyNameIndex && idx !== contactNameIndex && values[idx]) {
        metadata[header] = values[idx];
      }
    });

    contacts.push({
      email: email.toLowerCase(),
      companyName: companyNameIndex !== -1 ? values[companyNameIndex] : undefined,
      name: contactNameIndex !== -1 ? values[contactNameIndex] : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  }

  return contacts;
}

// Generate email HTML template - Professional Design
function generateEmailHtml(
  subject: string,
  message: string,
  formUrl: string,
  contactName?: string,
  options?: {
    headerColor?: string;
    buttonColor?: string;
    logoUrl?: string;
    footerLogoUrl?: string;
  }
): string {
  const greeting = contactName ? `Olá, ${contactName}!` : "Olá!";
  const headerColor = options?.headerColor || '#10B981';
  const buttonColor = options?.buttonColor || '#10B981';
  const logoUrl = options?.logoUrl;

  // Calculate lighter shade for accents
  const lightenColor = (color: string, amount: number = 40): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const headerColorLight = lightenColor(headerColor, 180);

  const logoHtml = logoUrl 
    ? `<tr>
        <td align="center" style="padding: 30px 20px 10px 20px;">
          <img src="${logoUrl}" alt="Logo" style="max-height: 70px; max-width: 200px; object-fit: contain;" />
        </td>
      </tr>`
    : '';

  // Professional email template using tables for maximum compatibility
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button-link { padding: 14px 35px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  
  <!-- Wrapper Table -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Logo Section -->
          ${logoHtml}
          
          <!-- Decorative Header Line -->
          <tr>
            <td align="center" style="padding: ${logoUrl ? '10px' : '30px'} 40px 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="80">
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, ${headerColor}, ${lightenColor(headerColor, 60)}); border-radius: 2px;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Subject Title -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #18181b; letter-spacing: -0.5px; text-transform: uppercase;">
                ${subject}
              </h1>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="height: 1px; background-color: #e4e4e7;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td style="padding: 35px 40px;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #27272a;">
                ${greeting}
              </p>
              
              <!-- Message Body -->
              <div style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.7; color: #52525b; white-space: pre-wrap;">
${message}
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 15px 0 10px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background: ${buttonColor}; border-radius: 10px; box-shadow: 0 4px 14px ${buttonColor}40;">
                          <a href="${formUrl}" target="_blank" class="button-link" style="display: inline-block; padding: 16px 40px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                            Responder Agora &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${options?.footerLogoUrl ? `
              <!-- Footer Logo -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 25px 0 10px 0;">
                    <img src="${options.footerLogoUrl}" alt="Logo" style="max-height: 60px; max-width: 180px; object-fit: contain;" />
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 25px 40px; border-top: 1px solid #f4f4f5;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">
                      ✉️ Este email foi enviado pelo sistema de formulários.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                      Se você não reconhece esta mensagem, pode ignorá-la com segurança.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        <!-- End Main Container -->
        
      </td>
    </tr>
  </table>
  <!-- End Wrapper Table -->
  
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("User has no company associated");
    }

    const companyId = profile.company_id;
    const body = await req.json();
    const { action } = body;

    console.log(`[email-mailing-management] Action: ${action}, User: ${user.id}, Company: ${companyId}`);

    switch (action) {
      case "GET_TEMPLATE": {
        const template = getCsvTemplate();
        return new Response(JSON.stringify({ template }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "GET_MAILING_LISTS": {
        const { data, error } = await supabase
          .from("email_mailing_lists")
          .select(`
            *,
            mailing_list_contacts(count),
            mailing_list_forms(count)
          `)
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch mailing lists: ${error.message}`);

        // Transform count arrays to numbers
        const listsWithCounts = (data || []).map((list: any) => ({
          ...list,
          contact_count: list.mailing_list_contacts?.[0]?.count || 0,
          form_count: list.mailing_list_forms?.[0]?.count || 0,
        }));

        return new Response(JSON.stringify(listsWithCounts), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "GET_MAILING_LIST": {
        const { listId } = body;

        const { data: list, error: listError } = await supabase
          .from("email_mailing_lists")
          .select("*")
          .eq("id", listId)
          .eq("company_id", companyId)
          .single();

        if (listError) throw new Error(`Failed to fetch mailing list: ${listError.message}`);

        const { data: contacts, error: contactsError } = await supabase
          .from("mailing_list_contacts")
          .select("*")
          .eq("mailing_list_id", listId)
          .order("created_at", { ascending: false });

        if (contactsError) throw new Error(`Failed to fetch contacts: ${contactsError.message}`);

        const { data: forms, error: formsError } = await supabase
          .from("mailing_list_forms")
          .select(`
            *,
            custom_forms(id, title, is_published)
          `)
          .eq("mailing_list_id", listId);

        if (formsError) throw new Error(`Failed to fetch forms: ${formsError.message}`);

        return new Response(
          JSON.stringify({
            ...list,
            contacts: contacts || [],
            forms: forms?.map((f: any) => f.custom_forms) || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "CREATE_MAILING_LIST": {
        const { name, description, formIds } = body;

        const { data: list, error: listError } = await supabase
          .from("email_mailing_lists")
          .insert({
            company_id: companyId,
            created_by_user_id: user.id,
            name,
            description,
          })
          .select()
          .single();

        if (listError) throw new Error(`Failed to create mailing list: ${listError.message}`);

        // Link forms if provided
        if (formIds && formIds.length > 0) {
          const formLinks = formIds.map((formId: string) => ({
            mailing_list_id: list.id,
            form_id: formId,
          }));

          const { error: linkError } = await supabase
            .from("mailing_list_forms")
            .insert(formLinks);

          if (linkError) console.error("Failed to link forms:", linkError.message);
        }

        console.log(`[email-mailing-management] Created mailing list: ${list.id}`);

        return new Response(JSON.stringify(list), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "UPDATE_MAILING_LIST": {
        const { listId, name, description, formIds } = body;

        const { data: list, error: listError } = await supabase
          .from("email_mailing_lists")
          .update({ name, description, updated_at: new Date().toISOString() })
          .eq("id", listId)
          .eq("company_id", companyId)
          .select()
          .single();

        if (listError) throw new Error(`Failed to update mailing list: ${listError.message}`);

        // Update form links
        if (formIds !== undefined) {
          // Remove existing links
          await supabase
            .from("mailing_list_forms")
            .delete()
            .eq("mailing_list_id", listId);

          // Add new links
          if (formIds.length > 0) {
            const formLinks = formIds.map((formId: string) => ({
              mailing_list_id: listId,
              form_id: formId,
            }));

            await supabase.from("mailing_list_forms").insert(formLinks);
          }
        }

        return new Response(JSON.stringify(list), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "DELETE_MAILING_LIST": {
        const { listId } = body;

        const { error } = await supabase
          .from("email_mailing_lists")
          .delete()
          .eq("id", listId)
          .eq("company_id", companyId);

        if (error) throw new Error(`Failed to delete mailing list: ${error.message}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "IMPORT_CONTACTS": {
        const { listId, csvContent } = body;

        // Verify list ownership
        const { data: list } = await supabase
          .from("email_mailing_lists")
          .select("id")
          .eq("id", listId)
          .eq("company_id", companyId)
          .single();

        if (!list) throw new Error("Mailing list not found");

        const contacts = parseCSV(csvContent);

        if (contacts.length === 0) {
          throw new Error("Nenhum contato válido encontrado no CSV");
        }

        const contactsToInsert = contacts.map((c) => ({
          mailing_list_id: listId,
          email: c.email,
          name: c.name,
          company_name: c.companyName,
          metadata: c.metadata || {},
          status: "active",
        }));

        const { data: inserted, error: insertError } = await supabase
          .from("mailing_list_contacts")
          .upsert(contactsToInsert, {
            onConflict: "mailing_list_id,email",
            ignoreDuplicates: false,
          })
          .select();

        if (insertError) throw new Error(`Failed to import contacts: ${insertError.message}`);

        console.log(`[email-mailing-management] Imported ${inserted?.length || 0} contacts to list ${listId}`);

        return new Response(
          JSON.stringify({
            imported: inserted?.length || 0,
            total: contacts.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "DELETE_CONTACT": {
        const { contactId } = body;

        const { error } = await supabase
          .from("mailing_list_contacts")
          .delete()
          .eq("id", contactId);

        if (error) throw new Error(`Failed to delete contact: ${error.message}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "ADD_CONTACT": {
        const { listId, email, name, companyName } = body;

        // Validate email
        if (!email || !email.includes("@")) {
          throw new Error("Email inválido");
        }

        // Verify list ownership
        const { data: list } = await supabase
          .from("email_mailing_lists")
          .select("id")
          .eq("id", listId)
          .eq("company_id", companyId)
          .single();

        if (!list) throw new Error("Lista não encontrada");

        const { error } = await supabase
          .from("mailing_list_contacts")
          .upsert({
            mailing_list_id: listId,
            email: email.toLowerCase(),
            name: name || null,
            company_name: companyName || null,
            status: "active",
          }, {
            onConflict: "mailing_list_id,email",
          });

        if (error) throw new Error(`Erro ao adicionar contato: ${error.message}`);

        console.log(`[email-mailing-management] Added contact ${email} to list ${listId}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "GET_CAMPAIGNS": {
        const { data, error } = await supabase
          .from("email_campaigns")
          .select(`
            *,
            email_mailing_lists(id, name),
            custom_forms(id, title)
          `)
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch campaigns: ${error.message}`);

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "CREATE_CAMPAIGN": {
        const { mailingListId, formId, subject, message, headerColor, buttonColor, logoUrl, footerLogoUrl } = body;

        // Count recipients
        const { count } = await supabase
          .from("mailing_list_contacts")
          .select("*", { count: "exact", head: true })
          .eq("mailing_list_id", mailingListId)
          .eq("status", "active");

        const { data: campaign, error } = await supabase
          .from("email_campaigns")
          .insert({
            company_id: companyId,
            mailing_list_id: mailingListId,
            form_id: formId,
            subject,
            message,
            header_color: headerColor || '#10B981',
            button_color: buttonColor || '#10B981',
            logo_url: logoUrl || null,
            footer_logo_url: footerLogoUrl || null,
            status: "draft",
            total_recipients: count || 0,
            created_by_user_id: user.id,
          })
          .select()
          .single();

        if (error) throw new Error(`Failed to create campaign: ${error.message}`);

        console.log(`[email-mailing-management] Created campaign: ${campaign.id}`);

        return new Response(JSON.stringify(campaign), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "SEND_CAMPAIGN": {
        const { campaignId } = body;

        // Get campaign details
        const { data: campaign, error: campaignError } = await supabase
          .from("email_campaigns")
          .select(`
            *,
            custom_forms(id, title)
          `)
          .eq("id", campaignId)
          .eq("company_id", companyId)
          .single();

        if (campaignError || !campaign) {
          throw new Error("Campaign not found");
        }

        if (campaign.status === "sent" || campaign.status === "sending") {
          throw new Error("Campaign already sent or in progress");
        }

        // Update campaign status to sending
        await supabase
          .from("email_campaigns")
          .update({ status: "sending" })
          .eq("id", campaignId);

        // Get contacts
        const { data: contacts, error: contactsError } = await supabase
          .from("mailing_list_contacts")
          .select("*")
          .eq("mailing_list_id", campaign.mailing_list_id)
          .eq("status", "active");

        if (contactsError || !contacts || contacts.length === 0) {
          await supabase
            .from("email_campaigns")
            .update({ status: "failed" })
            .eq("id", campaignId);
          throw new Error("No active contacts found");
        }

        // Create campaign sends
        const sends = contacts.map((contact) => ({
          campaign_id: campaignId,
          contact_id: contact.id,
          email: contact.email,
          status: "pending",
        }));

        await supabase.from("email_campaign_sends").insert(sends);

        // Send emails
        const transporter = createTransporter();
        const gmailUser = Deno.env.get("GMAIL_USER")!;
        let sentCount = 0;

        // Build form URL - using /form/:formId route
        const origin = req.headers.get("origin") || "https://dqlvioijqzlvnvvajmft.supabase.co";
        const formUrl = `${origin}/form/${campaign.form_id}`;

        for (const contact of contacts) {
          try {
            const emailHtml = generateEmailHtml(
              campaign.subject,
              campaign.message || "",
              formUrl,
              contact.name,
              {
                headerColor: campaign.header_color,
                buttonColor: campaign.button_color,
                logoUrl: campaign.logo_url,
                footerLogoUrl: campaign.footer_logo_url,
              }
            );

            await transporter.sendMail({
              from: `"Formulários" <${gmailUser}>`,
              to: contact.email,
              subject: campaign.subject,
              html: emailHtml,
            });

            await supabase
              .from("email_campaign_sends")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("campaign_id", campaignId)
              .eq("contact_id", contact.id);

            sentCount++;
            console.log(`[email-mailing-management] Email sent to ${contact.email}`);
          } catch (emailError: any) {
            console.error(`[email-mailing-management] Failed to send to ${contact.email}:`, emailError.message);
            await supabase
              .from("email_campaign_sends")
              .update({ status: "failed", error_message: emailError.message })
              .eq("campaign_id", campaignId)
              .eq("contact_id", contact.id);
          }
        }

        // Update campaign status
        await supabase
          .from("email_campaigns")
          .update({
            status: sentCount > 0 ? "sent" : "failed",
            sent_count: sentCount,
            sent_at: new Date().toISOString(),
          })
          .eq("id", campaignId);

        console.log(`[email-mailing-management] Campaign ${campaignId} completed: ${sentCount}/${contacts.length} emails sent`);

        return new Response(
          JSON.stringify({
            success: true,
            sent: sentCount,
            total: contacts.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "GET_FORMS": {
        const { data, error } = await supabase
          .from("custom_forms")
          .select("id, title")
          .eq("company_id", companyId)
          .eq("is_published", true)
          .order("title");

        if (error) throw new Error(`Failed to fetch forms: ${error.message}`);

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error("[email-mailing-management] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
