import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform, MotionValue } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Users,
  FileCheck,
  TrendingUp,
  Brain,
  Menu,
  Server,
  ShieldCheck,
  Network,
  Zap,
} from "lucide-react";
import { HeimdallNavbar } from "@/components/landing/heimdall/HeimdallNavbar";
import { PublicFooter } from "@/components/landing/heimdall/PublicFooter";
import "@/components/landing/heimdall/heimdall.css";
import esgSocialCardImg from "@/assets/esg-social-card.png";
import esgQualityCardImg from "@/assets/esg-quality-card.png";
import esgAmbientalHeroImg from "@/assets/esg-ambiental-hero.png";
import esgSuppliersCardImg from "@/assets/esg-suppliers-card.png";
import esgAiCardImg from "@/assets/esg-ai-card.png";

// --- DATA ---

interface ModuleHighlight {
  id: string;
  index: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  image: string;
  color: string;
}

const MODULES: ModuleHighlight[] = [
  {
    id: "ambiental",
    index: "001",
    title: "ESG Ambiental",
    category: "Meio Ambiente / Sustentabilidade / Gestão",
    description:
      "Monitore emissões, gerencie licenças e acompanhe o consumo de recursos em painéis em tempo real. Automatize cálculos e acelere a conformidade com regulamentações globais.",
    icon: Leaf,
    image: "/hero-img-01.png",
    color: "#eef9e6",
    features: [
      "Inventário de emissões GEE (Escopos 1, 2, 3)",
      "Gestão de licenças e condicionantes",
      "Monitoramento de água e energia",
    ],
  },
  {
    id: "social",
    index: "002",
    title: "ESG Social",
    category: "Social / Diversidade / Segurança",
    description:
      "Acompanhe métricas de diversidade, rotatividade e segurança em um painel consolidado. Gerencie o ciclo de vida completo do colaborador, do recrutamento ao desenvolvimento de carreira.",
    icon: Users,
    image: esgSocialCardImg,
    color: "#f0fdf4",
    features: [
      "Dashboard de métricas sociais e diversidade",
      "LMS integrado para capacitação",
      "Gestão de segurança do trabalho",
    ],
  },
  {
    id: "qualidade",
    index: "003",
    title: "Qualidade (SGQ)",
    category: "Gestão / Controle de Processos",
    description:
      "Registre, analise e trate não conformidades com fluxos estruturados. Controle versões de documentos e conduza auditorias internas com total rastreabilidade.",
    icon: FileCheck,
    image: esgQualityCardImg,
    color: "#f5f3ff",
    features: [
      "Gestão completa de não conformidades",
      "Ações corretivas com 5W2H",
      "Controle de documentos",
    ],
  },
  {
    id: "fornecedores",
    index: "004",
    title: "Gestão Fornecedores",
    category: "Cadeia de Suprimentos / Compras",
    description:
      "Qualifique e avalie fornecedores. Monitore contratos e riscos ESG na cadeia, oferecendo um portal de autoatendimento para seus parceiros.",
    icon: TrendingUp,
    image: esgSuppliersCardImg,
    color: "#fff7ed",
    features: [
      "Cadastro e homologação de fornecedores",
      "Portal do fornecedor",
      "Monitoramento de riscos ESG",
    ],
  },
  {
    id: "ia",
    index: "005",
    title: "Inteligência Artificial",
    category: "Tecnologia / Automação",
    description:
      "Analise dados em tempo real para gerar alertas preditivos, identificar riscos emergentes e sugerir ações de melhoria contínua.",
    icon: Brain,
    image: esgAiCardImg,
    color: "#eff6ff",
    features: [
      "Alertas inteligentes de prazos",
      "Extração automática de documentos",
      "Insights contextuais",
    ],
  },
];

// --- INFRA DATA & COMPONENTS (moved from Technology) ---

interface InfraModuleHighlight {
  id: string;
  index: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  image: string;
  color: string;
  metrics?: { label: string; value: string; desc: string }[];
}

