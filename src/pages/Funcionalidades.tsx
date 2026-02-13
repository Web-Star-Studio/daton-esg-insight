import { Link } from "react-router-dom";
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
      "Módulos essenciais para gestão ESG completa e sustentabilidade corporativa.",
    features: [
      {
        icon: BarChart3,
        title: "Gestão de Emissões GEE",
        description:
          "Monitore e controle emissões com precisão científica e trilha de auditoria.",
        items: [
          "Cálculo automático por escopos 1, 2 e 3",
          "Fatores de emissão atualizados",
          "Monitoramento em tempo real",
          "Relatórios de inventário GEE",
        ],
      },
      {
        icon: Shield,
        title: "Licenciamento",
        description:
          "Conformidade regulatória com acompanhamento inteligente de licenças.",
        items: [
          "Controle de prazos e renovações",
          "Alertas automáticos de vencimento",
          "Histórico completo de documentos",
          "Dashboard de conformidade",
        ],
      },
      {
        icon: Recycle,
        title: "Gestão de Resíduos",
        description:
          "Rastreamento completo de resíduos com foco em economia circular.",
        items: [
          "Rastreamento por tipo e destino",
          "Indicadores de circularidade",
          "Controle de fornecedores",
          "Relatórios de destinação",
        ],
      },
      {
        icon: Leaf,
        title: "Projetos de Carbono",
        description:
          "Gestão de compensação e créditos de carbono com transparência.",
        items: [
          "Portfólio de projetos",
          "Validação de créditos",
          "ROI ambiental",
          "Certificações internacionais",
        ],
      },
      {
        icon: Target,
        title: "Metas de Sustentabilidade",
        description:
          "Defina e acompanhe metas ESG com foco em execução e resultado.",
        items: [
          "Metas SMART definidas",
          "Acompanhamento de progresso",
          "Alinhamento com ODS",
          "Relatórios de performance",
        ],
      },
      {
        icon: Users,
        title: "Gestão de Stakeholders",
        description:
          "Relacione-se melhor com partes interessadas em toda a cadeia.",
        items: [
          "Mapeamento de stakeholders",
          "Matriz de materialidade",
          "Planos de engajamento",
          "Feedback e consultas",
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
          "SGQ completo com conformidade ISO 9001, 14001, 45001 e outras normas.",
        items: [
          "Gestão de documentos ISO",
          "Controle de processos",
          "Auditorias internas",
          "Melhoria contínua",
        ],
      },
      {
        icon: AlertTriangle,
        title: "Gestão de Riscos",
        description:
          "Identifique, avalie e trate riscos operacionais e estratégicos.",
        items: [
          "Matriz de riscos",
          "Avaliação quantitativa",
          "Planos de tratamento",
          "Monitoramento contínuo",
        ],
      },
      {
        icon: CheckCircle2,
        title: "Não Conformidades",
        description:
          "Controle completo de não conformidades e ações corretivas.",
        items: [
          "Registro e classificação",
          "Workflow de aprovação",
          "Planos de ação",
          "Análise de tendências",
        ],
      },
      {
        icon: Search,
        title: "Auditorias",
        description: "Planeje e execute auditorias internas com eficiência.",
        items: [
          "Cronograma de auditorias",
          "Checklists personalizados",
          "Relatórios automáticos",
          "Follow-up de achados",
        ],
      },
      {
        icon: Activity,
        title: "Indicadores de Performance",
        description: "Monitore KPIs de qualidade e desempenho operacional.",
        items: [
          "Dashboards em tempo real",
          "Metas e limites de controle",
          "Alertas automáticos",
          "Análise estatística",
        ],
      },
    ],
  },
  {
    category: "Pessoas & RH",
    description:
      "Gestão de pessoas e desenvolvimento organizacional de ponta a ponta.",
    features: [
      {
        icon: Users,
        title: "Gestão de Desempenho",
        description:
          "Avalie e desenvolva colaboradores com ciclos estruturados.",
        items: [
          "Ciclos de avaliação 360°",
          "Matriz de competências",
          "PDI personalizado",
          "Feedback contínuo",
        ],
      },
      {
        icon: GraduationCap,
        title: "Treinamentos",
        description:
          "Capacite sua equipe com trilhas de aprendizado personalizadas.",
        items: [
          "Trilhas de desenvolvimento",
          "Controle de certificações",
          "ROI de treinamentos",
          "Avaliações de eficácia",
        ],
      },
      {
        icon: TrendingUp,
        title: "Planos de Carreira",
        description: "Estruture o crescimento profissional dos colaboradores.",
        items: [
          "Mapeamento de carreiras",
          "Sucessão de cargos",
          "Gaps de competência",
          "Planos de desenvolvimento",
        ],
      },
      {
        icon: UserCheck,
        title: "Recrutamento & Seleção",
        description: "Gerencie processos seletivos com eficiência e rastreio.",
        items: [
          "Banco de talentos",
          "Entrevistas estruturadas",
          "Avaliação de fit cultural",
          "Onboarding automatizado",
        ],
      },
      {
        icon: Clock,
        title: "Controle de Ponto",
        description: "Monitore jornada de trabalho e horas extras.",
        items: [
          "Registro biométrico/digital",
          "Controle de absenteísmo",
          "Relatórios de produtividade",
          "Integração com folha",
        ],
      },
    ],
  },
  {
    category: "Dados & Documentos",
    description:
      "Gestão inteligente de informações e documentos corporativos.",
    features: [
      {
        icon: FileText,
        title: "Gestão Documental",
        description: "Organize e controle documentos com versionamento.",
        items: [
          "Controle de versões",
          "Workflow de aprovações",
          "Pesquisa avançada",
          "Backup automático",
        ],
      },
      {
        icon: Upload,
        title: "Formulários Dinâmicos",
        description: "Crie formulários personalizados para coleta de dados.",
        items: [
          "Designer visual",
          "Validações automáticas",
          "Integração com base de dados",
          "Relatórios customizados",
        ],
      },
      {
        icon: Brain,
        title: "IA para Dados",
        description: "Extraia informações automaticamente de documentos.",
        items: [
          "OCR inteligente",
          "Extração de dados",
          "Classificação automática",
          "Insights preditivos",
        ],
      },
      {
        icon: Clipboard,
        title: "Compliance",
        description: "Assegure conformidade com regulamentações.",
        items: [
          "Checklist de conformidade",
          "Monitoramento regulatório",
          "Alertas de mudanças",
          "Relatórios de auditoria",
        ],
      },
    ],
  },
  {
    category: "Estratégia & Governança",
    description:
      "Ferramentas para gestão estratégica e governança corporativa.",
    features: [
      {
        icon: Target,
        title: "Balanced Scorecard",
        description:
          "Implemente BSC para alinhamento estratégico organizacional.",
        items: [
          "4 perspectivas do BSC",
          "Mapas estratégicos",
          "Indicadores balanceados",
          "Cascateamento de metas",
        ],
      },
      {
        icon: TrendingUp,
        title: "OKRs",
        description: "Gerencie objetivos e resultados-chave da organização.",
        items: [
          "Objetivos SMART",
          "Key Results mensuráveis",
          "Check-ins regulares",
          "Alinhamento estratégico",
        ],
      },
      {
        icon: Building2,
        title: "Governança Corporativa",
        description: "Estruture conselhos e comitês de governança.",
        items: [
          "Gestão de conselhos",
          "Atas e deliberações",
          "Políticas corporativas",
          "Compliance governance",
        ],
      },
      {
        icon: Briefcase,
        title: "Gestão de Projetos",
        description: "Gerencie projetos estratégicos e iniciativas.",
        items: [
          "Cronogramas detalhados",
          "Controle de recursos",
          "Relatórios de progresso",
          "Gestão de riscos",
        ],
      },
    ],
  },
];

