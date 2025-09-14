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

// Enhanced specialized prompts for Brazilian environmental licenses
function getSpecializedPrompt(documentContent: string): string {
  const context = detectLicenseContext(documentContent);
  
  let basePrompt = `
VOCÊ É UM ESPECIALISTA SÊNIOR EM LICENCIAMENTO AMBIENTAL BRASILEIRO com 25+ anos de experiência em análise de documentos oficiais de órgãos como IBAMA, CETESB, INEA, IAP, FATMA, FEAM, SEMAC, ADEMA, FEPAM e todos os órgãos estaduais e municipais.

🎯 MISSÃO CRÍTICA: Extrair TODOS os dados possíveis deste documento de licenciamento ambiental com MÁXIMA PRECISÃO e INTELIGÊNCIA CONTEXTUAL.

🔍 CONTEXTO DETECTADO:
- Tipo de Licença: ${context.licenseType || 'IDENTIFICAR NO DOCUMENTO'}
- Órgão Emissor: ${context.issuingBody || 'EXTRAIR DO CABEÇALHO/LOGOTIPO'}  
- Setor Empresarial: ${context.businessSector || 'INFERIR DA ATIVIDADE'}

📋 ESTRATÉGIA DE ANÁLISE INTELIGENTE:

1. RECONHECIMENTO ESTRUTURAL:
   🏛️ CABEÇALHO: Identificar órgão emissor pelo logotipo, timbre, nome oficial
   📝 TÍTULO: Extrair tipo de licença (LP, LI, LO, LAS, LAU, LAC, RLO, AAF, etc.)
   🔢 NUMERAÇÃO: Localizar número do processo/protocolo/licença em destaque
   👤 REQUERENTE: Razão social, CNPJ, endereço (geralmente após "CONCEDE A:")
   📅 DATAS: Buscar "emitida em", "válida até", "vencimento" em formatos DD/MM/AAAA

2. EXTRAÇÃO INTELIGENTE DE CONDICIONANTES:
   🔍 LOCALIZAR por marcadores: "1.", "2.", "I.", "II.", "a)", "b)", "•", "-"
   📝 IDENTIFICAR frases-chave: "fica condicionado", "deverá", "obriga-se", "é obrigatório"
   🏷️ CATEGORIZAR: monitoramento, relatório, obra, programa, compensação, controle
   ⚡ PRIORIZAR: alta (multa/suspensão), média (advertência), baixa (informativo)
   🔄 FREQUÊNCIAS: mensal, trimestral, semestral, anual, única, contínua
   👥 RESPONSABILIDADE: ambiental, operacional, técnico, jurídico

3. VALIDAÇÃO CRUZADA BRASILEIRA:
   ✅ Formato de processo por órgão (IBAMA: XXXXXX.XXXXXX/XXXX-XX)
   ✅ Tipos de licença válidos no Brasil (LP, LI, LO, LAS, LAU, LAC, etc.)
   ✅ Órgãos oficiais reconhecidos (federal, estadual, municipal)
   ✅ Datas em formato brasileiro (DD/MM/AAAA → converter para YYYY-MM-DD)
   ✅ Status calculado logicamente (Ativa se válida, Vencida se expirada)

4. CONFIDENCE SCORES PRECISOS (0-100):
   90-100: Informação explícita e inequívoca no documento
   70-89: Informação clara mas requer interpretação mínima  
   50-69: Informação inferível com contexto sólido e padrões conhecidos
   30-49: Informação parcial ou estimada com base em fragmentos
   10-29: Informação duvidosa ou altamente interpretativa
   0-9: Informação não encontrada ou impossível de determinar`;

  // Add context-specific instructions
  if (context.licenseType?.includes('LP')) {
    basePrompt += `\n\n🎯 FOCO LICENÇA PRÉVIA (LP):
- Viabilidade ambiental e localização aprovada
- Estudos exigidos (EIA/RIMA, EAS, RCA, PCA)
- Condicionantes para obtenção da LI
- Restrições de localização e atividades
- Cronograma e marcos para próximas fases`;
  } else if (context.licenseType?.includes('LI')) {
    basePrompt += `\n\n🎯 FOCO LICENÇA DE INSTALAÇÃO (LI):
- Autorização para construção/instalação
- Planos de controle ambiental específicos
- Cronograma de obras e implementação
- Sistemas de monitoramento a instalar
- Condicionantes para obtenção da LO`;
  } else if (context.licenseType?.includes('LO')) {
    basePrompt += `\n\n🎯 FOCO LICENÇA DE OPERAÇÃO (LO):
- Autorização para funcionamento/operação
- Limites de emissões e efluentes
- Programas de monitoramento contínuo
- Relatórios periódicos obrigatórios (RAL, RCA)
- Planos de emergência e contingência
- Cronograma de renovação (tipicamente 4-10 anos)`;
  }

  if (context.issuingBody?.includes('IBAMA')) {
    basePrompt += `\n\n🏛️ ESPECIFICIDADES IBAMA:
- Atividades de impacto nacional/interestadual
- Condicionantes federais (fauna, flora, UC)
- Programas de compensação ambiental
- Interface com outros órgãos federais`;
  } else if (context.issuingBody?.includes('CETESB')) {
    basePrompt += `\n\n🏛️ ESPECIFICIDADES CETESB-SP:
- Licenciamento integrado (ar, água, solo)
- CADRI para resíduos industriais
- Padrões paulistas de qualidade ambiental
- Sistema de classificação de atividades`;
  }

  basePrompt += `\n\n⚠️ REGRAS CRÍTICAS DE RESPOSTA:
- Responda EXCLUSIVAMENTE em JSON válido
- Para campos não encontrados: usar "" (string), [] (array), 0 (number)
- Datas SEMPRE em formato YYYY-MM-DD (converter de DD/MM/AAAA)
- Confidence scores REALISTAS e JUSTIFICADOS
- Status inferido das datas: "Ativa", "Vencida", "Suspensa", "Cancelada"
- Condicionantes detalhadas com texto completo

📄 DOCUMENTO PARA ANÁLISE INTELIGENTE:
${documentContent.substring(0, 25000)}

🎯 EXECUTE ANÁLISE COMPLETA AGORA!`;

  return basePrompt;
}

