import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Document type definitions
export interface DocumentClassification {
  documentType: string;
  confidence: number;
  suggestedFields: string[];
  suggestedActions: string[];
  extractionStrategy: string;
  category: 'emissions' | 'waste' | 'licenses' | 'employees' | 'compliance' | 'financial' | 'reports' | 'other';
}

const documentTypes = {
  'waste_invoice': {
    name: 'Nota Fiscal de Resíduos',
    category: 'waste' as const,
    fields: ['waste_type', 'quantity', 'unit', 'disposal_company', 'mtr_number', 'date', 'value'],
    actions: ['Register waste disposal', 'Update PGRS records', 'Update recycling metrics'],
    keywords: ['resíduo', 'mtr', 'destinação', 'reciclagem', 'coleta', 'tratamento']
  },
  'emissions_report': {
    name: 'Relatório de Emissões',
    category: 'emissions' as const,
    fields: ['emission_source', 'scope', 'quantity', 'period', 'emission_factor'],
    actions: ['Register emission sources', 'Update GHG inventory', 'Analyze trends'],
    keywords: ['emissão', 'co2', 'ghg', 'gee', 'escopo', 'carbono', 'tco2e']
  },
  'emissions_spreadsheet': {
    name: 'Planilha de Inventário GEE',
    category: 'emissions' as const,
    fields: ['source_name', 'scope', 'activity_data', 'emission_factor', 'emissions', 'period'],
    actions: ['Bulk import emissions', 'Calculate totals', 'Generate inventory report'],
    keywords: ['inventário', 'emissões', 'escopo 1', 'escopo 2', 'escopo 3', 'fator']
  },
  'environmental_license': {
    name: 'Licença Ambiental',
    category: 'licenses' as const,
    fields: ['license_number', 'issuing_agency', 'issue_date', 'expiry_date', 'license_type', 'conditions'],
    actions: ['Register license', 'Set expiry alerts', 'Track compliance'],
    keywords: ['licença', 'ibama', 'cetesb', 'válida até', 'condicionante', 'autorização']
  },
  'employee_spreadsheet': {
    name: 'Planilha de Funcionários',
    category: 'employees' as const,
    fields: ['name', 'email', 'department', 'position', 'hire_date', 'birth_date', 'gender'],
    actions: ['Bulk import employees', 'Update HR database', 'Generate diversity metrics'],
    keywords: ['funcionário', 'colaborador', 'departamento', 'cargo', 'admissão', 'cpf']
  },
  'audit_report': {
    name: 'Relatório de Auditoria',
    category: 'compliance' as const,
    fields: ['audit_date', 'auditor', 'findings', 'non_conformities', 'recommendations'],
    actions: ['Register findings', 'Create action plans', 'Track remediation'],
    keywords: ['auditoria', 'não conformidade', 'achado', 'recomendação', 'correção']
  },
  'meter_reading': {
    name: 'Leitura de Medidor',
    category: 'emissions' as const,
    fields: ['meter_type', 'reading_value', 'unit', 'date', 'location'],
    actions: ['Register consumption', 'Calculate emissions', 'Track usage trends'],
    keywords: ['medidor', 'leitura', 'consumo', 'kwh', 'm³', 'energia', 'água']
  },
  'waste_manifest': {
    name: 'Manifesto de Transporte de Resíduos',
    category: 'waste' as const,
    fields: ['generator', 'transporter', 'receiver', 'waste_code', 'quantity', 'mtr'],
    actions: ['Register MTR', 'Track disposal chain', 'Update waste records'],
    keywords: ['manifesto', 'mtr', 'transporte', 'gerador', 'transportador', 'receptor']
  },
  'gri_report': {
    name: 'Relatório GRI/CDP',
    category: 'reports' as const,
    fields: ['reporting_period', 'indicators', 'metrics', 'targets', 'performance'],
    actions: ['Extract KPIs', 'Benchmark performance', 'Identify gaps'],
    keywords: ['gri', 'cdp', 'sustentabilidade', 'esg', 'indicador', 'relato']
  },
  'supplier_contract': {
    name: 'Contrato de Fornecedor',
    category: 'compliance' as const,
    fields: ['supplier_name', 'contract_number', 'start_date', 'end_date', 'value', 'terms'],
    actions: ['Register supplier', 'Set renewal alerts', 'Track compliance'],
    keywords: ['contrato', 'fornecedor', 'prestador', 'vigência', 'renovação']
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileType, fileName, structured } = await req.json();

    if (!content && !structured) {
      throw new Error('Content or structured data is required');
    }

    console.log('🔍 Classifying document:', { fileType, fileName, hasContent: !!content, hasStructured: !!structured });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare content for classification
    let textToAnalyze = '';
    let structuredInfo = '';

    if (content) {
      // Limit content to first 2000 chars for efficiency
      textToAnalyze = typeof content === 'string' 
        ? content.substring(0, 2000) 
        : JSON.stringify(content).substring(0, 2000);
    }

    if (structured) {
      if (structured.headers && Array.isArray(structured.headers)) {
        structuredInfo += `\nSpreadsheet headers: ${structured.headers.join(', ')}`;
      }
      if (structured.rowCount) {
        structuredInfo += `\nNumber of rows: ${structured.rowCount}`;
      }
    }

    // Build classification prompt
    const classificationPrompt = `Analise este documento e identifique seu tipo EXATO dentre as opções abaixo.

**CONTEÚDO DO DOCUMENTO:**
${textToAnalyze}
${structuredInfo}

**Tipo de arquivo:** ${fileType || 'desconhecido'}
**Nome do arquivo:** ${fileName || 'desconhecido'}

**TIPOS DE DOCUMENTOS DISPONÍVEIS:**
${Object.entries(documentTypes).map(([key, info]) => 
  `- ${key}: ${info.name} (palavras-chave: ${info.keywords.join(', ')})`
).join('\n')}

**INSTRUÇÕES:**
1. Analise o conteúdo e identifique qual tipo de documento melhor se encaixa
2. Se não houver match claro, use 'other'
3. Avalie a confiança de 0 a 1 (quanto mais claro o tipo, maior a confiança)
4. Liste campos relevantes que podem ser extraídos
5. Sugira ações específicas baseadas no conteúdo

**Retorne APENAS um JSON válido com esta estrutura:**
{
  "documentType": "tipo_do_documento",
  "confidence": 0.95,
  "category": "categoria",
  "suggestedFields": ["campo1", "campo2"],
  "suggestedActions": ["ação1", "ação2"],
  "extractionStrategy": "estratégia de extração"
}`;

    // Call AI for classification
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: classificationPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent classification
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI classification failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const classificationText = aiData.choices?.[0]?.message?.content || '';

    console.log('🤖 AI classification response:', classificationText.substring(0, 200));

    // Parse AI response
    let classification: DocumentClassification;
    
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = classificationText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and enrich with document type info
      const docTypeKey = parsed.documentType || 'other';
      const docInfo = documentTypes[docTypeKey as keyof typeof documentTypes];
      
      classification = {
        documentType: docInfo?.name || 'Documento Genérico',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        category: docInfo?.category || parsed.category || 'other',
        suggestedFields: parsed.suggestedFields || docInfo?.fields || [],
        suggestedActions: parsed.suggestedActions || docInfo?.actions || [],
        extractionStrategy: parsed.extractionStrategy || 'standard'
      };

    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback:', parseError);
      
      // Fallback: keyword-based classification
      const contentLower = (textToAnalyze + structuredInfo).toLowerCase();
      let bestMatch = { key: 'other', confidence: 0.3 };
      
      for (const [key, info] of Object.entries(documentTypes)) {
        const matchCount = info.keywords.filter(kw => contentLower.includes(kw.toLowerCase())).length;
        const confidence = matchCount / info.keywords.length;
        
        if (confidence > bestMatch.confidence) {
          bestMatch = { key, confidence };
        }
      }
      
      const matchedInfo = documentTypes[bestMatch.key as keyof typeof documentTypes];
      classification = {
        documentType: matchedInfo?.name || 'Documento Genérico',
        confidence: bestMatch.confidence,
        category: matchedInfo?.category || 'other',
        suggestedFields: matchedInfo?.fields || [],
        suggestedActions: matchedInfo?.actions || [],
        extractionStrategy: 'fallback_keywords'
      };
    }

    console.log('✅ Document classified:', classification);

    return new Response(
      JSON.stringify({
        success: true,
        classification,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Classification error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
