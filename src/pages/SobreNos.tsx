import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Users, Target, Globe, Shield, TrendingUp, Zap, CheckCircle,
    FileText, Layers, Award, ArrowRight, Lock, Menu
} from 'lucide-react';
import { HeimdallNavbar } from '@/components/landing/heimdall/HeimdallNavbar';
import { PublicFooter } from '@/components/landing/heimdall/PublicFooter';
import '@/components/landing/heimdall/heimdall.css';

const SobreNos = () => {
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
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop"
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
                            { index: "005", title: "Parceria de longo prazo", desc: "Não vendemos software — construímos capacidade ESG dentro das organizações.", features: ["Suporte consultivo especializado", "Evolução contínua da plataforma", "Comunidade de práticas ESG"] },
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
                        {/* Placeholder for platform visual/graphic */}
                        <div className="aspect-square bg-gradient-to-tr from-[#1a2421] to-[#0f1513] rounded-3xl p-8 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="grid grid-cols-2 gap-4 w-full max-w-md relative z-10">
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                                    <Globe className="text-[#c4fca1] mb-2" size={32} />
                                    <div className="text-white text-lg font-bold">Ambiental</div>
                                    <div className="text-white/60 text-xs">Gestão Completa</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 translate-y-8">
                                    <Users className="text-[#c4fca1] mb-2" size={32} />
                                    <div className="text-white text-lg font-bold">Social</div>
                                    <div className="text-white/60 text-xs">Impacto Humano</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 -translate-y-8">
                                    <Award className="text-[#c4fca1] mb-2" size={32} />
                                    <div className="text-white text-lg font-bold">Qualidade</div>
                                    <div className="text-white/60 text-xs">Normas ISO</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                                    <Zap className="text-[#c4fca1] mb-2" size={32} />
                                    <div className="text-white text-lg font-bold">IA</div>
                                    <div className="text-white/60 text-xs">Automática</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- METRICS --- */}
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

            {/* --- WHY DATON --- */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#15c470] font-mono text-xs uppercase tracking-widest font-bold">Diferenciais</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1a2421] mt-2">Por que empresas escolhem a Daton</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { title: "Tudo em um só lugar", desc: "Chega de planilhas dispersas e sistemas desconectados. ESG, qualidade e fornecedores em um único login." },
                        { title: "IA que trabalha por você", desc: "Extração automática de documentos, cálculos de emissões e alertas proativos para que sua equipe foque no que importa: estratégia." },
                        { title: "Conformidade sem complicação", desc: "Relatórios GRI, SASB e TCFD gerados automaticamente com dados já validados e auditáveis." },
                        { title: "Segurança de nível enterprise", desc: "Criptografia AES-256, isolamento de dados por empresa (Row Level Security), RBAC granular e conformidade total com a LGPD." },
                        { title: "Suporte humano, não genérico", desc: "Equipe especializada em ESG e qualidade que entende o contexto regulatório brasileiro." },
                        { title: "Monitoramento em tempo real", desc: "Acompanhe seus indicadores e metas minuto a minuto, não apenas no fechamento do mês." }
                    ].map((item, idx) => (
                        <div key={idx} className="p-8 rounded-2xl bg-[#f8fafc] border border-[#e5e7eb] hover:bg-white hover:shadow-md transition-all">
                            <h3 className="text-lg font-bold text-[#1a2421] mb-3">{item.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- PRIVACY --- */}
            <section className="py-24 px-6 bg-[#f8fafc] border-t border-[#e5e7eb]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 bg-[#1a2421] rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#c4fca1]">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1a2421] mb-6">Seus dados, sua soberania</h2>
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        Privacidade não é funcionalidade opcional — é arquitetura. Cada empresa opera em um ambiente logicamente isolado com Row Level Security no nível do banco de dados. Todos os dados são criptografados em trânsito (TLS 1.3) e em repouso (AES-256). Estamos em conformidade com a LGPD e seguimos as melhores práticas de segurança da informação, incluindo logs de auditoria completos e controle de acesso baseado em papéis com quatro níveis de permissão.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">AES-256 Encryption</span>
                        <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">TLS 1.3</span>
                        <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">Row Level Security</span>
                        <span className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-gray-700">LGPD Compliant</span>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto bg-[#1a2421] rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <Zap size={200} className="text-white" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Pronto para transformar sua gestão ESG?</h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Crie sua conta e tenha seu primeiro dashboard operacional em menos de 48 horas.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button className="px-8 py-4 bg-[#15c470] text-white font-bold rounded-lg hover:bg-[#12a35d] transition-colors flex items-center gap-2">
                                Começar agora <ArrowRight size={20} />
                            </button>
                            <button className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
                                Falar com especialista
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default SobreNos;