// Enhanced utility function to extract JSON from AI response
function extractJsonFromText(text: string): any {
  console.log('Attempting to extract JSON from AI response...');
  
  // Remove markdown code blocks and extra whitespace
  let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // Try to find JSON content between braces
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(cleanText);
    console.log('JSON extraction successful');
    return parsed;
  } catch (error) {
    console.log('Primary JSON parsing failed, attempting cleanup...');
    
    // Try to extract just the JSON object more aggressively
    const startBrace = cleanText.indexOf('{');
    const endBrace = cleanText.lastIndexOf('}');
    
    if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
      const jsonPart = cleanText.substring(startBrace, endBrace + 1);
      
      try {
        const parsed = JSON.parse(jsonPart);
        console.log('JSON extraction successful after cleanup');
        return parsed;
      } catch (secondError) {
        console.error('Failed to parse JSON after cleanup:', secondError);
        throw new Error(`Invalid JSON format: ${secondError.message}`);
      }
    }
    
    throw new Error(`Unable to extract valid JSON: ${error.message}`);
  }
}

// Enhanced license context detection
function detectLicenseContext(content: string): LicenseContext {
  const context: LicenseContext = {};
  
  // Enhanced license type detection with comprehensive patterns
  const licensePatterns = [
    { pattern: /licen[çc]a pr[ée]via|LP\b(?!\w)/i, type: 'LP' },
    { pattern: /licen[çc]a de instala[çc][ãa]o|LI\b(?!\w)/i, type: 'LI' },
    { pattern: /licen[çc]a de opera[çc][ãa]o|LO\b(?!\w)/i, type: 'LO' },
    { pattern: /licen[çc]a ambiental simplificada|LAS\b/i, type: 'LAS' },
    { pattern: /licen[çc]a ambiental [úu]nica|LAU\b/i, type: 'LAU' },
    { pattern: /licen[çc]a ambiental corretiva|LAC\b/i, type: 'LAC' },
    { pattern: /renova[çc][ãa]o de licen[çc]a de opera[çc][ãa]o|RLO\b/i, type: 'RLO' },
    { pattern: /autoriza[çc][ãa]o ambiental|AAF\b/i, type: 'AAF' },
    { pattern: /licen[çc]a de regulariza[çc][ãa]o|LR\b/i, type: 'LR' }
  ];
  
  for (const { pattern, type } of licensePatterns) {
    if (content.match(pattern)) {
      context.licenseType = type;
      break;
    }
  }
  
  // Comprehensive issuing body detection
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
    { pattern: /ADEMA|Administra[çc][ãa]o Estadual do Meio Ambiente/i, name: 'ADEMA' },
    { pattern: /SEDAM|Secretaria de Estado do Desenvolvimento Ambiental/i, name: 'SEDAM' },
    { pattern: /IDEMA|Instituto de Desenvolvimento Sustent[áa]vel e Meio Ambiente/i, name: 'IDEMA' }
  ];
  
  for (const { pattern, name } of issuingBodies) {
    if (content.match(pattern)) {
      context.issuingBody = name;
      break;
    }
  }
  
  // Enhanced business sector detection
  if (content.match(/minera[çc][ãa]o|extrat|lavra|mina\b|DNPM|ANM/i)) {
    context.businessSector = 'mineração';
  } else if (content.match(/petr[óo]leo|g[áa]s|refinaria|E&P|ANP/i)) {
    context.businessSector = 'petróleo';
  } else if (content.match(/sider[úu]rgica|metalurgia|a[çc]o\b|usina|fundi[çc][ãa]o/i)) {
    context.businessSector = 'siderurgia';
  } else if (content.match(/qu[íi]mica|farmac[êe]utica|petroqu[íi]mica/i)) {
    context.businessSector = 'química';
  } else if (content.match(/agropecuári|agricultura|criação|piscicultura/i)) {
    context.businessSector = 'agropecuário';
  } else if (content.match(/aterro|res[íi]duo|lixo|tratamento|ETE|ETA/i)) {
    context.businessSector = 'saneamento';
  }
  
  return context;
}

