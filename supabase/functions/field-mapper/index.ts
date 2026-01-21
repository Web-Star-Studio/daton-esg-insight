import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  transformation?: string;
}

interface MappingResult {
  mappings: FieldMapping[];
  unmapped: string[];
  suggestions: Array<{
    sourceField: string;
    possibleTargets: Array<{ field: string; confidence: number }>;
  }>;
}

// Entity field definitions
const ENTITY_FIELDS: Record<string, Record<string, string[]>> = {
  'emissions': {
    'source_name': ['fonte', 'nome da fonte', 'source', 'emission source', 'fonte de emissão'],
    'scope': ['escopo', 'scope', 'nível'],
    'category': ['categoria', 'category', 'tipo'],
    'quantity': ['quantidade', 'qty', 'quantity', 'volume', 'consumo'],
    'unit': ['unidade', 'unit', 'un'],
    'total_co2e': ['emissão', 'co2', 'co2e', 'tco2e', 'emissões', 'total'],
    'period_start': ['início', 'data início', 'start date', 'de'],
    'period_end': ['fim', 'data fim', 'end date', 'até']
  },
  'employees': {
    'full_name': ['nome', 'nome completo', 'colaborador', 'funcionário', 'name'],
    'email': ['email', 'e-mail', 'correio'],
    'cpf': ['cpf', 'documento'],
    'department': ['departamento', 'dept', 'setor', 'área'],
    'position': ['cargo', 'função', 'position', 'job title'],
    'hire_date': ['admissão', 'data admissão', 'contratação', 'hire date'],
    'birth_date': ['nascimento', 'data nascimento', 'birth date', 'aniversário'],
    'gender': ['gênero', 'sexo', 'gender']
  },
  'goals': {
    'goal_name': ['meta', 'objetivo', 'goal', 'nome'],
    'category': ['categoria', 'category', 'pilar', 'tipo'],
    'target_value': ['valor alvo', 'target', 'meta valor', 'objetivo'],
    'baseline_value': ['baseline', 'linha base', 'valor base', 'inicial'],
    'target_date': ['prazo', 'data alvo', 'target date', 'até'],
    'unit': ['unidade', 'unit', 'un'],
    'description': ['descrição', 'description', 'detalhes']
  },
  'waste': {
    'waste_type': ['tipo', 'resíduo', 'material', 'waste type'],
    'waste_class': ['classe', 'classificação', 'class'],
    'quantity': ['quantidade', 'qty', 'quantity', 'peso'],
    'unit': ['unidade', 'unit', 'un'],
    'disposal_method': ['destinação', 'método', 'disposal', 'tratamento'],
    'disposal_date': ['data', 'data destinação', 'date']
  },
  'licenses': {
    'license_name': ['nome', 'licença', 'license'],
    'license_number': ['número', 'protocolo', 'number', 'nº'],
    'license_type': ['tipo', 'type', 'modalidade'],
    'issuing_body': ['órgão', 'emissor', 'issuing body'],
    'issue_date': ['emissão', 'data emissão', 'issue date'],
    'expiry_date': ['validade', 'vencimento', 'expiry', 'expiração']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceHeaders, targetEntity, companyId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Auto-map fields
    const mappingResult = await autoMapFields(
      sourceHeaders,
      targetEntity,
      companyId,
      supabaseClient
    );

    return new Response(JSON.stringify(mappingResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Field mapping error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function autoMapFields(
  sourceHeaders: string[],
  targetEntity: string,
  companyId: string,
  supabaseClient: any
): Promise<MappingResult> {
  const result: MappingResult = {
    mappings: [],
    unmapped: [],
    suggestions: []
  };

  const targetFields = ENTITY_FIELDS[targetEntity] || {};

  // Try rule-based mapping first
  for (const sourceHeader of sourceHeaders) {
    const normalizedSource = normalizeFieldName(sourceHeader);
    let bestMatch: { field: string; confidence: number } | null = null;

    // Check each target field
    for (const [targetField, patterns] of Object.entries(targetFields)) {
      const confidence = calculateMatchConfidence(normalizedSource, patterns);
      
      if (confidence > 0.7) {
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { field: targetField, confidence };
        }
      }
    }

    if (bestMatch && bestMatch.confidence > 0.8) {
      // High confidence match
      result.mappings.push({
        sourceField: sourceHeader,
        targetField: bestMatch.field,
        confidence: bestMatch.confidence
      });
    } else if (bestMatch) {
      // Medium confidence - add as suggestion
      result.suggestions.push({
        sourceField: sourceHeader,
        possibleTargets: [bestMatch]
      });
      result.unmapped.push(sourceHeader);
    } else {
      result.unmapped.push(sourceHeader);
    }
  }

  // For unmapped fields, use AI for intelligent mapping
  if (result.unmapped.length > 0 && LOVABLE_API_KEY) {
    try {
      const aiMappings = await getAIMappings(
        result.unmapped,
        Object.keys(targetFields),
        targetEntity
      );

      for (const aiMapping of aiMappings) {
        const existingSuggestion = result.suggestions.find(
          s => s.sourceField === aiMapping.sourceField
        );

        if (existingSuggestion) {
          existingSuggestion.possibleTargets.push({
            field: aiMapping.targetField,
            confidence: aiMapping.confidence
          });
        } else {
          result.suggestions.push({
            sourceField: aiMapping.sourceField,
            possibleTargets: [{
              field: aiMapping.targetField,
              confidence: aiMapping.confidence
            }]
          });
        }
      }
    } catch (error) {
      console.error('AI mapping failed:', error);
    }
  }

  return result;
}

function normalizeFieldName(field: string): string {
  return field
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function calculateMatchConfidence(sourceField: string, patterns: string[]): number {
  let maxConfidence = 0;

  for (const pattern of patterns) {
    const normalizedPattern = normalizeFieldName(pattern);
    
    // Exact match
    if (sourceField === normalizedPattern) {
      return 1.0;
    }

    // Contains match
    if (sourceField.includes(normalizedPattern) || normalizedPattern.includes(sourceField)) {
      const confidence = Math.min(sourceField.length, normalizedPattern.length) / 
                        Math.max(sourceField.length, normalizedPattern.length);
      maxConfidence = Math.max(maxConfidence, confidence);
    }

    // Word match
    const sourceWords = sourceField.split(/\s+/);
    const patternWords = normalizedPattern.split(/\s+/);
    const matchingWords = sourceWords.filter(w => patternWords.includes(w)).length;
    
    if (matchingWords > 0) {
      const wordConfidence = matchingWords / Math.max(sourceWords.length, patternWords.length);
      maxConfidence = Math.max(maxConfidence, wordConfidence * 0.9);
    }
  }

  return maxConfidence;
}

async function getAIMappings(
  unmappedFields: string[],
  targetFields: string[],
  entityType: string
): Promise<FieldMapping[]> {
  const prompt = `Você é um especialista em mapeamento de campos de dados ESG.

**Contexto:** 
Estou importando dados para uma tabela de "${entityType}".

**Campos disponíveis no sistema:** ${targetFields.join(', ')}

**Campos da planilha do usuário:** ${unmappedFields.join(', ')}

**Tarefa:**
Para cada campo da planilha, identifique o melhor campo do sistema para mapear, ou retorne null se não houver correspondência adequada.

**Retorne APENAS um JSON válido** no formato:
{
  "mappings": [
    {
      "sourceField": "campo da planilha",
      "targetField": "campo do sistema ou null",
      "confidence": 0.0-1.0,
      "transformation": "opcional - descreva se precisa de transformação"
    }
  ]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'Você é um assistente de mapeamento de dados. Retorne apenas JSON válido.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_completion_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`AI mapping failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
  const jsonContent = jsonMatch ? jsonMatch[1] : content;
  
  const result = JSON.parse(jsonContent);
  
  return result.mappings.filter((m: any) => m.targetField !== null);
}
