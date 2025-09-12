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

// Specialized prompts based on license context with advanced AI strategies
function getSpecializedPrompt(documentContent: string): string {
  const context = detectLicenseContext(documentContent);
  
  let basePrompt = `
Você é um especialista SÊNIOR em licenciamento ambiental brasileiro com 20+ anos de experiência prática. Use estratégias avançadas de extração de dados para documentos oficiais brasileiros.

🔍 ESTRATÉGIA DE ANÁLISE EM 3 NÍVEIS:

NÍVEL 1 - RECONHECIMENTO CONTEXTUAL:
- Identifique primeiro o TIPO de documento (cabeçalho, logotipo, formato)
- Detecte o ÓRGÃO emissor através de logos, timbres e assinaturas
- Determine o SETOR através de atividades descritas

NÍVEL 2 - EXTRAÇÃO INTELIGENTE POR PADRÕES:
- NÚMEROS DE PROCESSO: Procure padrões como "Processo nº", "Protocolo:", seguidos de números com pontos/barras
- DATAS: Busque "emitida em", "válida até", "vencimento em" em formato DD/MM/AAAA ou DD de MMMM de AAAA
- CONDICIONANTES: Identifique por numeração (1., 2., I, II) ou bullets, termos como "fica condicionado", "deverá"
- STATUS: Inferir de datas (se vencida = "Vencida", se ativa = "Ativa")

NÍVEL 3 - VALIDAÇÃO CRUZADA:
- Verifique consistência entre dados extraídos
- Calcule confidence scores baseado na CLAREZA e LOCALIZAÇÃO da informação
- Use conhecimento de padrões brasileiros para validar

📍 LOCAIS TÍPICOS DE INFORMAÇÃO:
- CABEÇALHO: Nome da licença, órgão emissor, logotipo
- PRIMEIRO PARÁGRAFO: Número de processo, requerente, atividade
- MEIO DO DOCUMENTO: Condicionantes detalhadas (seção específica)
- FINAL: Datas de emissão e validade, assinaturas

🎯 PADRÕES ESPECÍFICOS BRASILEIROS:
- Processos: XXXXXX.XXXXXX/XXXX-XX (IBAMA), outros formatos por órgão
- Órgãos: IBAMA, CETESB, INEA, FATMA, FEAM, IAP, SEMAC, etc.
- Tipos: LP, LI, LO, LAS, LAU, LAC, RLO, ARL, etc.
- Datas: DD/MM/AAAA predominante em documentos oficiais

CONTEXTO ATUAL DETECTADO:
- Tipo: ${context.licenseType || 'ANALISAR NO DOCUMENTO'}
- Órgão: ${context.issuingBody || 'EXTRAIR DO CABEÇALHO'} 
- Setor: ${context.businessSector || 'INFERIR DA ATIVIDADE'}

INSTRUÇÕES CRÍTICAS PARA ANÁLISE:`;

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
🚀 EXECUÇÃO DA ANÁLISE:

1. DADOS FUNDAMENTAIS (OBRIGATÓRIOS):
   📋 NOME: Título completo da licença (geralmente no cabeçalho)
   🏷️ TIPO: LP/LI/LO/LAS/LAU/etc. (procure após "Licença de" ou sozinho)
   🏛️ ÓRGÃO: Nome completo do órgão emissor (cabeçalho com logotipo)
   📋 PROCESSO: Número completo do processo (após "Processo nº")
   📅 EMISSÃO: Data de emissão (procure "emitida em", formato DD/MM/AAAA)
   ⏰ VENCIMENTO: Data limite (procure "válida até", "vencimento")
   ✅ STATUS: Calcule baseado na data atual vs vencimento

2. ESTRATÉGIAS PARA CONDICIONANTES:
   🔍 LOCALIZE por: "fica condicionado", "deverá", "obriga-se", "é obrigatório"
   📝 EXTRAIA: Texto completo sem cortes
   🏷️ CATEGORIZE: monitoramento, relatório, obra, programa, compensação
   ⚡ PRIORIDADE: high (multas/suspensão), medium (advertência), low (informativo)
   🔄 FREQUÊNCIA: Procure "mensalmente", "anualmente", "até DD/MM"
   👥 RESPONSÁVEL: Inferir pela natureza (ambiental, operacional, técnico)

3. CONFIDENCE SCORES INTELIGENTES:
   100: Informação explícita e clara no documento
   80-99: Informação evidente mas requer interpretação mínima
   60-79: Informação inferida com base em contexto sólido
   40-59: Informação estimada com padrões conhecidos
   20-39: Informação parcial ou incerta
   0-19: Informação não encontrada ou altamente duvidosa

4. VALIDAÇÕES OBRIGATÓRIAS:
   ✅ Datas em formato brasileiro (DD/MM/AAAA)
   ✅ Órgão deve estar na lista conhecida de órgãos ambientais
   ✅ Tipo de licença deve ser código válido (LP, LI, LO, etc.)
   ✅ Status derivado logicamente das datas
   ✅ Condicionantes devem ter sentido técnico
- Melhorias nos processos internos
- Preparação para renovação

⚠️ REGRAS CRÍTICAS DE RESPOSTA:
- Responda EXCLUSIVAMENTE em formato JSON válido
- Use confidence scores REALISTAS (0-100)
- Para campos não encontrados: "" (string), [] (array), 0 (number)
- Datas SEMPRE no formato YYYY-MM-DD (converter de DD/MM/AAAA)
- Seja CONSERVADOR nos confidence scores se houver dúvida

📋 FORMATO JSON OBRIGATÓRIO:
{
  "nome": "Licença de Operação - [Nome da Atividade]",
  "tipo": "LO", 
  "orgaoEmissor": "CETESB - Companhia Ambiental do Estado de São Paulo",
  "numeroProcesso": "123456.789.012/2023-SP",
  "dataEmissao": "2023-05-15",
  "dataVencimento": "2033-05-14", 
  "status": "Ativa",
  "condicionantes": "Texto completo das condicionantes encontradas no documento...",
  "structured_conditions": [
    {
      "condition_text": "Realizar monitoramento mensal da qualidade do ar",
      "condition_category": "monitoramento_continuo",
      "priority": "high",
      "frequency": "Mensal",
      "due_date": "2024-01-30",
      "responsible_area": "Meio Ambiente",
      "compliance_status": "pending"
    }
  ],
  "alerts": [
    {
      "type": "renewal",
      "title": "Licença próxima ao vencimento",
      "message": "Iniciar processo de renovação em 18 meses", 
      "severity": "medium",
      "due_date": "2031-11-14",
      "action_required": true
    }
  ],
  "compliance_score": 85,
  "renewal_recommendation": {
    "start_date": "2031-05-15",
    "urgency": "medium", 
    "required_documents": ["EIA/RIMA atualizado", "Relatórios de monitoramento"],
    "estimated_cost": 150000,
    "recommended_actions": ["Contratar consultoria especializada", "Atualizar estudos ambientais"]
  },
  "confidence_scores": {
    "nome": 95,
    "tipo": 90,
    "orgaoEmissor": 88,
    "numeroProcesso": 85,
    "dataEmissao": 92,
    "dataVencimento": 90,
    "status": 95,
    "condicionantes": 75
  }
}

📄 CONTEÚDO DO DOCUMENTO PARA ANÁLISE:
${documentContent}

🎯 EXECUTE A ANÁLISE AGORA COM MÁXIMA INTELIGÊNCIA E PRECISÃO!
`;

  return basePrompt;
}

// Utility function to extract JSON from text that might contain code blocks or other noise
function extractJsonFromText(text: string): any {
  // Remove any markdown code block markers
  let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Try to find JSON content between braces
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }
  
  // Trim whitespace
  cleanText = cleanText.trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    // If that fails, try to extract just the JSON object
    const startBrace = cleanText.indexOf('{');
    const endBrace = cleanText.lastIndexOf('}');
    
    if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
      const jsonPart = cleanText.substring(startBrace, endBrace + 1);
      return JSON.parse(jsonPart);
    }
    
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
}

function detectLicenseContext(content: string): LicenseContext {
  const context: LicenseContext = {};
  
  // Enhanced license type detection with more patterns
  const licensePatterns = [
    { pattern: /licen[çc]a pr[ée]via|LP\b/i, type: 'LP' },
    { pattern: /licen[çc]a de instala[çc][ãa]o|LI\b/i, type: 'LI' },
    { pattern: /licen[çc]a de opera[çc][ãa]o|LO\b/i, type: 'LO' },
    { pattern: /licen[çc]a ambiental simplificada|LAS\b/i, type: 'LAS' },
    { pattern: /licen[çc]a ambiental [úu]nica|LAU\b/i, type: 'LAU' },
    { pattern: /licen[çc]a ambiental corretiva|LAC\b/i, type: 'LAC' },
    { pattern: /renova[çc][ãa]o de licen[çc]a|RLO\b/i, type: 'RLO' },
    { pattern: /autoriza[çc][ãa]o para atividade|AAF\b/i, type: 'AAF' }
  ];
  
  for (const { pattern, type } of licensePatterns) {
    if (content.match(pattern)) {
      context.licenseType = type;
      break;
    }
  }
  
  // Enhanced issuing body detection
  const issuingBodies = [
    { pattern: /IBAMA|Instituto Brasileiro do Meio Ambiente/i, name: 'IBAMA' },
    { pattern: /CETESB|Companhia Ambiental do Estado de S[ãa]o Paulo/i, name: 'CETESB' },
    { pattern: /FEPAM|Funda[çc][ãa]o Estadual de Prote[çc][ãa]o Ambiental/i, name: 'FEPAM' },
    { pattern: /INEA|Instituto Estadual do Ambiente/i, name: 'INEA' },
    { pattern: /FATMA|Funda[çc][ãa]o do Meio Ambiente/i, name: 'FATMA' },
    { pattern: /FEAM|Funda[çc][ãa]o Estadual do Meio Ambiente/i, name: 'FEAM' },
    { pattern: /IAP|Instituto Ambiental do Paran[áa]/i, name: 'IAP' },
    { pattern: /SEMAC|Secretaria de Estado de Meio Ambiente/i, name: 'SEMAC' },
    { pattern: /SEMA|Secretaria do Meio Ambiente/i, name: 'SEMA' },
    { pattern: /ADEMA|Administra[çc][ãa]o Estadual do Meio Ambiente/i, name: 'ADEMA' }
  ];
  
  for (const { pattern, name } of issuingBodies) {
    if (content.match(pattern)) {
      context.issuingBody = name;
      break;
    }
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
        try {
          const { data: signedUrlData, error: urlError } = await supabaseClient.storage
            .from('documents')
            .createSignedUrl(documentPath, 300);
          
          if (!urlError && signedUrlData?.signedUrl) {
            // For PDFs, we need to ensure the signed URL points to a supported image format
            // Since OpenAI only supports PNG, JPEG, GIF, WEBP for vision API
            signedUrl = signedUrlData.signedUrl;
            useVision = true;
          } else {
            console.log('Failed to create signed URL, falling back to text-only analysis');
            useVision = false;
          }
        } catch (urlError) {
          console.error('Error creating signed URL:', urlError);
          useVision = false;
        }
      }
    } else if (fileType === 'spreadsheet') {
      console.log('Parsing spreadsheet...');
      documentContent = await parseSpreadsheet(fileData, fileName);
    } else if (fileType === 'image') {
      console.log('Using vision API for image...');
      try {
        const { data: signedUrlData, error: urlError } = await supabaseClient.storage
          .from('documents')
          .createSignedUrl(documentPath, 300);
        
        if (!urlError && signedUrlData?.signedUrl) {
          // Verify the image format is supported by OpenAI
          const supportedFormats = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
          const fileExtension = fileName.toLowerCase().split('.').pop();
          
          if (supportedFormats.includes(fileExtension || '')) {
            signedUrl = signedUrlData.signedUrl;
            useVision = true;
          } else {
            throw new Error(`Formato de imagem não suportado: ${fileExtension}. Use PNG, JPEG, GIF ou WEBP.`);
          }
        } else {
          throw new Error('Falha ao criar URL assinada para a imagem');
        }
      } catch (imageError) {
        console.error('Error processing image:', imageError);
        throw new Error(`Erro ao processar imagem: ${imageError.message}`);
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

    if (useVision && signedUrl) {
      // Verify URL format before sending to OpenAI
      try {
        const response = await fetch(signedUrl, { method: 'HEAD' });
        const contentType = response.headers.get('content-type') || '';
        
        // Check if content type is supported by OpenAI Vision API
        const supportedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        
        if (supportedTypes.some(type => contentType.includes(type))) {
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
                  url: signedUrl,
                  detail: 'high'
                }
              }
            ]
          });
        } else {
          console.log(`Unsupported content type for vision: ${contentType}, falling back to text analysis`);
          useVision = false;
        }
      } catch (urlError) {
        console.error('Error checking URL format:', urlError);
        useVision = false;
      }
    }
    
    if (!useVision) {
      messages.push({
        role: 'user',
        content: `Analise este documento de licença ambiental e extraia os dados para preenchimento do formulário:

CONTEÚDO DO DOCUMENTO:
${documentContent || 'Documento não pôde ser processado adequadamente. Favor preencher manualmente os campos necessários.'}`
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
        temperature: 0.1,
        response_format: { type: "json_object" }
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
      extractedData = extractJsonFromText(aiContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw content:', aiContent)
      throw new Error(`Failed to parse AI analysis results: ${parseError.message}`)
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
    const errorMessage = error.message || 'Erro interno do servidor'
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      details: error.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})