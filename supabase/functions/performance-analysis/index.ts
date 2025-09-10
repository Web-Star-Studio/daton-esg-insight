import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Definição das métricas suportadas
const SUPPORTED_METRICS = {
  'TOTAL_GHG_EMISSIONS': {
    label: 'Emissões Totais (tCO₂e)',
    tables: ['calculated_emissions'],
    aggregation: 'SUM',
    valueColumn: 'total_co2e',
    joinPath: 'activity_data -> emission_sources'
  },
  'SCOPE_1_EMISSIONS': {
    label: 'Emissões Escopo 1 (tCO₂e)',
    tables: ['calculated_emissions'],
    aggregation: 'SUM', 
    valueColumn: 'total_co2e',
    joinPath: 'activity_data -> emission_sources',
    filters: { scope: 1 }
  },
  'SCOPE_2_EMISSIONS': {
    label: 'Emissões Escopo 2 (tCO₂e)',
    tables: ['calculated_emissions'],
    aggregation: 'SUM',
    valueColumn: 'total_co2e', 
    joinPath: 'activity_data -> emission_sources',
    filters: { scope: 2 }
  },
  'SCOPE_3_EMISSIONS': {
    label: 'Emissões Escopo 3 (tCO₂e)',
    tables: ['calculated_emissions'],
    aggregation: 'SUM',
    valueColumn: 'total_co2e',
    joinPath: 'activity_data -> emission_sources', 
    filters: { scope: 3 }
  },
  'WASTE_GENERATION': {
    label: 'Geração de Resíduos (t)',
    tables: ['waste_logs'],
    aggregation: 'SUM',
    valueColumn: 'quantity'
  },
  'ENERGY_CONSUMPTION': {
    label: 'Consumo Energético',
    tables: ['activity_data'],
    aggregation: 'SUM',
    valueColumn: 'quantity',
    filters: { category: 'Energia' }
  },
  'LICENSE_COMPLIANCE': {
    label: 'Taxa de Conformidade (%)',
    tables: ['licenses'], 
    aggregation: 'PERCENTAGE',
    calculation: 'active_licenses'
  }
};

function formatDateForGranularity(date: string, granularity: string): string {
  const d = new Date(date + 'T00:00:00');
  
  switch (granularity) {
    case 'monthly':
      return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    case 'quarterly':
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `Q${quarter}/${d.getFullYear().toString().slice(-2)}`;
    case 'yearly':
      return d.getFullYear().toString();
    default:
      return date;
  }
}

function getDateTruncFunction(granularity: string): string {
  switch (granularity) {
    case 'monthly':
      return "date_trunc('month', ";
    case 'quarterly':  
      return "date_trunc('quarter', ";
    case 'yearly':
      return "date_trunc('year', ";
    default:
      return "date_trunc('month', ";
  }
}

