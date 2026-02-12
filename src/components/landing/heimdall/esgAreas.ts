import heroImg01 from '@/assets/hero-floresta.png';

export type ESGAreaSlug = "ambiental" | "social" | "governanca";

export interface ESGAreaDefinition {
  slug: ESGAreaSlug;
  label: string;
  href: string;
  image: string;
  headline: string;
  subheadline: string;
}

export const ESG_AREAS: ESGAreaDefinition[] = [
  {
    slug: "ambiental",
    label: "Ambiental",
    href: "/ambiental",
    image: heroImg01,
    headline:
      "Gestão Ambiental em tempo real para monitorar emissões, resíduos e indicadores críticos com precisão.",
    subheadline:
      "Automatize conformidade, reduza riscos ambientais e acelere decisões sustentáveis com dados confiáveis.",
  },
  {
    slug: "social",
    label: "Social",
    href: "/social",
    image: "/hero-img-02.png",
    headline:
      "Gestão Social focada em pessoas, segurança e desenvolvimento para fortalecer a cultura da organização.",
    subheadline:
      "Acompanhe saúde ocupacional, diversidade, treinamentos e impacto social em um painel único.",
  },
  {
    slug: "governanca",
    label: "Governança",
    href: "/governanca",
    image: "/hero-img-03.png",
    headline:
      "Gestão de Governança com controle, rastreabilidade e inteligência para decisões corporativas sólidas.",
    subheadline:
      "Centralize políticas, auditorias, riscos e compliance para elevar transparência e confiança institucional.",
  },
];

export const ESG_AREA_LINKS = ESG_AREAS.map((area) => ({
  label: area.label,
  href: area.href,
}));

export function getESGAreaBySlug(slug: ESGAreaSlug) {
  return ESG_AREAS.find((area) => area.slug === slug);
}