// Comprehensive PDF text extraction with multiple strategies
async function extractPdfText(fileBlob: Blob): Promise<string> {
  try {
    console.log('Starting comprehensive PDF text extraction...');
    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let text = '';
    let textualContent = 0;
    let totalChars = 0;
    
    // STRATEGY 1: Enhanced text object extraction (BT...ET blocks)
    console.log('Attempting advanced text object extraction...');
    let i = 0;
    while (i < uint8Array.length - 10) {
      // Look for text objects (BT...ET blocks)
      if (uint8Array[i] === 0x42 && uint8Array[i+1] === 0x54) { // "BT"
        i += 2;
        if (uint8Array[i] === 0x20 || uint8Array[i] === 0x0A || uint8Array[i] === 0x0D) { // Space or newline
          i++;
          let textBlock = '';
          
          // Extract text until ET
          while (i < uint8Array.length - 3) {
            if (uint8Array[i] === 0x45 && uint8Array[i+1] === 0x54) { // "ET"
              break;
            }
            
            // Look for text strings in parentheses or angle brackets
            if (uint8Array[i] === 0x28) { // "(" - start of text string
              i++;
              let textContent = '';
              let parenCount = 1;
              
              while (i < uint8Array.length && parenCount > 0) {
                if (uint8Array[i] === 0x28) parenCount++;
                else if (uint8Array[i] === 0x29) parenCount--;
                
                if (parenCount > 0 && uint8Array[i] >= 32 && uint8Array[i] <= 126) {
                  textContent += String.fromCharCode(uint8Array[i]);
                  totalChars++;
                  if (/[a-zA-ZáéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(String.fromCharCode(uint8Array[i]))) {
                    textualContent++;
                  }
                }
                i++;
              }
              
              if (textContent.trim().length > 1) {
                textBlock += textContent + ' ';
              }
            } else if (uint8Array[i] === 0x3C) { // "<" - start of hex string
              i++;
              let hexContent = '';
              while (i < uint8Array.length && uint8Array[i] !== 0x3E) { // Until ">"
                if ((uint8Array[i] >= 0x30 && uint8Array[i] <= 0x39) || // 0-9
                    (uint8Array[i] >= 0x41 && uint8Array[i] <= 0x46) || // A-F
                    (uint8Array[i] >= 0x61 && uint8Array[i] <= 0x66)) { // a-f
                  hexContent += String.fromCharCode(uint8Array[i]);
                }
                i++;
              }
              
              // Convert hex to text
              if (hexContent.length > 0 && hexContent.length % 2 === 0) {
                try {
                  let textContent = '';
                  for (let j = 0; j < hexContent.length; j += 2) {
                    const hexByte = parseInt(hexContent.substr(j, 2), 16);
                    if (hexByte >= 32 && hexByte <= 126) {
                      textContent += String.fromCharCode(hexByte);
                    }
                  }
                  if (textContent.trim().length > 1) {
                    textBlock += textContent + ' ';
                  }
                } catch (e) {
                  // Ignore hex conversion errors
                }
              }
            }
            i++;
          }
          
          if (textBlock.trim().length > 3) {
            text += textBlock.trim() + '\n';
          }
        }
      }
      i++;
    }
    
    // STRATEGY 2: Enhanced fallback - intelligent ASCII sequence detection
    if (text.length < 500) {
      console.log('Primary extraction insufficient, trying enhanced fallback...');
      let fallbackText = '';
      let consecutiveLetters = 0;
      let currentWord = '';
      let wordBuffer = '';
      
      for (let j = 0; j < uint8Array.length; j++) {
        const char = uint8Array[j];
        
        if (char >= 32 && char <= 126) { // Printable ASCII
          const charStr = String.fromCharCode(char);
          currentWord += charStr;
          totalChars++;
          
          if (/[a-zA-ZáéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(charStr)) {
            consecutiveLetters++;
            textualContent++;
          } else if (/[\s\-\.\,\:\;\!\?\(\)]/.test(charStr)) {
            // Word separator - check if we have a meaningful word
            if (consecutiveLetters >= 2 && currentWord.length >= 3) {
              wordBuffer += currentWord;
            } else if (wordBuffer.length > 0 && /[\s\.\,\:\;\!\?]/.test(charStr)) {
              // End of sentence/phrase - add to text if meaningful
              if (wordBuffer.trim().length > 5) {
                fallbackText += wordBuffer + charStr;
                wordBuffer = '';
              }
            }
            currentWord = '';
            consecutiveLetters = 0;
          } else {
            // Reset if we encounter non-letter, non-separator
            if (consecutiveLetters < 2) {
              currentWord = '';
              consecutiveLetters = 0;
            }
          }
          
          // Prevent excessively long words
          if (currentWord.length > 100) {
            if (consecutiveLetters >= 3) {
              wordBuffer += currentWord.substring(0, 50) + ' ';
            }
            currentWord = '';
            consecutiveLetters = 0;
          }
        } else if (char === 10 || char === 13) {
          // Newline - finish current processing
          if (consecutiveLetters >= 2 && currentWord.length >= 3) {
            wordBuffer += currentWord;
          }
          if (wordBuffer.trim().length > 5) {
            fallbackText += wordBuffer + '\n';
            wordBuffer = '';
          }
          currentWord = '';
          consecutiveLetters = 0;
        } else {
          // Non-printable character - end current word
          if (consecutiveLetters >= 2 && currentWord.length >= 3) {
            wordBuffer += currentWord + ' ';
          }
          currentWord = '';
          consecutiveLetters = 0;
        }
      }
      
      // Add final content
      if (consecutiveLetters >= 2 && currentWord.length >= 3) {
        wordBuffer += currentWord;
      }
      if (wordBuffer.trim().length > 5) {
        fallbackText += wordBuffer;
      }
      
      if (fallbackText.length > text.length) {
        text = fallbackText;
        console.log('Enhanced fallback extraction used');
      }
    }
    
    // Calculate quality metrics
    const qualityRatio = totalChars > 0 ? textualContent / totalChars : 0;
    const wordCount = text.split(/\s+/).filter(word => word.length > 2).length;
    
    console.log(`PDF extraction stats: total chars: ${totalChars}, textual: ${textualContent}, quality ratio: ${qualityRatio.toFixed(2)}`);
    
    // Clean up extracted text
    const cleanedText = text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n\s*\n/g, '\n') // Multiple newlines to single newline
      .trim();
    
    const quality = qualityRatio > 0.6 ? 'Excellent' : qualityRatio > 0.4 ? 'Good' : qualityRatio > 0.2 ? 'Fair' : 'Poor';
    console.log(`Final PDF content: ${cleanedText.length} chars, ${wordCount} words, quality: ${quality}`);
    
    return cleanedText;
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return ''; // Return empty string rather than throwing
  }
}

// Enhanced heuristic analysis for fallback
function heuristicExtractFromFileName(fileName: string): Partial<ExtractedLicenseFormData> {
  console.log('Attempting heuristic extraction from filename:', fileName);
  
  const result: Partial<ExtractedLicenseFormData> = {
    nome: '',
    tipo: '',
    orgaoEmissor: '',
    numeroProcesso: '',
    dataEmissao: '',
    dataVencimento: '',
    status: '',
    condicionantes: ''
  };
  
  // Extract license type from filename
  if (fileName.match(/LP|licenca.?previa/i)) result.tipo = 'LP';
  else if (fileName.match(/LI|licenca.?instalacao/i)) result.tipo = 'LI';
  else if (fileName.match(/LO|licenca.?operacao/i)) result.tipo = 'LO';
  else if (fileName.match(/LAS|licenca.?simplificada/i)) result.tipo = 'LAS';
  
  // Extract issuing body from filename
  if (fileName.match(/IBAMA/i)) result.orgaoEmissor = 'IBAMA';
  else if (fileName.match(/CETESB/i)) result.orgaoEmissor = 'CETESB';
  else if (fileName.match(/INEA/i)) result.orgaoEmissor = 'INEA';
  else if (fileName.match(/IAP/i)) result.orgaoEmissor = 'IAP';
  
  // Extract dates (basic pattern matching)
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g;
  const dates = fileName.match(datePattern);
  if (dates && dates.length > 0) {
    result.dataEmissao = parseDate(dates[0]) || '';
    if (dates.length > 1) {
      result.dataVencimento = parseDate(dates[1]) || '';
    }
  }
  
  // Set basic status based on presence of data
  if (result.tipo && result.orgaoEmissor) {
    result.status = 'Ativa'; // Conservative assumption
  }
  
  console.log('Heuristic extraction result:', result);
  return result;
}

// Enhanced date parsing for Brazilian formats
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Handle DD/MM/YYYY or DD-MM-YYYY
  const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate date
    if (date.getFullYear() == parseInt(year) && 
        date.getMonth() == parseInt(month) - 1 && 
        date.getDate() == parseInt(day)) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  }
  
  return null;
}

