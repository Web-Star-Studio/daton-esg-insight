import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Users, Target, Globe, Shield, TrendingUp, Zap, CheckCircle,
    FileText, Layers, Award, ArrowRight, Lock, Menu
} from 'lucide-react';
import { HeimdallNavbar } from '@/components/landing/heimdall/HeimdallNavbar';
import pilaresImg from '@/assets/pilares-esg.png';
import soberaniaImg from '@/assets/esg-soberania.png';
import wortonLogo from '@/assets/worton-logo.png';
import sobreNosHero from '@/assets/sobre-nos-hero.png';
import socio1 from '@/assets/socio-1.jpeg';
import socio2 from '@/assets/socio-2.jpeg';
import socio3 from '@/assets/socio-3.jpeg';
import socio4 from '@/assets/socio-4.jpeg';
import { PublicFooter } from '@/components/landing/heimdall/PublicFooter';
import '@/components/landing/heimdall/heimdall.css';

const SobreNos = () => {
    const navigate = useNavigate();
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const actionBarRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="heimdall-page min-h-screen bg-white selection:bg-[#c4fca1] selection:text-[#1a2421]">
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
                {/* Background Image */}
                <img
                    src={sobreNosHero}
                    alt="Daton Team"
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

                {/* Gradient Overlay */}
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
                            Sobre a Daton
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
                            Transformamos dados em decisões que movem o futuro.
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
                            A Daton nasceu da convicção de que sustentabilidade e performance caminham juntas. Somos a plataforma que conecta indicadores ESG, qualidade e governança em um único ecossistema inteligente.
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

            {/* --- MISSION & VISION --- */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 items-start">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold text-[#1a2421] mb-6">Nossa Missão</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Simplificar a gestão de sustentabilidade corporativa, tornando dados ESG acessíveis, acionáveis e estratégicos para organizações de qualquer porte. Acreditamos que a transparência ambiental, social e de governança não é apenas uma obrigação regulatória — é a base para empresas mais resilientes e competitivas.
                        </p>
                    </motion.div>

                    <div className="hidden md:block w-px self-stretch bg-[#15c470]/30" />

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h2 className="text-3xl font-bold text-[#1a2421] mb-6">Nossa Visão</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Ser a plataforma de referência em gestão ESG na América Latina, reconhecida por transformar complexidade regulatória em clareza operacional e por empoderar empresas a alcançar metas de sustentabilidade com inteligência de dados.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* --- VALUES --- */}
            <section className="py-24 px-6 bg-[#f8fafc] border-y border-[#e5e7eb]">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold text-[#1a2421] mb-6 tracking-tight"
                        >
                            O que nos guia.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-xl text-[#6b7280] max-w-2xl leading-relaxed"
                        >
                            Nossos valores fundamentais definem cada decisão que tomamos e cada funcionalidade que construímos.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-[#e5e7eb] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
                        {[
                            { index: "001", title: "Transparência radical", desc: "Dados abertos, rastreabilidade total e auditabilidade em cada processo.", features: ["Auditoria completa de ações", "Rastreabilidade de dados ponta a ponta", "Logs imutáveis de operações"] },
                            { index: "002", title: "Impacto mensurável", desc: "Cada funcionalidade existe para gerar resultado concreto — não apenas relatórios.", features: ["KPIs acionáveis e contextuais", "Dashboards com metas tangíveis", "Relatórios orientados a resultado"] },
                            { index: "003", title: "Simplicidade intencional", desc: "Complexidade nos bastidores, clareza na interface. Tecnologia que qualquer equipe consegue usar.", features: ["Interface intuitiva e acessível", "Onboarding guiado e progressivo", "Automações invisíveis ao usuário"] },
                            { index: "004", title: "Inovação responsável", desc: "IA e automação a serviço da sustentabilidade, com ética e privacidade como premissa.", features: ["IA explicável e auditável", "Privacidade por design (LGPD)", "Governança ética de algoritmos"] },
                        ].map((val, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5 }}
                                className="group relative flex flex-col bg-white p-8 md:p-10 border-b border-r border-[#e5e7eb] hover:bg-[#fafafa] transition-colors duration-300"
                            >
                                <span className="text-xs font-mono text-[#9ca3af] mb-6 tracking-widest">{val.index}</span>
                                <h3 className="text-2xl font-bold text-[#1a2421] tracking-tight mb-6">{val.title}</h3>
                                <p className="text-[#4b5563] leading-relaxed mb-8">{val.desc}</p>
                                <ul className="space-y-3 mt-auto">
                                    {val.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-[#4b5563]">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c4fca1] shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PILLARS --- */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-[#15c470] font-mono text-xs uppercase tracking-widest font-bold">O que fazemos</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a2421] mt-2 mb-6">Uma plataforma, todos os pilares</h2>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            O Daton ESG Insight reúne em um único ambiente os módulos necessários para gerenciar o desempenho ambiental, social, de qualidade e de cadeia de fornecedores da sua organização.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "Ambiental", desc: "Inventário de emissões GEE (Escopos 1, 2 e 3), gestão de resíduos, licenciamento ambiental, monitoramento de água e energia.", icon: Globe },
                                { title: "Social", desc: "Indicadores de diversidade e inclusão, gestão de treinamentos, segurança do trabalho e programas de impacto comunitário.", icon: Users },
                                { title: "Qualidade (SGQ)", desc: "Não conformidades, ações corretivas (5W2H), controle de documentos, gestão de riscos e auditorias internas.", icon: Award },
                                { title: "Fornecedores", desc: "Homologação, avaliação de desempenho, portal de autoatendimento e monitoramento de riscos ESG na cadeia.", icon: Layers },
                                { title: "Inteligência e Automação", desc: "Assistente de IA contextual, extração automática de documentos, alertas preditivos e recomendações acionáveis.", icon: Zap }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="mt-1 shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-[#15c470]/10 flex items-center justify-center text-[#15c470]">
                                            <item.icon size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#1a2421]">{item.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <img 
                            src={pilaresImg} 
                            alt="Pilares ESG - cubos representando os pilares ambiental, social e governança" 
                            className="w-full rounded-3xl object-cover shadow-lg"
                        />
                    </div>
                </div>
            </section>

            {/* --- WHY DATON --- */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#15c470] font-mono text-xs uppercase tracking-widest font-bold">Diferenciais</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1a2421] mt-2">Por que empresas escolhem a Daton</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {[
                         { title: "Tudo em um só lugar", desc: "Chega de planilhas dispersas e sistemas desconectados.", details: "ESG, qualidade, fornecedores, auditorias e indicadores financeiros — tudo em um único login, com dados integrados e rastreáveis.", span: "lg:col-span-2" },
                         { title: "IA que trabalha por você", desc: "Extração automática de documentos e alertas proativos.", details: "Cálculos de emissões, classificação de documentos e sugestões inteligentes para que sua equipe foque no que importa: estratégia.", span: "lg:col-span-2" },
                         { title: "Conformidade sem complicação", desc: "Relatórios GRI, SASB e TCFD gerados automaticamente.", details: "Dados já validados e auditáveis, prontos para envio a reguladores e stakeholders com um clique.", span: "lg:col-span-2" },
                         { title: "Segurança enterprise", desc: "Criptografia AES-256 e isolamento por empresa.", details: "Row Level Security, RBAC granular com quatro níveis de permissão e conformidade total com a LGPD.", span: "lg:col-span-2" },
                         { title: "Suporte humano", desc: "Equipe especializada em ESG e qualidade.", details: "Profissionais que entendem o contexto regulatório brasileiro e acompanham sua jornada de maturidade.", span: "lg:col-span-2" },
                         { title: "Monitoramento em tempo real", desc: "Indicadores e metas atualizados minuto a minuto.", details: "Dashboards dinâmicos com alertas configuráveis, não apenas relatórios no fechamento do mês.", span: "lg:col-span-2" },
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            className={`${item.span} col-span-1 md:col-span-1 p-8 rounded-2xl bg-[#f8fafc] border border-[#e5e7eb] cursor-pointer transition-all duration-300 ${
                                hoveredIdx !== null && hoveredIdx !== idx
                                    ? 'opacity-50 scale-[0.97]'
                                    : ''
                            } ${
                                hoveredIdx === idx
                                    ? 'bg-white shadow-lg scale-[1.02] border-[#15c470]/30'
                                    : ''
                            }`}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            layout
                        >
                            <h3 className="text-lg font-bold text-[#1a2421] mb-2">{item.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                            <AnimatePresence>
                                {hoveredIdx === idx && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="text-gray-500 text-sm mt-3 leading-relaxed overflow-hidden"
                                    >
                                        {item.details}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- PRIVACY --- */}
            <section className="py-24 px-6 bg-[#f8fafc] border-t border-[#e5e7eb]">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <img 
                            src={soberaniaImg} 
                            alt="Profissionais analisando dados ESG em tablet" 
                            className="w-full rounded-3xl object-cover shadow-lg"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-[#1a2421] mb-6">Seus dados, sua soberania</h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            Privacidade não é funcionalidade opcional — é arquitetura. Cada empresa opera em um ambiente logicamente isolado com Row Level Security no nível do banco de dados. Todos os dados são criptografados em trânsito (TLS 1.3) e em repouso (AES-256). Estamos em conformidade com a LGPD e seguimos as melhores práticas de segurança da informação, incluindo logs de auditoria completos e controle de acesso baseado em papéis com quatro níveis de permissão.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">AES-256 Encryption</span>
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">TLS 1.3</span>
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">Row Level Security</span>
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">LGPD Compliant</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- WORTON --- */}
            <section className="py-16 px-6 bg-[#1a2421]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  {/* Left: Worton branding (30%) */}
                  <div className="md:w-[30%] flex justify-center">
                    <div className="relative w-fit">
                      <p className="absolute top-6 left-7 text-white/60 text-sm uppercase tracking-widest font-mono z-10">Uma empresa</p>
                      <a href="https://www.worton.com.br/" target="_blank" rel="noopener noreferrer">
                          <img
                              src={wortonLogo}
                              alt="Worton"
                              className="h-56 hover:opacity-80 transition-opacity"
                              style={{ filter: "brightness(0) invert(1)" }}
                          />
                      </a>
                    </div>
                  </div>

                  {/* Right: Partners grid (70%) */}
                  <div
                    className="md:w-[63%] aspect-square overflow-hidden"
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div
                      className="grid w-full h-full gap-2"
                      style={{
                        gridTemplateColumns:
                          hoveredIdx === null ? '1fr 1fr'
                          : hoveredIdx === 0 || hoveredIdx === 2 ? '3fr 1fr'
                          : '1fr 3fr',
                        gridTemplateRows:
                          hoveredIdx === null ? '1fr 1fr'
                          : hoveredIdx === 0 || hoveredIdx === 1 ? '3fr 1fr'
                          : '1fr 3fr',
                        transition: 'grid-template-rows 0.4s ease, grid-template-columns 0.4s ease',
                      }}
                    >
                      {[socio1, socio2, socio3, socio4].map((src, idx) => (
                        <div
                          key={idx}
                          className="overflow-hidden rounded-xl cursor-pointer"
                          onMouseEnter={() => setHoveredIdx(idx)}
                        >
                          <img
                            src={src}
                            alt={`Sócio ${idx + 1}`}
                            className="w-full h-full object-cover grayscale"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default SobreNos;
