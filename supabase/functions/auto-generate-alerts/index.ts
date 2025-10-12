import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar licenças próximas do vencimento
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*')
      .eq('status', 'Ativa');

    const alertsToCreate = [];
    const today = new Date();

    for (const license of licenses || []) {
      const expiryDate = new Date(license.expiry_date);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Alertas em diferentes períodos
      const alertPeriods = [180, 120, 90, 60, 30, 15, 7];
      
      for (const period of alertPeriods) {
        if (daysUntilExpiry === period) {
          alertsToCreate.push({
            license_id: license.id,
            company_id: license.company_id,
            alert_type: 'license_expiry',
            severity: period <= 30 ? 'high' : period <= 90 ? 'medium' : 'low',
            title: `Licença vence em ${period} dias`,
            message: `A licença ${license.name} vencerá em ${period} dias (${expiryDate.toLocaleDateString('pt-BR')})`,
            priority: period <= 30 ? 'alta' : 'média',
            category: 'renovação',
            auto_generated: true,
            notification_sent: false
          });
        }
      }

      // Verificar condicionantes vencendo
      const { data: conditions } = await supabase
        .from('license_conditions')
        .select('*')
        .eq('license_id', license.id)
        .eq('status', 'pending');

      for (const condition of conditions || []) {
        if (condition.due_date) {
          const conditionDate = new Date(condition.due_date);
          const daysUntilDue = Math.floor((conditionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if ([30, 15, 7, 3].includes(daysUntilDue)) {
            alertsToCreate.push({
              license_id: license.id,
              company_id: license.company_id,
              alert_type: 'condition_due',
              severity: daysUntilDue <= 7 ? 'high' : 'medium',
              title: `Condicionante vence em ${daysUntilDue} dias`,
              message: condition.condition_text?.substring(0, 200),
              priority: daysUntilDue <= 7 ? 'alta' : 'média',
              category: 'condicionante',
              auto_generated: true,
              related_condition_id: condition.id
            });
          }
        }
      }
    }

    // Inserir alertas
    if (alertsToCreate.length > 0) {
      await supabase.from('license_alerts').insert(alertsToCreate);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertsToCreate.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
