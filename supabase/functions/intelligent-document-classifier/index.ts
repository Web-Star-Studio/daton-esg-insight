import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Document types with keywords and suggested actions
const documentTypes = {
  emissions_report: {
    name: 'Relatório de Emissões',
    category: 'Ambiental - GEE',
    keywords: ['emiss', 'co2', 'ghg', 'gee', 'carbono', 'escopo', 'scope', 'tonelada'],
    relevantFields: ['scope', 'source', 'quantity', 'emission_factor', 'co2e'],
    suggestedActions: ['Importar dados de emissões', 'Criar/atualizar fontes de emissão']
  },
  emissions_spreadsheet: {
    name: 'Planilha de Emissões',
    category: 'Ambiental - GEE',
    keywords: ['emiss', 'co2', 'fonte', 'escopo', 'fator', 'kg', 'tonelada', 'atividade'],
    relevantFields: ['fonte', 'escopo', 'quantidade', 'fator_emissao', 'unidade'],
    suggestedActions: ['Importar emissões em lote', 'Analisar tendências']
  },
  environmental_license: {
    name: 'Licença Ambiental',
    category: 'Ambiental - Licenciamento',
    keywords: ['licença', 'licenca', 'ambiental', 'órgão', 'validade', 'vencimento', 'cetesb', 'ibama', 'lp', 'li', 'lo'],
    relevantFields: ['license_number', 'license_type', 'issuing_body', 'expiry_date'],
    suggestedActions: ['Cadastrar licença', 'Verificar vencimentos']
  },
  waste_invoice: {
    name: 'Nota Fiscal de Resíduos',
    category: 'Ambiental - Resíduos',
    keywords: ['resíduo', 'residuo', 'mtr', 'manifesto', 'destinação', 'destinacao', 'tonelada', 'kg', 'tratamento'],
    relevantFields: ['waste_type', 'quantity', 'destination', 'supplier'],
    suggestedActions: ['Registrar resíduo', 'Atualizar PGRS']
  },
  employee_spreadsheet: {
    name: 'Planilha de Colaboradores',
    category: 'Social - RH',
    keywords: ['colaborador', 'funcionário', 'funcionario', 'cpf', 'cargo', 'salário', 'salario', 'admissão', 'admissao'],
    relevantFields: ['name', 'position', 'department', 'hire_date', 'gender'],
    suggestedActions: ['Importar colaboradores', 'Analisar diversidade']
  },
  goals_spreadsheet: {
    name: 'Planilha de Metas',
    category: 'Governança - Estratégia',
    keywords: ['meta', 'objetivo', 'target', 'kpi', 'indicador', 'progresso', 'baseline', 'prazo'],
    relevantFields: ['goal_name', 'target_value', 'current_value', 'deadline', 'category'],
    suggestedActions: ['Importar metas', 'Atualizar progresso']
  },
  generic: {
    name: 'Documento Genérico',
    category: 'Outros',
    keywords: [],
    relevantFields: [],
    suggestedActions: ['Analisar conteúdo']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileType, fileName, structured } = await req.json();
    
    console.log('📋 Classifying document:', { fileName, fileType, contentLength: content?.length });

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build classification prompt
    const documentTypesList = Object.entries(documentTypes).map(([key, info]) => 
      `- **${key}**: ${info.name} (${info.category})\n  Palavras-chave: ${info.keywords.join(', ')}`
    ).join('\n');

    const prompt = `Você é um classificador especialista de documentos ESG.

**DOCUMENTO A CLASSIFICAR:**
Nome do arquivo: ${fileName}
Tipo: ${fileType}
${structured ? `Dados estruturados disponíveis: ${JSON.stringify(structured).substring(0, 500)}` : ''}

**CONTEÚDO (primeiros 2000 caracteres):**
${content.substring(0, 2000)}

**TIPOS DE DOCUMENTOS DISPONÍVEIS:**
${documentTypesList}

**SUA TAREFA:**
Analise o documento e retorne APENAS um objeto JSON no seguinte formato:
{
  "documentType": "tipo_do_documento",
  "category": "categoria",
  "confidence": 0.95,
  "relevantFields": ["campo1", "campo2"],
  "suggestedActions": ["ação1", "ação2"]
}

Escolha o tipo que melhor corresponde ao conteúdo. Use "generic" se não houver correspondência clara.
Confidence deve ser entre 0 e 1.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limits exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to your workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI classification error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let classification;

    try {
      const aiResponse = data.choices[0].message.content;
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.warn('Failed to parse AI classification, using fallback:', parseError);
      // Fallback: keyword-based classification
      const lowerContent = content.toLowerCase();
      let bestMatch = 'generic';
      let maxScore = 0;

      for (const [docType, info] of Object.entries(documentTypes)) {
        if (docType === 'generic') continue;
        const score = info.keywords.filter(kw => lowerContent.includes(kw.toLowerCase())).length;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = docType;
        }
      }

      const matched = documentTypes[bestMatch as keyof typeof documentTypes];
      classification = {
        documentType: bestMatch,
        category: matched.category,
        confidence: maxScore > 0 ? Math.min(maxScore * 0.2, 0.8) : 0.3,
        relevantFields: matched.relevantFields,
        suggestedActions: matched.suggestedActions
      };
    }

    console.log('✅ Classification result:', classification);

    return new Response(JSON.stringify({ 
      classification 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in intelligent-document-classifier:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Classification failed',
      classification: {
        documentType: 'generic',
        category: 'Outros',
        confidence: 0.1,
        relevantFields: [],
        suggestedActions: ['Analisar manualmente']
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