// Enhanced spreadsheet parsing
async function parseSpreadsheet(fileData: Blob, fileType: string): Promise<string> {
  console.log(`Parsing ${fileType} spreadsheet...`);
  
  try {
    const text = await fileData.text();
    
    if (fileType === 'csv') {
      // Simple CSV parsing - join rows with newlines
      return text.split('\n').slice(0, 100).join('\n'); // Limit to first 100 rows
    }
    
    // For Excel files, just return what we can extract as text
    // In a real implementation, you'd use a proper Excel parsing library
    return text.substring(0, 10000); // Limit content
    
  } catch (error) {
    console.error('Spreadsheet parsing error:', error);
    return 'Error parsing spreadsheet content';
  }
}

// Enhanced file type detection
function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const typeMap: { [key: string]: string } = {
    'pdf': 'pdf',
    'jpg': 'jpg',
    'jpeg': 'jpeg', 
    'png': 'png',
    'webp': 'webp',
    'csv': 'csv',
    'xlsx': 'xlsx',
    'xls': 'xls'
  };
  
  return typeMap[extension] || 'unknown';
}

serve(async (req) => {
  console.log('Starting comprehensive document analysis...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    
    // Get Supabase client and verify authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Serviço de análise por IA não configurado. Contacte o administrador.',
        technical_details: 'OpenAI API key missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Use service role key for storage access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create auth client for user verification
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: userError } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting document analysis for user: ${user.id}`);

    // Parse request
    const { documentPath }: DocumentAnalysisRequest = await req.json();
    
    if (!documentPath) {
      return new Response(JSON.stringify({ success: false, error: 'Document path is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download document from Supabase Storage
    console.log(`Downloading document: ${documentPath}`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(documentPath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      console.error('Document path:', documentPath);
      console.error('Storage bucket: documents');
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to download document. Please ensure the file exists and try again.',
        technical_details: {
          error: downloadError?.message || 'File not found',
          document_path: documentPath
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fileName = documentPath.split('/').pop() || 'document';
    const fileType = getFileType(fileName);
    
    console.log(`File type detected: ${fileType} for file: ${fileName}`);

    let documentContent = '';
    let imageUrl = '';
    let analysisType = 'text';

    // === PHASE 1: INTELLIGENT CONTENT EXTRACTION ===
    console.log('=== PHASE 1: CONTENT EXTRACTION ===');
    
    if (fileType === 'pdf') {
      console.log('Extracting text from PDF (comprehensive analysis)...');
      const extractedText = await extractPdfText(fileData);
      
      console.log(`PDF extraction results: ${extractedText.length} characters, ${extractedText.split(' ').filter(w => w.length > 2).length} words`);
      
      // Enhanced threshold for vision analysis decision
      const wordCount = extractedText.split(' ').filter(word => word.length > 2).length;
      const hasLicenseKeywords = /licen[çc]a|processo|emiss[ãa]o|vencimento|condicionante/i.test(extractedText);
      
      if (extractedText.length < 200 || wordCount < 25 || !hasLicenseKeywords) {
        console.log('PDF text quality insufficient, attempting hybrid analysis...');
        
        // Create temporary file for vision analysis
        const tempVisionPath = `temp-vision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(tempVisionPath, fileData, {
            contentType: 'application/pdf',
            cacheControl: '300'
          });
        
        if (!uploadError && uploadData) {
          const { data: urlData } = await supabase.storage
            .from('documents')
            .createSignedUrl(uploadData.path, 1800); // 30 minutes
          
          if (urlData?.signedUrl) {
            imageUrl = urlData.signedUrl;
            analysisType = 'hybrid';
            documentContent = `PDF document with limited text extraction. Extracted text: ${extractedText}`;
            console.log('Prepared for hybrid text+vision analysis');
          }
        }
        
        if (!imageUrl) {
          documentContent = extractedText;
          analysisType = 'text_low_quality';
          console.log('Fallback to text-only analysis with low quality content');
        }
      } else {
        documentContent = extractedText;
        analysisType = 'text';
        console.log('Using high-quality text analysis');
      }
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
      console.log('Processing image document for vision analysis...');
      
      const tempImagePath = `temp-vision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileType}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(tempImagePath, fileData, {
          contentType: fileData.type,
          cacheControl: '300'
        });
      
      if (!uploadError && uploadData) {
        const { data: urlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(uploadData.path, 1800);
        
        if (urlData?.signedUrl) {
          imageUrl = urlData.signedUrl;
          analysisType = 'vision';
          documentContent = `License document image: ${fileName}`;
        }
      }
    } else if (['csv', 'xlsx', 'xls'].includes(fileType)) {
      console.log('Parsing spreadsheet content...');
      documentContent = await parseSpreadsheet(fileData, fileType);
      analysisType = 'spreadsheet';
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Tipo de arquivo não suportado: ${fileType}. Envie arquivos PDF, imagens (JPG, PNG) ou planilhas (CSV, Excel).` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === PHASE 2: ENHANCED AI ANALYSIS ===
    console.log(`=== PHASE 2: AI ANALYSIS (${analysisType.toUpperCase()}) ===`);

    const minProcessingTime = 12000; // 12 seconds minimum for credibility
    const analysisStartTime = Date.now();
    
    console.log('Preparing advanced OpenAI analysis...');

    // Enhanced OpenAI configuration
    const openaiPayload: any = {
      model: 'gpt-4.1-2025-04-14', // Latest GPT-4.1 model
      max_completion_tokens: 6000,
      response_format: { type: "json_object" }
    };

    // Configure messages based on analysis type
    if (analysisType === 'vision' || analysisType === 'hybrid') {
      console.log('Configuring vision-enhanced analysis...');
      openaiPayload.messages = [
        {
          role: 'system',
          content: `Você é um especialista SÊNIOR em licenciamento ambiental brasileiro com 25+ anos de experiência. 
          Analise minuciosamente a imagem do documento fornecida e extraia TODAS as informações de licenciamento possíveis.
          
          ESTRATÉGIAS VISUAIS AVANÇADAS:
          - Examine cabeçalhos, logotipos e timbres para identificar órgãos emissores
          - Localize números de processo em destaque, caixas ou campos específicos
          - Procure datas em formatos brasileiros (DD/MM/AAAA) em locais típicos
          - Identifique condicionantes em listas numeradas, bullets ou seções específicas
          - Analise assinaturas, carimbos e validações oficiais
          - Use OCR mental para texto mesmo que de baixa qualidade
          
          Seja meticuloso e use confidence scores realistas baseados na clareza visual das informações.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: getSpecializedPrompt(documentContent)
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ];
    } else {
      console.log('Configuring advanced text analysis...');
      openaiPayload.messages = [
        {
          role: 'system',
          content: `Você é um especialista SÊNIOR em licenciamento ambiental brasileiro com 25+ anos de experiência.
          Analise o texto fornecido com máxima profundidade e inteligência contextual.
          
          ESTRATÉGIAS TEXTUAIS AVANÇADAS:
          - Use reconhecimento de padrões brasileiros de documentos oficiais
          - Identifique estruturas típicas de licenças (cabeçalho, corpo, condicionantes)
          - Procure por palavras-chave e frases típicas em português brasileiro
          - Valide informações cruzando múltiplas seções do documento
          - Infira informações implícitas usando conhecimento especializado
          - Seja conservador apenas quando realmente houver ambiguidade
          
          Dedique máxima atenção para uma análise completa e precisa.`
        },
        {
          role: 'user',
          content: getSpecializedPrompt(documentContent)
        }
      ];
    }

    console.log('Calling OpenAI API for comprehensive analysis...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiPayload),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error details:', errorText);
      
      let errorMessage = 'Erro no serviço de análise por IA.';
      const suggestions = ['Tente novamente em alguns minutos', 'Verifique sua conexão com a internet'];
      
      if (errorText.includes('rate_limit')) {
        errorMessage = 'Muitas solicitações de análise. Aguarde alguns minutos.';
      } else if (errorText.includes('invalid_api_key')) {
        errorMessage = 'Configuração do serviço de IA inválida.';
        suggestions.push('Contacte o administrador do sistema');
      } else if (errorText.includes('quota')) {
        errorMessage = 'Limite de análises atingido temporariamente.';
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMessage,
        suggestions,
        technical_details: `OpenAI API error: ${openaiResponse.status}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await openaiResponse.json();
    console.log('OpenAI analysis completed successfully');

    // === PHASE 3: INTELLIGENT RESULT PROCESSING ===
    console.log('=== PHASE 3: INTELLIGENT RESULT PROCESSING ===');

    let extractedData: ExtractedLicenseFormData;
    let extractionMethod = 'ai_primary';
    
    try {
      const content = aiResponse.choices[0].message.content;
      console.log(`AI response length: ${content.length}`);
      extractedData = extractJsonFromText(content);
      console.log('AI extraction successful');
      
      // Validate and enhance extracted data
      if (!extractedData.nome && extractedData.tipo && extractedData.orgaoEmissor) {
        extractedData.nome = `Licença ${extractedData.tipo} - ${extractedData.orgaoEmissor}`;
      }
      
      // Ensure status is logically calculated
      if (extractedData.dataVencimento && !extractedData.status) {
        const vencimento = new Date(extractedData.dataVencimento);
        const agora = new Date();
        extractedData.status = vencimento > agora ? 'Ativa' : 'Vencida';
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Attempting heuristic fallback analysis...');
      
      const heuristicData = heuristicExtractFromFileName(fileName);
      extractionMethod = 'heuristic_fallback';
      
      extractedData = {
        nome: heuristicData.nome || '',
        tipo: heuristicData.tipo || '',
        orgaoEmissor: heuristicData.orgaoEmissor || '',
        numeroProcesso: heuristicData.numeroProcesso || '',
        dataEmissao: heuristicData.dataEmissao || '',
        dataVencimento: heuristicData.dataVencimento || '',
        status: heuristicData.status || '',
        condicionantes: heuristicData.condicionantes || '',
        structured_conditions: [],
        alerts: [],
        compliance_score: 0,
        renewal_recommendation: {
          start_date: '',
          urgency: 'medium',
          required_documents: [],
          estimated_cost: 0,
          recommended_actions: []
        },
        confidence_scores: {
          nome: 15,
          tipo: 20,
          orgaoEmissor: 15,
          numeroProcesso: 10,
          dataEmissao: 10,
          dataVencimento: 10,
          status: 15,
          condicionantes: 5
        }
      } as ExtractedLicenseFormData;
    }

    // Enhanced confidence calculation
    const confidenceScores = extractedData.confidence_scores || {};
    const weights = {
      nome: 0.15,
      tipo: 0.20,
      orgaoEmissor: 0.15,
      numeroProcesso: 0.15,
      dataEmissao: 0.10,
      dataVencimento: 0.10,
      status: 0.10,
      condicionantes: 0.05
    };

    let weightedConfidence = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([field, weight]) => {
      const score = confidenceScores[field as keyof typeof confidenceScores] || 0;
      weightedConfidence += score * weight;
      totalWeight += weight;
    });

    const baseConfidence = Math.round(weightedConfidence / totalWeight);

    // Boost confidence for critical data presence
    const criticalFields = ['nome', 'tipo', 'orgaoEmissor', 'numeroProcesso'];
    const criticalDataCount = criticalFields.filter(field => 
      extractedData[field as keyof ExtractedLicenseFormData]
    ).length;
    
    const criticalBoost = (criticalDataCount / criticalFields.length) * 20;
    
    // Content quality boost
    const contentQualityBoost = documentContent.length > 2000 ? 10 : 
                               documentContent.length > 1000 ? 5 : 0;
    
    const finalConfidence = Math.min(95, Math.round(baseConfidence + criticalBoost + contentQualityBoost));

    // Ensure minimum processing time for user experience
    const processingTime = Date.now() - analysisStartTime;
    if (processingTime < minProcessingTime) {
      const waitTime = minProcessingTime - processingTime;
      console.log(`Ensuring minimum processing time: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const totalProcessingTime = Date.now() - startTime;
    console.log(`Analysis completed: confidence=${finalConfidence}%, method=${extractionMethod}, processing_time=${totalProcessingTime}ms`);

    // Enhanced response logic based on confidence and data quality
    if (finalConfidence < 25 && criticalDataCount < 2) {
      console.log('Analysis confidence critically low, providing detailed guidance...');
      
      return new Response(JSON.stringify({ 
        success: false, 
        confidence: finalConfidence,
        error: 'Análise incompleta. Documento pode não ser uma licença ambiental válida ou ter qualidade insuficiente.',
        analysis_details: {
          method: extractionMethod,
          processing_time: totalProcessingTime,
          content_length: documentContent.length,
          critical_data_found: criticalDataCount
        },
        partial_data: extractedData,
        suggestions: [
          'Verifique se o arquivo é realmente uma licença ambiental',
          'Tente fazer upload de uma versão escaneada em alta resolução (300 DPI ou superior)',
          'Certifique-se de que o documento está completo e todas as páginas estão incluídas',
          'Se for um PDF digitalizado de baixa qualidade, tente convertê-lo para imagem PNG',
          'Complete manualmente os campos mais importantes usando o formulário'
        ],
        technical_help: `Análise tentada com ${analysisType}. Conteúdo: ${documentContent.length} caracteres.`
      }), {
        status: 200, // Changed to 200 to allow frontend handling
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (finalConfidence < 50) {
      console.log('Analysis confidence moderate, providing guidance...');
      
      return new Response(JSON.stringify({
        success: true,
        confidence: finalConfidence,
        extracted_data: extractedData,
        analysis_details: {
          method: extractionMethod,
          processing_time: totalProcessingTime,
          quality_indicators: {
            critical_data_found: criticalDataCount,
            content_length: documentContent.length,
            analysis_type: analysisType
          }
        },
        message: 'Análise parcial realizada. Alguns dados podem estar incompletos.',
        suggestions: [
          'Revise cuidadosamente todos os campos extraídos',
          'Complete manualmente os campos em branco ou com baixa confiança',
          'Verifique se as datas estão no formato correto',
          'Confirme se o CNPJ e números de processo estão completos'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // High confidence - successful analysis
    console.log('Analysis completed successfully with high confidence');

    // Cleanup temporary files
    if (imageUrl && (analysisType === 'vision' || analysisType === 'hybrid')) {
      try {
        const urlParts = imageUrl.split('/');
        const tempFileName = urlParts[urlParts.length - 1].split('?')[0];
        if (tempFileName.startsWith('temp-vision-')) {
          await supabase.storage.from('documents').remove([tempFileName]);
          console.log('Temporary vision file cleaned up');
        }
      } catch (cleanupError) {
        console.log('Cleanup warning (non-critical):', cleanupError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      confidence: finalConfidence,
      extracted_data: extractedData,
      analysis_details: {
        method: extractionMethod,
        processing_time: totalProcessingTime,
        analysis_type: analysisType,
        content_quality: documentContent.length > 2000 ? 'high' : documentContent.length > 1000 ? 'medium' : 'low',
        critical_data_found: criticalDataCount
      },
      message: 'Análise realizada com sucesso.',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in comprehensive document analysis:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // Enhanced error classification and user guidance
    let errorMessage = 'Erro durante a análise do documento.';
    let errorSuggestions: string[] = [];
    let errorCategory = 'unknown';
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('openai') || errorMsg.includes('api')) {
        errorCategory = 'ai_service';
        errorMessage = 'Erro no serviço de análise por IA.';
        errorSuggestions = [
          'Verifique sua conexão com a internet',
          'Tente novamente em alguns minutos',
          'Se o problema persistir, contacte o suporte técnico'
        ];
      } else if (errorMsg.includes('pdf') || errorMsg.includes('extract')) {
        errorCategory = 'file_processing';
        errorMessage = 'Erro ao processar o arquivo PDF.';
        errorSuggestions = [
          'Verifique se o arquivo não está corrompido',
          'Tente fazer upload de uma versão mais simples do PDF',
          'Certifique-se de que o arquivo é um PDF válido',
          'Se possível, converta o documento para formato de imagem (PNG/JPG)'
        ];
      } else if (errorMsg.includes('download') || errorMsg.includes('storage')) {
        errorCategory = 'storage';
        errorMessage = 'Erro ao acessar o documento armazenado.';
        errorSuggestions = [
          'Verifique se o arquivo foi enviado corretamente',
          'Tente fazer o upload do documento novamente',
          'Confirme se o arquivo não foi removido ou corrompido'
        ];
      } else if (errorMsg.includes('auth') || errorMsg.includes('permission')) {
        errorCategory = 'authorization';
        errorMessage = 'Erro de autorização para análise do documento.';
        errorSuggestions = [
          'Faça login novamente na plataforma',
          'Verifique se você tem permissão para analisar documentos',
          'Contacte o administrador se o problema persistir'
        ];
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      error_category: errorCategory,
      suggestions: errorSuggestions,
      technical_details: {
        error_type: error instanceof Error ? error.name : 'Unknown',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        stack_preview: error instanceof Error ? error.stack?.substring(0, 300) : null
      },
      fallback_options: [
        'Tente analisar um documento diferente para testar o sistema',
        'Use o formulário manual para inserir os dados da licença',
        'Contacte o suporte técnico com os detalhes do erro acima'
      ]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});