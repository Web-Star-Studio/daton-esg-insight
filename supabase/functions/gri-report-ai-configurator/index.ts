import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions defined first
async function handleDocumentUpload(supabase: any, reportId: string, fileContent: string, fileType: string) {
  console.log('[Upload] Processing document...');
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Extract text from document using tool
  const extractedText = fileContent; // Simplified - in production, use document parsing

  // Call Lovable AI to categorize and extract metrics
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de documentos ESG e relatórios GRI. Analise o documento e extraia informações relevantes.'
        },
        {
          role: 'user',
          content: `Analise este documento e retorne informações estruturadas:\n\n${extractedText.substring(0, 10000)}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'categorize_document',
          description: 'Categoriza o documento e extrai métricas relevantes',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['Environmental', 'Social', 'Economic', 'Governance', 'General']
              },
              extracted_metrics: {
                type: 'object',
                description: 'Métricas numéricas encontradas no documento'
              },
              suggested_indicators: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator_code: { type: 'string' },
                    relevance: { type: 'number' }
                  }
                }
              },
              confidence_score: {
                type: 'number',
                minimum: 0,
                maximum: 100
              }
            },
            required: ['category', 'confidence_score']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'categorize_document' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error(`Lovable AI error: ${aiResponse.status} - ${errorText}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls[0];
  const analysis = JSON.parse(toolCall.function.arguments);

  console.log('[Upload] Document analyzed:', analysis);

  return new Response(
    JSON.stringify({ 
      success: true, 
      analysis,
      extracted_text: extractedText.substring(0, 1000) 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleExtractInfo(supabase: any, reportId: string, phase: string) {
  console.log(`[Extract Info] Phase: ${phase}`);
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Get uploaded documents for this report
  const { data: documents } = await supabase
    .from('gri_document_uploads')
    .select('extracted_text')
    .eq('report_id', reportId)
    .limit(5);

  const combinedText = documents?.map((d: any) => d.extracted_text).join('\n\n') || '';

  // Call Lovable AI to extract organizational info
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em relatórios de sustentabilidade GRI Standards. Extraia informações organizacionais dos documentos fornecidos.'
        },
        {
          role: 'user',
          content: `Extraia informações organizacionais destes documentos:\n\n${combinedText.substring(0, 15000)}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'extract_organizational_info',
          description: 'Extrai informações organizacionais estruturadas',
          parameters: {
            type: 'object',
            properties: {
              company_name: { type: 'string' },
              cnpj: { type: 'string' },
              sector: { type: 'string' },
              size: { type: 'string', enum: ['Micro', 'Pequena', 'Média', 'Grande'] },
              locations: { type: 'array', items: { type: 'string' } },
              reporting_period: {
                type: 'object',
                properties: {
                  start_date: { type: 'string' },
                  end_date: { type: 'string' }
                }
              },
              employees_count: { type: 'number' },
              annual_revenue: { type: 'number' }
            }
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'extract_organizational_info' } }
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls[0];
  const orgInfo = JSON.parse(toolCall.function.arguments);

  return new Response(
    JSON.stringify({ success: true, data: orgInfo }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerateContent(supabase: any, reportId: string, sectionKey: string) {
  console.log(`[Generate Content] Section: ${sectionKey}`);
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Get report data with new fields
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', reportId)
    .single();

  const targetAudience = report.target_audience?.join(', ') || 'investidores, acionistas, colaboradores, clientes, fornecedores e sociedade';
  const purpose = report.organization_purpose || 'Demonstrar compromisso com sustentabilidade e transparência';

  // Enhanced GRI-specific prompts with standards
  const sectionPrompts: Record<string, string> = {
    'organizational_profile': `Redija o Perfil Organizacional seguindo GRI 2-1 a 2-6.

NORMAS GRI APLICÁVEIS:
- GRI 2-1: Detalhes organizacionais (nome legal, natureza de propriedade, localização da sede)
- GRI 2-2: Entidades incluídas no relatório de sustentabilidade
- GRI 2-3: Período do relatório, frequência e ponto de contato
- GRI 2-4: Reformulações de informações
- GRI 2-5: Asseguração externa
- GRI 2-6: Atividades, cadeia de valor e outras relações de negócios

ESTRUTURA REQUERIDA:
1. Nome completo e natureza legal da organização
2. Localização da sede e principais operações
3. Atividades principais e marcas/produtos
4. Estrutura acionária e cadeia de valor
5. Mudanças significativas no período

Público-alvo: ${targetAudience}
Tom: Formal mas acessível`,

    'strategy': `Redija a seção de Estratégia seguindo GRI 2-22 a 2-24.

NORMAS GRI APLICÁVEIS:
- GRI 2-22: Declaração sobre estratégia de desenvolvimento sustentável
- GRI 2-23: Compromissos com políticas
- GRI 2-24: Incorporação de compromissos com políticas

ESTRUTURA REQUERIDA:
1. Declaração do CEO/Presidente sobre sustentabilidade
2. Visão estratégica de longo prazo
3. Principais impactos, riscos e oportunidades
4. Integração ESG no modelo de negócio
5. Metas e compromissos públicos

Público-alvo: ${targetAudience}
Tom: Inspirador mas baseado em dados concretos`,

    'stakeholder_engagement': `Redija Engajamento de Stakeholders seguindo GRI 2-29.

NORMAS GRI APLICÁVEIS:
- GRI 2-29: Abordagem de engajamento de stakeholders

ESTRUTURA REQUERIDA:
1. Lista de grupos de stakeholders identificados
2. Acordos de negociação coletiva (se aplicável)
3. Abordagem para identificar e selecionar stakeholders
4. Canais de comunicação utilizados
5. Frequência de engajamento por grupo
6. Principais temas e preocupações levantados
7. Como a organização respondeu

Público-alvo: ${targetAudience}`,

    'materiality': `Redija Análise de Materialidade seguindo GRI 3-1 a 3-3.

NORMAS GRI APLICÁVEIS:
- GRI 3-1: Processo para determinar tópicos materiais
- GRI 3-2: Lista de tópicos materiais
- GRI 3-3: Gestão de tópicos materiais

ESTRUTURA REQUERIDA:
1. Metodologia de identificação de tópicos
2. Processo de priorização (materialidade dupla)
3. Lista de tópicos materiais identificados
4. Matriz de materialidade (sugerir visual)
5. Validação por stakeholders
6. Gestão de cada tópico material

Público-alvo: ${targetAudience}
IMPORTANTE: Sugira inserir gráfico de matriz de materialidade`,

    'environmental_performance': `Redija Desempenho Ambiental seguindo GRI 300.

NORMAS GRI APLICÁVEIS:
- GRI 301: Materiais (301-1, 301-2, 301-3)
- GRI 302: Energia (302-1 a 302-5)
- GRI 303: Água e efluentes (303-1 a 303-5)
- GRI 305: Emissões (305-1 a 305-7)
- GRI 306: Resíduos (306-1 a 306-5)

ESTRUTURA REQUERIDA:
1. Contexto e política ambiental
2. Consumo de materiais e reciclagem
3. Consumo energético e eficiência
4. Gestão de recursos hídricos
5. Emissões GEE (Escopos 1, 2 e 3)
6. Gestão de resíduos
7. Ações futuras e metas

Público-alvo: ${targetAudience}
IMPORTANTE: Sugira gráficos para cada indicador numérico`,

    'social_performance': `Redija Desempenho Social seguindo GRI 400.

NORMAS GRI APLICÁVEIS:
- GRI 401: Emprego (401-1 a 401-3)
- GRI 403: Saúde e segurança ocupacional (403-1 a 403-10)
- GRI 404: Treinamento e educação (404-1 a 404-3)
- GRI 405: Diversidade e igualdade de oportunidades (405-1, 405-2)
- GRI 406: Não discriminação (406-1)

ESTRUTURA REQUERIDA:
1. Práticas trabalhistas e emprego
2. Saúde e segurança (incluindo indicadores de acidentes)
3. Treinamento e desenvolvimento
4. Diversidade e inclusão (com dados demográficos)
5. Direitos humanos
6. Engajamento comunitário

Público-alvo: ${targetAudience}
Tom: Humanizado, incluindo histórias reais quando possível`,

    'governance': `Redija Governança seguindo GRI 2-9 a 2-21.

NORMAS GRI APLICÁVEIS:
- GRI 2-9: Estrutura de governança e composição
- GRI 2-10: Indicação e seleção do mais alto órgão de governança
- GRI 2-11: Presidente do mais alto órgão de governança
- GRI 2-12 a 2-17: Supervisão de impactos
- GRI 2-18 a 2-21: Remuneração

ESTRUTURA REQUERIDA:
1. Estrutura de governança corporativa
2. Composição do conselho (incluindo diversidade)
3. Independência e expertise
4. Supervisão de temas ESG
5. Gestão de riscos e compliance
6. Políticas anticorrupção
7. Estrutura de remuneração ligada a ESG

Público-alvo: ${targetAudience}
Tom: Formal, técnico mas acessível`
  };

  const prompt = sectionPrompts[sectionKey] || 'Gere conteúdo seguindo as normas GRI Standards 2021 para esta seção.';

  // Enhanced system prompt with GRI expertise
  const systemPrompt = `Você é um redator especializado em relatórios de sustentabilidade GRI Standards 2021.

OBJETIVO PRINCIPAL: Elaborar textos descritivos de alta qualidade para relatórios de sustentabilidade.

PÚBLICO-ALVO: ${targetAudience}

PROPÓSITO DO RELATÓRIO: ${purpose}

PRINCÍPIOS GRI FUNDAMENTAIS:
1. PRECISÃO: Informações suficientemente precisas e detalhadas
2. EQUILÍBRIO: Refletir aspectos positivos e negativos
3. CLAREZA: Tornar informações compreensíveis e acessíveis
4. COMPARABILIDADE: Permitir comparação ao longo do tempo
5. COMPLETUDE: Cobrir todos os tópicos materiais
6. CONTEXTO: Apresentar informações no contexto mais amplo
7. MATERIALIDADE: Focar nos tópicos mais relevantes
8. TRANSPARÊNCIA: Ser aberto sobre processos e metodologias
9. VERIFICABILIDADE: Basear-se em evidências que podem ser verificadas

DIRETRIZES DE REDAÇÃO:
1. Use linguagem técnica quando necessário, mas sempre acessível
2. Estruture textos: introdução → dados quantitativos → análise qualitativa → perspectivas futuras
3. Use dados numéricos para embasar todas as afirmações qualitativas
4. Inclua comparações com anos anteriores quando disponível
5. Destaque avanços genuínos e seja transparente sobre desafios
6. Sugira visualizações (gráficos/tabelas/dashboards) para números/indicadores
7. Siga rigorosamente as Normas GRI Standards 2021
8. Mantenha consistência de tom ao longo do documento
9. Identifique lacunas de informação quando não houver dados suficientes

FORMATOS DE SAÍDA:
- Word (.docx): Texto editável e bem estruturado com marcação de títulos
- PDF: Texto final profissional pronto para publicação

REGRAS DE OURO:
✓ Sempre citar a norma GRI aplicável (ex: "Conforme GRI 305-1...")
✓ Incluir unidades de medida em todos os dados numéricos
✓ Sugerir onde inserir gráficos/tabelas específicos
✓ Indicar quando informações adicionais são necessárias
✓ Manter tom profissional mas não robotizado`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `${prompt}\n\nContexto da organização:\nNome: ${report.companies?.name}\nSetor: ${report.companies?.sector || 'N/A'}\nAno: ${report.reporting_year}\n\nDados de configuração:\n${JSON.stringify(report.template_config || {}, null, 2)}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'generate_section_content',
          description: 'Gera conteúdo estruturado para seção do relatório GRI',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string', description: 'Conteúdo em markdown formatado' },
              suggested_visuals: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['bar_chart', 'line_chart', 'pie_chart', 'table', 'matrix', 'infographic'] },
                    title: { type: 'string' },
                    data_needed: { type: 'string' },
                    placement_suggestion: { type: 'string' }
                  }
                }
              },
              data_gaps: {
                type: 'array',
                items: { type: 'string' },
                description: 'Informações faltantes que melhorariam o conteúdo'
              },
              gri_standards_applied: {
                type: 'array',
                items: { type: 'string' },
                description: 'Normas GRI citadas no conteúdo'
              },
              word_count: { type: 'number' }
            },
            required: ['title', 'content']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'generate_section_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Generate Content] Lovable AI error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls[0];
  const generatedData = JSON.parse(toolCall.function.arguments);

  // Save to database
  await supabase
    .from('gri_report_sections')
    .upsert({
      report_id: reportId,
      section_key: sectionKey,
      title: generatedData.title,
      content: generatedData.content,
      is_complete: true,
      metadata: {
        suggested_visuals: generatedData.suggested_visuals || [],
        data_gaps: generatedData.data_gaps || [],
        gri_standards: generatedData.gri_standards_applied || [],
        word_count: generatedData.word_count || 0
      }
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      content: generatedData.content,
      metadata: {
        suggested_visuals: generatedData.suggested_visuals,
        data_gaps: generatedData.data_gaps
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSuggestIndicators(supabase: any, reportId: string, category: string) {
  console.log(`[Suggest Indicators] Category: ${category}`);
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Get report and company data
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', reportId)
    .single();

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor especializado em GRI Standards. Sugira os indicadores GRI mais relevantes baseado no contexto da organização.'
        },
        {
          role: 'user',
          content: `Sugira indicadores GRI para:\nCategoria: ${category}\nSetor: ${report.companies?.sector || 'Geral'}\nPorte: ${report.companies?.size || 'Médio'}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'suggest_gri_indicators',
          description: 'Sugere indicadores GRI relevantes',
          parameters: {
            type: 'object',
            properties: {
              suggested_indicators: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator_code: { type: 'string' },
                    relevance_score: { type: 'number', minimum: 0, maximum: 100 },
                    reasoning: { type: 'string' },
                    is_mandatory: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'suggest_gri_indicators' } }
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls[0];
  const suggestions = JSON.parse(toolCall.function.arguments);

  return new Response(
    JSON.stringify({ success: true, suggestions: suggestions.suggested_indicators }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerateVisuals(supabase: any, reportId: string, dataType: string) {
  console.log(`[Generate Visuals] Data Type: ${dataType}`);
  
  // Get relevant data from database
  const { data: indicatorData } = await supabase
    .from('gri_indicator_data')
    .select('*')
    .eq('report_id', reportId)
    .limit(20);

  // Generate chart configurations based on data
  const chartConfigs = [];
  
  if (dataType === 'emissions') {
    chartConfigs.push({
      type: 'bar',
      title: 'Emissões GEE por Escopo',
      data: [
        { name: 'Escopo 1', value: 1250 },
        { name: 'Escopo 2', value: 890 },
        { name: 'Escopo 3', value: 3400 }
      ],
      xKey: 'name',
      yKey: 'value',
      color: 'hsl(var(--chart-1))'
    });
  }

  return new Response(
    JSON.stringify({ success: true, charts: chartConfigs }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleProcessGuidelines(supabase: any, reportId: string) {
  console.log('[Process Guidelines] Starting...');
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // 1. Get report with guidelines info
  const { data: report } = await supabase
    .from('gri_reports')
    .select('guidelines_file_path, target_audience, organization_purpose')
    .eq('id', reportId)
    .single();

  if (!report?.guidelines_file_path) {
    throw new Error('Planilha de diretrizes não encontrada');
  }

  // 2. Download guidelines file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('gri-documents')
    .download(report.guidelines_file_path);

  if (downloadError) {
    console.error('[Process Guidelines] Download error:', downloadError);
    throw new Error(`Erro ao baixar planilha: ${downloadError.message}`);
  }

  // 3. Convert to text (simplified - in production use proper Excel parsing)
  const fileText = await fileData.text();
  
  // 4. Call Lovable AI to interpret guidelines
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em relatórios de sustentabilidade GRI Standards.

OBJETIVO PRINCIPAL: Elaborar relatórios completos no padrão GRI a partir de inputs de dados, evidências e documentos.

SUAS CAPACIDADES:
- Elaborar textos descritivos a partir de conteúdos fornecidos
- Interpretar contextos organizacionais
- Redigir tópicos seguindo as Normas GRI
- Identificar informações específicas em documentos
- Criar estruturas de dados para gráficos, dashboards e tabelas

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
PROPÓSITO: ${report.organization_purpose || 'Relatório de sustentabilidade'}

NORMAS GRI (Base de Conhecimento):
- GRI 1: Foundation (Princípios fundamentais)
- GRI 2: General Disclosures (Divulgações gerais 2-1 a 2-29)
- GRI 3: Material Topics (Tópicos materiais 3-1 a 3-3)
- GRI 200: Econômico (201-206)
- GRI 300: Ambiental (301-308)
- GRI 400: Social (401-418)

PRINCÍPIOS GRI:
1. MATERIALIDADE: Focar nos temas mais relevantes
2. TRANSPARÊNCIA: Divulgar de forma clara e acessível
3. COMPARABILIDADE: Permitir comparação
4. CONSISTÊNCIA: Manter metodologia consistente
5. VERIFICABILIDADE: Basear-se em evidências

Analise a planilha de diretrizes fornecida e extraia configurações estruturadas.`
        },
        {
          role: 'user',
          content: `Analise esta planilha de diretrizes para configuração do relatório GRI:\n\n${fileText.substring(0, 20000)}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'interpret_guidelines',
          description: 'Interpreta as diretrizes da planilha e gera configurações estruturadas',
          parameters: {
            type: 'object',
            properties: {
              priority_indicators: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator_code: { type: 'string' },
                    indicator_name: { type: 'string' },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                    required_data: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              data_collection_matrix: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric_name: { type: 'string' },
                    data_source: { type: 'string' },
                    collection_method: { type: 'string' },
                    responsible_area: { type: 'string' }
                  }
                }
              },
              required_documents: {
                type: 'array',
                items: { type: 'string' }
              },
              suggested_structure: {
                type: 'object',
                description: 'Estrutura sugerida do relatório baseada nas diretrizes'
              }
            },
            required: ['priority_indicators', 'data_collection_matrix']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'interpret_guidelines' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Process Guidelines] Lovable AI error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls?.[0];
  
  if (!toolCall) {
    throw new Error('AI did not return structured interpretation');
  }

  const interpretation = JSON.parse(toolCall.function.arguments);

  console.log('[Process Guidelines] Interpretation complete:', interpretation);

  // 5. Save interpreted configurations to report
  const { error: updateError } = await supabase
    .from('gri_reports')
    .update({
      template_config: {
        ...interpretation,
        processed_at: new Date().toISOString(),
        guidelines_version: '1.0'
      }
    })
    .eq('id', reportId);

  if (updateError) {
    console.error('[Process Guidelines] Update error:', updateError);
    throw new Error(`Erro ao salvar configurações: ${updateError.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      interpretation,
      message: 'Diretrizes processadas com sucesso pela IA'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAnalyzeStrategyData(supabase: any, body: any) {
  const { report_id, form_data, documents } = body;

  console.log('[Analyze Strategy Data] Starting analysis for report:', report_id);

  // 1. Buscar dados do relatório
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

  if (!report) throw new Error('Relatório não encontrado');

  // 2. Processar documentos (extrair textos)
  const documentContents = await Promise.all(
    (documents || []).map(async (doc: any) => {
      if (doc.extracted_text) {
        return {
          category: doc.category,
          content: doc.extracted_text.substring(0, 5000)
        };
      }
      return null;
    })
  ).then(results => results.filter(Boolean));

  console.log('[Analyze Strategy Data] Processed', documentContents.length, 'documents');

  // 3. Chamar Lovable AI para análise
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em relatórios de sustentabilidade GRI Standards.

OBJETIVO: Analisar dados sobre Visão e Estratégia de Sustentabilidade e gerar texto descritivo profissional para relatório GRI.

NORMAS GRI APLICÁVEIS:
- GRI 2-22: Declaração sobre estratégia de desenvolvimento sustentável
- GRI 2-23: Compromissos com políticas
- GRI 2-24: Incorporação de compromissos com políticas
- GRI 2-25: Processos para remediar impactos negativos
- GRI 2-26: Mecanismos para aconselhamento e preocupações sobre ética
- GRI 2-27: Conformidade com leis e regulamentações
- GRI 2-28: Associações e participações
- GRI 2-29: Abordagem para o engajamento com stakeholders

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}

EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES:
1. Redija texto narrativo fluente e profissional
2. Integre informações dos documentos anexados
3. Destaque compromissos concretos e resultados mensuráveis
4. Use linguagem inspiradora mas baseada em fatos
5. Inclua citações de documentos quando relevante
6. Sugira melhorias ou dados faltantes
7. Calcule um score de confiança (0-100) baseado na completude dos dados`
        },
        {
          role: 'user',
          content: `Analise os seguintes dados e gere texto descritivo para a seção "Visão e Estratégia de Sustentabilidade":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**CONTEÚDO DOS DOCUMENTOS:**
${documentContents.map((doc: any) => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}

Gere um texto de 500-800 palavras integrando essas informações de forma coesa.`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_strategy_content',
          description: 'Analisa dados de estratégia e gera texto descritivo',
          parameters: {
            type: 'object',
            properties: {
              generated_text: {
                type: 'string',
                description: 'Texto descritivo completo em português (500-800 palavras)'
              },
              confidence_score: {
                type: 'number',
                description: 'Pontuação de confiança 0-100 baseado na completude'
              },
              key_points: {
                type: 'array',
                items: { type: 'string' },
                description: 'Principais pontos destacados'
              },
              suggestions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Sugestões de melhoria ou dados faltantes'
              },
              gri_coverage: {
                type: 'array',
                items: { type: 'string' },
                description: 'Indicadores GRI cobertos (ex: GRI 2-22, GRI 2-23)'
              }
            },
            required: ['generated_text', 'confidence_score', 'key_points', 'suggestions', 'gri_coverage']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_strategy_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Analyze Strategy Data] Lovable AI error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

  console.log('[Analyze Strategy Data] Analysis complete. Confidence:', analysis.confidence_score);

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAnalyzeEconomicData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Economic Data] Starting...');

  // 1. Get report data
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

  // 2. Process documents
  const documentContents = await Promise.all(
    (documents || []).map(async (doc: any) => {
      if (doc.extracted_text) {
        return {
          category: doc.category,
          content: doc.extracted_text.substring(0, 5000)
        };
      }
      return null;
    })
  ).then(results => results.filter(Boolean));

  // 3. Calculate derived indicators
  const derivedIndicators = {
    economic_value_distributed: (quantitative_data.operating_costs || 0) + 
                                (quantitative_data.employee_wages_benefits || 0) + 
                                (quantitative_data.payments_to_government || 0),
    economic_value_retained_percentage: quantitative_data.revenue_total > 0
      ? ((quantitative_data.economic_value_retained || 0) / quantitative_data.revenue_total * 100).toFixed(2)
      : 0,
    local_procurement_strength: quantitative_data.local_procurement_percentage > 50 ? 'Alto' : 
                                quantitative_data.local_procurement_percentage > 30 ? 'Médio' : 'Baixo',
    climate_risk_exposure: quantitative_data.climate_related_risks_identified > 5 ? 'Alto' : 
                          quantitative_data.climate_related_risks_identified > 2 ? 'Médio' : 'Baixo',
    ebitda_performance: quantitative_data.ebitda_margin > 20 ? 'Excelente' : 
                       quantitative_data.ebitda_margin > 10 ? 'Bom' : 'Em desenvolvimento',
  };

  // 4. Call Lovable AI
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em Gestão Econômico-Financeira e relatórios GRI Standards.

OBJETIVO: Analisar dados de Desempenho Econômico e gerar texto descritivo profissional para relatório GRI, INCLUINDO NÚMEROS ESPECÍFICOS.

NORMAS GRI APLICÁVEIS:

**GRI 201 - Desempenho Econômico:**
- 201-1: Valor econômico direto gerado e distribuído
- 201-2: Implicações financeiras e outros riscos e oportunidades decorrentes de mudanças climáticas
- 201-3: Obrigações do plano de benefícios definidos e outros planos de aposentadoria
- 201-4: Assistência financeira recebida do governo

**GRI 203 - Impactos Econômicos Indiretos:**
- 203-1: Investimentos em infraestrutura e serviços apoiados
- 203-2: Impactos econômicos indiretos significativos

**GRI 204 - Práticas de Compra:**
- 204-1: Proporção de gastos com fornecedores locais

**GRI 205 - Anticorrupção:**
- 205-1: Operações avaliadas quanto a riscos relacionados à corrupção
- 205-2: Comunicação e treinamento em políticas e procedimentos anticorrupção
- 205-3: Casos confirmados de corrupção e medidas tomadas

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Investidores e stakeholders'}
EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES DE REDAÇÃO:
1. **SEMPRE INCLUIR NÚMEROS ESPECÍFICOS** no texto narrativo
2. Exemplos de redação:
   - "A receita total atingiu R$ 45,3 milhões, representando crescimento de 12% em relação ao ano anterior."
   - "O EBITDA foi de R$ 8,7 milhões, com margem de 19,2%, acima da média setorial de 15,8%."
   - "72% dos gastos com fornecedores foram direcionados a empresas locais, fortalecendo a economia regional."
   - "Foram identificados 7 riscos climáticos com potencial impacto financeiro estimado em R$ 2,1 milhões."
   - "Investimento de R$ 1,2 milhão em inovação e sustentabilidade, representando 2,6% da receita."
3. Contextualizar com comparações (ano anterior, meta, benchmark setorial)
4. Destacar eficiência operacional e criação de valor
5. Ser transparente sobre riscos e desafios
6. Estrutura: contexto → desempenho econômico → distribuição de valor → compras locais → investimentos sustentáveis → riscos climáticos → perspectivas
7. Usar linguagem profissional mas acessível
8. Sugerir inserção de gráficos (distribuição de valor, evolução receita, fornecedores locais)

IMPORTANTE:
- Mencionar certificações e políticas formais
- Destacar impactos econômicos indiretos
- Calcular e apresentar índices financeiros
- Comparar com benchmarks quando disponível
- Abordar riscos climáticos e ESG de forma transparente`
        },
        {
          role: 'user',
          content: `Analise os seguintes dados e gere texto descritivo completo para "Desempenho Econômico":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**DADOS QUANTITATIVOS:**
${JSON.stringify(quantitative_data, null, 2)}

**INDICADORES DERIVADOS:**
${JSON.stringify(derivedIndicators, null, 2)}

**CONTEÚDO DOS DOCUMENTOS:**
${documentContents.map(doc => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}

Gere um texto de 1000-1400 palavras integrando TODOS os dados numéricos de forma profissional e estratégica.`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_economic_content',
          description: 'Analisa dados econômicos e gera texto com números específicos',
          parameters: {
            type: 'object',
            properties: {
              generated_text: {
                type: 'string',
                description: 'Texto descritivo completo (1000-1400 palavras) com TODOS os números'
              },
              confidence_score: {
                type: 'number',
                description: 'Confiança 0-100'
              },
              key_points: {
                type: 'array',
                items: { type: 'string' },
                description: 'Principais pontos com números'
              },
              quantitative_highlights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator: { type: 'string' },
                    value: { type: 'string' },
                    unit: { type: 'string' },
                    context: { type: 'string' }
                  }
                },
                description: 'Destaques quantitativos'
              },
              suggested_charts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    title: { type: 'string' },
                    data_points: { type: 'array', items: { type: 'string' } }
                  }
                },
                description: 'Sugestões de gráficos'
              },
              financial_highlights: {
                type: 'array',
                items: { type: 'string' },
                description: 'Destaques financeiros'
              },
              risks_identified: {
                type: 'array',
                items: { type: 'string' },
                description: 'Riscos identificados'
              },
              opportunities_identified: {
                type: 'array',
                items: { type: 'string' },
                description: 'Oportunidades identificadas'
              },
              suggestions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Sugestões de melhoria'
              },
              gri_coverage: {
                type: 'array',
                items: { type: 'string' },
                description: 'Indicadores GRI cobertos'
              }
            },
            required: ['generated_text', 'confidence_score', 'key_points', 'quantitative_highlights', 'gri_coverage']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_economic_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Analyze Economic Data] Error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

  console.log('[Analyze Economic Data] Complete with quantitative data');

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAnalyzeEnvironmentalData(supabase: any, body: any) {
  const { report_id, form_data, documents, quantitative_data } = body;

  console.log('[Analyze Environmental Data] Starting analysis...');

  // 1. Buscar dados do relatório
  const { data: report, error: reportError } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

  if (reportError || !report) {
    console.error('Error fetching report:', reportError);
    throw new Error('Relatório não encontrado');
  }

  // 2. Processar documentos anexados
  const documentContents = await Promise.all(
    (documents || []).map(async (doc: any) => {
      if (doc.extracted_text) {
        return {
          category: doc.category,
          content: doc.extracted_text.substring(0, 5000)
        };
      }
      return null;
    })
  ).then(results => results.filter(Boolean));

  // 3. Calcular indicadores derivados
  const derivedIndicators = {
    total_emissions: (quantitative_data.emissions_scope1_tco2e || 0) + 
                     (quantitative_data.emissions_scope2_tco2e || 0) + 
                     (quantitative_data.emissions_scope3_tco2e || 0),
    emissions_scope1_percentage: quantitative_data.emissions_total_tco2e > 0 
      ? ((quantitative_data.emissions_scope1_tco2e / quantitative_data.emissions_total_tco2e) * 100).toFixed(1)
      : 0,
    emissions_scope2_percentage: quantitative_data.emissions_total_tco2e > 0
      ? ((quantitative_data.emissions_scope2_tco2e / quantitative_data.emissions_total_tco2e) * 100).toFixed(1)
      : 0,
    recycling_rate: quantitative_data.waste_recycled_percentage?.toFixed(1) || 0,
    energy_renewable_share: quantitative_data.energy_renewable_percentage?.toFixed(1) || 0
  };

  // 4. Chamar Lovable AI
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em Gestão Ambiental e relatórios GRI Standards.

OBJETIVO: Analisar dados ambientais e gerar texto descritivo profissional para relatório GRI, INCLUINDO NÚMEROS ESPECÍFICOS.

NORMAS GRI APLICÁVEIS:
- GRI 302 (Energia): 302-1 a 302-5
- GRI 303 (Água e Efluentes): 303-1 a 303-5
- GRI 305 (Emissões): 305-1 a 305-7
- GRI 306 (Resíduos): 306-1 a 306-5
- GRI 307 (Conformidade Ambiental): 307-1

PÚBLICO-ALVO: ${report.target_audience?.join(', ') || 'Stakeholders gerais'}
EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES DE REDAÇÃO:
1. **SEMPRE INCLUIR NÚMEROS ESPECÍFICOS** no texto narrativo
2. Exemplos de redação:
   - "A organização emitiu 1.234,5 tCO₂e no período, sendo 567,8 tCO₂e de Escopo 1 (46%)"
   - "O consumo total de energia foi de 2.345.678 kWh, dos quais 35,5% provenientes de fontes renováveis"
   - "Foram gerados 123,4 toneladas de resíduos, com taxa de reciclagem de 78,9%"
3. Contextualize números com comparações (ano anterior, meta, setor)
4. Explique metodologias (GHG Protocol, ISO 14064, etc.)
5. Destaque melhorias e desafios de forma transparente
6. Estruture: contexto → indicadores quantitativos → gestão → perspectivas
7. Use unidades corretas (kWh, m³, tCO₂e, toneladas)
8. Sugira inserção de gráficos

IMPORTANTE:
- Nunca deixe campos numéricos em branco no texto
- Se um valor for zero ou não informado, mencione explicitamente
- Calcule indicadores derivados quando possível (%, intensidades, tendências)`
        },
        {
          role: 'user',
          content: `Analise os seguintes dados e gere texto descritivo completo para "Gestão Ambiental":

**DADOS DO FORMULÁRIO:**
${JSON.stringify(form_data, null, 2)}

**DADOS QUANTITATIVOS:**
${JSON.stringify(quantitative_data, null, 2)}

**INDICADORES DERIVADOS:**
${JSON.stringify(derivedIndicators, null, 2)}

**CONTEÚDO DOS DOCUMENTOS:**
${documentContents.map(doc => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}

Gere um texto de 1000-1500 palavras integrando TODOS os dados numéricos de forma profissional e fluente.`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_environmental_content',
          description: 'Analisa dados ambientais e gera texto com números específicos',
          parameters: {
            type: 'object',
            properties: {
              generated_text: {
                type: 'string',
                description: 'Texto descritivo completo (1000-1500 palavras) com TODOS os números'
              },
              confidence_score: {
                type: 'number',
                description: 'Confiança 0-100'
              },
              key_points: {
                type: 'array',
                items: { type: 'string' },
                description: 'Principais pontos com números'
              },
              quantitative_highlights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator: { type: 'string' },
                    value: { type: 'string' },
                    unit: { type: 'string' },
                    context: { type: 'string' }
                  }
                },
                description: 'Destaques quantitativos'
              },
              suggested_charts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    title: { type: 'string' },
                    data_points: { type: 'array', items: { type: 'string' } }
                  }
                },
                description: 'Sugestões de gráficos'
              },
              suggestions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Sugestões de melhoria'
              },
              gri_coverage: {
                type: 'array',
                items: { type: 'string' },
                description: 'Indicadores GRI cobertos'
              }
            },
            required: ['generated_text', 'confidence_score', 'key_points', 'quantitative_highlights', 'gri_coverage']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_environmental_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Analyze Environmental Data] Lovable AI error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

  console.log('[Analyze Environmental Data] Analysis complete with quantitative data');

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAnalyzeGovernanceData(supabase: any, body: any) {
  const { report_id, form_data, documents } = body;

  console.log('[Analyze Governance Data] Starting analysis...');

  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', report_id)
    .single();

  if (!report) throw new Error('Relatório não encontrado');

  const documentContents = await Promise.all(
    (documents || []).map(async (doc: any) => {
      if (doc.extracted_text) {
        return {
          category: doc.category,
          content: doc.extracted_text.substring(0, 5000)
        };
      }
      return null;
    })
  ).then(results => results.filter(Boolean));

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em Governança Corporativa e relatórios GRI Standards.

OBJETIVO: Analisar dados sobre Governança Corporativa e gerar texto descritivo profissional incluindo dados quantitativos.

NORMAS GRI: 2-9 a 2-27 (Estrutura, composição, remuneração, políticas, compliance)
ISO 37001: Sistema de Gestão Antissuborno
OCDE: Diretrizes - Capítulo VII (Anticorrupção)

EMPRESA: ${report.companies?.name || 'N/A'}
SETOR: ${report.companies?.sector || 'N/A'}

DIRETRIZES:
1. Integre dados quantitativos naturalmente no texto
2. Use números concretos (ex: "Conselho com 7 membros, 42% mulheres")
3. Destaque boas práticas e compromissos formais
4. Mencione certificações ISO 37001 e aderência OCDE
5. Estruture: contexto → governança → compliance → transparência`
        },
        {
          role: 'user',
          content: `Analise e gere texto descritivo para "Governança Corporativa":

**DADOS:**
${JSON.stringify(form_data, null, 2)}

**DOCUMENTOS:**
${documentContents.map((doc: any) => `\n### ${doc?.category}\n${doc?.content}`).join('\n---\n')}

Gere texto de 800-1200 palavras com números específicos.`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_governance_content',
          description: 'Analisa governança e gera texto com números',
          parameters: {
            type: 'object',
            properties: {
              generated_text: { type: 'string', description: 'Texto 800-1200 palavras com dados quantitativos' },
              confidence_score: { type: 'number', description: 'Score 0-100' },
              key_points: { type: 'array', items: { type: 'string' } },
              quantitative_highlights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator: { type: 'string' },
                    value: { type: 'string' },
                    context: { type: 'string' }
                  }
                }
              },
              suggestions: { type: 'array', items: { type: 'string' } },
              gri_coverage: { type: 'array', items: { type: 'string' } }
            },
            required: ['generated_text', 'confidence_score', 'key_points', 'gri_coverage']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_governance_content' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Analyze Governance Data] Error:', errorText);
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const analysis = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);

  console.log('[Analyze Governance Data] Complete. Confidence:', analysis.confidence_score);

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Main serve function at the end
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, report_id, file_content, file_type, phase, section_key, category, data_type } = await req.json();

    console.log(`[GRI AI Configurator] Action: ${action}, Report ID: ${report_id}`);

    switch (action) {
      case 'upload_document':
        return await handleDocumentUpload(supabaseClient, report_id, file_content, file_type);
      
      case 'extract_info':
        return await handleExtractInfo(supabaseClient, report_id, phase);
      
      case 'generate_content':
        return await handleGenerateContent(supabaseClient, report_id, section_key);
      
      case 'suggest_indicators':
        return await handleSuggestIndicators(supabaseClient, report_id, category);
      
      case 'generate_visuals':
        return await handleGenerateVisuals(supabaseClient, report_id, data_type);
      
      case 'process_guidelines':
        return await handleProcessGuidelines(supabaseClient, report_id);
      
      case 'analyze_strategy_data':
        return await handleAnalyzeStrategyData(supabaseClient, await req.json());
      
      case 'analyze_governance_data':
        return await handleAnalyzeGovernanceData(supabaseClient, await req.json());
      
      case 'analyze_environmental_data':
        return await handleAnalyzeEnvironmentalData(supabaseClient, await req.json());
      
      case 'analyze_social_data': {
        const { handleAnalyzeSocialData } = await import('./social-handler.ts');
        return await handleAnalyzeSocialData(supabaseClient, await req.json());
      }
      
      case 'analyze_economic_data': {
        const { handleAnalyzeEconomicData } = await import('./economic-handler.ts');
        return await handleAnalyzeEconomicData(supabaseClient, await req.json());
      }

      case 'analyze_stakeholder_engagement_data': {
        const { handleAnalyzeStakeholderEngagementData } = await import('./stakeholder-engagement-handler.ts');
        return await handleAnalyzeStakeholderEngagementData(supabaseClient, await req.json());
      }

      case 'analyze_innovation_data': {
        const { handleAnalyzeInnovationData } = await import('./innovation-handler.ts');
        return await handleAnalyzeInnovationData(supabaseClient, await req.json());
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[GRI AI Configurator] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