const INFRA_MODULES: InfraModuleHighlight[] = [
  {
    id: "ia",
    index: "001",
    title: "Inteligência Artificial",
    category: "IA Nativa / Contexto / Automação",
    description:
      "IA nativa em cada camada da plataforma. Não é um chatbot genérico. É inteligência treinada no contexto da sua empresa para prever e agir.",
    icon: Brain,
    image: "",
    color: "#eef2ff",
    features: [
      "Modelos Preditivos e Machine Learning (ML)",
      "NLP (Processamento de Linguagem Natural)",
      "Processamento Inteligente de Documentos (IDP)",
      "Assistente Contextual IA Generativa",
    ],
  },
  {
    id: "arquitetura",
    index: "002",
    title: "Arquitetura & Infraestrutura",
    category: "Cloud-Native / Serverless / Escala",
    description:
      "Construída para escalar com a sua operação. Arquitetura cloud-native com isolamento de dados por empresa e performance otimizada.",
    icon: Server,
    image: "",
    color: "#f8fafc",
    features: [
      "Infraestrutura Serverless auto-escalável",
      "Isolamento Multi-Tenant com segurança a nível de linha",
      "Edge Computing para menor latência",
      "Cache Inteligente em múltiplas camadas",
    ],
  },
  {
    id: "seguranca",
    index: "003",
    title: "Segurança & Compliance",
    category: "Cibersegurança / LGPD / Auditoria",
    description:
      "Segurança não é funcionalidade. É fundação. Proteção de dados em conformidade com LGPD e padrões internacionais rigorosos.",
    icon: ShieldCheck,
    image: "",
    color: "#f0f9ff",
    features: [
      "Criptografia Militar (AES-256 e TLS 1.3)",
      "Autenticação via JWT com suporte a MFA",
      "Segurança em Nível de Linha (RLS)",
      "Compliance Nativo com LGPD",
      "Auditoria Completa e Rastreabilidade",
    ],
  },
  {
    id: "integracoes",
    index: "004",
    title: "Integrações & Dados",
    category: "API First / Conectividade / Ecossistema",
    description:
      "Conectada ao seu ecossistema. Importe, exporte e sincronize dados com as ferramentas que sua equipe já utiliza no dia a dia.",
    icon: Network,
    image: "",
    color: "#fdf4ff",
    features: [
      "Importação Flexível (Excel, CSV, PDF, Imagens)",
      "API RESTful documentada para ERPs e BI",
      "Exportação Multi-Formato",
      "Webhooks & Notificações configuráveis",
    ],
  },
  {
    id: "performance",
    index: "005",
    title: "Performance",
    category: "Velocidade / Otimização / Uptime",
    description:
      "Velocidade que acompanha sua operação. Otimizações em cada camada para uma experiência fluida, mesmo com grandes volumes de dados.",
    icon: Zap,
    image: "",
    color: "#fffbeb",
    features: [],
    metrics: [
      { label: "LCP", value: "< 2.5s", desc: "Carregamento da página principal" },
      { label: "IA Response", value: "< 5s", desc: "Respostas do assistente inteligente" },
      { label: "Uptime", value: "99.9%", desc: "Disponibilidade da plataforma" },
      { label: "Dados", value: "Milhões", desc: "Registros processados simultaneamente" },
    ],
  },
];

const InfraFeatureCard = ({ module }: { module: InfraModuleHighlight }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5 }}
    className="group relative flex flex-col bg-white p-8 md:p-10 border-b border-r border-[#e5e7eb] hover:bg-[#fafafa] transition-colors duration-300"
  >
    <span className="text-xs font-mono text-[#9ca3af] mb-6 tracking-widest">{module.index}</span>
    <div className="flex items-start justify-between mb-6">
      <h3 className="text-2xl font-bold text-[#1a2421] tracking-tight">{module.title}</h3>
    </div>
    <p className="text-[#4b5563] leading-relaxed mb-8 h-20">{module.description}</p>
    <ul className="space-y-3 mt-auto">
      {module.features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-3 text-sm text-[#4b5563]">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c4fca1] shrink-0" />
          {feature}
        </li>
      ))}
    </ul>
  </motion.div>
);

