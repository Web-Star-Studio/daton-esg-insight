import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeimdallNavbar } from "@/components/landing/heimdall/HeimdallNavbar";
import { PublicFooter } from "@/components/landing/heimdall/PublicFooter";
import {
  ESG_AREA_LINKS,
  ESGAreaSlug,
  getESGAreaBySlug,
} from "@/components/landing/heimdall/esgAreas";

interface ModuleCard {
  title: string;
  description: string;
  items: string[];
}

interface ESGAreaContent {
  eyebrow: string;
  sectionTitle: string;
  sectionDescription: string;
  modules: ModuleCard[];
}

const AREA_CONTENT: Record<ESGAreaSlug, ESGAreaContent> = {
  ambiental: {
    eyebrow: "Ambiental",
    sectionTitle: "Operação Ambiental com controle contínuo",
    sectionDescription:
      "Registre dados ambientais, evidências e prazos com rastreabilidade. Os recursos disponíveis variam conforme os módulos habilitados e as permissões da empresa.",
    modules: [
      {
        title: "Emissões GEE",
        description: "Gestão de escopos 1, 2 e 3 com rastreabilidade de cálculo.",
        items: [
          "Inventário por filial e fonte de emissão",
          "Fatores versionados com fonte declarada",
          "Totais por escopo e exportação em CSV",
        ],
      },
      {
        title: "Resíduos e Destinação",
        description:
          "Rastreamento ponta a ponta da geração até a destinação final.",
        items: [
          "Controle por tipo e classe",
          "Documentos MTR e CDF",
          "Histórico de movimentações e destinação",
        ],
      },
      {
        title: "Licenças e Condicionantes",
        description:
          "Visibilidade de prazos, renovações e riscos de não conformidade.",
        items: [
          "Cadastro de licenças e condicionantes",
          "Prazos e situação de atendimento",
          "Obrigações recorrentes e evidências",
        ],
      },
    ],
  },
  social: {
    eyebrow: "Social",
    sectionTitle: "Gestão Social orientada a pessoas e desempenho",
    sectionDescription:
      "Acompanhe pessoas, competências, capacitação e comunicação com registros preservados. Os recursos disponíveis variam conforme os módulos habilitados e as permissões da empresa.",
    modules: [
      {
        title: "Pessoas e Competências",
        description:
          "Cadastros de colaboradores, cargos e competências requeridas.",
        items: [
          "Competências exigidas por cargo",
          "Identificação de lacunas de competência",
          "Histórico de alterações do colaborador",
        ],
      },
      {
        title: "Treinamentos",
        description:
          "Planejamento e registro de capacitações com avaliação de eficácia.",
        items: [
          "Turmas, participantes e conclusões",
          "Certificados com dados da conclusão",
          "Avaliação versionada de eficácia",
        ],
      },
      {
        title: "Comunicação e Engajamento",
        description:
          "Campanhas internas para informar, consultar e registrar ciência.",
        items: [
          "Público definido por regras",
          "Visualização e ciência registradas",
          "Consultas identificadas ou anônimas",
        ],
      },
    ],
  },
  governanca: {
    eyebrow: "Governança",
    sectionTitle: "Governança com visibilidade executiva e execução disciplinada",
    sectionDescription:
      "Conecte planejamento, riscos, indicadores e auditorias com rastreabilidade. Os recursos disponíveis variam conforme os módulos habilitados e as permissões da empresa.",
    modules: [
      {
        title: "Riscos e Controles",
        description:
          "Gestão estruturada de riscos operacionais e estratégicos.",
        items: [
          "Cadastro e avaliação de riscos e oportunidades",
          "Planos de tratamento com responsáveis",
          "Vínculos com projetos e planos de ação",
        ],
      },
      {
        title: "Auditorias e Conformidade",
        description:
          "Registros de auditoria, constatações e requisitos de conformidade.",
        items: [
          "Programas e registros de auditoria",
          "Constatações ligadas a não conformidades",
          "Licenças, requisitos e obrigações",
        ],
      },
      {
        title: "Planejamento e Indicadores",
        description:
          "Acompanhamento da estratégia com SWOT, processos e indicadores.",
        items: [
          "Análise SWOT e objetivos estratégicos",
          "Indicadores, metas e lançamentos",
          "Processos e análise crítica",
        ],
      },
    ],
  },
};

interface ESGAreaTemplateProps {
  areaSlug: ESGAreaSlug;
}

export function ESGAreaTemplate({ areaSlug }: ESGAreaTemplateProps) {
  const navigate = useNavigate();
  const area = getESGAreaBySlug(areaSlug);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const actionBarRef = useRef<HTMLDivElement>(null);

  const areaContent = AREA_CONTENT[areaSlug];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!quickMenuOpen) return;
      const target = event.target as Node;
      if (actionBarRef.current && !actionBarRef.current.contains(target)) {
        setQuickMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuickMenuOpen(false);
      }
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

  if (!area) return null;

  return (
    <div className="min-h-screen bg-[#edf4ef] text-[#10261b]">
      <HeimdallNavbar />

      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          padding: "120px 2rem 80px",
        }}
      >
        <img
          src={area.image}
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
              "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.24) 45%, rgba(0,0,0,0.52) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "10vh",
            left: "max(4vw, 2rem)",
            maxWidth: "740px",
            zIndex: 10,
            color: "#ffffff",
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
            {areaContent.eyebrow}
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.8rem, 4.2vw, 3.8rem)",
              lineHeight: 1.1,
              fontWeight: 650,
              letterSpacing: "-0.02em",
            }}
          >
            {area.headline}
          </h1>
          <p
            style={{
              marginTop: "0.85rem",
              marginBottom: 0,
              fontSize: "clamp(0.95rem, 1.25vw, 1.2rem)",
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.9)",
              maxWidth: "680px",
            }}
          >
            {area.subheadline}
          </p>
        </div>

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
                style={{ width: "100%", overflow: "hidden" }}
              >
                <nav
                  style={{
                    display: "grid",
                    gap: "0.15rem",
                    padding: "0.35rem 0.35rem 0.2rem",
                  }}
                >
                  {ESG_AREA_LINKS.map((link) => (
                    <motion.button
                      key={link.href}
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

          <div
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

            <Button
              onClick={() => navigate("/contato")}
              className="rounded-xl bg-[#c4fca1] text-black hover:bg-[#b3ef8d]"
            >
              Falar com especialista
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto -mt-1 w-full max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
        <section className="rounded-[1.8rem] border border-[#d2e1d8] bg-white p-6 shadow-[0_16px_42px_rgba(14,34,24,0.08)] md:p-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-[#12261c] md:text-4xl">
              {areaContent.sectionTitle}
            </h2>
            <p className="mt-3 text-[#4a6558]">{areaContent.sectionDescription}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {areaContent.modules.map((module) => (
              <motion.article
                key={module.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl border border-[#d8e6de] bg-[#f7fbf8] p-5"
              >
                <h3 className="text-lg font-semibold text-[#132a20]">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm text-[#4d685a]">{module.description}</p>

                <ul className="mt-4 space-y-2">
                  {module.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-[#2a4338]"
                    >
                      <CheckCircle2 className="mt-[2px] h-4 w-4 text-[#40b96f]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/contato">
              <Button className="rounded-xl bg-[#12261c] text-white hover:bg-[#1a3226]">
                Agendar demonstração
              </Button>
            </Link>
            <Link to="/landing">
              <Button
                variant="outline"
                className="rounded-xl border-[#cfe2d5] text-[#1f3a2f] hover:bg-[#eff6f1]"
              >
                Voltar para landing
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
