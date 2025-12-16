import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertToCreate {
  company_id: string;
  supplier_id: string;
  alert_type: string;
  reference_name: string;
  expiry_date: string;
  alert_status: string;
  alert_category: string;
  auto_inactivation_triggered?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[supplier-auto-alerts] Starting daily supplier alerts check...');

    const alertsToCreate: AlertToCreate[] = [];
    const suppliersToInactivate: { id: string; reason: string; company_id: string }[] = [];
    const today = new Date();

    // 1. VERIFICAR DOCUMENTOS VENCENDO/VENCIDOS
    console.log('[supplier-auto-alerts] Checking document expirations...');
    
    const { data: documents, error: docsError } = await supabase
      .from('supplier_documents')
      .select(`
        id, supplier_id, document_type_id, expiry_date, status,
        supplier:supplier_management(id, company_id, status, company_name, full_name),
        document_type:supplier_document_types(name, is_mandatory)
      `)
      .not('expiry_date', 'is', null)
      .eq('status', 'Aprovado');

    if (docsError) {
      console.error('[supplier-auto-alerts] Error fetching documents:', docsError);
    } else if (documents) {
      for (const doc of documents) {
        if (!doc.supplier || !doc.expiry_date) continue;
        
        const expiryDate = new Date(doc.expiry_date);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const supplier = doc.supplier as any;
        const docType = doc.document_type as any;

        // Criar alertas baseados nos dias até vencimento
        let shouldCreateAlert = false;
        let alertPriority = 'normal';

        if (daysUntilExpiry < 0) {
          // Vencido
          shouldCreateAlert = true;
          alertPriority = 'vencido';
          
          // Se documento obrigatório vencido há mais de 30 dias, marcar para inativação
          if (docType?.is_mandatory && daysUntilExpiry <= -30 && supplier.status === 'Ativo') {
            suppliersToInactivate.push({
              id: supplier.id,
              reason: `Documento obrigatório "${docType.name}" vencido há ${Math.abs(daysUntilExpiry)} dias`,
              company_id: supplier.company_id
            });
          }
        } else if (daysUntilExpiry <= 7) {
          shouldCreateAlert = true;
          alertPriority = 'critico';
        } else if (daysUntilExpiry <= 15) {
          shouldCreateAlert = true;
          alertPriority = 'urgente';
        } else if (daysUntilExpiry <= 30) {
          shouldCreateAlert = true;
          alertPriority = 'atencao';
        }

        if (shouldCreateAlert) {
          // Verificar se já existe alerta para este documento
          const { data: existingAlert } = await supabase
            .from('supplier_expiration_alerts')
            .select('id')
            .eq('supplier_id', supplier.id)
            .eq('alert_type', 'documento')
            .eq('reference_name', docType?.name || 'Documento')
            .single();

          if (!existingAlert) {
            alertsToCreate.push({
              company_id: supplier.company_id,
              supplier_id: supplier.id,
              alert_type: 'documento',
              reference_name: `${docType?.name || 'Documento'} - ${alertPriority.toUpperCase()}`,
              expiry_date: doc.expiry_date,
              alert_status: 'Pendente',
              alert_category: 'expiration'
            });
          }
        }
      }
    }

    // 2. VERIFICAR AVALIAÇÕES PENDENTES
    console.log('[supplier-auto-alerts] Checking pending evaluations...');
    
    const { data: suppliers, error: suppliersError } = await supabase
      .from('supplier_management')
      .select('id, company_id, status, company_name, full_name')
      .eq('status', 'Ativo');

    if (!suppliersError && suppliers) {
      for (const supplier of suppliers) {
        // Verificar última avaliação de desempenho
        const { data: lastEval } = await supabase
          .from('supplier_performance_evaluations')
          .select('evaluation_date')
          .eq('supplier_id', supplier.id)
          .order('evaluation_date', { ascending: false })
          .limit(1)
          .single();

        if (lastEval) {
          const lastEvalDate = new Date(lastEval.evaluation_date);
          const daysSinceEval = Math.floor((today.getTime() - lastEvalDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Se faz mais de 330 dias (quase 1 ano), criar alerta
          if (daysSinceEval >= 330) {
            const nextEvalDate = new Date(lastEvalDate);
            nextEvalDate.setFullYear(nextEvalDate.getFullYear() + 1);
            
            alertsToCreate.push({
              company_id: supplier.company_id,
              supplier_id: supplier.id,
              alert_type: 'avaliacao',
              reference_name: `Avaliação de desempenho anual pendente`,
              expiry_date: nextEvalDate.toISOString().split('T')[0],
              alert_status: 'Pendente',
              alert_category: 'evaluation'
            });
          }
        }
      }
    }

    // 3. VERIFICAR FORNECEDORES COM MUITAS FALHAS
    console.log('[supplier-auto-alerts] Checking suppliers with failures...');
    
    const { data: failureCounts, error: failuresError } = await supabase
      .from('supplier_supply_failures')
      .select('supplier_id, company_id')
      .gte('failure_date', new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (!failuresError && failureCounts) {
      // Agrupar por fornecedor
      const failuresBySupplier: Record<string, { count: number; company_id: string }> = {};
      for (const f of failureCounts) {
        if (!failuresBySupplier[f.supplier_id]) {
          failuresBySupplier[f.supplier_id] = { count: 0, company_id: f.company_id };
        }
        failuresBySupplier[f.supplier_id].count++;
      }

      // Verificar fornecedores com mais de 3 falhas
      for (const [supplierId, data] of Object.entries(failuresBySupplier)) {
        if (data.count > 3) {
          // Verificar se já está inativo
          const { data: supplierData } = await supabase
            .from('supplier_management')
            .select('status')
            .eq('id', supplierId)
            .single();

          if (supplierData?.status === 'Ativo') {
            suppliersToInactivate.push({
              id: supplierId,
              reason: `Mais de 3 falhas de fornecimento nos últimos 12 meses (${data.count} falhas)`,
              company_id: data.company_id
            });
          }
        }
      }
    }

    // 4. PROCESSAR INATIVAÇÕES AUTOMÁTICAS
    console.log(`[supplier-auto-alerts] Processing ${suppliersToInactivate.length} auto-inactivations...`);
    
    for (const supplier of suppliersToInactivate) {
      const { error: updateError } = await supabase
        .from('supplier_management')
        .update({
          status: 'Inativo',
          auto_inactivation_reason: supplier.reason,
          auto_inactivated_at: new Date().toISOString(),
          reactivation_blocked_until: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .eq('id', supplier.id);

      if (updateError) {
        console.error(`[supplier-auto-alerts] Error inactivating supplier ${supplier.id}:`, updateError);
      } else {
        // Criar alerta de inativação
        alertsToCreate.push({
          company_id: supplier.company_id,
          supplier_id: supplier.id,
          alert_type: 'inativacao',
          reference_name: supplier.reason,
          expiry_date: today.toISOString().split('T')[0],
          alert_status: 'Pendente',
          alert_category: 'inactivation',
          auto_inactivation_triggered: true
        });
      }
    }

    // 5. INSERIR ALERTAS
    console.log(`[supplier-auto-alerts] Creating ${alertsToCreate.length} alerts...`);
    
    if (alertsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('supplier_expiration_alerts')
        .insert(alertsToCreate);

      if (insertError) {
        console.error('[supplier-auto-alerts] Error inserting alerts:', insertError);
      }
    }

    // 6. EXECUTAR VERIFICAÇÃO DE DOCUMENTOS OBRIGATÓRIOS
    console.log('[supplier-auto-alerts] Running mandatory documents check...');
    
    const { error: checkError } = await supabase.rpc('check_supplier_mandatory_documents');
    if (checkError) {
      console.error('[supplier-auto-alerts] Error checking mandatory documents:', checkError);
    }

    console.log('[supplier-auto-alerts] Completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        alerts_created: alertsToCreate.length,
        suppliers_inactivated: suppliersToInactivate.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[supplier-auto-alerts] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
