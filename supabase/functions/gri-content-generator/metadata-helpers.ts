// Helper functions for metadata generation

export function buildMetadataPrompt(report, metadataType) {
  const companyName = report.companies?.name || 'Nossa empresa';
  const year = report.year;
  
  const baseContext = `
Empresa: ${companyName}
Ano do relatório: ${year}
Versão GRI: ${report.gri_version || 'GRI Standards'}
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

export function getDefaultMetadataContent(metadataType, report) {
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