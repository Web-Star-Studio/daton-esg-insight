import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  event: 'NEW_FAILURE' | 'AT_RISK' | 'INACTIVATION' | 'DOCUMENT_EXPIRING';
  supplier_id: string;
  company_id: string;
  failure_id?: string;
  severity?: string;
  details?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    console.log('Received notification request:', payload);

    // Get supplier info
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier_management')
      .select('id, company_name, full_name, company_id, supply_failure_count')
      .eq('id', payload.supplier_id)
      .single();

    if (supplierError || !supplier) {
      console.error('Supplier not found:', supplierError);
      return new Response(
        JSON.stringify({ error: 'Supplier not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supplierName = supplier.company_name || supplier.full_name || 'Fornecedor';
    const companyId = supplier.company_id;

    // Get notification config
    const { data: config } = await supabase
      .from('supplier_failure_config')
      .select('*')
      .eq('company_id', companyId)
      .single();

    // Check if notification should be sent based on config
    const shouldNotify = checkShouldNotify(payload.event, config);
    if (!shouldNotify) {
      console.log('Notification skipped based on config');
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build notification content
    const notification = buildNotification(payload, supplierName, supplier.supply_failure_count || 0);

    // Create in-app notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        company_id: companyId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: 'supplier',
        entity_type: 'supplier',
        entity_id: payload.supplier_id,
        priority: notification.priority,
        action_url: `/fornecedores?supplier=${payload.supplier_id}`,
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send email notifications if configured
    if (config?.notify_emails?.length > 0) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        await sendEmailNotifications(
          resendApiKey,
          config.notify_emails,
          notification,
          supplierName
        );
      }
    }

    // Create supplier alert
    await supabase
      .from('supplier_expiration_alerts')
      .insert({
        company_id: companyId,
        supplier_id: payload.supplier_id,
        alert_type: mapEventToAlertType(payload.event),
        severity: notification.priority,
        title: notification.title,
        description: notification.message,
        status: 'pending',
      });

    console.log('Notification processed successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function checkShouldNotify(event: string, config: any): boolean {
  if (!config) return true; // Default to notify if no config

  switch (event) {
    case 'NEW_FAILURE':
      return config.notify_on_failure !== false;
    case 'AT_RISK':
      return config.notify_on_at_risk !== false;
    case 'INACTIVATION':
      return config.notify_on_inactivation !== false;
    default:
      return true;
  }
}

function buildNotification(
  payload: NotificationPayload,
  supplierName: string,
  failureCount: number
): {
  title: string;
  message: string;
  type: string;
  priority: string;
} {
  switch (payload.event) {
    case 'NEW_FAILURE':
      return {
        title: `Nova falha registrada - ${supplierName}`,
        message: `Uma falha de severidade ${getSeverityLabel(payload.severity || 'medium')} foi registrada. Total de falhas: ${failureCount}.`,
        type: 'warning',
        priority: payload.severity === 'critical' ? 'high' : 'medium',
      };

    case 'AT_RISK':
      return {
        title: `⚠️ Fornecedor em risco - ${supplierName}`,
        message: `O fornecedor está próximo do limite de falhas permitido e pode ser inativado automaticamente. Atenção requerida.`,
        type: 'warning',
        priority: 'high',
      };

    case 'INACTIVATION':
      return {
        title: `🚫 Fornecedor inativado - ${supplierName}`,
        message: `O fornecedor foi inativado automaticamente por exceder o limite de falhas. A reativação está bloqueada temporariamente.`,
        type: 'error',
        priority: 'critical',
      };

    case 'DOCUMENT_EXPIRING':
      return {
        title: `📄 Documento vencendo - ${supplierName}`,
        message: `Um documento do fornecedor está próximo do vencimento. Solicite a atualização.`,
        type: 'info',
        priority: 'medium',
      };

    default:
      return {
        title: `Notificação - ${supplierName}`,
        message: 'Evento relacionado ao fornecedor.',
        type: 'info',
        priority: 'low',
      };
  }
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: 'baixa',
    medium: 'média',
    high: 'alta',
    critical: 'crítica',
  };
  return labels[severity] || severity;
}

function mapEventToAlertType(event: string): string {
  const mapping: Record<string, string> = {
    'NEW_FAILURE': 'failure_recorded',
    'AT_RISK': 'at_risk',
    'INACTIVATION': 'auto_inactivation',
    'DOCUMENT_EXPIRING': 'document_expiring',
  };
  return mapping[event] || 'general';
}

async function sendEmailNotifications(
  apiKey: string,
  emails: string[],
  notification: { title: string; message: string; priority: string },
  supplierName: string
): Promise<void> {
  try {
    const priorityColors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#2563eb',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${priorityColors[notification.priority] || '#2563eb'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">${notification.title}</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; line-height: 1.6;">${notification.message}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Este é um e-mail automático do sistema de gestão de fornecedores.
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Daton ESG <noreply@daton.app>',
        to: emails,
        subject: notification.title,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send error:', error);
    } else {
      console.log('Emails sent successfully to:', emails);
    }
  } catch (error) {
    console.error('Error sending emails:', error);
  }
}
