import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting document-ai-processor...');
    
    // Create client for user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Unauthorized: No authorization header');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      console.error('Unauthorized: No user found');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    
    console.log('User authenticated:', user.id);
    
    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { document_id, processing_type, action, preview_id } = await req.json()
    console.log('Request:', { document_id, processing_type, action, preview_id });

    // Handle approval/rejection actions
    if (action === 'approve' || action === 'reject') {
      return await handleApprovalAction(supabaseAdmin, action, preview_id, user.id);
    }

    // Continue with document processing
    console.log('Processing document:', document_id, 'Type:', processing_type);

    // Get document info
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      console.error('Document not found:', docError);
      throw new Error('Document not found')
    }

    // Create job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('document_extraction_jobs')
      .insert({
        document_id,
        processing_type: processing_type || 'general_extraction',
        status: 'Processando',
        company_id: document.company_id,
        user_id: user.id
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create job:', jobError);
      throw new Error(`Failed to create job: ${jobError.message}`)
    }

    console.log('Job created:', job.id);

    // Process document in background
    EdgeRuntime.waitUntil(processDocumentWithAI(supabaseAdmin, job.id, document, user.id));

    return new Response(JSON.stringify(job), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in document-ai-processor:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processDocumentWithAI(supabaseClient: any, jobId: string, document: any, userId: string) {
  try {
    console.log('Starting AI processing for job:', jobId);

    // 1. Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    console.log('File downloaded, size:', fileData.size, 'type:', document.file_type);

    // 2. Extract content based on file type
    let extractedContent = '';
    let imageBase64 = '';

    if (document.file_type === 'application/pdf') {
      // For PDFs, call parse-chat-document
      const formData = new FormData();
      formData.append('file', fileData, document.file_name);
      
      const parseResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/parse-chat-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          filePath: document.file_path,
          fileType: document.file_type
        })
      });

      if (parseResponse.ok) {
        const parseResult = await parseResponse.json();
        extractedContent = parseResult.content || '';
      }
    } else if (document.file_type.startsWith('image/')) {
      // For images, convert to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      imageBase64 = `data:${document.file_type};base64,${base64}`;
    }

    console.log('Content extracted, length:', extractedContent.length, 'has image:', !!imageBase64);

    // 3. Analyze with Lovable AI
    const analysisPrompt = buildAnalysisPrompt(document.file_name, extractedContent);
    
    const aiMessages: any[] = [
      { role: "system", content: "Você é um assistente especializado em análise de documentos ESG e ambientais. Sua tarefa é extrair dados estruturados de documentos e sugerir onde no sistema eles devem ser registrados." },
      { role: "user", content: analysisPrompt }
    ];

    // Add image if available
    if (imageBase64) {
      aiMessages[1].content = [
        { type: "text", text: analysisPrompt },
        { type: "image_url", image_url: { url: imageBase64 } }
      ];
    }

    console.log('Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',  // Using Pro model for complex document analysis
        messages: aiMessages,
        tools: [{
          type: "function",
          function: {
            name: "extract_document_data",
            description: "Extrai dados estruturados do documento e sugere tabelas de destino com confiança por campo",
            parameters: {
              type: "object",
              properties: {
                document_type: {
                  type: "string",
                  description: "Tipo identificado do documento (ex: licenca_ambiental, nota_fiscal_residuos, conta_energia, relatorio_emissoes, etc.)"
                },
                confidence: {
                  type: "number",
                  description: "Confiança geral na identificação do tipo de documento (0-100)"
                },
                suggested_tables: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de tabelas do sistema onde os dados devem ser inseridos (pode ser múltiplas)"
                },
                extracted_fields: {
                  type: "object",
                  description: "Campos extraídos organizados por tabela. Estrutura: { 'table_name': { 'field_name': value } }. SEMPRE normalize dados (datas ISO, números limpos, unidades padrão)."
                },
                field_confidence: {
                  type: "object",
                  description: "Confiança individual para cada campo extraído (0.0-1.0). Estrutura: { 'field_name': 0.85 }. OBRIGATÓRIO para TODOS os campos."
                },
                extraction_reasoning: {
                  type: "object",
                  description: "Explicação do raciocínio para cada campo extraído. Estrutura: { 'field_name': 'Raciocínio detalhado...' }. Explique: de onde veio o valor, qual normalização foi feita, por que essa confiança."
                },
                summary: {
                  type: "string",
                  description: "Resumo executivo do documento (2-3 frases)"
                },
                data_quality_issues: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de problemas encontrados nos dados (ex: 'Data sem ano inferido', 'Unidade não especificada', 'Valor ilegível estimado')"
                }
              },
              required: ["document_type", "confidence", "suggested_tables", "extracted_fields", "field_confidence", "extraction_reasoning", "summary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_document_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Data extracted successfully!');
    console.log('- Document type:', extractedData.document_type);
    console.log('- Overall confidence:', extractedData.confidence);
    console.log('- Target tables:', extractedData.suggested_tables?.join(', '));
    console.log('- Fields extracted:', Object.keys(extractedData.extracted_fields || {}).length);
    console.log('- Data quality issues:', extractedData.data_quality_issues?.length || 0);

    // 4. Save extracted data preview
    const { error: previewError } = await supabaseClient
      .from('extracted_data_preview')
      .insert({
        extraction_job_id: jobId,
        company_id: document.company_id,
        target_table: extractedData.suggested_tables[0] || 'unknown',
        extracted_fields: extractedData.extracted_fields,
        confidence_scores: extractedData.field_confidence || {},
        suggested_mappings: {
          document_type: extractedData.document_type,
          summary: extractedData.summary,
          all_suggested_tables: extractedData.suggested_tables,
          extraction_reasoning: extractedData.extraction_reasoning || {},
          data_quality_issues: extractedData.data_quality_issues || []
        },
        validation_status: 'Pendente'
      });

    if (previewError) {
      console.error('Failed to save preview:', previewError);
    }

    // 5. Update job status
    await supabaseClient
      .from('document_extraction_jobs')
      .update({
        status: 'Concluído',
        completed_at: new Date().toISOString(),
        confidence_score: extractedData.confidence / 100
      })
      .eq('id', jobId);

    console.log('Job completed successfully:', jobId);

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update job with error
    await supabaseClient
      .from('document_extraction_jobs')
      .update({
        status: 'Erro',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', jobId);
  }
}

function buildAnalysisPrompt(fileName: string, content: string): string {
  return `
# SISTEMA DE ANÁLISE INTELIGENTE DE DOCUMENTOS ESG/AMBIENTAL

Você é um especialista em extração de dados de documentos ESG bagunçados, confusos e mal formatados. Sua missão é **SEMPRE extrair informações úteis**, mesmo quando os dados estão incompletos, mal escritos ou organizados de forma não convencional.

---

## 📄 DOCUMENTO A ANALISAR

**Nome do arquivo:** ${fileName}

**Conteúdo do documento:**
${content ? content.substring(0, 12000) : 'Conteúdo não disponível em texto. IMPORTANTE: Analise a imagem fornecida com atenção máxima, aplicando OCR se necessário. Busque por tabelas, carimbos, assinaturas, números de protocolo, datas manuscritas, etc.'}

---

## 🎯 INSTRUÇÕES CRÍTICAS PARA LIDAR COM DADOS BAGUNÇADOS

### 1. NORMALIZAÇÃO INTELIGENTE
- **Datas**: Aceite QUALQUER formato (DD/MM/YYYY, DD-MM-YY, "15 de março de 2024", "15/03/24") e converta para YYYY-MM-DD
- **CNPJ/CPF**: Extraia mesmo sem pontuação (12345678000190 → 12.345.678/0001-90)
- **Números**: Reconheça vírgulas/pontos como separadores decimais (1.234,56 → 1234.56)
- **Unidades**: Converta automaticamente (kg→toneladas se >1000, L→m³, kWh→MWh)
- **Valores monetários**: Extraia números mesmo com "R$", "$", espaços, pontos, vírgulas

### 2. INFERÊNCIA E CONTEXTO
- Se faltar o **ano**, infira do contexto (ex: "validade até 03/2026" → assumir dia 31)
- Se faltar **unidade**, deduza pelo contexto (ex: "Resíduo Classe II - 500" → assumir kg se não especificado)
- Se houver **abreviações** comuns, expanda-as: "Lic. Op." → "Licença de Operação", "CETESB" → manter sigla mas adicionar como issuing_body

### 3. CORREÇÃO DE ERROS DE OCR
- Troque confusões comuns: O↔0, l↔1, S↔5, B↔8, |↔I
- Corrija erros de espaçamento: "L icença" → "Licença"
- Ignore caracteres especiais estranhos: "L¡cença" → "Licença"

### 4. EXTRAÇÃO AGRESSIVA
- **SEMPRE** extraia ALGUMA informação, mesmo que parcial
- Se não tiver certeza, extraia com confiança baixa (<60%) mas EXTRAIA
- Campos em branco SÓ se realmente não houver NADA no documento
- Se houver múltiplas interpretações, escolha a mais provável

### 5. RACIOCÍNIO EXPLÍCITO (Chain-of-Thought)
Para CADA campo extraído, você DEVE explicar seu raciocínio no campo "extraction_reasoning":
- Por que identificou esse valor?
- Qual parte do documento usou?
- Qual foi a confiança e por quê?
- Houve alguma inferência ou correção?

Exemplo: 
\`\`\`json
"license_number": "123/2024",
"license_number_confidence": 0.95,
"license_number_reasoning": "Encontrado no cabeçalho como 'Licença nº 123/2024'. Alta confiança pois está claramente identificado e segue padrão CETESB."
\`\`\`

---

## 🗄️ TABELAS COMPLETAS DO SISTEMA (50+ tabelas mapeadas)

### **AMBIENTAL & LICENCIAMENTO**
- **licenses**: Licenças ambientais
  - Campos: license_name, license_number, license_type, issuing_body, issue_date, expiration_date, status, validity_period, conditions, covered_activities, monitoring_requirements
- **assets**: Ativos e instalações físicas
  - Campos: name, asset_type, location, description, productive_capacity, capacity_unit, installation_year, operational_status, pollution_potential, cnae_code
- **environmental_incidents**: Incidentes ambientais
  - Campos: incident_date, incident_type, severity, location, description, immediate_actions, root_cause

### **EMISSÕES GEE**
- **emission_sources**: Fontes de emissão
  - Campos: source_name, scope, category, fuel_type, location, emission_factor, description
- **activity_data**: Dados de atividade
  - Campos: emission_source_id, quantity, unit, period_start_date, period_end_date, notes
- **transport_distribution**: Transporte e distribuição
  - Campos: direction, transport_mode, fuel_type, distance_km, weight_tonnes, fuel_consumption

### **RESÍDUOS**
- **waste_logs**: Registros de resíduos
  - Campos: waste_type, waste_class, quantity, unit, log_date, treatment_method, disposal_site, mtr_number, notes
- **waste_suppliers**: Fornecedores de gestão de resíduos
  - Campos: company_name, cnpj, supplier_type, contact_name, contact_email, license_number, license_type, license_expiry, status
- **pgrs_plans**: Planos de gerenciamento de resíduos
  - Campos: plan_name, creation_date, status, version, responsible_user_id

### **RECURSOS NATURAIS**
- **energy_consumption**: Consumo de energia
  - Campos: source_type, quantity_kwh, consumption_date, cost, supplier, invoice_number, demand_kw
- **water_consumption**: Consumo de água
  - Campos: source, quantity_m3, consumption_date, cost, invoice_number, water_type
- **wastewater_treatment**: Tratamento de efluentes
  - Campos: treatment_type, volume_treated, organic_load_bod, nitrogen_content, discharge_pathway, ch4_emissions, n2o_emissions

### **FORNECEDORES & STAKEHOLDERS**
- **suppliers**: Fornecedores gerais
  - Campos: name, cnpj, contact_email, contact_phone, address, category, status, qualification_status, rating, notes
- **stakeholders**: Partes interessadas
  - Campos: name, category, contact_email, contact_phone, influence_level, interest_level, engagement_strategy
- **stakeholder_assessments**: Avaliações de materialidade
  - Campos: assessment_year, methodology, participants_count, assessment_date, status

### **COMPLIANCE & AUDITORIAS**
- **audits**: Auditorias
  - Campos: title, audit_type, auditor, start_date, end_date, scope, status
- **nonconformities**: Não conformidades
  - Campos: title, description, severity, detection_date, deadline, responsible_user_id, status, corrective_action
- **findings**: Constatações de auditoria
  - Campos: audit_id, finding_type, description, severity, evidence, recommendations

### **TREINAMENTOS & RH**
- **training_programs**: Programas de treinamento
  - Campos: name, description, category, duration_hours, is_mandatory, valid_for_months, status
- **employees**: Funcionários
  - Campos: full_name, email, phone, hire_date, department, position, employment_type, status
- **attendance_records**: Registros de ponto
  - Campos: employee_id, date, check_in, check_out, total_hours, overtime_hours, status
- **leave_requests**: Solicitações de afastamento
  - Campos: employee_id, leave_type_id, start_date, end_date, reason, status

### **METAS & ESTRATÉGIA**
- **goals**: Metas ESG
  - Campos: title, description, category, baseline_value, target_value, unit, target_date, progress_percentage, status
- **okrs**: OKRs (Objectives and Key Results)
  - Campos: title, description, period_start, period_end, owner_user_id, status, progress_percentage
- **key_results**: Resultados-chave
  - Campos: okr_id, title, description, target_value, current_value, unit, progress_percentage, status

### **RISCOS & OPORTUNIDADES**
- **risks**: Riscos
  - Campos: title, description, category, probability, impact, risk_level, status, mitigation_actions
- **opportunities**: Oportunidades
  - Campos: title, description, category, probability, impact, potential_value, implementation_cost, roi_estimate, status
- **risk_occurrences**: Ocorrências de risco
  - Campos: risk_id, occurrence_date, actual_impact, financial_impact, operational_impact, response_actions, status

### **RELATÓRIOS & FRAMEWORKS**
- **gri_reports**: Relatórios GRI
  - Campos: report_year, reporting_period_start, reporting_period_end, gri_version, status
- **gri_disclosures**: Divulgações GRI
  - Campos: report_id, disclosure_number, disclosure_name, topic, content_text, quantitative_data, data_sources
- **tcfd_disclosures**: Divulgações TCFD
  - Campos: pillar, recommendation_id, recommendation_title, disclosure_content, implementation_status, maturity_level, status
- **ifrs_disclosures**: Divulgações IFRS S1/S2
  - Campos: disclosure_id, disclosure_name, category, requirement_type, disclosure_content, quantitative_data, status
- **tnfd_disclosures**: Divulgações TNFD
  - Campos: pillar, disclosure_id, disclosure_title, nature_related_topic, biomes_ecosystems, disclosure_content, status

### **PROCESSOS & QUALIDADE**
- **process_maps**: Mapas de processos
  - Campos: process_name, process_type, description, objective, owner_user_id, status
- **action_plans**: Planos de ação
  - Campos: title, description, objective, plan_type, status
- **projects**: Projetos
  - Campos: project_name, description, project_type, start_date, end_date, budget, status, progress_percentage

### **BIODIVERSIDADE & CONSERVAÇÃO**
- **conservation_areas**: Áreas de conservação
  - Campos: area_name, location, area_hectares, biome_type, protection_status, management_plan
- **conservation_activities**: Atividades de conservação
  - Campos: activity_type_id, conservation_area_id, activity_date, area_hectares, carbon_sequestered_tonnes

### **DOCUMENTOS & GOVERNANÇA**
- **documents**: Documentos gerais do sistema
  - Campos: file_name, file_type, document_type, code, related_model, related_id, folder_id, tags, effective_date, controlled_copy

---

## 📚 EXEMPLOS DE EXTRAÇÕES BEM-SUCEDIDAS (Multi-Shot Learning)

### Exemplo 1: Licença Ambiental Bagunçada
**Documento:** "LIC OPERAÇÃO 456-2023 CETESB válida até 15março2025 Empresa: ACME LTDA CNPJ: 12345678000190"

**Extração:**
\`\`\`json
{
  "document_type": "licenca_ambiental",
  "confidence": 85,
  "suggested_tables": ["licenses"],
  "extracted_fields": {
    "license_number": "456/2023",
    "license_type": "Licença de Operação",
    "issuing_body": "CETESB",
    "expiration_date": "2025-03-15",
    "status": "Ativa"
  },
  "field_confidence": {
    "license_number": 0.90,
    "license_type": 0.85,
    "issuing_body": 0.95,
    "expiration_date": 0.80,
    "status": 0.75
  },
  "extraction_reasoning": {
    "license_number": "Identificado 'LIC OPERAÇÃO 456-2023', normalizado para 456/2023",
    "license_type": "Abreviação 'LIC OPERAÇÃO' expandida para 'Licença de Operação'",
    "expiration_date": "Data '15março2025' sem espaços, convertida para formato ISO assumindo último dia do mês"
  }
}
\`\`\`

### Exemplo 2: Nota Fiscal de Resíduos com Erros OCR
**Documento:** "NF 789 Res|duo C1asse II - Plásti co 1.250 Kg 20/04/2024 Destinad0r: ECOLIXO LTDA"

**Extração:**
\`\`\`json
{
  "document_type": "nota_fiscal_residuos",
  "confidence": 75,
  "suggested_tables": ["waste_logs", "waste_suppliers"],
  "extracted_fields": {
    "waste_logs": {
      "waste_type": "Plástico",
      "waste_class": "Classe II",
      "quantity": 1.25,
      "unit": "toneladas",
      "log_date": "2024-04-20",
      "disposal_site": "ECOLIXO LTDA"
    },
    "waste_suppliers": {
      "company_name": "ECOLIXO LTDA",
      "supplier_type": "Tratamento e Destinação"
    }
  },
  "field_confidence": {
    "waste_type": 0.85,
    "waste_class": 0.90,
    "quantity": 0.70,
    "unit": 0.65
  },
  "extraction_reasoning": {
    "waste_type": "Corrigido erro OCR 'Plásti co' → 'Plástico'",
    "quantity": "Convertido 1.250 Kg para 1.25 toneladas (padrão do sistema)",
    "unit": "Inferido conversão kg→toneladas pois valor >1000kg, confiança média pois não explícito"
  }
}
\`\`\`

### Exemplo 3: Conta de Energia Incompleta
**Documento:** "CPFL Consumo: 3450 Valor: R$ 2.875,00 Ref: 03/2024"

**Extração:**
\`\`\`json
{
  "document_type": "conta_energia",
  "confidence": 70,
  "suggested_tables": ["energy_consumption"],
  "extracted_fields": {
    "source_type": "Rede Elétrica",
    "quantity_kwh": 3450,
    "consumption_date": "2024-03-31",
    "cost": 2875.00,
    "supplier": "CPFL"
  },
  "field_confidence": {
    "source_type": 0.60,
    "quantity_kwh": 0.95,
    "consumption_date": 0.65,
    "cost": 0.90,
    "supplier": 0.95
  },
  "extraction_reasoning": {
    "source_type": "Inferido como 'Rede Elétrica' pois CPFL é distribuidora, mas não explícito no doc (baixa confiança)",
    "consumption_date": "Referência '03/2024' convertida para último dia do mês (31/03/2024) assumindo fechamento mensal",
    "cost": "Valor 'R$ 2.875,00' normalizado para 2875.00 (ponto como decimal)"
  }
}
\`\`\`

---

## 🎯 TAREFA FINAL

1. **IDENTIFIQUE o tipo de documento** com base em palavras-chave, estrutura, logos, carimbos
2. **EXTRAIA TODOS os campos** relevantes aplicando TODAS as técnicas de normalização acima
3. **SUGIRA as tabelas** corretas do sistema (pode ser múltiplas tabelas)
4. **FORNEÇA confiança individual por campo** (0.0 a 1.0)
5. **EXPLIQUE seu raciocínio** para cada campo extraído
6. **NUNCA deixe campos importantes vazios** - extraia parcialmente com baixa confiança se necessário

**LEMBRE-SE:** Documentos reais são bagunçados! Seu trabalho é ser INTELIGENTE e extrair informações úteis mesmo do caos.

Execute a extração agora usando a função \`extract_document_data\`.
`;
}

async function handleApprovalAction(supabaseClient: any, action: string, previewId: string, userId: string) {
  try {
    console.log(`Handling ${action} for preview:`, previewId);

    // Get preview data
    const { data: preview, error: previewError } = await supabaseClient
      .from('extracted_data_preview')
      .select('*')
      .eq('id', previewId)
      .single();

    if (previewError || !preview) {
      throw new Error('Preview not found');
    }

    if (action === 'approve') {
      // Insert data into target table
      const recordData = {
        ...preview.extracted_fields,
        company_id: preview.company_id,
        created_at: new Date().toISOString()
      };

      // Special handling for specific tables
      const tableName = preview.target_table;
      
      if (tableName === 'licenses') {
        recordData.status = recordData.status || 'Ativa';
      } else if (tableName === 'waste_logs') {
        recordData.log_date = recordData.log_date || new Date().toISOString().split('T')[0];
      } else if (tableName === 'emission_sources') {
        recordData.scope = recordData.scope || 1;
      }

      const { data: insertedData, error: insertError } = await supabaseClient
        .from(tableName)
        .insert(recordData)
        .select()
        .single();

      if (insertError) {
        console.error(`Error inserting into ${tableName}:`, insertError);
        throw new Error(`Failed to insert into ${tableName}: ${insertError.message}`);
      }

      console.log(`Inserted into ${tableName}:`, insertedData.id);

      // Update preview status
      await supabaseClient
        .from('extracted_data_preview')
        .update({
          validation_status: 'Aprovado',
          approved_at: new Date().toISOString(),
          approved_by_user_id: userId
        })
        .eq('id', previewId);

      console.log('Approval completed');

      return new Response(JSON.stringify({
        success: true,
        message: 'Dados aprovados e inseridos com sucesso',
        inserted_record: insertedData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'reject') {
      // Update preview status to rejected
      await supabaseClient
        .from('extracted_data_preview')
        .update({
          validation_status: 'Rejeitado',
          approved_at: new Date().toISOString(),
          approved_by_user_id: userId
        })
        .eq('id', previewId);

      console.log('Rejection completed');

      return new Response(JSON.stringify({
        success: true,
        message: 'Extração rejeitada'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in approval action:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}