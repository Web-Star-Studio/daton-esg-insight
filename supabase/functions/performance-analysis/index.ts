import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisConfig {
  metric_key: string;
  time_range: { start: string; end: string };
  granularity: 'monthly' | 'quarterly' | 'yearly';
  comparison_dimension?: 'asset' | 'waste_class' | 'scope';
  filter_ids?: string[];
}

interface ChartDataset {
  id: string;
  label: string;
  data: number[];
  color: string;
}

const METRIC_LABELS: Record<string, string> = {
  'TOTAL_GHG_EMISSIONS': 'Emissões Totais (tCO₂e)',
  'SCOPE_1_EMISSIONS': 'Emissões Escopo 1 (tCO₂e)',
  'SCOPE_2_EMISSIONS': 'Emissões Escopo 2 (tCO₂e)',
  'SCOPE_3_EMISSIONS': 'Emissões Escopo 3 (tCO₂e)',
  'WASTE_GENERATION': 'Geração de Resíduos (t)',
  'LICENSE_COMPLIANCE': 'Taxa de Conformidade (%)',
};

const COLORS = [
  'hsl(221.2, 83.2%, 53.3%)', // primary
  'hsl(142.1, 76.2%, 36.3%)', // success
  'hsl(24.6, 95%, 53.1%)', // warning
  'hsl(346.8, 77.2%, 49.8%)', // destructive
  'hsl(262.1, 83.3%, 57.8%)', // purple
  'hsl(173, 58%, 39%)', // teal
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config: AnalysisConfig = await req.json();
    console.log('📊 Analysis config:', config);

    // Validate config
    if (!config.metric_key || !config.time_range || !config.granularity) {
      return new Response(JSON.stringify({ error: 'Configuração inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const labels: string[] = [];
    const datasets: ChartDataset[] = [];
    let allValues: number[] = [];

    // Generate time labels based on granularity
    const startDate = new Date(config.time_range.start);
    const endDate = new Date(config.time_range.end);
    
    switch (config.granularity) {
      case 'monthly':
        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
          labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
        }
        break;
      case 'quarterly':
        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 3)) {
          const quarter = Math.floor(d.getMonth() / 3) + 1;
          labels.push(`Q${quarter}/${d.getFullYear().toString().slice(2)}`);
        }
        break;
      case 'yearly':
        for (let d = new Date(startDate); d <= endDate; d.setFullYear(d.getFullYear() + 1)) {
          labels.push(d.getFullYear().toString());
        }
        break;
    }

    // Process based on metric type
    if (config.metric_key.includes('EMISSIONS')) {
      const scopeFilter = config.metric_key === 'SCOPE_1_EMISSIONS' ? 1 
        : config.metric_key === 'SCOPE_2_EMISSIONS' ? 2
        : config.metric_key === 'SCOPE_3_EMISSIONS' ? 3
        : null;

      if (config.comparison_dimension === 'asset') {
        // Compare by assets
        const { data: assets } = await supabase
          .from('assets')
          .select('id, name')
          .eq('company_id', profile.company_id)
          .in('id', config.filter_ids || []);

        for (let i = 0; i < (assets?.length || 0); i++) {
          const asset = assets![i];
          const { data: emissions } = await supabase
            .from('calculated_emissions')
            .select('total_co2e, activity_data!inner(period_start_date, emission_sources!inner(scope, asset_id))')
            .eq('activity_data.emission_sources.asset_id', asset.id)
            .gte('activity_data.period_start_date', config.time_range.start)
            .lte('activity_data.period_start_date', config.time_range.end);

          const dataPoints = labels.map(() => 0);
          emissions?.forEach((e: any) => {
            const date = new Date(e.activity_data.period_start_date);
            let index = 0;
            
            if (config.granularity === 'monthly') {
              index = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
            } else if (config.granularity === 'quarterly') {
              index = Math.floor((date.getFullYear() - startDate.getFullYear()) * 4 + (date.getMonth() - startDate.getMonth()) / 3);
            } else {
              index = date.getFullYear() - startDate.getFullYear();
            }
            
            if (index >= 0 && index < dataPoints.length) {
              dataPoints[index] += e.total_co2e || 0;
            }
          });

          datasets.push({
            id: asset.id,
            label: asset.name,
            data: dataPoints,
            color: COLORS[i % COLORS.length],
          });
          allValues.push(...dataPoints);
        }
      } else if (config.comparison_dimension === 'scope') {
        // Compare by scopes
        const scopes = scopeFilter ? [scopeFilter] : [1, 2, 3];
        
        for (let i = 0; i < scopes.length; i++) {
          const scope = scopes[i];
          const { data: emissions } = await supabase
            .from('calculated_emissions')
            .select('total_co2e, activity_data!inner(period_start_date, emission_sources!inner(scope))')
            .eq('activity_data.emission_sources.scope', scope)
            .eq('activity_data.emission_sources.company_id', profile.company_id)
            .gte('activity_data.period_start_date', config.time_range.start)
            .lte('activity_data.period_start_date', config.time_range.end);

          const dataPoints = labels.map(() => 0);
          emissions?.forEach((e: any) => {
            const date = new Date(e.activity_data.period_start_date);
            let index = 0;
            
            if (config.granularity === 'monthly') {
              index = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
            } else if (config.granularity === 'quarterly') {
              index = Math.floor((date.getFullYear() - startDate.getFullYear()) * 4 + (date.getMonth() - startDate.getMonth()) / 3);
            } else {
              index = date.getFullYear() - startDate.getFullYear();
            }
            
            if (index >= 0 && index < dataPoints.length) {
              dataPoints[index] += e.total_co2e || 0;
            }
          });

          datasets.push({
            id: `scope_${scope}`,
            label: `Escopo ${scope}`,
            data: dataPoints,
            color: COLORS[i % COLORS.length],
          });
          allValues.push(...dataPoints);
        }
      } else {
        // No comparison - total emissions
        const { data: emissions } = await supabase
          .from('calculated_emissions')
          .select('total_co2e, activity_data!inner(period_start_date, emission_sources!inner(scope, company_id))')
          .eq('activity_data.emission_sources.company_id', profile.company_id)
          .gte('activity_data.period_start_date', config.time_range.start)
          .lte('activity_data.period_start_date', config.time_range.end);

        const dataPoints = labels.map(() => 0);
        emissions?.forEach((e: any) => {
          if (scopeFilter && e.activity_data.emission_sources.scope !== scopeFilter) return;
          
          const date = new Date(e.activity_data.period_start_date);
          let index = 0;
          
          if (config.granularity === 'monthly') {
            index = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
          } else if (config.granularity === 'quarterly') {
            index = Math.floor((date.getFullYear() - startDate.getFullYear()) * 4 + (date.getMonth() - startDate.getMonth()) / 3);
          } else {
            index = date.getFullYear() - startDate.getFullYear();
          }
          
          if (index >= 0 && index < dataPoints.length) {
            dataPoints[index] += e.total_co2e || 0;
          }
        });

        datasets.push({
          id: 'total',
          label: METRIC_LABELS[config.metric_key],
          data: dataPoints,
          color: COLORS[0],
        });
        allValues = dataPoints;
      }
    } else if (config.metric_key === 'WASTE_GENERATION') {
      if (config.comparison_dimension === 'waste_class') {
        // Compare by waste classes
        const wasteClasses = config.filter_ids || [];
        
        for (let i = 0; i < wasteClasses.length; i++) {
          const wasteClass = wasteClasses[i];
          const { data: waste } = await supabase
            .from('waste_logs')
            .select('quantity_kg, generated_date')
            .eq('company_id', profile.company_id)
            .eq('waste_class', wasteClass)
            .gte('generated_date', config.time_range.start)
            .lte('generated_date', config.time_range.end);

          const dataPoints = labels.map(() => 0);
          waste?.forEach((w: any) => {
            const date = new Date(w.generated_date);
            let index = 0;
            
            if (config.granularity === 'monthly') {
              index = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
            } else if (config.granularity === 'quarterly') {
              index = Math.floor((date.getFullYear() - startDate.getFullYear()) * 4 + (date.getMonth() - startDate.getMonth()) / 3);
            } else {
              index = date.getFullYear() - startDate.getFullYear();
            }
            
            if (index >= 0 && index < dataPoints.length) {
              dataPoints[index] += (w.quantity_kg || 0) / 1000; // Convert to tonnes
            }
          });

          datasets.push({
            id: wasteClass,
            label: wasteClass,
            data: dataPoints,
            color: COLORS[i % COLORS.length],
          });
          allValues.push(...dataPoints);
        }
      } else if (config.comparison_dimension === 'asset') {
        // Compare by assets
        const { data: assets } = await supabase
          .from('assets')
          .select('id, name')
          .eq('company_id', profile.company_id)
          .in('id', config.filter_ids || []);

        for (let i = 0; i < (assets?.length || 0); i++) {
          const asset = assets![i];
          const { data: waste } = await supabase
            .from('waste_logs')
            .select('quantity_kg, generated_date')
            .eq('asset_id', asset.id)
            .gte('generated_date', config.time_range.start)
            .lte('generated_date', config.time_range.end);

          const dataPoints = labels.map(() => 0);
          waste?.forEach((w: any) => {
            const date = new Date(w.generated_date);
            let index = 0;
            
            if (config.granularity === 'monthly') {
              index = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
            } else if (config.granularity === 'quarterly') {
              index = Math.floor((date.getFullYear() - startDate.getFullYear()) * 4 + (date.getMonth() - startDate.getMonth()) / 3);
            } else {
              index = date.getFullYear() - startDate.getFullYear();
            }
            
            if (index >= 0 && index < dataPoints.length) {
              dataPoints[index] += (w.quantity_kg || 0) / 1000;
            }
          });

          datasets.push({
            id: asset.id,
            label: asset.name,
            data: dataPoints,
            color: COLORS[i % COLORS.length],
          });
          allValues.push(...dataPoints);
        }
      } else {
        // Total waste generation
        const { data: waste } = await supabase
          .from('waste_logs')
          .select('quantity_kg, generated_date')
          .eq('company_id', profile.company_id)
          .gte('generated_date', config.time_range.start)
          .lte('generated_date', config.time_range.end);

        const dataPoints = labels.map(() => 0);
        waste?.forEach((w: any) => {
          const date = new Date(w.generated_date);
          let index = 0;
          
          if (config.granularity === 'monthly') {
            index = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
          } else if (config.granularity === 'quarterly') {
            index = Math.floor((date.getFullYear() - startDate.getFullYear()) * 4 + (date.getMonth() - startDate.getMonth()) / 3);
          } else {
            index = date.getFullYear() - startDate.getFullYear();
          }
          
          if (index >= 0 && index < dataPoints.length) {
            dataPoints[index] += (w.quantity_kg || 0) / 1000;
          }
        });

        datasets.push({
          id: 'total',
          label: 'Geração Total de Resíduos',
          data: dataPoints,
          color: COLORS[0],
        });
        allValues = dataPoints;
      }
    } else if (config.metric_key === 'LICENSE_COMPLIANCE') {
      // License compliance rate
      const { data: licenses } = await supabase
        .from('licenses')
        .select('status, expiration_date')
        .eq('company_id', profile.company_id)
        .gte('expiration_date', config.time_range.start)
        .lte('expiration_date', config.time_range.end);

      const dataPoints = labels.map(() => 0);
      const countsPerPeriod = labels.map(() => ({ valid: 0, total: 0 }));

      licenses?.forEach((l: any) => {
        const date = new Date(l.expiration_date);
        let index = 0;
        
        if (config.granularity === 'monthly') {
          index = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
        } else if (config.granularity === 'quarterly') {
          index = Math.floor((date.getFullYear() - startDate.getFullYear()) * 4 + (date.getMonth() - startDate.getMonth()) / 3);
        } else {
          index = date.getFullYear() - startDate.getFullYear();
        }
        
        if (index >= 0 && index < dataPoints.length) {
          countsPerPeriod[index].total++;
          if (l.status === 'Válida') {
            countsPerPeriod[index].valid++;
          }
        }
      });

      countsPerPeriod.forEach((count, i) => {
        dataPoints[i] = count.total > 0 ? (count.valid / count.total) * 100 : 0;
      });

      datasets.push({
        id: 'compliance',
        label: 'Taxa de Conformidade',
        data: dataPoints,
        color: COLORS[0],
      });
      allValues = dataPoints;
    }

    // Calculate summary stats
    const filteredValues = allValues.filter(v => v > 0);
    const summary_stats = {
      total: allValues.reduce((sum, v) => sum + v, 0),
      average: filteredValues.length > 0 ? allValues.reduce((sum, v) => sum + v, 0) / filteredValues.length : 0,
      count: filteredValues.length,
      max: filteredValues.length > 0 ? Math.max(...filteredValues) : 0,
      min: filteredValues.length > 0 ? Math.min(...filteredValues) : 0,
    };

    const response = {
      query_details: {
        metric_key: config.metric_key,
        metric_label: METRIC_LABELS[config.metric_key],
        time_range: config.time_range,
        granularity: config.granularity,
        comparison_dimension: config.comparison_dimension,
      },
      chart_data: {
        labels,
        datasets,
        summary_stats,
      },
    };

    console.log('✅ Analysis complete:', { datasets: datasets.length, dataPoints: labels.length });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in performance-analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
