import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentAnalysisRequest {
  documentPath: string;
}

interface ExtractedLicenseFormData {
  nome: string;
  tipo: string;
  orgaoEmissor: string;
  numeroProcesso: string;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  condicionantes: string;
  structured_conditions: LicenseCondition[];
  alerts: LicenseAlert[];
  compliance_score: number;
  renewal_recommendation: RenewalRecommendation;
  confidence_scores: {
    nome: number;
    tipo: number;
    orgaoEmissor: number;
    numeroProcesso: number;
    dataEmissao: number;
    dataVencimento: number;
    status: number;
    condicionantes: number;
  };
}

interface LicenseCondition {
  condition_text: string;
  condition_category: string;
  priority: 'low' | 'medium' | 'high';
  frequency?: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' | 'Unica';
  due_date?: string;
  responsible_area?: string;
  compliance_status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

interface LicenseAlert {
  type: 'renewal' | 'condition_due' | 'compliance_issue' | 'document_required';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  action_required: boolean;
}

interface RenewalRecommendation {
  start_date: string;
  urgency: 'low' | 'medium' | 'high';
  required_documents: string[];
  estimated_cost?: number;
  recommended_actions: string[];
}

interface LicenseContext {
  licenseType?: string;
  issuingBody?: string;
  businessSector?: string;
  activityType?: string;
}

// Specialized prompts based on license context
function getSpecializedPrompt(documentContent: string): string {
  const context = detectLicenseContext(documentContent);
  
  let basePrompt = `
Você é um especialista em licenciamento ambiental brasileiro com profundo conhecimento em:
- Legislação ambiental federal, estadual e municipal
- Procedimentos dos órgãos ambientais (IBAMA, CETESB, FEPAM, INEA, etc.)
- Condicionantes técnicas por setor industrial
- Prazos e cronogramas de renovação
- Compliance ambiental corporativo

CONTEXTO DETECTADO:
- Tipo de Licença: ${context.licenseType || 'Detectar automaticamente'}
- Órgão Emissor: ${context.issuingBody || 'Detectar automaticamente'}
- Setor de Atividade: ${context.businessSector || 'Detectar automaticamente'}

INSTRUÇÕES ESPECÍFICAS:
`;

  // Add specialized instructions based on context
  if (context.licenseType?.includes('LP')) {
    basePrompt += `
ANÁLISE ESPECÍFICA PARA LICENÇA PRÉVIA (LP):
- Foque em viabilidade ambiental e localização
- Identifique estudos ambientais exigidos (EIA/RIMA, EAS, RCA)
- Extraia condicionantes de concepção e alternativas tecnológicas
- Analise restrições de localização e distâncias mínimas
- Identifique exigências para fase de LI
`;
  } else if (context.licenseType?.includes('LI')) {
    basePrompt += `
ANÁLISE ESPECÍFICA PARA LICENÇA DE INSTALAÇÃO (LI):
- Foque em especificações técnicas e cronogramas
- Extraia condicionantes de construção e instalação  
- Identifique sistemas de controle ambiental exigidos
- Analise prazos de obras e marcos de execução
- Identifique documentos para LO
`;
  } else if (context.licenseType?.includes('LO')) {
    basePrompt += `
ANÁLISE ESPECÍFICA PARA LICENÇA DE OPERAÇÃO (LO):
- Foque em condicionantes operacionais e monitoramento
- Extraia frequências de relatórios e monitoramentos
- Identifique parâmetros de emissões e efluentes
- Analise obrigações de automonitoramento
- Calcule cronograma de renovação (geralmente 4-10 anos)
`;
  }

  if (context.issuingBody?.includes('IBAMA')) {
    basePrompt += `
ESPECIFICIDADES DO IBAMA:
- Atividades de significativo impacto ambiental nacional
- Foco em fauna, flora e unidades de conservação
- Condicionantes federais específicas
- Prazos e procedimentos federais
`;
  } else if (context.issuingBody?.includes('CETESB')) {
    basePrompt += `
ESPECIFICIDADES DA CETESB (SP):
- Padrões de qualidade do ar de São Paulo
- CADRI para resíduos industriais  
- Emissões veiculares e combustíveis
- Licenciamento por porte e potencial poluidor
`;
  }

  if (context.businessSector?.includes('mineração')) {
    basePrompt += `
SETOR MINERAÇÃO:
- PAE (Plano de Aproveitamento Econômico)
- PRAD (Plano de Recuperação de Área Degradada)
- Plano de fechamento de mina
- Monitoramento de águas subterrâneas
`;
  } else if (context.businessSector?.includes('petróleo')) {
    basePrompt += `
SETOR PETRÓLEO & GÁS:
- Planos de emergência individual (PEI)
- Estudos de dispersão de óleo
- Monitoramento da biota aquática
- Análise de risco ecológico
`;
  }

  basePrompt += `
ANÁLISE REQUERIDA:

1. DADOS BÁSICOS DA LICENÇA:
- Nome/título da licença
- Tipo (LP, LI, LO, LAS, LAU, LAC, RLO, etc.)
- Órgão emissor completo
- Número do processo administrativo
- Data de emissão (formato YYYY-MM-DD)
- Data de vencimento (formato YYYY-MM-DD)
- Status atual da licença

2. ANÁLISE INTELIGENTE DE CONDICIONANTES:
Para cada condicionante identificada, extrair:
- Texto completo e exato da condicionante
- Categoria técnica (monitoramento_continuo, relatorio_periodico, obra_infraestrutura, programa_ambiental, etc.)
- Prioridade baseada em consequências do não cumprimento
- Frequência específica (Mensal, Bimestral, Trimestral, Semestral, Anual, Unica)
- Data limite calculada ou estimada
- Área responsável sugerida (Meio Ambiente, Operação, Manutenção, etc.)
- Indicadores de compliance automático

3. SISTEMA DE ALERTAS INTELIGENTES:
- Alerta de renovação com cronograma otimizado
- Alertas de condicionantes vencendo
- Identificação de riscos de compliance
- Alertas de mudanças regulamentares aplicáveis

4. ANÁLISE PREDITIVA:
- Score de compliance calculado (0-100)
- Probabilidade de renovação bem-sucedida
- Riscos identificados e recomendações
- Cronograma otimizado de renovação
- Estimativa de custos do processo

5. RECOMENDAÇÕES ESTRATÉGICAS:
- Ações preventivas prioritárias
- Oportunidades de simplificação ou unificação
- Melhorias nos processos internos
- Preparação para renovação

Retorne APENAS um JSON válido no seguinte formato:
{
  "nome": "string",
  "tipo": "string", 
  "orgaoEmissor": "string",
  "numeroProcesso": "string",
  "dataEmissao": "YYYY-MM-DD",
  "dataVencimento": "YYYY-MM-DD", 
  "status": "Ativa|Vencida|Em Renovação|Suspensa",
  "condicionantes": "string com texto completo das condicionantes",
  "structured_conditions": [
    {
      "condition_text": "texto exato da condicionante",
      "condition_category": "categoria específica",
      "priority": "low|medium|high",
      "frequency": "Mensal|Bimestral|Trimestral|Semestral|Anual|Unica",
      "due_date": "YYYY-MM-DD ou null",
      "responsible_area": "área responsável",
      "compliance_status": "pending"
    }
  ],
  "alerts": [
    {
      "type": "renewal|condition_due|compliance_issue|document_required|regulatory_change",
      "title": "título específico",
      "message": "descrição detalhada", 
      "severity": "low|medium|high|critical",
      "due_date": "YYYY-MM-DD ou null",
      "action_required": boolean
    }
  ],
  "compliance_score": number,
  "renewal_recommendation": {
    "start_date": "YYYY-MM-DD",
    "urgency": "low|medium|high", 
    "required_documents": ["lista específica"],
    "estimated_cost": number,
    "recommended_actions": ["ações específicas"]
  },
  "confidence_scores": {
    "nome": number,
    "tipo": number,
    "orgaoEmissor": number,
    "numeroProcesso": number,
    "dataEmissao": number,
    "dataVencimento": number,
    "status": number,
    "condicionantes": number
  }
}
`;

  return basePrompt;
}

function detectLicenseContext(content: string): LicenseContext {
  const context: LicenseContext = {};
  
  // Detect license type
  if (content.match(/licen[çc]a pr[ée]via|LP\b/i)) {
    context.licenseType = 'LP - Licença Prévia';
  } else if (content.match(/licen[çc]a de instala[çc][ãa]o|LI\b/i)) {
    context.licenseType = 'LI - Licença de Instalação';
  } else if (content.match(/licen[çc]a de opera[çc][ãa]o|LO\b/i)) {
    context.licenseType = 'LO - Licença de Operação';
  } else if (content.match(/licen[çc]a ambiental simplificada|LAS\b/i)) {
    context.licenseType = 'LAS - Licença Ambiental Simplificada';
  }
  
  // Detect issuing body
  if (content.match(/IBAMA|Instituto Brasileiro/i)) {
    context.issuingBody = 'IBAMA';
  } else if (content.match(/CETESB|Companhia Ambiental/i)) {
    context.issuingBody = 'CETESB - São Paulo';
  } else if (content.match(/FEPAM|Funda[çc][ãa]o Estadual/i)) {
    context.issuingBody = 'FEPAM - Rio Grande do Sul';
  } else if (content.match(/INEA|Instituto Estadual/i)) {
    context.issuingBody = 'INEA - Rio de Janeiro';
  }
  
  // Detect business sector
  if (content.match(/minera[çc][ãa]o|extrat|lavra|mina\b/i)) {
    context.businessSector = 'mineração';
  } else if (content.match(/petr[óo]leo|g[áa]s|refinaria|E&P/i)) {
    context.businessSector = 'petróleo';
  } else if (content.match(/sider[úu]rgica|metalurgia|a[çc]o\b/i)) {
    context.businessSector = 'siderurgia';
  } else if (content.match(/qu[íi]mica|farmac[êe]utica|petroqu[íi]mica/i)) {
    context.businessSector = 'química';
  }
  
  return context;
}

// Enhanced PDF text extraction with multi-page support
async function extractPdfText(fileBlob: Blob): Promise<string> {
  try {
    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let text = '';
    let currentPage = 1;
    const maxPages = 10; // Limit to first 10 pages
    
    // Look for page breaks and text objects
    let inTextObject = false;
    let pageText = '';
    
    for (let i = 0; i < uint8Array.length - 10 && currentPage <= maxPages; i++) {
      const slice = uint8Array.slice(i, i + 3);
      const str = String.fromCharCode(...slice);
      
      // Detect page breaks
      if (uint8Array.slice(i, i + 8).toString() === '47,41,103,101,32,111,98,106') { // "page obj"
        if (pageText.trim()) {
          text += `\n--- Página ${currentPage} ---\n${pageText}\n`;
          currentPage++;
          pageText = '';
        }
      }
      
      if (str === 'BT ') {
        inTextObject = true;
        i += 2;
        continue;
      }
      
      if (str === 'ET ') {
        inTextObject = false;
        pageText += '\n';
        i += 2;
        continue;
      }
      
      // Extract readable characters
      if (inTextObject && uint8Array[i] >= 32 && uint8Array[i] <= 126) {
        pageText += String.fromCharCode(uint8Array[i]);
      }
    }
    
    // Add final page if exists
    if (pageText.trim()) {
      text += `\n--- Página ${currentPage} ---\n${pageText}\n`;
    }
    
    // Enhanced text cleaning and structure preservation
    return text.replace(/[^\w\s\-\/\(\)\.\,\:\n\r]/g, ' ')
              .replace(/\s+/g, ' ')
              .replace(/\n\s*\n/g, '\n')
              .trim()
              .substring(0, 15000); // Increased limit for multi-page
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

// Helper function to parse Excel/CSV data
async function parseSpreadsheet(fileBlob: Blob, fileName: string): Promise<string> {
  try {
    const arrayBuffer = await fileBlob.arrayBuffer();
    
    if (fileName.toLowerCase().includes('.csv')) {
      const text = new TextDecoder().decode(arrayBuffer);
      const lines = text.split('\n').slice(0, 50);
      return lines.join('\n');
    } else if (fileName.toLowerCase().includes('.xlsx') || fileName.toLowerCase().includes('.xls')) {
      // Basic Excel content extraction (simplified)
      const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(arrayBuffer);
      // Extract readable text patterns
      const readableText = text.replace(/[^\w\s\-\/\(\)\.\,\:]/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim();
      return readableText.substring(0, 5000);
    }
    
    return '';
  } catch (error) {
    console.error('Error parsing spreadsheet:', error);
    return '';
  }
}

// Helper function to determine file type
function getFileType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  if (['pdf'].includes(extension || '')) return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(extension || '')) return 'spreadsheet';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return 'image';
  
  return 'unknown';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    console.log(`Starting document analysis for user: ${user.id}`)

    const { documentPath }: DocumentAnalysisRequest = await req.json()

    if (!documentPath) {
      throw new Error('Document path is required')
    }

    console.log(`Analyzing document: ${documentPath}`)

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('documents')
      .download(documentPath)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message}`)
    }

    const fileName = documentPath.split('/').pop() || '';
    const fileType = getFileType(fileName);
    
    console.log(`File type detected: ${fileType} for file: ${fileName}`)

    let documentContent = '';
    let useVision = false;
    let signedUrl = '';

    // Process file based on type
    if (fileType === 'pdf') {
      console.log('Extracting text from PDF...');
      documentContent = await extractPdfText(fileData);
      
      // If no text extracted or very little, fallback to vision
      if (documentContent.length < 100) {
        console.log('PDF text extraction yielded little content, using vision API...');
        const { data: signedUrlData, error: urlError } = await supabaseClient.storage
          .from('documents')
          .createSignedUrl(documentPath, 300);
        
        if (!urlError && signedUrlData?.signedUrl) {
          signedUrl = signedUrlData.signedUrl;
          useVision = true;
        }
      }
    } else if (fileType === 'spreadsheet') {
      console.log('Parsing spreadsheet...');
      documentContent = await parseSpreadsheet(fileData, fileName);
    } else if (fileType === 'image') {
      console.log('Using vision API for image...');
      const { data: signedUrlData, error: urlError } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(documentPath, 300);
      
      if (!urlError && signedUrlData?.signedUrl) {
        signedUrl = signedUrlData.signedUrl;
        useVision = true;
      }
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Calling OpenAI API for analysis...')

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare messages based on content type
    const messages = [
      {
        role: 'system',
        content: `Você é um especialista em análise avançada de documentos de licenças ambientais brasileiras. 
        Analise o documento e extraia informações estruturadas para preenchimento automatizado de formulário e geração de alertas.

        INSTRUÇÕES ESPECÍFICAS:
        
        1. DADOS BÁSICOS DA LICENÇA:
           - Nome: Identifique o nome/título completo da licença
           - Tipo: LP, LI, LO, LAS, LOC, ou Outra
           - Órgão Emissor: IBAMA, CETESB, FEPAM, IAP, INEA, etc.
           - Número do Processo: Número oficial completo
           - Data de Emissão e Vencimento: Formato YYYY-MM-DD
           - Status: Ativa, Vencida, Suspensa, Em Renovação

        2. CONDICIONANTES ESTRUTURADAS:
           Extraia TODAS as condicionantes/exigências encontradas com:
           - Texto completo da condicionante
           - Categoria (monitoramento, relatório, obras, operação, etc.)
           - Prioridade (low, medium, high)
           - Frequência se aplicável (Mensal, Trimestral, Semestral, Anual, Unica)
           - Data limite se mencionada
           - Área responsável se identificada

        3. ALERTAS AUTOMÁTICOS:
           Gere alertas baseados em:
           - Proximidade do vencimento da licença
           - Condicionantes com prazos críticos
           - Relatórios periódicos obrigatórios
           - Documentações pendentes

        4. ANÁLISE DE COMPLIANCE:
           - Score de compliance (0-100) baseado na complexidade das condicionantes
           - Recomendações para renovação com cronograma
           - Documentos necessários para renovação
           - Ações recomendadas

        ${fileType === 'pdf' ? 'IMPORTANTE: Este é um documento PDF multi-página. Analise todo o conteúdo disponível.' : ''}
        ${fileType === 'spreadsheet' ? 'IMPORTANTE: Este é um arquivo de planilha. Procure por dados estruturados em colunas.' : ''}

        Responda APENAS com um JSON válido no formato EXATO:
        {
          "nome": "string",
          "tipo": "string",
          "orgaoEmissor": "string", 
          "numeroProcesso": "string",
          "dataEmissao": "YYYY-MM-DD",
          "dataVencimento": "YYYY-MM-DD",
          "status": "string",
          "condicionantes": "string resumido das principais condicionantes",
          "structured_conditions": [
            {
              "condition_text": "texto completo da condicionante",
              "condition_category": "categoria",
              "priority": "medium",
              "frequency": "Anual",
              "due_date": "YYYY-MM-DD",
              "responsible_area": "área responsável",
              "compliance_status": "pending"
            }
          ],
          "alerts": [
            {
              "type": "renewal",
              "title": "título do alerta",
              "message": "descrição detalhada",
              "severity": "medium",
              "due_date": "YYYY-MM-DD",
              "action_required": true
            }
          ],
          "compliance_score": 75,
          "renewal_recommendation": {
            "start_date": "YYYY-MM-DD",
            "urgency": "medium",
            "required_documents": ["documento1", "documento2"],
            "estimated_cost": 0,
            "recommended_actions": ["ação1", "ação2"]
          },
          "confidence_scores": {
            "nome": 0.8,
            "tipo": 0.9,
            "orgaoEmissor": 0.95,
            "numeroProcesso": 0.85,
            "dataEmissao": 0.9,
            "dataVencimento": 0.9,
            "status": 0.7,
            "condicionantes": 0.8
          }
        }`
      }
    ];

    if (useVision) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analise este documento de licença ambiental e extraia os dados para preenchimento do formulário:'
          },
          {
            type: 'image_url',
            image_url: {
              url: signedUrl
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Analise este documento de licença ambiental e extraia os dados para preenchimento do formulário:

CONTEÚDO DO DOCUMENTO:
${documentContent}`
      });
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useVision ? 'gpt-4o-mini' : 'gpt-4o-mini',
        messages: messages,
        max_tokens: 3000,
        temperature: 0.1
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`)
    }

    const openAIResult = await openAIResponse.json()
    console.log('OpenAI response received')

    if (!openAIResult.choices || !openAIResult.choices[0]) {
      throw new Error('Invalid OpenAI response structure')
    }

    let extractedData: ExtractedLicenseFormData
    try {
      const aiContent = openAIResult.choices[0].message.content
      console.log('AI extracted content:', aiContent)
      extractedData = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      throw new Error('Failed to parse AI analysis results')
    }

    // Calculate overall confidence score
    const confidenceValues = Object.values(extractedData.confidence_scores)
    const overallConfidence = confidenceValues.reduce((sum, score) => sum + score, 0) / confidenceValues.length

    console.log(`Analysis completed with overall confidence: ${overallConfidence} using ${useVision ? 'vision' : 'text'} analysis`)

    return new Response(JSON.stringify({
      success: true,
      extracted_data: extractedData,
      overall_confidence: overallConfidence,
      analysis_type: useVision ? 'vision' : 'text',
      file_type: fileType,
      analysis_timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in license-document-analyzer:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})