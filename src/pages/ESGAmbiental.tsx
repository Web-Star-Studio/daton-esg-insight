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
  Menu
} from "lucide-react";
import { HeimdallNavbar } from "@/components/landing/heimdall/HeimdallNavbar";
import { PublicFooter } from "@/components/landing/heimdall/PublicFooter";
import "@/components/landing/heimdall/heimdall.css";

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
    category: "Aesthetics / Design / Architecture",
    description:
      "Monitor emissions, manage licenses, and track resource consumption in real-time dashboards. Automate calculations and accelerate compliance with global regulations.",
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
    category: "Gastronomy / Futuristic Cuisine",
    description:
      "Track diversity, turnover, and safety metrics in a consolidated panel. Manage the complete employee lifecycle from recruitment to career development.",
    icon: Users,
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=2669&auto=format&fit=crop",
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
    category: "Management / Process Control",
    description:
      "Register, analyze, and treat non-conformities with structured flows. Control document versions and conduct internal audits with full traceability.",
    icon: FileCheck,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2670&auto=format&fit=crop",
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
    category: "Supply Chain / Procurement",
    description:
      "Qualify and evaluate suppliers. Monitor contracts and ESG risks in the chain, offering a self-service portal for your partners.",
    icon: TrendingUp,
    image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=2574&auto=format&fit=crop",
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
    category: "Technology / Automation",
    description:
      "Analyze data in real-time to generate predictive alerts, identify emerging risks, and suggest continuous improvement actions.",
    icon: Brain,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop",
    color: "#eff6ff",
    features: [
      "Alertas inteligentes de prazos",
      "Extração automática de documentos",
      "Insights contextuais",
    ],
  },
];

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
  // Calculate blur range: Start blurring ONLY when the *next* card overlaps significantly (30%).
  // range[0] is when *this* card enters.
  // range[0] + 0.25 is when the *next* card enters.
  // range[0] + 0.25 + (0.25 * 0.3) is when next card is 30% visible.
  // Calculate blur range: Start blurring ONLY when the *next* card overlaps.
  // We must ensure the input range lies within [0, 1] to avoid WAAPI errors/crashes.

  const step = 0.25;
  // Reduce threshold to 10% overlap (0.1) so blur starts earlier as requested.
  let blurStart = range[0] + step + (step * 0.1);

  // Safe clamp to ensure we don't exceed 0.95 (leaving room for interpolation)
  if (blurStart > 0.95) blurStart = 0.95;

  const blurEnd = 1;

  // If blurStart >= blurEnd, useTransform might behave oddly or offsets error occurs.
  // We ensure strictly increasing range: [0.95, 1] worst case.
  // For the last card (or any card where calculation pushes it too far), we just disable blur.

  const shouldBlur = i < MODULES.length - 1 && blurStart < blurEnd;
  const blur = useTransform(
    progress,
    shouldBlur ? [blurStart, blurEnd] : [0, 1],
    shouldBlur ? ["blur(0px)", "blur(10px)"] : ["blur(0px)", "blur(0px)"]
  );

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
        {/* Left Side: Image */}
        <div className="w-full h-1/2 md:w-[60%] md:h-full overflow-hidden relative group">
          <motion.div className="w-full h-full" style={{ scale: imageScale }}>
            <img
              src={module.image}
              alt={module.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Right Side: Content */}
        <div className="w-full h-1/2 md:w-[40%] md:h-full p-8 md:p-12 lg:p-16 flex flex-col justify-between relative bg-opacity-50 backdrop-blur-sm">
          {/* Top Meta */}
          <div className="flex justify-between items-start text-[10px] md:text-xs font-mono tracking-widest text-gray-500 uppercase">
            <span>[ {module.index} ]</span>
            <span className="text-right max-w-[150px]">{module.category}</span>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-6 mt-8 md:mt-0">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl text-[#1a2421]"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              {module.title}
            </h2>

            <p className="text-base md:text-lg text-[#5e6b66] leading-relaxed">
              {module.description}
            </p>

            {/* Features List */}
            <ul className="space-y-3 mt-4">
              {module.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm md:text-base text-[#4a5550]"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#15c470] shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Action */}
          <div className="flex items-center gap-4 mt-8 md:mt-0">
            <button className="group flex items-center gap-2 px-6 py-3 bg-[#c4fca1] hover:bg-[#b0ef8d] transition-colors rounded-full text-xs md:text-sm font-mono font-bold tracking-wider text-[#1a2421] uppercase">
              Get In Touch
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <div className="flex -space-x-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative"
                >
                  <img
                    src={`https://source.unsplash.com/random/100x100?abstract&sig=${j + Number(module.index) * 10
                      }`}
                    className="w-full h-full object-cover opacity-80"
                    alt=""
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
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
    { label: 'Tecnologia', href: '/documentacao' },
    { label: 'Documentação', href: '/documentacao' },
    { label: 'Sobre Nós', href: '/contato' },
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
          src="/hero-img-01.png"
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
              onClick={() => navigate("/demo")}
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

      {/* --- ORIGINAL FOOTER --- */}
      <PublicFooter />
    </div>
  );
}
