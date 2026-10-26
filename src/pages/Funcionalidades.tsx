import { Link } from "react-router-dom";
import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  Clipboard,
  Clock,
  Database,
  FileText,
  GraduationCap,
  Leaf,
  Recycle,
  Search,
  Shield,
  Target,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import datonLogo from "@/assets/daton-logo-header.png";
import { PAINEL_URL } from "@/config/externalApp";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
}

interface FeatureCategory {
  category: string;
  description: string;
  features: Feature[];
}

const featureCategories: FeatureCategory[] = [
  {
    category: "ESG & Sustentabilidade",
    description:
      "Recursos para registrar, acompanhar e comprovar a gestão ambiental e ESG.",
    features: [
      {
        icon: BarChart3,
        title: "Gestão de Emissões GEE",
        description:
          "Inventários com fatores versionados. Projetos e compensações separados das emissões são uma evolução planejada, ainda indisponível.",
        items: [
          "Fontes dos escopos 1, 2 e 3",
          "Fatores de emissão versionados",
          "Emissões calculadas por atividade",
          "Totais por escopo e exportação CSV",
        ],
      },
      {
        icon: Shield,
        title: "Licenciamento",
        description:
          "Organize licenças, condicionantes e obrigações recorrentes por filial.",
        items: [
          "Validades e ciclos de renovação",
          "Condicionantes e evidências",
          "Obrigações e recorrências",
          "Anexos e histórico do registro",
        ],
      },
      {
        icon: Recycle,
        title: "Gestão de Resíduos",
        description:
          "Registre a geração e a destinação de resíduos com seus comprovantes.",
        items: [
          "Tipo, quantidade, setor e destino",
          "Transportador e destinador",
          "MTR, CDF e anexos",
          "Custos, receitas e etapas datadas",
        ],
      },
      {
        icon: Leaf,
        title: "ESG e Relato",
        description:
          "Organize temas, respostas e relatos em rascunho. Revisão e publicação estão planejadas e ainda indisponíveis.",
        items: [
          "Referenciais configuráveis",
          "Temas, respostas e indicadores",
          "Evidências e iniciativas",
          "ODS e relatos em rascunho",
        ],
      },
      {
        icon: Target,
        title: "LAIA e Controles",
        description:
          "Avalie aspectos e impactos ambientais e acompanhe seus controles.",
        items: [
          "Aspectos, impactos e critérios",
          "Requisitos e controles operacionais",
          "Planos de ação vinculados",
          "Monitoramento e correções",
        ],
      },
      {
        icon: Users,
        title: "Terceiros e Partes Interessadas",
        description:
          "Mantenha um cadastro compartilhado dos atores externos da operação.",
        items: [
          "Pessoas físicas e jurídicas",
          "Papéis e dados de contato",
          "Vínculo com fornecedores",
          "Seleção nos módulos habilitados",
        ],
      },
    ],
  },
  {
    category: "Qualidade & Processos",
    description:
      "Sistema de gestão da qualidade e melhoria contínua dos processos.",
    features: [
      {
        icon: Award,
        title: "Sistema de Qualidade",
        description:
          "Centralize processos, documentos e registros do sistema de gestão.",
        items: [
          "Documentos e revisões",
          "Processos do SGQ",
          "Auditorias internas",
          "Não conformidades e ações",
        ],
      },
      {
        icon: AlertTriangle,
        title: "Gestão de Riscos",
        description:
          "Identifique, avalie e trate riscos operacionais e estratégicos.",
        items: [
          "Probabilidade e impacto",
          "Riscos e oportunidades",
          "Planos de tratamento",
          "Revisão e avaliação de eficácia",
        ],
      },
      {
        icon: CheckCircle2,
        title: "Não Conformidades",
        description:
          "Registre desvios e acompanhe a tratativa até a avaliação de eficácia.",
        items: [
          "Registro, origem e classificação",
          "Contenção e análise de causa",
          "Plano de ação vinculado",
          "Verificação de eficácia",
        ],
      },
      {
        icon: Search,
        title: "Auditorias",
        description: "Planeje e execute auditorias internas com eficiência.",
        items: [
          "Planejamento e cronograma",
          "Checklists e constatações",
          "Evidências da execução",
          "Achados e ações vinculadas",
        ],
      },
      {
        icon: Activity,
        title: "Indicadores de Performance",
        description: "Acompanhe metas, resultados e tendências dos indicadores.",
        items: [
          "Metas e tolerâncias",
          "Semáforos de desempenho",
          "Séries e tendências",
          "Lançamentos pendentes",
        ],
      },
    ],
  },
  {
    category: "Pessoas & RH",
    description:
      "Pessoas, competências e aprendizagem com evidências. Planos de desenvolvimento individuais estão planejados e ainda indisponíveis.",
    features: [
      {
        icon: Users,
        title: "Colaboradores e Competências",
        description:
          "Relacione pessoas, cargos e competências exigidas pela organização.",
        items: [
          "Cadastro e situação do colaborador",
          "Cargo e filial no histórico",
          "Competências requeridas",
          "Lacunas de competência",
        ],
      },
      {
        icon: GraduationCap,
        title: "Treinamentos",
        description:
          "Planeje turmas e preserve a evidência de cada conclusão.",
        items: [
          "Catálogo e turmas",
          "Registro de conclusão",
          "Certificados por evento",
          "Avaliações de eficácia",
        ],
      },
      {
        icon: TrendingUp,
        title: "Cargos e Obrigatoriedades",
        description: "Defina o que cada cargo exige e acompanhe o que falta cumprir.",
        items: [
          "Cadastro de cargos",
          "Competências por cargo",
          "Treinamentos obrigatórios",
          "Pendências por colaborador",
        ],
      },
      {
        icon: UserCheck,
        title: "Programa Anual e Indicadores",
        description: "Organize o programa anual de treinamento e acompanhe seus resultados.",
        items: [
          "Programa anual por período",
          "Treinamentos planejados",
          "Indicadores de aprendizagem",
          "Acompanhamento da execução",
        ],
      },
      {
        icon: Clock,
        title: "Comunicação e Engajamento",
        description: "Publique comunicações e acompanhe alcance, ciência e respostas.",
        items: [
          "Campanhas e público por regra",
          "Programação e publicação",
          "Confirmação de leitura",
          "Alcance e consulta de respostas",
        ],
      },
    ],
  },
  {
    category: "Dados & Documentos",
    description:
      "Informações, documentos e evidências organizados com controle de acesso.",
    features: [
      {
        icon: FileText,
        title: "Gestão Documental",
        description: "Organize e controle documentos com versionamento.",
        items: [
          "Controle de versões",
          "Revisão e aprovação",
          "Distribuição controlada",
          "Registro de ciência",
        ],
      },
      {
        icon: Upload,
        title: "Formulários Internos",
        description: "Crie modelos versionados e preserve a versão respondida.",
        items: [
          "Construtor de campos e seções",
          "Regras de obrigatoriedade e exibição",
          "Respostas e anexos",
          "Exportação CSV",
        ],
      },
      {
        icon: Brain,
        title: "Assistente Daton",
        description: "Hoje, consulte dados autorizados em modo somente leitura. Extração documental assistida está planejada e ainda indisponível.",
        items: [
          "Panorama de módulos",
          "Indicadores e pendências",
          "Listas conforme a tela",
          "Acesso revalidado por consulta",
        ],
      },
      {
        icon: Clipboard,
        title: "Compliance",
        description: "Organize requisitos, legislações e documentos regulatórios.",
        items: [
          "Legislações aplicáveis",
          "Requisitos por filial",
          "Licenças e prazos",
          "Anexos e evidências",
        ],
      },
    ],
  },
  {
    category: "Estratégia & Governança",
    description:
      "Planejamento, processos e análise para conduzir o sistema de gestão.",
    features: [
      {
        icon: Target,
        title: "Planejamento Estratégico",
        description:
          "Registre o contexto e converta prioridades em objetivos e planos.",
        items: [
          "Contexto e matriz SWOT",
          "Objetivos estratégicos",
          "Riscos e oportunidades",
          "Planos e responsáveis",
        ],
      },
      {
        icon: TrendingUp,
        title: "Indicadores e Metas",
        description: "Acompanhe indicadores e metas do período. Cálculos ambientais reproduzíveis estão planejados e ainda indisponíveis.",
        items: [
          "Indicadores vinculados",
          "Metas por período",
          "Resultados e tolerâncias",
          "Análise de desempenho",
        ],
      },
      {
        icon: Building2,
        title: "Processos e Análise Crítica",
        description: "Registre processos e análise crítica. Agenda, atas e decisões integradas estão planejadas e ainda indisponíveis.",
        items: [
          "Cadastro e interação de processos",
          "Entradas da análise crítica",
          "Saídas e decisões",
          "Responsáveis e planos de ação",
        ],
      },
      {
        icon: Briefcase,
        title: "Projeto e Desenvolvimento",
        description: "Conduza projetos conforme o fluxo de projeto e desenvolvimento do SGQ.",
        items: [
          "Entradas, etapas e saídas",
          "Revisão, verificação e validação",
          "Mudanças e histórico",
          "Responsáveis e prazos",
        ],
      },
    ],
  },
];

