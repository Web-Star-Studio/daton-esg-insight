import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Brain,
    Menu,
    Leaf,
    Users,
    FileCheck,
    TrendingUp,
    CheckCircle2
} from "lucide-react";
import solutionAmbiental from "@/assets/solution-ambiental.jpg";
import solutionSocial from "@/assets/tech-social-screenshot.png";
import solutionQualidade from "@/assets/solution-qualidade.jpg";
import solutionFornecedores from "@/assets/solution-fornecedores.jpg";
import solutionIA from "@/assets/solution-ia.jpg";
import techHeroImg from "@/assets/tech-hero.png";
import { HeimdallNavbar } from "@/components/landing/heimdall/HeimdallNavbar";
import { PublicFooter } from "@/components/landing/heimdall/PublicFooter";
import "@/components/landing/heimdall/heimdall.css";

// --- SOLUTION MODULES DATA ---

interface SolutionModule {
    id: string;
    index: string;
    title: string;
    category: string;
    description: string;
    features: string[];
    icon: React.ElementType;
    image: string;
}

const SOLUTION_MODULES: SolutionModule[] = [
    {
        id: "ambiental",
        index: "001",
        title: "ESG Ambiental",
        category: "Meio Ambiente / Sustentabilidade / Gestão",
        description:
            "Monitore emissões, gerencie licenças e acompanhe o consumo de recursos em painéis em tempo real. Automatize cálculos de inventário GEE e acelere a conformidade com regulamentações globais como GRI, SASB e CDP.",
        icon: Leaf,
        image: solutionAmbiental,
        features: [
            "Inventário de emissões GEE (Escopos 1, 2, 3)",
            "Gestão de licenças e condicionantes ambientais",
            "Monitoramento de água, energia e resíduos",
            "Dashboards de performance ambiental em tempo real",
            "Relatórios automáticos para órgãos reguladores",
        ],
    },
    {
        id: "social",
        index: "002",
        title: "ESG Social",
        category: "Social / Diversidade / Segurança",
        description:
            "Acompanhe métricas de diversidade, rotatividade e segurança em um painel consolidado. Gerencie o ciclo de vida completo do colaborador, do recrutamento ao desenvolvimento de carreira, com LMS integrado.",
        icon: Users,
        image: solutionSocial,
        features: [
            "Dashboard de métricas sociais e diversidade",
            "LMS integrado para capacitação e treinamentos",
            "Gestão de saúde e segurança do trabalho",
            "Engajamento de stakeholders e comunidades",
            "Relatórios de impacto social automatizados",
        ],
    },
    {
        id: "qualidade",
        index: "003",
        title: "Qualidade (SGQ)",
        category: "Gestão / Controle de Processos",
        description:
            "Registre, analise e trate não conformidades com fluxos estruturados. Controle versões de documentos, conduza auditorias internas e gerencie ações corretivas com total rastreabilidade ISO 9001.",
        icon: FileCheck,
        image: solutionQualidade,
        features: [
            "Gestão completa de não conformidades",
            "Ações corretivas e preventivas com 5W2H",
            "Controle de documentos com versionamento",
            "Auditorias internas com checklists dinâmicos",
            "Indicadores de qualidade e KPIs em tempo real",
        ],
    },
    {
        id: "fornecedores",
        index: "004",
        title: "Gestão Fornecedores",
        category: "Cadeia de Suprimentos / Compras",
        description:
            "Qualifique e avalie fornecedores com critérios ESG integrados. Monitore contratos, riscos e desempenho da cadeia de suprimentos com portal de autoatendimento para parceiros.",
        icon: TrendingUp,
        image: solutionFornecedores,
        features: [
            "Cadastro e homologação de fornecedores",
            "Portal do fornecedor com autoatendimento",
            "Monitoramento de riscos ESG na cadeia",
            "Avaliação de desempenho e scoring",
            "Gestão de contratos e SLAs",
        ],
    },
    {
        id: "ia",
        index: "005",
        title: "Inteligência Artificial",
        category: "Tecnologia / Automação / Predição",
        description:
            "Analise dados em tempo real para gerar alertas preditivos, identificar riscos emergentes e sugerir ações de melhoria contínua. IA nativa treinada no contexto da sua operação ESG.",
        icon: Brain,
        image: solutionIA,
        features: [
            "Alertas inteligentes de prazos e vencimentos",
            "Extração automática de documentos (IDP)",
            "Insights contextuais com IA generativa",
            "Modelos preditivos para riscos ESG",
            "Automação de relatórios e compliance",
        ],
    },
];

