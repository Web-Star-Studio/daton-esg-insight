export interface SDGTarget {
  code: string;
  description: string;
}

export interface SDGInfo {
  number: number;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  description: string;
  longDescription: string;
  targets: SDGTarget[];
  globalPactPrinciples?: number[];
}

export const SDG_DATA: SDGInfo[] = [
  {
    number: 1,
    name: "Erradicação da Pobreza",
    shortName: "Pobreza Zero",
    color: "#E5243B",
    icon: "🏘️",
    description: "Acabar com a pobreza em todas as suas formas, em todos os lugares",
    longDescription: "A pobreza vai além da falta de renda e recursos. Suas manifestações incluem fome, desnutrição, acesso limitado à educação e outros serviços básicos, discriminação social e exclusão, bem como falta de participação em tomadas de decisão. Este objetivo busca garantir que todos tenham acesso a recursos econômicos, serviços básicos, propriedade e controle sobre terras e outras formas de propriedade.",
    targets: [
      { code: "1.1", description: "Até 2030, erradicar a pobreza extrema para todas as pessoas em todos os lugares" },
      { code: "1.2", description: "Reduzir pelo menos à metade a proporção de pessoas que vivem na pobreza" },
      { code: "1.3", description: "Implementar sistemas e medidas de proteção social apropriados" },
      { code: "1.4", description: "Garantir direitos iguais aos recursos econômicos e acesso a serviços básicos" },
      { code: "1.5", description: "Construir a resiliência dos pobres e vulneráveis" }
    ],
    globalPactPrinciples: [1, 2, 6]
  },
  {
    number: 2,
    name: "Fome Zero e Agricultura Sustentável",
    shortName: "Fome Zero",
    color: "#DDA63A",
    icon: "🌾",
    description: "Acabar com a fome, alcançar a segurança alimentar e melhoria da nutrição e promover a agricultura sustentável",
    longDescription: "O setor alimentar e agrícola oferece soluções fundamentais para o desenvolvimento e é essencial para a erradicação da fome e da pobreza. Este objetivo busca garantir o acesso universal a alimentos seguros, nutritivos e suficientes durante todo o ano, além de dobrar a produtividade agrícola e promover práticas agrícolas sustentáveis.",
    targets: [
      { code: "2.1", description: "Acabar com a fome e garantir o acesso a alimentos seguros e nutritivos" },
      { code: "2.2", description: "Acabar com todas as formas de desnutrição" },
      { code: "2.3", description: "Dobrar a produtividade agrícola e renda dos pequenos produtores" },
      { code: "2.4", description: "Garantir sistemas sustentáveis de produção de alimentos" },
      { code: "2.5", description: "Manter a diversidade genética de sementes e plantas cultivadas" }
    ],
    globalPactPrinciples: [7, 8]
  },
  {
    number: 3,
    name: "Saúde e Bem-Estar",
    shortName: "Saúde",
    color: "#4C9F38",
    icon: "🏥",
    description: "Assegurar uma vida saudável e promover o bem-estar para todos, em todas as idades",
    longDescription: "Garantir uma vida saudável e promover o bem-estar para todos em todas as idades é essencial para o desenvolvimento sustentável. Este objetivo aborda as principais ameaças à saúde global, incluindo mortalidade materna e infantil, doenças transmissíveis e não transmissíveis, saúde mental e dependências.",
    targets: [
      { code: "3.1", description: "Reduzir a mortalidade materna global" },
      { code: "3.2", description: "Acabar com as mortes evitáveis de recém-nascidos e crianças menores de 5 anos" },
      { code: "3.3", description: "Acabar com as epidemias de AIDS, tuberculose, malária e doenças tropicais" },
      { code: "3.4", description: "Reduzir a mortalidade prematura por doenças não transmissíveis" },
      { code: "3.5", description: "Fortalecer a prevenção e tratamento do abuso de substâncias" },
      { code: "3.8", description: "Atingir a cobertura universal de saúde" }
    ],
    globalPactPrinciples: [1, 2]
  },
  {
    number: 4,
    name: "Educação de Qualidade",
    shortName: "Educação",
    color: "#C5192D",
    icon: "📚",
    description: "Assegurar a educação inclusiva e equitativa de qualidade, e promover oportunidades de aprendizagem ao longo da vida para todos",
    longDescription: "A educação permite a mobilidade socioeconômica e é chave para escapar da pobreza. Este objetivo busca garantir que todos tenham acesso a educação de qualidade e oportunidades de aprendizagem ao longo da vida, eliminando disparidades de gênero e renda.",
    targets: [
      { code: "4.1", description: "Garantir educação primária e secundária gratuita, equitativa e de qualidade" },
      { code: "4.3", description: "Assegurar acesso igualitário à educação técnica, profissional e superior" },
      { code: "4.4", description: "Aumentar o número de pessoas com competências para emprego e empreendedorismo" },
      { code: "4.5", description: "Eliminar disparidades de gênero na educação" },
      { code: "4.7", description: "Garantir que todos adquiram conhecimentos para promover o desenvolvimento sustentável" }
    ],
    globalPactPrinciples: [1, 6]
  },
  {
    number: 5,
    name: "Igualdade de Gênero",
    shortName: "Igualdade",
    color: "#FF3A21",
    icon: "⚖️",
    description: "Alcançar a igualdade de gênero e empoderar todas as mulheres e meninas",
    longDescription: "A igualdade de gênero não é apenas um direito humano fundamental, mas a base necessária para um mundo pacífico, próspero e sustentável. Este objetivo busca acabar com todas as formas de discriminação contra mulheres e meninas, garantir participação plena e oportunidades iguais de liderança.",
    targets: [
      { code: "5.1", description: "Acabar com todas as formas de discriminação contra mulheres e meninas" },
      { code: "5.2", description: "Eliminar todas as formas de violência contra mulheres e meninas" },
      { code: "5.4", description: "Reconhecer e valorizar o trabalho de cuidado não remunerado" },
      { code: "5.5", description: "Garantir participação plena e oportunidades iguais de liderança" },
      { code: "5.C", description: "Adotar políticas sólidas para promover a igualdade de gênero" }
    ],
    globalPactPrinciples: [1, 2, 6]
  },
  {
    number: 6,
    name: "Água Potável e Saneamento",
    shortName: "Água Limpa",
    color: "#26BDE2",
    icon: "💧",
    description: "Assegurar a disponibilidade e gestão sustentável da água e saneamento para todos",
    longDescription: "A água é essencial para a vida sustentável. Este objetivo busca garantir acesso universal e equitativo à água potável segura e acessível, melhorar a qualidade da água, aumentar a eficiência no uso da água e proteger ecossistemas relacionados à água.",
    targets: [
      { code: "6.1", description: "Alcançar acesso universal e equitativo à água potável segura" },
      { code: "6.2", description: "Alcançar acesso a saneamento e higiene adequados e equitativos" },
      { code: "6.3", description: "Melhorar a qualidade da água, reduzindo poluição e eliminando despejo" },
      { code: "6.4", description: "Aumentar substancialmente a eficiência no uso da água" },
      { code: "6.6", description: "Proteger e restaurar ecossistemas relacionados com a água" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 7,
    name: "Energia Limpa e Acessível",
    shortName: "Energia Limpa",
    color: "#FCC30B",
    icon: "⚡",
    description: "Assegurar o acesso confiável, sustentável, moderno e a preço acessível à energia para todos",
    longDescription: "A energia é fundamental para quase todos os grandes desafios e oportunidades. Este objetivo busca garantir acesso universal a serviços de energia modernos, aumentar a participação de energias renováveis e melhorar a eficiência energética.",
    targets: [
      { code: "7.1", description: "Assegurar o acesso universal a serviços de energia modernos" },
      { code: "7.2", description: "Aumentar substancialmente a participação de energias renováveis" },
      { code: "7.3", description: "Dobrar a taxa global de melhoria da eficiência energética" },
      { code: "7.A", description: "Reforçar a cooperação internacional para facilitar acesso a energia limpa" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 8,
    name: "Trabalho Decente e Crescimento Econômico",
    shortName: "Trabalho Digno",
    color: "#A21942",
    icon: "💼",
    description: "Promover o crescimento econômico sustentado, inclusivo e sustentável, emprego pleno e produtivo e trabalho decente para todos",
    longDescription: "Crescimento econômico sustentável exigirá que as sociedades criem condições que permitam ter empregos de qualidade. Este objetivo promove políticas que estimulam o empreendedorismo e a criação de emprego, além de medidas eficazes para erradicar o trabalho forçado, a escravidão e o tráfico humano.",
    targets: [
      { code: "8.1", description: "Sustentar o crescimento econômico per capita" },
      { code: "8.2", description: "Atingir níveis mais elevados de produtividade" },
      { code: "8.3", description: "Promover políticas orientadas para o desenvolvimento que apoiem empreendedorismo" },
      { code: "8.5", description: "Alcançar emprego pleno e produtivo e trabalho decente" },
      { code: "8.7", description: "Erradicar o trabalho forçado, escravidão moderna e tráfico de pessoas" },
      { code: "8.8", description: "Proteger os direitos trabalhistas e promover ambientes de trabalho seguros" }
    ],
    globalPactPrinciples: [1, 2, 3, 4, 5, 6]
  },
  {
    number: 9,
    name: "Indústria, Inovação e Infraestrutura",
    shortName: "Inovação",
    color: "#FD6925",
    icon: "🏗️",
    description: "Construir infraestruturas resilientes, promover a industrialização inclusiva e sustentável e fomentar a inovação",
    longDescription: "Investimentos em infraestrutura são cruciais para alcançar o desenvolvimento sustentável. Este objetivo promove a industrialização inclusiva e sustentável e, até 2030, aumenta significativamente a participação da indústria no emprego e no PIB.",
    targets: [
      { code: "9.1", description: "Desenvolver infraestrutura de qualidade, confiável, sustentável e resiliente" },
      { code: "9.2", description: "Promover a industrialização inclusiva e sustentável" },
      { code: "9.4", description: "Modernizar infraestruturas e reabilitar indústrias para torná-las sustentáveis" },
      { code: "9.5", description: "Fortalecer a pesquisa científica e capacidades tecnológicas" },
      { code: "9.C", description: "Aumentar significativamente o acesso às TIC" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 10,
    name: "Redução das Desigualdades",
    shortName: "Desigualdade",
    color: "#DD1367",
    icon: "📊",
    description: "Reduzir a desigualdade dentro dos países e entre eles",
    longDescription: "As desigualdades baseadas em renda, sexo, idade, deficiência, orientação sexual, raça, classe, etnia, religião e oportunidade continuam a persistir. Este objetivo busca garantir oportunidades iguais e reduzir as desigualdades de resultados.",
    targets: [
      { code: "10.1", description: "Progressivamente alcançar e sustentar o crescimento da renda dos 40% mais pobres" },
      { code: "10.2", description: "Empoderar e promover a inclusão social, econômica e política de todos" },
      { code: "10.3", description: "Garantir a igualdade de oportunidades e reduzir as desigualdades" },
      { code: "10.4", description: "Adotar políticas para promover maior igualdade" }
    ],
    globalPactPrinciples: [1, 2, 6]
  },
  {
    number: 11,
    name: "Cidades e Comunidades Sustentáveis",
    shortName: "Cidades Sustentáveis",
    color: "#FD9D24",
    icon: "🏙️",
    description: "Tornar as cidades e os assentamentos humanos inclusivos, seguros, resilientes e sustentáveis",
    longDescription: "As cidades são centros para novas ideias, comércio, cultura, ciência, produtividade, desenvolvimento social e muito mais. Este objetivo busca garantir acesso a habitação segura e acessível, melhorar assentamentos precários e proporcionar acesso a sistemas de transporte seguros, acessíveis e sustentáveis.",
    targets: [
      { code: "11.1", description: "Garantir acesso à habitação segura, adequada e a preço acessível" },
      { code: "11.2", description: "Proporcionar acesso a sistemas de transporte seguros e acessíveis" },
      { code: "11.3", description: "Aumentar a urbanização inclusiva e sustentável" },
      { code: "11.6", description: "Reduzir o impacto ambiental negativo per capita das cidades" },
      { code: "11.7", description: "Proporcionar acesso universal a espaços públicos seguros e inclusivos" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 12,
    name: "Consumo e Produção Responsáveis",
    shortName: "Consumo Responsável",
    color: "#BF8B2E",
    icon: "♻️",
    description: "Assegurar padrões de produção e de consumo sustentáveis",
    longDescription: "O consumo e a produção sustentáveis visam fazer mais e melhor com menos. Este objetivo busca promover a eficiência energética e de recursos, infraestrutura sustentável e proporcionar acesso a serviços básicos, empregos verdes e uma melhor qualidade de vida para todos.",
    targets: [
      { code: "12.2", description: "Alcançar a gestão sustentável e uso eficiente dos recursos naturais" },
      { code: "12.3", description: "Reduzir pela metade o desperdício de alimentos per capita mundial" },
      { code: "12.4", description: "Alcançar o manejo ambientalmente adequado dos produtos químicos e resíduos" },
      { code: "12.5", description: "Reduzir substancialmente a geração de resíduos" },
      { code: "12.6", description: "Incentivar as empresas a adotar práticas sustentáveis e relatórios de sustentabilidade" },
      { code: "12.8", description: "Garantir que as pessoas tenham informação e consciência para o desenvolvimento sustentável" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 13,
    name: "Ação Contra a Mudança Global do Clima",
    shortName: "Ação Climática",
    color: "#3F7E44",
    icon: "🌍",
    description: "Tomar medidas urgentes para combater a mudança climática e seus impactos",
    longDescription: "A mudança climática é um desafio global que não respeita fronteiras nacionais. Este objetivo busca fortalecer a resiliência e a capacidade de adaptação a riscos relacionados ao clima, integrar medidas de mudança climática nas políticas e melhorar a educação sobre mitigação das mudanças climáticas.",
    targets: [
      { code: "13.1", description: "Reforçar a resiliência e a capacidade de adaptação a riscos relacionados ao clima" },
      { code: "13.2", description: "Integrar medidas da mudança do clima nas políticas, estratégias e planejamentos" },
      { code: "13.3", description: "Melhorar a educação, conscientização e capacidade sobre mudança do clima" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 14,
    name: "Vida na Água",
    shortName: "Vida Aquática",
    color: "#0A97D9",
    icon: "🐠",
    description: "Conservação e uso sustentável dos oceanos, dos mares e dos recursos marinhos para o desenvolvimento sustentável",
    longDescription: "Os oceanos fornecem recursos naturais essenciais, incluindo alimentos, medicamentos, biocombustíveis e outros produtos. Este objetivo busca prevenir e reduzir significativamente a poluição marinha, proteger ecossistemas marinhos e costeiros e aumentar os benefícios econômicos de pequenos Estados insulares.",
    targets: [
      { code: "14.1", description: "Prevenir e reduzir significativamente a poluição marinha" },
      { code: "14.2", description: "Gerir de forma sustentável e proteger os ecossistemas marinhos e costeiros" },
      { code: "14.3", description: "Minimizar e enfrentar os impactos da acidificação dos oceanos" },
      { code: "14.4", description: "Regular a coleta e acabar com a sobrepesca" },
      { code: "14.5", description: "Conservar pelo menos 10% das zonas costeiras e marinhas" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 15,
    name: "Vida Terrestre",
    shortName: "Vida na Terra",
    color: "#56C02B",
    icon: "🌳",
    description: "Proteger, recuperar e promover o uso sustentável dos ecossistemas terrestres, gerir de forma sustentável as florestas, combater a desertificação, deter e reverter a degradação da terra e deter a perda de biodiversidade",
    longDescription: "As florestas cobrem 30% da superfície da Terra e, além de fornecer segurança alimentar e abrigo, são essenciais para combater a mudança climática. Este objetivo busca conservar e restaurar o uso de ecossistemas terrestres, deter o desmatamento e a perda de biodiversidade.",
    targets: [
      { code: "15.1", description: "Assegurar a conservação, recuperação e uso sustentável de ecossistemas terrestres" },
      { code: "15.2", description: "Promover a implementação da gestão sustentável de florestas e deter o desmatamento" },
      { code: "15.3", description: "Combater a desertificação e restaurar terras degradadas" },
      { code: "15.5", description: "Tomar medidas urgentes para reduzir a degradação de habitat natural e perda de biodiversidade" },
      { code: "15.A", description: "Mobilizar recursos financeiros para conservação e uso sustentável da biodiversidade" }
    ],
    globalPactPrinciples: [7, 8, 9]
  },
  {
    number: 16,
    name: "Paz, Justiça e Instituições Eficazes",
    shortName: "Paz e Justiça",
    color: "#00689D",
    icon: "⚖️",
    description: "Promover sociedades pacíficas e inclusivas para o desenvolvimento sustentável, proporcionar o acesso à justiça para todos e construir instituições eficazes, responsáveis e inclusivas em todos os níveis",
    longDescription: "Este objetivo se dedica à promoção de sociedades pacíficas e inclusivas, proporcionando acesso à justiça para todos e construindo instituições eficazes e responsáveis. Busca reduzir significativamente todas as formas de violência, acabar com o abuso, exploração, tráfico e tortura.",
    targets: [
      { code: "16.1", description: "Reduzir significativamente todas as formas de violência" },
      { code: "16.2", description: "Acabar com abuso, exploração, tráfico e todas as formas de violência e tortura contra crianças" },
      { code: "16.3", description: "Promover o Estado de Direito e garantir acesso igualitário à justiça" },
      { code: "16.5", description: "Reduzir substancialmente a corrupção e o suborno" },
      { code: "16.6", description: "Desenvolver instituições eficazes, responsáveis e transparentes" },
      { code: "16.7", description: "Garantir a tomada de decisão responsiva, inclusiva, participativa e representativa" }
    ],
    globalPactPrinciples: [1, 2, 10]
  },
  {
    number: 17,
    name: "Parcerias e Meios de Implementação",
    shortName: "Parcerias",
    color: "#19486A",
    icon: "🤝",
    description: "Fortalecer os meios de implementação e revitalizar a parceria global para o desenvolvimento sustentável",
    longDescription: "A Agenda 2030 requer parcerias globais revitalizadas que mobilizem todos os recursos disponíveis. Este objetivo busca fortalecer a mobilização de recursos, melhorar a cooperação internacional, promover um sistema de comércio multilateral universal e aumentar a estabilidade macroeconômica global.",
    targets: [
      { code: "17.1", description: "Fortalecer a mobilização de recursos internos" },
      { code: "17.3", description: "Mobilizar recursos financeiros adicionais para países em desenvolvimento" },
      { code: "17.6", description: "Reforçar a cooperação Norte-Sul, Sul-Sul e triangular" },
      { code: "17.16", description: "Reforçar a parceria global para o desenvolvimento sustentável" },
      { code: "17.17", description: "Incentivar e promover parcerias públicas, público-privadas e com a sociedade civil" }
    ],
    globalPactPrinciples: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
];

export const GLOBAL_PACT_PRINCIPLES = [
  {
    number: 1,
    category: "Direitos Humanos",
    text: "As empresas devem apoiar e respeitar a proteção de direitos humanos reconhecidos internacionalmente",
    description: "Significa que as empresas devem garantir que não estão sendo cúmplices em abusos de direitos humanos e que apoiam ativamente a proteção desses direitos em suas operações e cadeia de valor."
  },
  {
    number: 2,
    category: "Direitos Humanos",
    text: "Assegurar-se de não serem cúmplices de abusos em direitos humanos",
    description: "As empresas devem ter processos de due diligence para identificar, prevenir e mitigar impactos adversos em direitos humanos, evitando cumplicidade direta, benéfica ou silenciosa."
  },
  {
    number: 3,
    category: "Trabalho",
    text: "As empresas devem apoiar a liberdade de associação e o reconhecimento efetivo do direito à negociação coletiva",
    description: "Os trabalhadores têm o direito de formar e se filiar a sindicatos de sua escolha e negociar coletivamente com os empregadores."
  },
  {
    number: 4,
    category: "Trabalho",
    text: "A eliminação de todas as formas de trabalho forçado ou compulsório",
    description: "Todo trabalho ou serviço exigido de um indivíduo sob ameaça de qualquer penalidade e para o qual ele não se ofereceu voluntariamente deve ser eliminado."
  },
  {
    number: 5,
    category: "Trabalho",
    text: "A abolição efetiva do trabalho infantil",
    description: "As empresas devem garantir que não empregam menores de idade em trabalho que seja perigoso, interfira com sua educação ou seja prejudicial ao seu desenvolvimento."
  },
  {
    number: 6,
    category: "Trabalho",
    text: "Eliminar a discriminação no emprego",
    description: "As empresas devem garantir igualdade de oportunidades e tratamento no emprego, eliminando discriminação baseada em raça, cor, sexo, religião, opinião política, nacionalidade ou origem social."
  },
  {
    number: 7,
    category: "Meio Ambiente",
    text: "As empresas devem apoiar uma abordagem preventiva aos desafios ambientais",
    description: "Implementar o princípio da precaução, adotando medidas proativas para prevenir danos ambientais antes que ocorram, mesmo na ausência de certeza científica completa."
  },
  {
    number: 8,
    category: "Meio Ambiente",
    text: "Desenvolver iniciativas para promover maior responsabilidade ambiental",
    description: "As empresas devem desenvolver e difundir tecnologias ambientalmente sustentáveis, implementar sistemas de gestão ambiental e promover a conscientização ambiental."
  },
  {
    number: 9,
    category: "Meio Ambiente",
    text: "Incentivar o desenvolvimento e difusão de tecnologias ambientalmente sustentáveis",
    description: "Promover o desenvolvimento, transferência e difusão de tecnologias que reduzam impactos ambientais e contribuam para o desenvolvimento sustentável."
  },
  {
    number: 10,
    category: "Anticorrupção",
    text: "As empresas devem combater a corrupção em todas as suas formas, incluindo extorsão e propina",
    description: "Implementar políticas e programas anticorrupção, incluindo medidas para prevenir, detectar e responder à corrupção, suborno, extorsão e outras formas de crime econômico."
  }
];

// Função auxiliar para obter ODS por número
export const getSDGByNumber = (number: number): SDGInfo | undefined => {
  return SDG_DATA.find(sdg => sdg.number === number);
};

// Função auxiliar para obter princípios do Pacto Global relacionados a um ODS
export const getRelatedGlobalPactPrinciples = (sdgNumber: number) => {
  const sdg = getSDGByNumber(sdgNumber);
  if (!sdg?.globalPactPrinciples) return [];
  
  return sdg.globalPactPrinciples.map(principleNumber => 
    GLOBAL_PACT_PRINCIPLES.find(p => p.number === principleNumber)
  ).filter(Boolean);
};

// Categorias temáticas dos ODS (para agrupamento)
export const SDG_THEMES = {
  social: [1, 2, 3, 4, 5, 10, 16],
  economic: [8, 9, 12, 17],
  environmental: [6, 7, 11, 13, 14, 15]
};

export const getSDGTheme = (sdgNumber: number): 'social' | 'economic' | 'environmental' => {
  if (SDG_THEMES.social.includes(sdgNumber)) return 'social';
  if (SDG_THEMES.economic.includes(sdgNumber)) return 'economic';
  return 'environmental';
};