const InfraPerformanceSection = ({ module }: { module: InfraModuleHighlight }) => {
  if (!module.metrics) return null;
  return (
    <section className="bg-[#f8fafc] w-full py-24 border-t border-[#e5e7eb]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="block text-xs font-mono text-[#6b7280] mb-4 tracking-widest uppercase">
              {module.category}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a2421] mb-6 tracking-tight">
              {module.title}
            </h2>
            <p className="text-lg text-[#4b5563] leading-relaxed max-w-xl">
              {module.description}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {module.metrics.map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-6 border-l-2 border-[#e5e7eb]"
              >
                <span className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#c4fca1]" />
                <p className="text-4xl font-bold text-[#1a2421] mb-1">{metric.value}</p>
                <p className="text-sm font-bold text-[#374151] mb-1">{metric.label}</p>
                <p className="text-xs text-[#6b7280]">{metric.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- CARD COMPONENT ---

const Card = ({
  i,
  module,
  progress,
  range,
  targetScale,
}: {
  i: number;
  module: ModuleHighlight;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "start start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  // Blur Logic
  const step = 0.25;
  let blurStart = range[0] + step + (step * 0.1);
  if (blurStart > 0.95) blurStart = 0.95;
  const blurEnd = 1;
  const shouldBlur = i < MODULES.length - 1 && blurStart < blurEnd;
  const blur = useTransform(
    progress,
    shouldBlur ? [blurStart, blurEnd] : [0, 1],
    shouldBlur ? ["blur(0px)", "blur(10px)"] : ["blur(0px)", "blur(0px)"]
  );

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const imageWidth = useTransform(scrollYProgress, [0, 1], ["100%", "60%"]);
  const contentWidth = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0.3, 1], [0, 1]);

  return (
    <div
      ref={container}
      className="h-screen flex items-center justify-center sticky top-0"
    >
      <motion.div
        style={{
          scale,
          filter: blur,
          backgroundColor: module.color,
          top: `calc(-1vh + ${i * 25}px)`,
        }}
        className="flex flex-col relative w-[95vw] h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl origin-top md:flex-row border border-[rgba(0,0,0,0.05)]"
      >
        {/* Background Image: Always Full Size on Desktop */}
        <motion.div
          className="absolute inset-0 z-0 overflow-hidden"
          style={{
            width: "100%",
            height: isDesktop ? "100%" : "60%" // Reduce height on mobile to show content below
          }}
        >
          <motion.div className="w-full h-full" style={{ scale: imageScale }}>
            <img
              src={module.image}
              alt={module.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {/* Overlay gradient for text readability if needed */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </motion.div>

        {/* Content Overlay: Right side glass panel */}
        <motion.div
          className="relative z-10 flex flex-col justify-between p-8 md:p-12 lg:p-16 backdrop-blur-md bg-black/40 border-l border-white/10"
          style={{
            // Desktop: Animate width from 0% -> 40%. Mobile: Full width, fixed height at bottom
            width: isDesktop ? contentWidth : "100%",
            height: isDesktop ? "100%" : "40%",
            top: isDesktop ? 0 : "auto",
            bottom: 0,
            right: 0,
            position: isDesktop ? "absolute" : "absolute",
            opacity: isDesktop ? contentOpacity : 1
          }}
        >
          {/* Main Content */}
          <div className="flex flex-col gap-6 mt-8 md:mt-0 pt-16">
            <h2
              className="text-3xl md:text-5xl lg:text-6xl text-white font-bold tracking-tight"
            >
              {module.title}
            </h2>

            <p className="text-sm md:text-lg text-white/80 leading-relaxed max-w-2xl">
              {module.description}
            </p>

            {/* Features List */}
            <ul className="space-y-3 mt-4">
              {module.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm md:text-base text-white/70"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Action */}
          <div className="flex items-center gap-4 mt-8 md:mt-0">
            <button className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-white overflow-hidden rounded-full text-xs md:text-sm font-mono font-bold tracking-wider text-[#1a2421] uppercase transition-all duration-300 hover:scale-105">
              <span className="absolute inset-0 bg-[#c4fca1] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                Entre em contato
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};


export default function ESGAmbiental() {
  const navigate = useNavigate();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const actionBarRef = useRef<HTMLDivElement>(null);

  // Menu links synced with Home
  const quickMenuLinks = [
    { label: 'Soluções', href: '/funcionalidades' },
    
    { label: 'Central de Ajuda', href: '/documentacao' },
    { label: 'Sobre Nós', href: '/sobre-nos' },
    { label: 'Contato', href: '/contato' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!quickMenuOpen) return;
      const target = event.target as Node;
      if (actionBarRef.current && !actionBarRef.current.contains(target)) {
        setQuickMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuickMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickMenuOpen]);

  // --- SCROLL LOGIC FOR MAIN CONTAINER ---
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div className="heimdall-page min-h-screen bg-white">
      <HeimdallNavbar />

      {/* --- ORIGINAL HERO SECTION --- */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "var(--lumine-bg)",
          overflow: "hidden",
          padding: "120px 2rem 80px",
        }}
      >
        <img
          src={esgAmbientalHeroImg}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.24) 45%, rgba(0,0,0,0.46) 100%)",
          }}
        />

        {/* Bottom Left Title */}
        <div
          style={{
            position: "absolute",
            bottom: "10vh",
            left: "max(4vw, 2rem)",
            maxWidth: "820px",
            zIndex: 10,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              color: "#ffffff",
              margin: 0,
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                marginBottom: "0.9rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.08)",
                padding: "0.3rem 0.75rem",
                fontSize: "0.74rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Nossas Soluções
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 4.8vw, 4.2rem)",
                lineHeight: "1.15",
                letterSpacing: "-0.02em",
                fontWeight: 650,
                margin: 0,
                textAlign: "left",
              }}
            >
              Tudo o que sua empresa precisa para transformar sustentabilidade
              em resultado.
            </h1>
            <p
              style={{
                display: "block",
                marginTop: "1rem",
                marginBottom: 0,
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "clamp(0.95rem, 1.3vw, 1.2rem)",
                fontWeight: 400,
                lineHeight: 1.5,
                maxWidth: "720px",
              }}
            >
              Gerencie indicadores ambientais, sociais, de qualidade e
              fornecedores em uma única plataforma — com inteligência
              artificial, automação e conformidade regulatória integradas.
            </p>
          </motion.div>
        </div>

        {/* Bottom Right Action Bar */}
        <div
          ref={actionBarRef}
          style={{
            position: "absolute",
            bottom: "10vh",
            right: "max(4vw, 2rem)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: "fit-content",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            background: "rgba(0, 0, 0, 0.32)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          }}
        >
          <AnimatePresence>
            {quickMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <nav
                  style={{
                    display: "grid",
                    gap: "0.15rem",
                    padding: "0.35rem 0.35rem 0.2rem",
                  }}
                >
                  {quickMenuLinks.map((link, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setQuickMenuOpen(false);
                        navigate(link.href);
                      }}
                      whileHover={{
                        scale: 1.03,
                        backgroundColor: "#c4fca1",
                        color: "#000000",
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "none",
                        borderRadius: "9px",
                        color: "#ffffff",
                        fontSize: "0.92rem",
                        fontWeight: 500,
                        padding: "0.68rem 0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      {link.label}
                    </motion.button>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem",
            }}
          >
            <button
              onClick={() => setQuickMenuOpen((prev) => !prev)}
              aria-label="Abrir menu"
              aria-expanded={quickMenuOpen}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.45)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Menu size={18} />
            </button>

            <div
              aria-hidden="true"
              style={{
                width: "1px",
                height: "28px",
                background: "rgba(255, 255, 255, 0.28)",
              }}
            />

            <motion.button
              onClick={() => navigate("/auth")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lumine-btn-primary"
              style={{ color: "#000000" }}
            >
              EXPLORAR DEMONSTRAÇÃO
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* --- INFRAESTRUTURA SECTION --- */}
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-[#1a2421] mb-6 tracking-tight bg-clip-text"
          >
            Infraestrutura de classe mundial.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#6b7280] max-w-2xl leading-relaxed"
          >
            Cada componente da plataforma Daton foi desenhado para segurança, escalabilidade e performance. Sem concessões.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-[#e5e7eb] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
          {INFRA_MODULES.filter(m => m.id !== "performance").map((module) => (
            <InfraFeatureCard key={module.id} module={module} />
          ))}
        </div>
      </main>

      {/* --- MAIN SCROLL CONTENT --- */}
      <main ref={container} className="relative mt-[50px] mb-[100px]">
        {MODULES.map((module, i) => {
          const targetScale = 1 - (MODULES.length - i) * 0.05;
          return (
            <Card
              key={module.id}
              i={i}
              module={module}
              progress={scrollYProgress}
              range={[i * 0.25, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </main>

      {/* --- METRICS SECTION (from SobreNos) --- */}
      <section className="py-20 bg-[#1a2421] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center divide-x divide-white/10">
            {[
              { value: "6+", label: "Frameworks suportados", desc: "GRI, SASB, CDP, TCFD..." },
              { value: "12+", label: "Módulos integrados", desc: "ESG, SGQ, RH, Financeiro..." },
              { value: "< 48h", label: "Tempo de implantação", desc: "Do cadastro ao dashboard" },
              { value: "99.9%", label: "Disponibilidade", desc: "Infraestrutura cloud-native" },
            ].map((stat, idx) => (
              <div key={idx} className={`px-4 ${idx === 0 ? 'border-none' : ''}`}>
                <div className="text-4xl md:text-5xl font-bold text-[#c4fca1] mb-2">{stat.value}</div>
                <div className="font-bold text-lg mb-1">{stat.label}</div>
                <div className="text-sm text-gray-400">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PERFORMANCE SECTION --- */}
      {(() => {
        const perfModule = INFRA_MODULES.find(m => m.id === "performance");
        return perfModule ? <InfraPerformanceSection module={perfModule} /> : null;
      })()}


      {/* --- ORIGINAL FOOTER --- */}
      <PublicFooter />
    </div>
  );
}