// --- SOLUTION DETAIL SECTION ---

const SolutionDetailSection = ({ modules, onNavigate }: { modules: SolutionModule[]; onNavigate: (path: string) => void }) => (
    <section className="w-full bg-[#fafafa] border-t border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-6 py-24">
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-20"
            >
                <span className="block text-xs font-mono text-[#6b7280] mb-4 tracking-widest uppercase">
                    Módulos da Plataforma
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-[#1a2421] mb-6 tracking-tight">
                    Nossas Soluções
                </h2>
                <p className="text-lg md:text-xl text-[#6b7280] max-w-2xl leading-relaxed">
                    Cada módulo foi projetado para resolver desafios reais de gestão ESG, qualidade e cadeia de suprimentos — com inteligência artificial nativa.
                </p>
            </motion.div>

            {/* Module Blocks */}
            <div className="space-y-24">
                {modules.map((module, idx) => {
                    const isReversed = idx % 2 !== 0;
                    const Icon = module.icon;

                    return (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.6 }}
                            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isReversed ? "lg:direction-rtl" : ""}`}
                        >
                            {/* Text Side */}
                            <div className={`space-y-6 ${isReversed ? "lg:order-2" : "lg:order-1"}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-[#9ca3af] tracking-widest">{module.index}</span>
                                    <span className="w-8 h-px bg-[#d1d5db]" />
                                    <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">{module.category}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#0B1210] flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-[#c4fca1]" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-[#1a2421] tracking-tight">{module.title}</h3>
                                </div>

                                <p className="text-[#4b5563] leading-relaxed text-base md:text-lg">
                                    {module.description}
                                </p>

                                <ul className="space-y-3 pt-2">
                                    {module.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-3 text-sm text-[#374151]">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#00bf63] shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <motion.button
                                    onClick={() => onNavigate("/funcionalidades")}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-[#0B1210] text-white text-sm font-semibold hover:bg-[#1a2e28] transition-colors"
                                >
                                    Explorar módulo
                                    <ArrowRight size={16} />
                                </motion.button>
                            </div>

                            {/* Image Side */}
                            <div className={`${isReversed ? "lg:order-1" : "lg:order-2"}`}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.15 }}
                                    className="relative rounded-2xl overflow-hidden shadow-xl border border-[#e5e7eb]"
                                >
                                    <img
                                        src={module.image}
                                        alt={`Módulo ${module.title} - Dashboard`}
                                        loading="lazy"
                                        className="w-full h-auto object-cover aspect-[3/2]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    </section>
)

export default function Technology() {
    const navigate = useNavigate();
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const actionBarRef = useRef<HTMLDivElement>(null);

    const quickMenuLinks = [
        { label: 'Soluções', href: '/funcionalidades' },
        { label: 'Tecnologia', href: '/tecnologia' },
        { label: 'Documentação', href: '/documentacao' },
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

    return (
        <div className="heimdall-page min-h-screen bg-white">
            <HeimdallNavbar />

            {/* --- HERO SECTION --- */}
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
                    src={techHeroImg}
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
                            Tecnologia Daton
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
                            Tecnologia de ponta a serviço da sustentabilidade.
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
                            Infraestrutura segura, inteligência artificial avançada e arquitetura escalável — tudo projetado para transformar dados ESG em decisões estratégicas.
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

            {/* --- SOLUTION MODULES SECTION --- */}
            <SolutionDetailSection modules={SOLUTION_MODULES} onNavigate={navigate} />

            <PublicFooter />
        </div>
    );
}
