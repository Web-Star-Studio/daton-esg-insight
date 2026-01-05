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
  name?: string;
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
  return `email,nome,departamento
joao@empresa.com,João Silva,RH
maria@empresa.com,Maria Santos,Financeiro
carlos@empresa.com,Carlos Oliveira,TI`;
}

// Parse CSV content
function parseCSV(csvContent: string): Contact[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const emailIndex = headers.indexOf("email");

  if (emailIndex === -1) {
    throw new Error("CSV deve conter uma coluna 'email'");
  }

  const nameIndex = headers.indexOf("nome");
  const contacts: Contact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const email = values[emailIndex];

    if (!email || !email.includes("@")) continue;

    const metadata: Record<string, any> = {};
    headers.forEach((header, idx) => {
      if (idx !== emailIndex && idx !== nameIndex && values[idx]) {
        metadata[header] = values[idx];
      }
    });

    contacts.push({
      email: email.toLowerCase(),
      name: nameIndex !== -1 ? values[nameIndex] : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  }

  return contacts;
}

// Generate email HTML template
function generateEmailHtml(
  subject: string,
  message: string,
  formUrl: string,
  contactName?: string
): string {
  const greeting = contactName ? `Olá ${contactName},` : "Olá,";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .message { margin-bottom: 30px; white-space: pre-wrap; }
    .cta-button { display: inline-block; background: #10B981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .cta-button:hover { background: #059669; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <div class="message">${message}</div>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${formUrl}" class="cta-button">Responder Formulário</a>
      </p>
    </div>
    <div class="footer">
      <p>Este email foi enviado através do sistema de formulários.</p>
      <p>Se você não reconhece este email, pode ignorá-lo com segurança.</p>
    </div>
  </div>
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
        const { mailingListId, formId, subject, message } = body;

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
              contact.name
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
