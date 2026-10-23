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
      "Gestão Ambiental para registrar emissões, resíduos, recursos e requisitos com rastreabilidade.",
    subheadline:
      "Organize inventários, evidências e prazos nos módulos habilitados para sua empresa e seu perfil de acesso.",
  },
  {
    slug: "social",
    label: "Social",
    href: "/social",
    image: "/hero-img-02.png",
    headline:
      "Gestão Social para acompanhar pessoas, competências, treinamentos e comunicação na organização.",
    subheadline:
      "Registre lacunas, turmas, certificados, eficácia e campanhas com histórico e acesso autorizado.",
  },
  {
    slug: "governanca",
    label: "Governança",
    href: "/governanca",
    image: "/hero-img-03.png",
    headline:
      "Gestão de Governança com controle e rastreabilidade para apoiar decisões corporativas.",
    subheadline:
      "Organize riscos, auditorias, indicadores, processos e planos de ação conforme os acessos da sua empresa.",
  },
];

export const ESG_AREA_LINKS = ESG_AREAS.map((area) => ({
  label: area.label,
  href: area.href,
}));

export function getESGAreaBySlug(slug: ESGAreaSlug) {
  return ESG_AREAS.find((area) => area.slug === slug);
}
