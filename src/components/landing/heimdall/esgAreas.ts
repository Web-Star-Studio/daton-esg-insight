import heroImg01 from '@/assets/hero-floresta.webp';

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
      "Gestão ambiental para antecipar riscos e avançar nas metas.",
    subheadline:
      "Controle emissões, resíduos, recursos e licenças. Transforme dados em ações e relatos ESG.",
  },
  {
    slug: "social",
    label: "Social",
    href: "/social",
    image: "/hero-img-02.png",
    headline:
      "Desenvolva pessoas e fortaleça o desempenho da sua equipe.",
    subheadline:
      "Conecte competências, PDI, treinamentos e comunicação para acompanhar a evolução da equipe.",
  },
  {
    slug: "governanca",
    label: "Governança",
    href: "/governanca",
    image: "/hero-img-03.png",
    headline:
      "Tire a estratégia do papel e transforme decisões em ação.",
    subheadline:
      "Antecipe riscos e conecte indicadores, reuniões e planos de ação.",
  },
];

export const ESG_AREA_LINKS = ESG_AREAS.map((area) => ({
  label: area.label,
  href: area.href,
}));

export function getESGAreaBySlug(slug: ESGAreaSlug) {
  return ESG_AREAS.find((area) => area.slug === slug);
}