const integrations = [
  { icon: TrendingUp, title: "Importação por planilha", description: "Destinos habilitados por módulo" },
  { icon: Database, title: "Exportações", description: "Saídas por módulo; catálogo e BI ainda planejados" },
  { icon: Zap, title: "Conectores planejados", description: "Ainda indisponíveis; dependem de contrato por integração" },
];

const benefits = [
  {
    icon: Brain,
    title: "Consulta Assistida",
    description: "Assistente em modo somente leitura, limitado aos acessos da pessoa.",
  },
  {
    icon: Database,
    title: "Dados Rastreáveis",
    description: "Histórico, evidências e responsabilidades junto aos registros.",
  },
  {
    icon: FileText,
    title: "Gestão Integrada",
    description: "Qualidade, pessoas, ambiente e governança no mesmo ambiente.",
  },
  {
    icon: Zap,
    title: "Adoção Progressiva",
    description: "Módulos habilitados conforme o escopo e a maturidade da operação.",
  },
];

function HeroStat({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-white/45 bg-black/35 px-4 py-3 text-white backdrop-blur-sm">
      <p className="text-4xl font-semibold leading-none">{title}</p>
      <p className="mt-1 text-xs text-white/85">{subtitle}</p>
    </div>
  );
}

const Funcionalidades = () => {
  const openPanel = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.location.href = PAINEL_URL;
  };

  return (
    <div className="min-h-screen bg-[#edf4ef] text-[#12251c]">
      <header className="sticky top-0 z-40 border-b border-[#d4e4da] bg-[#edf4ef]/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center">
            <img src={datonLogo} alt="Daton" className="h-10 md:h-11" />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/funcionalidades" className="text-sm font-semibold text-[#12251c]">
              Funcionalidades
            </Link>
            <Link
              to="/contato"
              className="text-sm text-[#335245] transition-colors hover:text-[#12251c]"
            >
              Contato
            </Link>
            <Link
              to="/auth"
              className="text-sm text-[#335245] transition-colors hover:text-[#12251c]"
            >
              Fazer Login
            </Link>
            <a href={PAINEL_URL} onClick={openPanel}>
              <Button className="rounded-xl bg-[#c4fca1] px-4 text-black hover:bg-[#b4ef8f]">
                Acessar painel
              </Button>
            </a>
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/auth">
              <Button size="sm" variant="ghost" className="text-sm text-[#335245]">
                Login
              </Button>
            </Link>
            <a href={PAINEL_URL} onClick={openPanel}>
              <Button size="sm" className="rounded-xl bg-[#c4fca1] px-3 text-black hover:bg-[#b4ef8f]">
                Acessar painel
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-14 px-4 py-8 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#cadacf] bg-[#dbe9e1]">
          <img
            src="/hero-img-01.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/66 via-black/54 to-black/60" />

          <div className="relative z-10 flex min-h-[66vh] flex-col justify-between p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-4xl"
            >
              <span className="mb-4 inline-flex rounded-full border border-white/50 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-white/95">
                Plataforma Daton
              </span>
              <h1 className="text-balance text-4xl font-semibold leading-[1.08] text-white md:text-6xl">
                Gestão integrada com evidências para cada decisão.
              </h1>
              <p className="mt-5 max-w-3xl text-base text-white/90 md:text-xl">
                Conecte qualidade, pessoas, ambiente e governança em uma única
                plataforma. Organize responsabilidades, prazos, registros e
                evidências para conduzir o sistema de gestão.
              </p>
            </motion.div>

            <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <HeroStat title="SGQ" subtitle="qualidade e processos" />
                <HeroStat title="ESG" subtitle="dados e evidências" />
                <HeroStat title="Perfis" subtitle="acessos por organização" />
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-black/35 p-2 backdrop-blur-md">
                <Link to="/contato">
                  <Button className="rounded-xl bg-white/10 text-white hover:bg-white/20">
                    Solicitar demonstração
                  </Button>
                </Link>
                <div className="h-7 w-px bg-white/40" />
                <a href={PAINEL_URL} onClick={openPanel}>
                  <Button className="rounded-xl bg-[#c4fca1] text-black hover:bg-[#b4ef8f]">
                    Acessar painel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          {featureCategories.map((category, categoryIndex) => (
            <motion.article
              key={category.category}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35 }}
              className="rounded-[1.5rem] border border-[#cfdfd5] bg-white/90 p-5 shadow-[0_12px_35px_rgba(11,31,20,0.08)] md:p-8"
            >
              <div className="mb-8">
                <span className="mb-3 inline-flex rounded-full border border-[#d1e2d6] bg-[#eff8f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2e4b3d]">
                  Bloco {categoryIndex + 1}
                </span>
                <h2 className="text-2xl font-semibold text-[#11251b] md:text-4xl">
                  {category.category}
                </h2>
                <p className="mt-2 max-w-3xl text-[#4a6558]">{category.description}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {category.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="group rounded-2xl border border-[#d8e6de] bg-[#f7fbf8] p-5"
                    >
                      <div className="mb-4 flex items-start gap-4">
                        <div className="rounded-xl border border-[#d7e8dd] bg-[#ebf8ef] p-2.5 transition-colors group-hover:bg-[#c4fca1]">
                          <Icon className="h-5 w-5 text-[#133227]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#10271d]">
                            {feature.title}
                          </h3>
                          <p className="mt-1 text-sm text-[#4f685c]">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2.5">
                        {feature.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-[#243f33]">
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#55c77f]" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  );
                })}
              </div>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[1.5rem] border border-[#cfdfd5] bg-white/90 p-6 shadow-[0_12px_35px_rgba(11,31,20,0.08)] md:p-8">
            <h3 className="text-2xl font-semibold text-[#11251b] md:text-3xl">
              Por que escolher o Daton?
            </h3>
            <p className="mt-2 text-[#4d675a]">
              Uma plataforma para organizar o sistema de gestão com dados,
              responsabilidades e evidências. A disponibilidade varia conforme os
              módulos habilitados e as permissões de cada pessoa. Capacidades
              futuras estão identificadas como planejadas, ainda indisponíveis.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="rounded-xl border border-[#d8e7df] bg-[#f6fbf8] p-4"
                  >
                    <div className="mb-3 inline-flex rounded-lg bg-[#c4fca1] p-2.5">
                      <Icon className="h-5 w-5 text-black" />
                    </div>
                    <h4 className="text-base font-semibold text-[#11281e]">{benefit.title}</h4>
                    <p className="mt-1 text-sm text-[#4f685b]">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#cfdfd5] bg-white/90 p-6 shadow-[0_12px_35px_rgba(11,31,20,0.08)] md:p-8">
            <h3 className="text-xl font-semibold text-[#11251b] md:text-2xl">
              Dados e integrações
            </h3>
            <p className="mt-2 text-sm text-[#4e675b]">
              Importe e exporte dados nos módulos disponíveis e avalie integrações
              específicas conforme a necessidade.
            </p>
            <div className="mt-5 space-y-3">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={integration.title}
                    className="flex items-center gap-3 rounded-xl border border-[#d8e7df] bg-[#f7fbf8] px-4 py-3"
                  >
                    <div className="rounded-lg bg-[#c4fca1] p-2">
                      <Icon className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#183227]">
                        {integration.title}
                      </p>
                      <p className="text-xs text-[#4f685c]">{integration.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-[#cde9bf] bg-[#c4fca1] p-6 text-black md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-semibold md:text-4xl">
                Pronto para ver isso em ação?
              </h3>
              <p className="mt-2 text-black/75">
                Solicite uma demonstração por e-mail e conheça
                os módulos disponíveis para sua operação.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row">
              <Link to="/contato">
                <Button className="w-full sm:w-auto rounded-xl bg-black px-6 text-white hover:bg-black/85">
                  Conhecer módulos
                </Button>
              </Link>
              <a href={PAINEL_URL} onClick={openPanel}>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl border-black/35 bg-transparent px-6 text-black hover:bg-black hover:text-white"
                >
                  Acessar painel
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d4e4da] bg-white/70 px-4 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 grid-cols-2 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <img src={datonLogo} alt="Daton" className="h-8" />
            <p className="mt-4 max-w-xl text-sm text-[#4d685a]">
              Plataforma para gestão integrada com foco em responsabilidades,
              evidências e rastreabilidade.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#1f3a2f]">
              Produto
            </h4>
            <div className="mt-3 space-y-2 text-sm text-[#4f685c]">
              <Link to="/funcionalidades" className="block hover:text-[#13271d]">
                Funcionalidades
              </Link>
              <a
                href={PAINEL_URL}
                onClick={openPanel}
                className="block hover:text-[#13271d]"
              >
                Acessar painel
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#1f3a2f]">
              Empresa
            </h4>
            <div className="mt-3 space-y-2 text-sm text-[#4f685c]">
              <Link to="/contato" className="block hover:text-[#13271d]">
                Contato
              </Link>
              <Link to="/auth" className="block hover:text-[#13271d]">
                Acessar plataforma
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-[#d8e6dd] pt-6 text-xs text-[#577064]">
          © {new Date().getFullYear()} Daton. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Funcionalidades;
