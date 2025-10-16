import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  reportId: string;
  sectionKey: string;
  contentType: string;
  context?: string;
  regenerate?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: ContentRequest = await req.json();
    const { reportId, sectionKey, contentType, context, regenerate } = requestData;

    console.log('Generating content for:', { reportId, sectionKey, contentType, regenerate });

    // Get company context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('Company not found');
    }

    // Get company data for context
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, cnpj')
      .eq('id', profile.company_id)
      .single();

    // Get report data
    const { data: report } = await supabaseClient
      .from('gri_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    // Generate content
    const generatedContent = await generateContent(sectionKey, company?.name, report);

    // Log generation for analytics
    await supabaseClient
      .from('ai_performance_metrics')
      .insert({
        company_id: profile.company_id,
        metric_date: new Date().toISOString().split('T')[0],
        documents_processed: 1,
        auto_approved_count: 0,
        manual_review_count: 1
      });

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        metadata: {
          sectionKey,
          contentType,
          generatedAt: new Date().toISOString(),
          regenerated: regenerate || false
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in gri-content-generator:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function generateContent(sectionKey: string, companyName?: string, report?: any): Promise<string> {
  const templates: Record<string, string> = {
    'organizational_profile': `${companyName || 'Nossa organização'} é uma empresa comprometida com práticas sustentáveis e responsabilidade corporativa. Fundada com o propósito de criar valor compartilhado, operamos em diversos setores mantendo sempre os mais altos padrões de ética e governança.

Nossa estrutura organizacional é projetada para garantir eficiência operacional e transparência em todas as nossas atividades. Com sede no Brasil e operações distribuídas estrategicamente, atendemos clientes em múltiplos mercados, sempre com foco em sustentabilidade e inovação.

A cadeia de valor de ${companyName || 'nossa empresa'} engloba desde o relacionamento com fornecedores até a entrega final aos clientes, sempre buscando minimizar impactos ambientais e maximizar benefícios sociais em cada etapa do processo.`,

    'strategy': `A estratégia de sustentabilidade de ${companyName || 'nossa organização'} está profundamente integrada ao nosso modelo de negócio e visão de longo prazo. Reconhecemos que o sucesso empresarial sustentável depende do equilíbrio entre performance econômica, responsabilidade ambiental e impacto social positivo.

Nossos objetivos estratégicos ESG para ${report?.year || new Date().getFullYear()} e anos subsequentes incluem a redução de emissões, o fortalecimento da governança corporativa, e o investimento contínuo em pessoas e comunidades. Estes objetivos não são apenas aspirações, mas compromissos concretos com metas mensuráveis e prazos definidos.

Acreditamos que a sustentabilidade é um diferencial competitivo essencial no cenário empresarial atual. Por isso, investimos em inovação, tecnologia e capacitação para garantir que ${companyName || 'nossa empresa'} esteja preparada para os desafios e oportunidades do futuro sustentável.`,

    'governance': `A governança corporativa de ${companyName || 'nossa organização'} é estruturada para garantir supervisão eficaz, tomada de decisões responsável e prestação de contas em todos os níveis. Nosso mais alto órgão de governança supervisiona ativamente questões de sustentabilidade, assegurando que estratégias ESG estejam alinhadas com objetivos de negócio.

A composição do nosso conselho reflete nosso compromisso com diversidade, independência e expertise em sustentabilidade. Contamos com membros que trazem perspectivas variadas e conhecimento especializado em questões ambientais, sociais e de governança, fortalecendo nossa capacidade de enfrentar desafios ESG complexos.

Processos formais de comunicação garantem que preocupações críticas, incluindo questões éticas e de sustentabilidade, sejam escaladas apropriadamente e tratadas com a devida urgência. A remuneração de executivos está parcialmente vinculada ao atingimento de metas ESG, demonstrando nosso compromisso com accountability em sustentabilidade.`,

    'stakeholder_engagement': `${companyName || 'Nossa organização'} reconhece a importância fundamental do engajamento contínuo com stakeholders para entender expectativas, identificar riscos e oportunidades, e construir relacionamentos de confiança de longo prazo. Identificamos e priorizamos stakeholders com base em sua influência e interesse em nossas operações e impactos.

Nossos principais grupos de stakeholders incluem empregados, clientes, fornecedores, comunidades locais, investidores, órgãos reguladores e organizações da sociedade civil. Para cada grupo, desenvolvemos abordagens de engajamento adequadas, incluindo pesquisas, consultas, diálogos estruturados e canais de comunicação abertos.

O feedback dos stakeholders influencia diretamente nossa estratégia de sustentabilidade e processos de tomada de decisão. Realizamos análise de materialidade anualmente, incorporando perspectivas de stakeholders para priorizar temas ESG mais relevantes. Mecanismos de reclamação e queixas estão disponíveis para garantir que preocupações sejam tratadas de forma justa e eficaz.`,

    'material_topics': `A determinação de temas materiais de ${companyName || 'nossa organização'} segue uma abordagem rigorosa e inclusiva, considerando impactos econômicos, ambientais e sociais significativos e sua influência nas avaliações e decisões dos stakeholders. O processo inclui identificação de temas potenciais, avaliação de relevância e validação com stakeholders internos e externos.

Nossa análise de materialidade para ${report?.year || new Date().getFullYear()} identificou temas prioritários que refletem onde a organização tem os maiores impactos e onde stakeholders expressam maior interesse. Estes temas incluem questões relacionadas a mudanças climáticas, gestão de recursos, diversidade e inclusão, governança ética e impactos na cadeia de valor.

A matriz de materialidade resultante demonstra a intersecção entre importância para stakeholders e significância dos impactos. Revisamos periodicamente nossos temas materiais para garantir que permaneçam relevantes à medida que contextos de negócio e expectativas de stakeholders evoluem. Cada tema material é reportado com transparência sobre limites, abordagens de gestão e indicadores de desempenho.`,

    'economic_performance': `O desempenho econômico de ${companyName || 'nossa organização'} reflete nossa capacidade de gerar e distribuir valor de forma sustentável. No ano fiscal ${report?.year || new Date().getFullYear()}, geramos valor econômico direto através de receitas operacionais, distribuindo este valor entre stakeholders através de custos operacionais, salários e benefícios, pagamentos a provedores de capital, investimentos comunitários e impostos.

Reconhecemos as implicações financeiras das mudanças climáticas e questões ambientais em nosso modelo de negócio. Identificamos riscos relacionados a regulamentações mais rígidas, mudanças nas preferências dos consumidores e impactos físicos de eventos climáticos extremos. Simultaneamente, identificamos oportunidades em eficiência energética, produtos e serviços sustentáveis e novos mercados verdes.

Mantemos compromisso com práticas de remuneração justa, com salários iniciais acima do mínimo local e benefícios abrangentes para empregados. Priorizamos fornecedores locais quando possível, contribuindo para desenvolvimento econômico regional. Investimentos em infraestrutura e serviços de benefício público demonstram nosso compromisso com prosperidade compartilhada.`,

    'environmental_performance': `${companyName || 'Nossa organização'} está comprometida com gestão ambiental responsável e redução contínua de nossos impactos. Monitoramos cuidadosamente o uso de materiais, priorizando insumos renováveis e reciclados quando viável. Nossa estratégia de economia circular busca minimizar resíduos e maximizar a vida útil de produtos e materiais.

O consumo de energia e as emissões de gases de efeito estufa são áreas de foco prioritário. Quantificamos emissões de Escopo 1 (diretas), Escopo 2 (energia adquirida) e Escopo 3 (cadeia de valor), estabelecendo metas de redução ambiciosas mas realistas. Investimos em eficiência energética, energias renováveis e tecnologias limpas para descarbonizar nossas operações.

A gestão da água é crítica para nossa operação e para o meio ambiente. Medimos consumo de água, avaliamos riscos hídricos e implementamos iniciativas de eficiência e reciclagem. Protegemos a biodiversidade em áreas onde operamos, realizando avaliações de impacto e implementando medidas de mitigação. Mantemos conformidade rigorosa com legislação ambiental e investimos continuamente em proteção ambiental.`,

    'social_performance': `A força de trabalho de ${companyName || 'nossa organização'} é nosso ativo mais valioso. Promovemos diversidade, equidade e inclusão em todos os níveis organizacionais, reconhecendo que equipes diversas são mais inovadoras e eficazes. Monitoramos indicadores de diversidade por gênero, idade, etnia e outros fatores relevantes, estabelecendo metas progressivas de representatividade.

A saúde e segurança dos empregados é prioridade absoluta. Mantemos programas robustos de segurança ocupacional, medimos taxas de lesões e doenças ocupacionais, e investimos continuamente em prevenção e cultura de segurança. Oferecemos benefícios abrangentes incluindo planos de saúde, aposentadoria, licenças parentais e programas de bem-estar.

Investimos significativamente em desenvolvimento de pessoas através de treinamento e programas de capacitação. A média de horas de treinamento por empregado reflete nosso compromisso com crescimento profissional contínuo. Respeitamos rigorosamente direitos humanos, mantemos políticas de não discriminação e avaliamos fornecedores usando critérios sociais. Engajamos ativamente com comunidades locais, investindo em projetos de desenvolvimento social que geram valor compartilhado.`
  };

  return templates[sectionKey] || `Conteúdo gerado para a seção ${sectionKey}. Este é um texto de demonstração que seria substituído por conteúdo gerado por IA em produção.

${companyName || 'A empresa'} mantém compromisso com práticas sustentáveis e transparência em seus relatórios de sustentabilidade seguindo os padrões GRI Standards.

Para o ano de ${report?.year || new Date().getFullYear()}, continuamos desenvolvendo nossas práticas ESG e reportando nosso progresso de forma clara e mensurável.`;
}
