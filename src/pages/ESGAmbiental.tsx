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
      "Antecipe riscos ambientais e acompanhe suas metas. Reúna recursos, resíduos, licenças e inventários de emissões para orientar ações e relatos ESG.",
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
    category: "Pessoas / Competências / Aprendizagem",
    description:
      "Saiba quais competências desenvolver e acompanhe a evolução da equipe. Conecte PDI, treinamentos, avaliação de eficácia e comunicação.",
    icon: Users,
    image: esgSocialCardImg,
    color: "#f0fdf4",
    features: [
      "Competências, lacunas e PDI",
      "Programas, turmas e eficácia",
      "Comunicação e engajamento",
    ],
  },
  {
    id: "qualidade",
    index: "003",
    title: "Qualidade (SGQ)",
    category: "Gestão / Controle de Processos",
    description:
      "Transforme desvios em melhoria contínua. Investigue causas, acompanhe ações corretivas e prepare auditorias com documentos e evidências organizados.",
    icon: FileCheck,
    image: esgQualityCardImg,
    color: "#f5f3ff",
    features: [
      "Gestão de não conformidades",
      "Ações corretivas com 5W2H",
      "Controle de documentos",
    ],
  },
  {
    id: "governanca",
    index: "004",
    title: "ESG Governança",
    category: "Governança Corporativa",
    description:
      "Leve a estratégia para a rotina da gestão. Acompanhe riscos e indicadores e transforme reuniões e análises críticas em decisões e planos de ação.",
    icon: TrendingUp,
    image: esgSuppliersCardImg,
    color: "#fff7ed",
    features: [
      "Riscos, oportunidades e planos de ação",
      "Reuniões, atas e decisões",
      "Indicadores, relatórios e RAC",
    ],
  },
  {
    id: "ia",
    index: "005",
    title: "Inteligência Artificial",
    category: "Tecnologia / Automação",
    description:
      "Ganhe tempo para analisar e agir. Consulte seus dados, extraia informações e receba recomendações com fontes. Revise a prévia e confirme as ações.",
    icon: Brain,
    image: esgAiCardImg,
    color: "#eff6ff",
    features: [
      "Respostas com fontes e contexto",
      "Extração e mapeamento assistidos",
      "Recomendações com confirmação",
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
    category: "Assistente / Fontes / Supervisão",
    description:
      "Encontre respostas nos seus dados e avance no trabalho com IA. Confira as fontes, revise as propostas e confirme as ações permitidas para você.",
    icon: Brain,
    image: "",
    color: "#eef2ff",
    features: [
      "Respostas ligadas às fontes consultadas",
      "Extração e comparação assistidas",
      "Mapeamento de dados com prévia",
      "Recomendações e ações confirmadas",
    ],
  },
  {
    id: "arquitetura",
    index: "002",
    title: "Plataforma Integrada",
    category: "Dados / Fluxos / Relações",
    description:
      "Reúna o que sua equipe precisa para decidir e executar. Acompanhe obrigações, ações e resultados sem perder o histórico das informações.",
    icon: Server,
    image: "",
    color: "#f8fafc",
    features: [
      "Visão integrada entre os módulos",
      "Relações sem duplicar a fonte",
      "Histórico e evidências no centro",
      "Fluxos do dado à decisão",
    ],
  },
  {
    id: "seguranca",
    index: "003",
    title: "Acesso e Governança",
    category: "Permissões / Responsabilidade / Trilha",
    description:
      "Compartilhe informações com as pessoas certas. Defina acessos e consulte o histórico de decisões, alterações e evidências.",
    icon: ShieldCheck,
    image: "",
    color: "#f0f9ff",
    features: [
      "Acesso por papel, módulo e abrangência",
      "Responsabilidades sem ampliar permissões",
      "Dados separados por organização",
      "Arquivos vinculados ao registro correto",
      "Histórico de decisões e alterações",
    ],
  },
  {
    id: "integracoes",
    index: "004",
    title: "Entrada e Saída de Dados",
    category: "Mapeamento / Prévia / Reconciliação",
    description:
      "Poupe o trabalho de redigitar dados. Confira a prévia, corrija inconsistências e confirme a importação com a origem preservada.",
    icon: Network,
    image: "",
    color: "#fdf4ff",
    features: [
      "Modelos orientados ao destino",
      "Erros identificados por linha",
      "Confirmação antes da gravação",
      "Exportação com fonte e filtros",
    ],
  },
  {
    id: "performance",
    index: "005",
    title: "Da Decisão à Ação",
    category: "Fonte / Responsável / Prazo / Evidência",
    description:
      "Saiba o que exige atenção, quem cuida de cada ação e qual é o prazo. Acompanhe a execução e veja os resultados com evidências.",
    icon: Zap,
    image: "",
    color: "#fffbeb",
    features: [],
    metrics: [
      { label: "Origem", value: "Fonte", desc: "Dado ligado ao registro correto" },
      { label: "Execução", value: "Dono", desc: "Responsabilidade claramente atribuída" },
      { label: "Controle", value: "Prazo", desc: "Acompanhamento e alertas" },
      { label: "Resultado", value: "Prova", desc: "Evidência e histórico preservados" },
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
    <p className="text-[#4b5563] leading-relaxed mb-8 min-h-20">{module.description}</p>
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
            height: isDesktop ? "100%" : "45%"
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
            height: isDesktop ? "100%" : "55%",
            top: isDesktop ? 0 : "auto",
            bottom: 0,
            right: 0,
            position: isDesktop ? "absolute" : "absolute",
            opacity: isDesktop ? contentOpacity : 1
          }}
        >
          {/* Main Content */}
          <div className="flex flex-col gap-4 md:gap-6 mt-4 md:mt-0 pt-6 md:pt-16 overflow-y-auto">
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
          paddingBottom: window.innerWidth < 768 ? 'clamp(10rem, 22vh, 14rem)' : '80px',
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
            bottom: window.innerWidth < 768 ? "18vh" : "10vh",
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
              Sua gestão conectada. Sua equipe pronta para agir.
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
              Reúna ambiente, pessoas, qualidade e governança. Automatize rotinas,
              acompanhe metas e avance com decisões bem fundamentadas.
            </p>
          </motion.div>
        </div>

        {/* Bottom Right Action Bar */}
        <div
          ref={actionBarRef}
          style={{
            position: "absolute",
            bottom: window.innerWidth < 768 ? "8vh" : "2vh",
            right: window.innerWidth < 768 ? "max(1vw, 0.5rem)" : "max(1vw, 0.5rem)",
            left: window.innerWidth < 768 ? "max(1vw, 0.5rem)" : "auto",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: window.innerWidth < 768 ? "auto" : "fit-content",
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
              className="lumine-btn-primary whitespace-nowrap text-[clamp(0.8rem,3.2vw,1rem)] flex-1 justify-center"
              style={{ color: "#000000" }}
            >
              INICIAR AGORA
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
            Tecnologia que conecta contexto, decisões e resultados.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#6b7280] max-w-2xl leading-relaxed"
          >
            Do controle ambiental ao desenvolvimento das pessoas, conecte as áreas da empresa e transforme informação em próximos passos.
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
              { value: "Fonte", label: "Origem", desc: "Dado ligado ao registro correto" },
              { value: "Dono", label: "Execução", desc: "Ação claramente atribuída" },
              { value: "Prazo", label: "Controle", desc: "Alertas e prioridades" },
              { value: "Prova", label: "Resultado", desc: "Evidência e histórico" },
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
