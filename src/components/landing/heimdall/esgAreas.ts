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
      "Transforme dados ambientais em controle: monitore recursos, emissões, resíduos, prazos e metas com fontes rastreáveis.",
    subheadline:
      "Consolide inventários, cálculos, alertas, projetos de compensação e relatos ESG em uma gestão conectada.",
  },
  {
    slug: "social",
    label: "Social",
    href: "/social",
    image: "/hero-img-02.png",
    headline:
      "Desenvolva equipes com competências, PDI, aprendizagem e comunicação conectados.",
    subheadline:
      "Planeje capacitações, acompanhe eficácia e preserve o histórico do desenvolvimento.",
  },
  {
    slug: "governanca",
    label: "Governança",
    href: "/governanca",
    image: "/hero-img-03.png",
    headline:
      "Conecte estratégia, riscos, indicadores, reuniões e decisões em uma gestão rastreável.",
    subheadline:
      "Reúna pautas, atas e ações em análises críticas com fontes, responsáveis e prazos.",
  },
];

export const ESG_AREA_LINKS = ESG_AREAS.map((area) => ({
  label: area.label,
  href: area.href,
}));

export function getESGAreaBySlug(slug: ESGAreaSlug) {
  return ESG_AREAS.find((area) => area.slug === slug);
}