async function executeQuery(queryConfig: any, userCompanyId: string) {
  const { metric_key, time_range, granularity, comparison_dimension, filter_ids } = queryConfig;
  const metric = SUPPORTED_METRICS[metric_key as keyof typeof SUPPORTED_METRICS];
  
  if (!metric) {
    throw new Error(`Métrica não suportada: ${metric_key}`);
  }

  let query: any;
  let results: any;

  try {
    // Query para emissões GEE
    if (metric_key.includes('EMISSIONS')) {
      const scopeFilter = metric.filters?.scope ? ` AND es.scope = ${metric.filters.scope}` : '';
      const assetFilter = comparison_dimension === 'asset' && filter_ids?.length 
        ? ` AND es.asset_id = ANY(ARRAY['${filter_ids.join("','")}']::uuid[])` 
        : '';
        
      const dateField = granularity === 'monthly' ? 'ad.period_start_date' : 'ad.period_start_date';
      const dateTrunc = getDateTruncFunction(granularity);
      
      let selectFields = `
        ${dateTrunc}${dateField}) as period,
        SUM(ce.total_co2e) as value
      `;
      
      let groupBy = `GROUP BY ${dateTrunc}${dateField})`;
      
      if (comparison_dimension === 'asset') {
        selectFields = `
          ${dateTrunc}${dateField}) as period,
          COALESCE(a.name, 'Sem Ativo') as dimension_label,
          es.asset_id as dimension_id,
          SUM(ce.total_co2e) as value
        `;
        groupBy = `GROUP BY ${dateTrunc}${dateField}), es.asset_id, a.name`;
      } else if (comparison_dimension === 'scope') {
        selectFields = `
          ${dateTrunc}${dateField}) as period,
          'Escopo ' || es.scope as dimension_label,
          es.scope as dimension_id,
          SUM(ce.total_co2e) as value
        `;
        groupBy = `GROUP BY ${dateTrunc}${dateField}), es.scope`;
      }

      query = supabase
        .from('calculated_emissions')
        .select(`
          ${selectFields}
          ${comparison_dimension === 'asset' ? ', assets:emission_sources!inner(asset_id, assets(name))' : ''}
        `, { count: 'exact' });

      // Usando SQL raw para consulta complexa
      const sqlQuery = `
        SELECT 
          ${selectFields}
        FROM calculated_emissions ce
        INNER JOIN activity_data ad ON ce.activity_data_id = ad.id
        INNER JOIN emission_sources es ON ad.emission_source_id = es.id
        ${comparison_dimension === 'asset' ? 'LEFT JOIN assets a ON es.asset_id = a.id' : ''}
        WHERE es.company_id = '${userCompanyId}'
          AND ${dateField} >= '${time_range.start}'
          AND ${dateField} <= '${time_range.end}'
          ${scopeFilter}
          ${assetFilter}
        ${groupBy}
        ORDER BY period ASC
      `;

      const { data, error } = await supabase.rpc('exec_sql', { query: sqlQuery });
      
      if (error) {
        console.error('Erro na consulta SQL:', error);
        throw error;
      }
      
      results = data || [];
    }
    
    // Query para resíduos
    else if (metric_key === 'WASTE_GENERATION') {
      const assetFilter = comparison_dimension === 'asset' && filter_ids?.length 
        ? ` AND wl.asset_id = ANY(ARRAY['${filter_ids.join("','")}']::uuid[])` 
        : '';
        
      const dateTrunc = getDateTruncFunction(granularity);
      
      let selectFields = `
        ${dateTrunc}wl.collection_date) as period,
        SUM(wl.quantity) as value
      `;
      
      let groupBy = `GROUP BY ${dateTrunc}wl.collection_date)`;
      
      if (comparison_dimension === 'asset') {
        selectFields = `
          ${dateTrunc}wl.collection_date) as period,
          COALESCE(a.name, 'Sem Ativo') as dimension_label,
          wl.asset_id as dimension_id,
          SUM(wl.quantity) as value
        `;
        groupBy = `GROUP BY ${dateTrunc}wl.collection_date), wl.asset_id, a.name`;
      } else if (comparison_dimension === 'waste_class') {
        selectFields = `
          ${dateTrunc}wl.collection_date) as period,
          wl.waste_class as dimension_label,
          wl.waste_class as dimension_id,
          SUM(wl.quantity) as value
        `;
        groupBy = `GROUP BY ${dateTrunc}wl.collection_date), wl.waste_class`;
      }

      const sqlQuery = `
        SELECT 
          ${selectFields}
        FROM waste_logs wl
        ${comparison_dimension === 'asset' ? 'LEFT JOIN assets a ON wl.asset_id = a.id' : ''}
        WHERE wl.company_id = '${userCompanyId}'
          AND wl.collection_date >= '${time_range.start}'
          AND wl.collection_date <= '${time_range.end}'
          ${assetFilter}
        ${groupBy}
        ORDER BY period ASC
      `;

      const { data, error } = await supabase.rpc('exec_sql', { query: sqlQuery });
      
      if (error) {
        console.error('Erro na consulta SQL:', error);
        throw error;
      }
      
      results = data || [];
    }
    
    // Query para licenças
    else if (metric_key === 'LICENSE_COMPLIANCE') {
      const sqlQuery = `
        SELECT 
          ${getDateTruncFunction(granularity)}l.issue_date) as period,
          ${comparison_dimension === 'asset' ? 'COALESCE(a.name, \'Sem Ativo\') as dimension_label, l.asset_id as dimension_id,' : ''}
          COUNT(CASE WHEN l.status = 'Ativa' THEN 1 END)::float / COUNT(*)::float * 100 as value
        FROM licenses l
        ${comparison_dimension === 'asset' ? 'LEFT JOIN assets a ON l.asset_id = a.id' : ''}
        WHERE l.company_id = '${userCompanyId}'
          AND l.issue_date >= '${time_range.start}'
          AND l.issue_date <= '${time_range.end}'
          ${comparison_dimension === 'asset' && filter_ids?.length ? ` AND l.asset_id = ANY(ARRAY['${filter_ids.join("','")}']::uuid[])` : ''}
        GROUP BY ${getDateTruncFunction(granularity)}l.issue_date)${comparison_dimension === 'asset' ? ', l.asset_id, a.name' : ''}
        ORDER BY period ASC
      `;

      const { data, error } = await supabase.rpc('exec_sql', { query: sqlQuery });
      
      if (error) {
        console.error('Erro na consulta SQL:', error);
        throw error;
      }
      
      results = data || [];
    }

  } catch (error) {
    console.error('Erro na execução da query:', error);
    throw error;
  }

  return results;
}

