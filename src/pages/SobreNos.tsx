import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Users, Target, Globe, Shield, TrendingUp, Zap, CheckCircle,
    FileText, Layers, Award, ArrowRight, Lock, Menu
} from 'lucide-react';
import { HeimdallNavbar } from '@/components/landing/heimdall/HeimdallNavbar';
import pilaresImg from '@/assets/pilares-esg.webp';
import soberaniaImg from '@/assets/esg-soberania.webp';
import sobreNosHero from '@/assets/sobre-nos-hero.webp';
import { responsiveImageProps } from "@/config/responsiveImages";
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
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    backgroundColor: "var(--lumine-bg)",
                    overflow: "hidden",
                    padding: "clamp(100px, 15vw, 120px) clamp(1rem, 4vw, 2rem) clamp(6rem, 12vh, 80px)",
                    paddingBottom: window.innerWidth < 768 ? 'clamp(10rem, 22vh, 14rem)' : 'clamp(6rem, 12vh, 80px)',
                }}
            >
                {/* Background Image */}
                <img
                    src={sobreNosHero}
                    {...responsiveImageProps(sobreNosHero)}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
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

                {/* Bottom Content - Stacks on mobile */}
                <div className="relative z-10 flex flex-col gap-8 md:gap-6 md:flex-row md:items-end md:justify-between mt-auto">
                    {/* Title */}
                    <div className="hero-content-wrapper max-w-[820px] pb-4 md:pb-0">
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
                                    fontSize: "clamp(1.8rem, 4.8vw, 4.2rem)",
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

                    {/* Action Bar */}
                    <div
                        ref={actionBarRef}
                        className="hero-action-bar self-end shrink-0 md:w-fit"
                        style={{
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
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
                </div>
            </section>

            {/* --- MISSION & VISION --- */}
            <section className="py-12 px-4 md:py-24 md:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 items-start">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold text-[#1a2421] mb-6">Nossa Missão</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Simplificar a gestão para que as equipes dediquem mais tempo a melhorar e menos a reunir informações. Conectamos qualidade, pessoas, sustentabilidade e governança para transformar dados em decisões e planos em ações acompanhadas.
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
                            Ser a referência em gestão integrada para organizações que querem transformar complexidade em clareza, dados em decisões e compromissos em resultados. Uma plataforma que conecta a operação à estratégia com automação, inteligência e responsabilidade.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* --- VALUES --- */}
            <section className="py-12 px-4 md:py-24 md:px-6 bg-[#f8fafc] border-y border-[#e5e7eb]">
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
                            { index: "001", title: "Transparência radical", desc: "Dados organizados, histórico de registros e clareza nos fluxos de gestão.", features: ["Histórico nos fluxos de gestão", "Registros com origem e responsáveis", "Evidências e versões por módulo"] },
                            { index: "002", title: "Impacto mensurável", desc: "Cada funcionalidade existe para gerar resultado concreto — não apenas relatórios.", features: ["KPIs acionáveis e contextuais", "Dashboards com metas tangíveis", "Relatórios orientados a resultado"] },
                            { index: "003", title: "Simplicidade intencional", desc: "Complexidade nos bastidores, clareza na interface. Tecnologia que qualquer equipe consegue usar.", features: ["Interface intuitiva e acessível", "Acesso por convite ou código", "Pendências com origem e responsável"] },
                            { index: "004", title: "Inovação responsável", desc: "IA e automação a serviço da sustentabilidade, com ética e privacidade como premissa.", features: ["IA com fontes e supervisão", "Controle de acesso por empresa", "Propostas e ações com confirmação"] },
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
            <section className="py-12 px-4 md:py-24 md:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-[#15c470] font-mono text-xs uppercase tracking-widest font-bold">O que fazemos</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a2421] mt-2 mb-6">Uma plataforma, todos os pilares</h2>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            O Daton conecta qualidade, pessoas, fornecedores, infraestrutura e sustentabilidade em um ciclo de gestão: organizar dados, executar processos, acompanhar resultados e melhorar com inteligência.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "Ambiental", desc: "Inventário de emissões GEE (Escopos 1, 2 e 3), gestão de resíduos, licenciamento ambiental, monitoramento de água e energia.", icon: Globe },
                                { title: "Social", desc: "Competências, planos de desenvolvimento, treinamentos, comunicação e conhecimento para desenvolver pessoas e equipes.", icon: Users },
                                { title: "Qualidade (SGQ)", desc: "Não conformidades, ações corretivas (5W2H), controle de documentos, gestão de riscos e auditorias internas.", icon: Award },
                                { title: "Fornecedores", desc: "Homologação, avaliação de desempenho, portal do fornecedor e controle de requisitos documentais.", icon: Layers },
                                { title: "Inteligência e Automação", desc: "IA com fontes, extração assistida, recomendações e ações supervisionadas para transformar informação em próximos passos.", icon: Zap }
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
                            {...responsiveImageProps(pilaresImg, "(min-width: 1024px) 608px, calc(100vw - 32px)")}
                            loading="lazy"
                            decoding="async"
                            alt="Pilares ESG - cubos representando os pilares ambiental, social e governança" 
                            className="w-full rounded-3xl object-cover shadow-lg"
                        />
                    </div>
                </div>
            </section>

            {/* --- WHY DATON --- */}
            <section className="py-12 px-4 md:py-24 md:px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#15c470] font-mono text-xs uppercase tracking-widest font-bold">Diferenciais</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1a2421] mt-2">Por que empresas escolhem a Daton</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                         { title: "Tudo em um só lugar", desc: "Chega de planilhas dispersas e sistemas desconectados.", details: "ESG, qualidade, fornecedores, auditorias e indicadores de desempenho — tudo em um único login, com dados integrados e rastreáveis." },
                         { title: "Inteligência para agir melhor", desc: "Encontre respostas e avance com apoio da IA.", details: "Consulte seus dados, extraia informações e receba propostas com fontes. Sua equipe revisa os resultados e confirma as ações autorizadas." },
                         { title: "Conformidade sem complicação", desc: "Saiba o que atender e prepare-se para demonstrar.", details: "Organize requisitos e evidências, acompanhe obrigações e prepare relatos para revisão e publicação pela equipe responsável." },
                         { title: "Acesso controlado", desc: "As informações certas para cada pessoa.", details: "Sua organização define quem pode consultar, revisar e agir, respeitando o papel de cada pessoa e os limites de acesso da equipe." },
                         { title: "Suporte humano", desc: "Converse com a equipe Daton.", details: "Use o canal Feedback no painel para dúvidas, problemas e ideias, ou entre em contato pelo e-mail institucional." },
                         { title: "Clareza para agir", desc: "Veja onde concentrar os esforços da equipe.", details: "Compare indicadores e metas, acompanhe desvios e transforme a análise em planos de ação com responsáveis e prazos." },
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            className={`p-6 md:p-8 rounded-2xl bg-[#f8fafc] border border-[#e5e7eb] cursor-pointer transition-all duration-300 ${
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
            <section className="py-12 px-4 md:py-24 md:px-6 bg-[#f8fafc] border-t border-[#e5e7eb]">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <img 
                            src={soberaniaImg} 
                            {...responsiveImageProps(soberaniaImg, "(min-width: 768px) 608px, calc(100vw - 32px)")}
                            loading="lazy"
                            decoding="async"
                            alt="Profissionais analisando dados ESG em tablet" 
                            className="w-full rounded-3xl object-cover shadow-lg"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-[#1a2421] mb-6">Seus dados, sua soberania</h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            Sua organização define quem pode consultar, revisar e agir. A proteção dos dados acompanha registros, documentos, relatórios e IA, com permissões, histórico e rastreabilidade para preservar o contexto de cada decisão.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">Senhas protegidas</span>
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">Sessões autenticadas</span>
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">Acesso por empresa</span>
                            <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">Papéis e permissões</span>
                        </div>
                    </div>
                </div>
            </section>


            <PublicFooter />
        </div>
    );
};

export default SobreNos;
