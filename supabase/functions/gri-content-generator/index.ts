import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
      },
    }
  );

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  try {
    const { authorization } = Object.fromEntries(req.headers.entries());
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authorization?.replace('Bearer ', '') || ''
    );
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, reportId, sectionKey, sectionType, regenerate, metadataType, format } = await req.json();
    
    console.log(`GRI content generator called with action: ${action}, reportId: ${reportId}`);

    if (action === 'preview' || action === 'export') {
      return await handleReportGeneration(supabaseClient, reportId, action, format);
    } else if (metadataType) {
      // Handle metadata generation
      return await handleMetadataGeneration(supabaseClient, openaiApiKey, reportId, metadataType);
    } else if (sectionKey && sectionType) {
      return await handleSectionGeneration(supabaseClient, openaiApiKey, reportId, sectionKey, sectionType, regenerate);
    } else {
      // Legacy support for direct section generation
      return await handleSectionGeneration(supabaseClient, openaiApiKey, reportId, 'overview', 'Visão Geral', false);
    }

  } catch (error) {
    console.error('Error in GRI content generator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle metadata generation (ceo_message, executive_summary, methodology)
async function handleMetadataGeneration(supabaseClient, openaiApiKey, reportId, metadataType) {
  console.log(`Generating metadata for type: ${metadataType}`);
  
  try {
    // Fetch report data
    const { data: report, error: reportError } = await supabaseClient
      .from('gri_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('Error fetching report:', reportError);
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch company data separately
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('name, sector')
      .eq('id', report.company_id)
      .single();

    // Attach company data to report
    report.companies = company;

    // Generate content using AI
    const content = await generateMetadataContent(openaiApiKey, report, metadataType);
    
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in metadata generation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleSectionGeneration(supabaseClient, openaiApiKey, reportId, sectionKey, sectionType, regenerate) {
  console.log(`Generating GRI content for section: ${sectionKey}, type: ${sectionType}`);
  
  try {
    // Fetch report data
    const { data: report, error: reportError } = await supabaseClient
      .from('gri_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('Error fetching report:', reportError);
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch company data separately
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('name, sector')
      .eq('id', report.company_id)
      .single();

    // Attach company data to report
    report.companies = company;

    // Fetch relevant GRI indicators
    const { data: indicators } = await supabaseClient
      .from('gri_indicator_data')
      .select(`
        *,
        gri_indicators_library (
          code,
          name,
          description
        )
      `)
      .eq('report_id', reportId);

    // Fetch existing section content if not regenerating
    let existingContent = null;
    if (!regenerate) {
      const { data: existingSection } = await supabaseClient
        .from('gri_report_sections')
        .select('content')
        .eq('report_id', reportId)
        .eq('section_key', sectionKey)
        .single();
      
      existingContent = existingSection?.content;
    }

    // Generate content using AI
    const content = await generateGRIContent(openaiApiKey, report, sectionKey, sectionType, indicators || [], existingContent);
    
    // Update the report section in the database
    const { error: upsertError } = await supabaseClient
      .from('gri_report_sections')
      .upsert({
        report_id: reportId,
        section_key: sectionKey,
        section_title: sectionType,
        content: content,
        is_complete: true,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error updating section:', upsertError);
      throw upsertError;
    }

    // Recalculate report completion
    await supabaseClient.rpc('calculate_gri_report_completion', {
      p_report_id: reportId
    });

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in section generation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleReportGeneration(supabaseClient, reportId, action, format = null) {
  console.log(`Generating full report for action: ${action}, format: ${format}`);
  
  try {
    // Fetch complete report data
    const { data: report, error: reportError } = await supabaseClient
      .from('gri_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // Fetch company data separately
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('name, sector, cnpj')
      .eq('id', report.company_id)
      .single();

    // Attach company data to report
    report.companies = company;

    // Fetch report sections
    const { data: sections } = await supabaseClient
      .from('gri_report_sections')
      .select('*')
      .eq('report_id', reportId)
      .order('section_key');

    // Fetch GRI indicators
    const { data: indicators } = await supabaseClient
      .from('gri_indicator_data')
      .select(`
        *,
        gri_indicators_library (
          code,
          name,
          description,
          category
        )
      `)
      .eq('report_id', reportId)
      .order('indicator_id');

    // Handle PDF export
    if (action === 'export' && format === 'pdf') {
      const pdfBuffer = await generatePDFReport(report, sections || [], indicators || []);
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
      
      return new Response(JSON.stringify({ pdfBase64 }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
      });
    }

    // Generate HTML report (default)
    const htmlContent = generateHTMLReport(report, sections || [], indicators || []);

    return new Response(htmlContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html; charset=utf-8'
      },
    });

  } catch (error) {
    console.error('Error in report generation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function generateGRIContent(openaiApiKey, report, sectionKey, sectionType, indicators, existingContent = null) {
  if (!openaiApiKey) {
    console.log('OpenAI API key not found, using template content');
    return generateTemplateContent(sectionKey, sectionType, report);
  }

  try {
    const prompt = buildGRIPrompt(report, sectionKey, sectionType, indicators, existingContent);
    
    console.log(`Calling OpenAI API for section: ${sectionKey}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in GRI sustainability reporting. Generate comprehensive, professional content for GRI sustainability reports in Portuguese. Focus on being specific, data-driven, and aligned with GRI standards.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return generateTemplateContent(sectionKey, sectionType, report);
  }
}

// Generate metadata content (ceo_message, executive_summary, methodology)
async function generateMetadataContent(openaiApiKey, report, metadataType) {
  if (!openaiApiKey) {
    return getDefaultMetadataContent(metadataType, report);
  }

  try {
    const prompt = buildMetadataPrompt(report, metadataType);
    
    console.log(`Generating metadata content for: ${metadataType}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in GRI sustainability reporting. Generate professional, executive-level content for GRI sustainability reports in Portuguese.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error generating metadata content:', error);
    return getDefaultMetadataContent(metadataType, report);
  }
}

function buildMetadataPrompt(report, metadataType) {
  const companyName = report.companies?.name || 'Nossa empresa';
  const year = report.year;
  
  const baseContext = `
Empresa: ${companyName}
Ano do relatório: ${year}
Versão GRI: ${report.gri_standard_version || 'GRI Standards'}
`;

  switch (metadataType) {
    case 'ceo_message':
      return `${baseContext}
      
Gere uma mensagem do CEO/Presidente para o relatório de sustentabilidade GRI ${year}. A mensagem deve:
- Ser escrita em primeira pessoa
- Demonstrar comprometimento com a sustentabilidade
- Mencionar conquistas e desafios do ano
- Destacar a importância da transparência e prestação de contas
- Incluir uma visão para o futuro
- Ser profissional mas humana
- Ter aproximadamente 300-500 palavras

Formato: Texto corrido, sem título, pronto para ser incluído no relatório.`;

    case 'executive_summary':
      return `${baseContext}
      
Gere um resumo executivo para o relatório de sustentabilidade GRI ${year}. O resumo deve:
- Apresentar os principais pontos do relatório
- Incluir destaques de performance ESG
- Mencionar metodologia GRI utilizada
- Destacar principais conquistas e desafios
- Ser objetivo e direto
- Usar linguagem executiva profissional
- Ter aproximadamente 400-600 palavras

Formato: Texto estruturado com parágrafos bem definidos, sem título, pronto para inclusão no relatório.`;

    case 'methodology':
      return `${baseContext}
      
Gere uma seção de metodologia para o relatório de sustentabilidade GRI ${year}. A seção deve:
- Explicar a adoção dos padrões GRI
- Descrever o processo de materialidade
- Mencionar período e escopo do relatório
- Explicar coleta e verificação de dados
- Incluir limitações e premissas
- Ser técnica mas acessível
- Ter aproximadamente 300-450 palavras

Formato: Texto técnico estruturado, sem título, pronto para inclusão no relatório.`;

    default:
      return `${baseContext}
      
Gere conteúdo relevante para o relatório de sustentabilidade GRI ${year}.`;
  }
}

function getDefaultMetadataContent(metadataType, report) {
  const companyName = report.companies?.name || 'Nossa empresa';
  const year = report.year;
  
  switch (metadataType) {
    case 'ceo_message':
      return `É com satisfação que apresento o Relatório de Sustentabilidade ${year} da ${companyName}, elaborado de acordo com os padrões GRI.

Este relatório reflete nosso compromisso contínuo com a transparência e a prestação de contas às partes interessadas. Durante ${year}, continuamos a integrar práticas sustentáveis em todas as nossas operações, reconhecendo que a sustentabilidade é fundamental para o sucesso a longo prazo de nosso negócio.

Enfrentamos desafios significativos, mas também celebramos conquistas importantes que nos aproximam de nossos objetivos de sustentabilidade. Nosso foco permanece em criar valor compartilhado para todos os stakeholders, contribuindo para um futuro mais sustentável.

A transparência é um pilar fundamental de nossa estratégia corporativa. Por meio deste relatório, compartilhamos nossos progressos, desafios e compromissos futuros, demonstrando nossa responsabilidade com o desenvolvimento sustentável.

Continuaremos a trabalhar com determinação para alcançar nossas metas e contribuir positivamente para a sociedade e o meio ambiente.`;

    case 'executive_summary':
      return `Este Relatório de Sustentabilidade ${year} da ${companyName} foi elaborado em conformidade com os padrões GRI, demonstrando nosso compromisso com a transparência e a prestação de contas às partes interessadas.

O relatório apresenta nosso desempenho em aspectos ambientais, sociais e de governança (ESG), destacando as principais iniciativas, conquistas e desafios enfrentados durante o período. A metodologia GRI foi aplicada para garantir a comparabilidade e a qualidade das informações divulgadas.

Durante ${year}, focamos em fortalecer nossa gestão de sustentabilidade, implementando práticas que contribuem para o desenvolvimento sustentável e a criação de valor compartilhado. Nossos esforços concentram-se em áreas materiais identificadas através de processo estruturado de engajamento com stakeholders.

Os dados e informações apresentados neste relatório refletem nosso compromisso com a melhoria contínua e a transparência em nossas práticas de sustentabilidade, servindo como base para o planejamento estratégico futuro.`;

    case 'methodology':
      return `Este relatório foi elaborado em conformidade com os padrões GRI (Global Reporting Initiative), seguindo a abordagem "de acordo com os padrões GRI". A metodologia adotada garante a qualidade, comparabilidade e transparência das informações divulgadas.

O período de reporte compreende o ano de ${year}, com dados coletados sistematicamente através de nossos sistemas de gestão internos. O escopo do relatório abrange as principais operações da ${companyName}, incluindo aspectos ambientais, sociais e econômicos relevantes.

A definição dos temas materiais foi realizada através de processo estruturado que considerou a relevância para o negócio e o impacto sobre as partes interessadas. Este processo orienta a seleção dos indicadores GRI reportados e garante o foco nos aspectos mais significativos.

Os dados apresentados foram coletados e validados através de procedimentos internos de controle de qualidade, assegurando a confiabilidade das informações. Eventuais limitações ou estimativas utilizadas são devidamente indicadas no relatório.`;

    default:
      return `Conteúdo em desenvolvimento para o Relatório de Sustentabilidade ${year} da ${companyName}.`;
  }
}

function buildGRIPrompt(report, sectionKey, sectionType, indicators, existingContent) {
  const companyName = report.companies?.name || 'Nossa empresa';
  const year = report.year;
  
  let prompt = `
Gere conteúdo para a seção "${sectionType}" do relatório de sustentabilidade GRI ${year} da empresa ${companyName}.

Contexto do relatório:
- Empresa: ${companyName}
- Ano: ${year}
- Setor: ${report.companies?.sector || 'Não especificado'}
- Versão GRI: ${report.gri_standard_version || 'GRI Standards'}

`;

  if (indicators && indicators.length > 0) {
    prompt += `
Indicadores GRI disponíveis:
${indicators.map(ind => `- ${ind.gri_indicators_library?.code}: ${ind.gri_indicators_library?.name} (Valor: ${ind.value || 'Não informado'})`).join('\n')}

`;
  }

  if (existingContent) {
    prompt += `
Conteúdo existente para referência:
${existingContent}

`;
  }

  prompt += `
Instruções:
- Gere conteúdo em português brasileiro
- Use linguagem profissional e técnica apropriada para relatórios GRI
- Seja específico e baseado em dados quando possível
- Mantenha foco na transparência e prestação de contas
- O conteúdo deve ter entre 300-600 palavras
- Não inclua títulos ou cabeçalhos, apenas o conteúdo da seção
`;

  return prompt;
}

function generateTemplateContent(sectionKey, sectionType, report) {
  const companyName = report.companies?.name || 'Nossa empresa';
  const year = report.year;
  
  const templates = {
    overview: `Este relatório de sustentabilidade ${year} da ${companyName} apresenta nosso compromisso com práticas empresariais responsáveis e transparentes. Elaborado seguindo os padrões GRI, o documento demonstra nossa dedicação à prestação de contas junto às partes interessadas e ao desenvolvimento sustentável.`,
    
    methodology: `A metodologia deste relatório segue os padrões GRI (Global Reporting Initiative), garantindo comparabilidade e transparência nas informações divulgadas. O período de reporte abrange o ano de ${year}, com dados coletados através de nossos sistemas de gestão internos.`,
    
    governance: `Nossa estrutura de governança corporativa está alinhada com as melhores práticas de mercado, garantindo transparência, responsabilidade e prestação de contas. O Conselho de Administração e a alta gestão da ${companyName} são responsáveis pela supervisão das estratégias de sustentabilidade.`,
    
    environmental: `A ${companyName} reconhece a importância da gestão ambiental responsável para a sustentabilidade do negócio e da sociedade. Durante ${year}, implementamos diversas iniciativas para reduzir nosso impacto ambiental e promover a conservação dos recursos naturais.`,
    
    social: `Nosso compromisso social se reflete no investimento contínuo em nossos colaboradores, comunidades e stakeholders. A ${companyName} promove práticas inclusivas, desenvolvimento profissional e contribui para o bem-estar das comunidades onde atua.`,
    
    economic: `O desempenho econômico da ${companyName} está intrinsecamente ligado à criação de valor sustentável para todos os stakeholders. Durante ${year}, mantivemos nosso foco na geração de resultados financeiros sólidos while contributing to sustainable development.`
  };
  
  return templates[sectionKey] || `Conteúdo da seção ${sectionType} em desenvolvimento para o relatório ${year} da ${companyName}.`;
}

async function generatePDFReport(report, sections, indicators) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const companyName = report.companies?.name || 'Empresa';
  const year = report.year;
  
  // Cover page
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  // Title
  page.drawText('Relatório de Sustentabilidade GRI', {
    x: 50,
    y: height - 150,
    size: 24,
    font: timesRomanBold,
    color: rgb(0.17, 0.24, 0.31),
  });
  
  page.drawText(`${companyName} - ${year}`, {
    x: 50,
    y: height - 200,
    size: 18,
    font: timesRomanFont,
    color: rgb(0.2, 0.28, 0.36),
  });
  
  // Report info
  const reportInfo = [
    `Versão GRI: ${report.gri_standard_version || 'GRI Standards'}`,
    `Período: ${report.reporting_period_start} a ${report.reporting_period_end}`,
    `Conclusão: ${Math.round(report.completion_percentage || 0)}%`,
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`
  ];
  
  let yPosition = height - 280;
  reportInfo.forEach(info => {
    page.drawText(info, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesRomanFont,
    });
    yPosition -= 25;
  });
  
  // Content pages
  yPosition = height - 100;
  const pageMargin = 50;
  const lineHeight = 20;
  const maxWidth = width - (pageMargin * 2);
  
  // Add CEO Message if available
  if (report.ceo_message) {
    if (yPosition < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 100;
    }
    
    page.drawText('Mensagem da Liderança', {
      x: pageMargin,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
      color: rgb(0.17, 0.24, 0.31),
    });
    yPosition -= 30;
    
    const messageLines = wrapText(report.ceo_message, maxWidth, 11, timesRomanFont);
    for (const line of messageLines) {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      page.drawText(line, {
        x: pageMargin,
        y: yPosition,
        size: 11,
        font: timesRomanFont,
      });
      yPosition -= lineHeight;
    }
    yPosition -= 20;
  }
  
  // Add sections
  sections.forEach(section => {
    if (section.content && yPosition < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 100;
    }
    
    if (section.content) {
      page.drawText(section.section_title, {
        x: pageMargin,
        y: yPosition,
        size: 16,
        font: timesRomanBold,
        color: rgb(0.17, 0.24, 0.31),
      });
      yPosition -= 30;
      
      const contentLines = wrapText(section.content, maxWidth, 11, timesRomanFont);
      for (const line of contentLines) {
        if (yPosition < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: pageMargin,
          y: yPosition,
          size: 11,
          font: timesRomanFont,
        });
        yPosition -= lineHeight;
      }
      yPosition -= 20;
    }
  });
  
  // Add indicators summary
  if (indicators.length > 0) {
    if (yPosition < 200) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 100;
    }
    
    page.drawText('Indicadores GRI', {
      x: pageMargin,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
      color: rgb(0.17, 0.24, 0.31),
    });
    yPosition -= 30;
    
    indicators.slice(0, 10).forEach(indicator => { // Limit to first 10 indicators
      if (indicator.gri_indicators_library && yPosition > 50) {
        page.drawText(`${indicator.gri_indicators_library.code}: ${indicator.value || 'Não informado'}`, {
          x: pageMargin,
          y: yPosition,
          size: 10,
          font: timesRomanFont,
        });
        yPosition -= 15;
      }
    });
  }
  
  return await pdfDoc.save();
}

// Helper function to wrap text
function wrapText(text, maxWidth, fontSize, font) {
  const words = text.replace(/\n+/g, ' ').split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (textWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word); // Word is too long, add it anyway
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function generateHTMLReport(report, sections, indicators) {
  const companyName = report.companies?.name || 'Empresa';
  const year = report.year;
  
  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Sustentabilidade GRI ${year} - ${companyName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .metadata { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .section { margin: 30px 0; }
        .indicators { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .indicator { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Relatório de Sustentabilidade GRI ${year}</h1>
    <h2>${companyName}</h2>
    
    <div class="metadata">
        <h3>Informações do Relatório</h3>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Ano:</strong> ${year}</p>
        <p><strong>Versão GRI:</strong> ${report.gri_standard_version || 'GRI Standards'}</p>
        <p><strong>Período:</strong> ${report.reporting_period_start} a ${report.reporting_period_end}</p>
        <p><strong>Conclusão:</strong> ${Math.round(report.completion_percentage || 0)}%</p>
    </div>
`;

  // Add CEO Message if available
  if (report.ceo_message) {
    html += `
    <div class="section">
        <h2>Mensagem da Liderança</h2>
        <div>${report.ceo_message.replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  // Add Executive Summary if available
  if (report.executive_summary) {
    html += `
    <div class="section">
        <h2>Resumo Executivo</h2>
        <div>${report.executive_summary.replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  // Add sections
  sections.forEach(section => {
    if (section.content) {
      html += `
    <div class="section">
        <h2>${section.section_title}</h2>
        <div>${section.content.replace(/\n/g, '<br>')}</div>
    </div>`;
    }
  });

  // Add methodology if available
  if (report.methodology) {
    html += `
    <div class="section">
        <h2>Metodologia</h2>
        <div>${report.methodology.replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  // Add indicators
  if (indicators.length > 0) {
    html += `
    <div class="section">
        <h2>Indicadores GRI</h2>
        <div class="indicators">`;
    
    indicators.forEach(indicator => {
      if (indicator.gri_indicators_library) {
        html += `
            <div class="indicator">
                <h4>${indicator.gri_indicators_library.code}</h4>
                <p><strong>${indicator.gri_indicators_library.name}</strong></p>
                <p>Valor: ${indicator.value || 'Não informado'}</p>
                ${indicator.gri_indicators_library.description ? `<p><small>${indicator.gri_indicators_library.description}</small></p>` : ''}
            </div>`;
      }
    });
    
    html += `
        </div>
    </div>`;
  }

  html += `
    <div class="footer">
        <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} pelo Sistema GRI</p>
        <p>Este relatório segue os padrões GRI (Global Reporting Initiative)</p>
    </div>
</body>
</html>`;

  return html;
}