function processResults(results: any[], queryConfig: any) {
  const { granularity, comparison_dimension } = queryConfig;
  const metric = SUPPORTED_METRICS[queryConfig.metric_key as keyof typeof SUPPORTED_METRICS];

  // Processar dados para o formato de gráfico
  const periodsSet = new Set();
  const dimensionsMap = new Map();

  results.forEach(row => {
    const period = formatDateForGranularity(row.period, granularity);
    periodsSet.add(period);
    
    if (comparison_dimension && row.dimension_label) {
      if (!dimensionsMap.has(row.dimension_id)) {
        dimensionsMap.set(row.dimension_id, {
          id: row.dimension_id,
          label: row.dimension_label,
          data: new Map()
        });
      }
      dimensionsMap.get(row.dimension_id).data.set(period, parseFloat(row.value) || 0);
    }
  });

  const labels = Array.from(periodsSet).sort();
  
  const datasets = [];
  
  if (comparison_dimension && dimensionsMap.size > 0) {
    // Dados com dimensões de comparação
    Array.from(dimensionsMap.values()).forEach((dimension, index) => {
      const data = labels.map(period => dimension.data.get(period) || 0);
      datasets.push({
        id: dimension.id,
        label: dimension.label,
        data,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      });
    });
  } else {
    // Dados agregados sem dimensão de comparação
    const dataMap = new Map();
    results.forEach(row => {
      const period = formatDateForGranularity(row.period, granularity);
      dataMap.set(period, parseFloat(row.value) || 0);
    });
    
    const data = labels.map(period => dataMap.get(period) || 0);
    datasets.push({
      id: 'total',
      label: metric.label,
      data,
      color: 'hsl(var(--primary))'
    });
  }

  // Calcular estatísticas resumo
  const allValues = datasets.flatMap(d => d.data).filter(v => v > 0);
  const total = allValues.reduce((sum, val) => sum + val, 0);
  const average = allValues.length > 0 ? total / allValues.length : 0;

  return {
    labels,
    datasets,
    summary_stats: {
      total: Math.round(total * 100) / 100,
      average: Math.round(average * 100) / 100,
      count: allValues.length,
      max: allValues.length > 0 ? Math.max(...allValues) : 0,
      min: allValues.length > 0 ? Math.min(...allValues) : 0
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter o token de autorização
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    // Validar usuário e obter company_id
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Token inválido');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('Perfil de usuário não encontrado');
    }

    const { 
      metric_key, 
      time_range, 
      granularity = 'monthly', 
      comparison_dimension, 
      filter_ids = [] 
    } = await req.json();

    if (!metric_key || !time_range) {
      throw new Error('Parâmetros obrigatórios: metric_key, time_range');
    }

    const metric = SUPPORTED_METRICS[metric_key as keyof typeof SUPPORTED_METRICS];
    if (!metric) {
      throw new Error(`Métrica não suportada: ${metric_key}`);
    }

    console.log(`Executando análise: ${metric_key} para empresa ${profile.company_id}`);

    // Executar consulta
    const queryResults = await executeQuery({
      metric_key,
      time_range,
      granularity,
      comparison_dimension,
      filter_ids
    }, profile.company_id);

    // Processar resultados
    const chartData = processResults(queryResults, {
      metric_key,
      granularity,
      comparison_dimension
    });

    const response = {
      query_details: {
        metric_key,
        metric_label: metric.label,
        time_range,
        granularity,
        comparison_dimension: comparison_dimension || null
      },
      chart_data: chartData,
      summary_stats: chartData.summary_stats
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na análise de desempenho:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});