const integrations = [
  { icon: TrendingUp, title: "ERPs", description: "SAP, Oracle, Dynamics" },
  { icon: Database, title: "Relatórios", description: "Power BI, Tableau, Excel" },
  { icon: Zap, title: "APIs", description: "REST APIs e webhooks" },
];

const benefits = [
  {
    icon: Brain,
    title: "IA Integrada",
    description: "Insights automáticos e recomendações acionáveis.",
  },
  {
    icon: Database,
    title: "Dados Centralizados",
    description: "Uma fonte de verdade para toda a operação ESG.",
  },
  {
    icon: FileText,
    title: "Relatórios Inteligentes",
    description: "Padrões GRI, SASB e CDP com menor esforço operacional.",
  },
  {
    icon: Zap,
    title: "Implantação Ágil",
    description: "Conectores e APIs para rápida adoção no ecossistema atual.",
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
            <Link to="/simulador">
              <Button className="rounded-xl bg-[#c4fca1] px-4 text-black hover:bg-[#b4ef8f]">
                Simulador Gratuito
              </Button>
            </Link>
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/auth">
              <Button size="sm" variant="ghost" className="text-sm text-[#335245]">
                Login
              </Button>
            </Link>
            <Link to="/simulador">
              <Button size="sm" className="rounded-xl bg-[#c4fca1] px-3 text-black hover:bg-[#b4ef8f]">
                Simulador
              </Button>
            </Link>
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
                Funcionalidades completas para gestão ESG de alto desempenho.
              </h1>
              <p className="mt-5 max-w-3xl text-base text-white/90 md:text-xl">
                Conecte Ambiental, Social e Governança em uma arquitetura única.
                Execute com dados confiáveis, automação inteligente e decisões
                orientadas por evidência.
              </p>
            </motion.div>

            <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <HeroStat title="30+" subtitle="módulos integrados" />
                <HeroStat title="360°" subtitle="visão ESG unificada" />
                <HeroStat title="24/7" subtitle="monitoramento contínuo" />
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-black/35 p-2 backdrop-blur-md">
                <Link to="/contato">
                  <Button className="rounded-xl bg-white/10 text-white hover:bg-white/20">
                    Solicitar Demo
                  </Button>
                </Link>
                <div className="h-7 w-px bg-white/40" />
                <Link to="/simulador">
                  <Button className="rounded-xl bg-[#c4fca1] text-black hover:bg-[#b4ef8f]">
                    Simulador
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
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
              Mais de 30 módulos integrados em uma plataforma única para acelerar
              maturidade ESG com controle real da operação.
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
              Integrações
            </h3>
            <p className="mt-2 text-sm text-[#4e675b]">
              Conecte com o ecossistema que sua operação já usa.
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
                Agende uma demonstração personalizada e veja como o Daton adapta
                os módulos à realidade da sua operação.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row">
              <Link to="/contato">
                <Button className="w-full sm:w-auto rounded-xl bg-black px-6 text-white hover:bg-black/85">
                  Agendar demonstração
                </Button>
              </Link>
              <Link to="/simulador">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl border-black/35 bg-transparent px-6 text-black hover:bg-black hover:text-white"
                >
                  Testar simulador
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d4e4da] bg-white/70 px-4 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 grid-cols-2 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <img src={datonLogo} alt="Daton" className="h-8" />
            <p className="mt-4 max-w-xl text-sm text-[#4d685a]">
              Plataforma completa para gestão ESG com foco em execução,
              rastreabilidade e inteligência operacional.
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
              <Link to="/simulador" className="block hover:text-[#13271d]">
                Simulador
              </Link>
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
