import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText, Zap, Shield, Target, Users, Cpu, Globe, TrendingUp,
  Clock, CheckCircle, ArrowRight, Layers, HelpCircle, ChevronDown, Menu
} from 'lucide-react';
import { FAQ_categories } from '@/data/faqs';
import { HeimdallNavbar } from '@/components/landing/heimdall/HeimdallNavbar';
import { PublicFooter } from '@/components/landing/heimdall/PublicFooter';
import { supabase } from '@/integrations/supabase/client';
import '@/components/landing/heimdall/heimdall.css';
import docsHeroImg from '@/assets/docs-hero.png';

const Documentacao = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('faq');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
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

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) setActiveSection('overview');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) setActiveSection('overview');
      else setActiveSection('faq');
    });

    return () => subscription.unsubscribe();
  }, []);

  const allSections = [
    { id: 'overview', title: 'Visão Geral', icon: FileText },
    { id: 'modules', title: 'Módulos', icon: Layers },
    { id: 'benefits', title: 'Benefícios', icon: Target },
    { id: 'security', title: 'Segurança', icon: Shield },
    { id: 'api', title: 'API & Dev', icon: Cpu },
    { id: 'faq', title: 'Central de Ajuda', icon: HelpCircle },
  ];

  const sections = isAuthenticated
    ? allSections
    : allSections.filter(s => s.id === 'faq');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Header offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div className="heimdall-page min-h-screen bg-white selection:bg-[#c4fca1] selection:text-[#1a2421]">
      <HeimdallNavbar />

      {/* --- HERO SECTION --- */}
      <section
        style={{
          position: "relative",
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0B0C0E",
          overflow: "hidden",
          padding: "clamp(100px, 15vw, 120px) clamp(1rem, 4vw, 2rem) clamp(3rem, 6vh, 60px)",
        }}
      >
        {/* Hero Background Image */}
        <img
          src={docsHeroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-[#0B0C0E]/80" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              Documentação
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Guia completo de arquitetura, referências de API e manuais de utilização da plataforma ESG mais avançada do mercado.
            </p>
          </motion.div>
        </div>

        {/* Bottom Right Action Bar (Hamburger Menu) */}
        <div
          ref={actionBarRef}
          className="absolute bottom-[4vh] left-1/2 -translate-x-1/2 w-[90vw] md:w-fit md:left-auto md:translate-x-0 md:right-[max(4vw,2rem)]"
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
                style={{ width: "100%", overflow: "hidden" }}
              >
                <nav style={{ display: "grid", gap: "0.15rem", padding: "0.35rem 0.35rem 0.2rem" }}>
                  {quickMenuLinks.map((link, index) => (
                    <motion.button
                      key={index}
                      onClick={() => { setQuickMenuOpen(false); navigate(link.href); }}
                      whileHover={{ scale: 1.03, backgroundColor: "#c4fca1", color: "#000000" }}
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

            <div aria-hidden="true" style={{ width: "1px", height: "28px", background: "rgba(255, 255, 255, 0.28)" }} />

            <motion.button
              onClick={() => navigate("/auth")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lumine-btn-primary whitespace-nowrap text-[clamp(0.8rem,3.2vw,1rem)] flex-1 justify-center"
              style={{ color: "#000000" }}
            >
              EXPLORAR DEMONSTRAÇÃO
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-16 flex flex-col md:flex-row gap-8 md:gap-12">
        {/* --- SIDEBAR NAVIGATION --- */}
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <div className="sticky top-32 space-y-8">
            <div>
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-6 px-3">
                Índice
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`
                                                w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
                                                ${isActive
                          ? 'bg-[#f3f4f6] text-[#1a2421]'
                          : 'text-gray-500 hover:text-[#1a2421] hover:bg-gray-50'
                        }
                                            `}
                    >
                      <Icon
                        size={16}
                        className={`transition-colors ${isActive ? 'text-[#15c470]' : 'text-gray-400 group-hover:text-gray-600'}`}
                      />
                      {section.title}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-[#15c470]"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-[#e5e7eb]">
              <h4 className="font-bold text-[#1a2421] mb-2">Precisa de ajuda?</h4>
              <p className="text-sm text-gray-500 mb-4">Nossa equipe de suporte técnico está disponível 24/7.</p>
              <Link to="/contato" className="w-full py-2 px-4 bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#1a2421] hover:bg-[#e5e7eb] transition-colors shadow-sm block text-center">
                Contatar Suporte
              </Link>
            </div>
          </div>
        </aside>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 space-y-24">

          {/* VISÃO GERAL - apenas logado */}
          {isAuthenticated && (
            <>
              <section id="overview" className="scroll-mt-32">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-[#1a2421] mb-4">Visão Geral</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Daton é a plataforma ESG (Environmental, Social & Governance) enterprise-grade que unifica a gestão de sustentabilidade.
                    Projetada para escala, segurança e conformidade automática.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Clock, label: "Eficiência", title: "70% menos tempo", desc: "em relatórios e coletas de dados manuais." },
                    { icon: CheckCircle, label: "Precisão", title: "99.9% Compliance", desc: "com normas locais e globais (GRI, SASB)." },
                    { icon: Zap, label: "Velocidade", title: "Setup em 15min", desc: "para criar sua primeira conta e dashboard." },
                  ].map((item, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-[#f8fafc] border border-[#e5e7eb] hover:border-[#15c470]/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center mb-4 text-[#15c470]">
                        <item.icon size={20} />
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                      <h3 className="text-xl font-bold text-[#1a2421] mt-1 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* MÓDULOS */}
              <section id="modules" className="scroll-mt-32">
                <h2 className="text-3xl font-bold text-[#1a2421] mb-8">Módulos Essenciais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Gestão de Emissões GEE",
                      icon: Globe,
                      features: ["Escopos 1, 2 e 3 automático", "Biblioteca de fatores DEFRA/IPCC", "Inventário em tempo real"]
                    },
                    {
                      title: "Compliance & Licenças",
                      icon: Shield,
                      features: ["Monitoramento de condicionantes", "Alertas de vencimento", "Rastro de auditoria"]
                    },
                    {
                      title: "Inteligência Artificial",
                      icon: Cpu,
                      features: ["OCR de faturas de energia", "Predição de riscos climáticos", "Assistente jurídico"]
                    },
                    {
                      title: "Supply Chain",
                      icon: Users,
                      features: ["Homologação de fornecedores", "Scorecard ESG", "Portal do fornecedor"]
                    }
                  ].map((mod, idx) => (
                    <div key={idx} className="group p-8 rounded-2xl border border-[#e5e7eb] bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-[#c4fca1] transition-colors">
                          <mod.icon size={24} className="text-[#1a2421]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1a2421]">{mod.title}</h3>
                      </div>
                      <ul className="space-y-3">
                        {mod.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#15c470] shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* BENEFÍCIOS */}
              <section id="benefits" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-[#1a2421]">Impacto Real</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e5e7eb] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
                  {[
                    { title: "Automação", desc: "Coleta automática de dados via APIs e integradores." },
                    { title: "Auditoria", desc: "Histórico imutável de todas as ações na plataforma." },
                    { title: "Reporte", desc: "Relatórios prontos para investidores e stakeholders." }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-8 hover:bg-gray-50 transition-colors">
                      <h3 className="text-lg font-bold text-[#1a2421] mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SEGURANÇA */}
              <section id="security" className="scroll-mt-32">
                <h2 className="text-3xl font-bold text-[#1a2421] mb-8">Segurança de Dados</h2>
                <div className="p-8 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ul className="space-y-4">
                      {[
                        "Criptografia AES-256 em repouso",
                        "TLS 1.3 para dados em trânsito",
                        "Autenticação Multi-fator (MFA)",
                        "Backups automáticos diários"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-[#1a2421] font-medium">
                          <Shield size={18} className="text-[#15c470]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-4">
                      <h4 className="font-bold text-[#1a2421]">Certificações & Compliance</h4>
                      <div className="flex flex-wrap gap-3">
                        <span className="px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-md text-xs font-bold text-gray-600">ISO 27001 Ready</span>
                        <span className="px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-md text-xs font-bold text-gray-600">LGPD</span>
                        <span className="px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-md text-xs font-bold text-gray-600">SOC 2 Type II</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* API */}
              <section id="api" className="scroll-mt-32">
                <h2 className="text-3xl font-bold text-[#1a2421] mb-8">API & Desenvolvedores</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-6">
                    A plataforma Daton segue uma abordagem <strong>API-First</strong>. Tudo o que você vê no dashboard está disponível via API.
                  </p>
                  <div className="bg-[#1e293b] rounded-xl p-6 overflow-x-auto text-sm">
                    <code className="text-blue-300">GET</code> <code className="text-gray-300">https://api.daton.app/v1/emissions/summary</code>
                    <pre className="mt-4 text-gray-400 font-mono">
                      {`{
  "company_id": "acc_123456",
  "period": "2024-Q1",
  "total_co2e": 1250.5,
  "scope_breakdown": {
    "scope_1": 450.2,
    "scope_2": 300.0,
    "scope_3": 500.3
  }
}`}
                    </pre>
                  </div>
                  <div className="mt-6">
                    <button className="inline-flex items-center gap-2 text-[#15c470] font-bold hover:underline">
                      Ver Documentação Completa da API <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* FAQ */}
          <section id="faq" className="scroll-mt-32">
            <div className="mb-12">
              <span className="inline-block px-3 py-1 mb-4 text-xs font-mono tracking-widest text-[#15c470] border border-[#15c470]/30 rounded-full uppercase bg-[#15c470]/10">
                Suporte
              </span>
              <h2 className="text-3xl font-bold text-[#1a2421] mb-4">Central de Ajuda</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Encontre respostas para as perguntas mais comuns sobre a plataforma.
              </p>
            </div>

            <div className="space-y-12">
              {FAQ_categories.map((category, catIdx) => (
                <div key={catIdx} className="space-y-6">
                  <h3 className="text-xl font-bold text-[#1a2421] border-b border-[#e5e7eb] pb-2">
                    {category.title}
                  </h3>
                  <div className="space-y-4">
                    {category.items.map((item, idx) => (
                      <FAQItem key={idx} question={item.q} answer={item.a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};


const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#e5e7eb] rounded-xl bg-white overflow-hidden transition-all duration-200 hover:border-[#15c470]/30">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-5 text-left group"
        >
            <span className={`font-medium pr-8 transition-colors ${isOpen ? 'text-[#15c470]' : 'text-[#1a2421] group-hover:text-[#15c470]'}`}>
                {question}
            </span>
            <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#15c470]' : ''}`} 
            />
        </button>
        <motion.div
            initial={false}
            animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
        >
            <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-transparent">
                {answer}
            </div>
        </motion.div>
    </div>
  );
};

export default Documentacao;
