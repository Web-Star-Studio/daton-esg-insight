// Original-resolution fallbacks are kept; smaller screens can request lighter variants.
import hero_img_02_960 from "@/assets/responsive/hero-img-02-960.webp.asset.json";
import hero_img_02_1440 from "@/assets/responsive/hero-img-02-1440.webp.asset.json";
import hero_img_03_960 from "@/assets/responsive/hero-img-03-960.webp.asset.json";
import hero_img_03_1440 from "@/assets/responsive/hero-img-03-1440.webp.asset.json";
import hero_floresta_960 from "@/assets/responsive/hero-floresta-960.webp.asset.json";
import hero_floresta_1440 from "@/assets/responsive/hero-floresta-1440.webp.asset.json";
import esg_ambiental_hero_960 from "@/assets/responsive/esg-ambiental-hero-960.webp.asset.json";
import esg_ambiental_hero_1440 from "@/assets/responsive/esg-ambiental-hero-1440.webp.asset.json";
import esg_social_card_960 from "@/assets/responsive/esg-social-card-960.webp.asset.json";
import esg_quality_card_960 from "@/assets/responsive/esg-quality-card-960.webp.asset.json";
import esg_quality_card_1440 from "@/assets/responsive/esg-quality-card-1440.webp.asset.json";
import esg_suppliers_card_960 from "@/assets/responsive/esg-suppliers-card-960.webp.asset.json";
import esg_suppliers_card_1440 from "@/assets/responsive/esg-suppliers-card-1440.webp.asset.json";
import esg_ai_card_960 from "@/assets/responsive/esg-ai-card-960.webp.asset.json";
import esg_ai_card_1440 from "@/assets/responsive/esg-ai-card-1440.webp.asset.json";
import sobre_nos_hero_960 from "@/assets/responsive/sobre-nos-hero-960.webp.asset.json";
import sobre_nos_hero_1440 from "@/assets/responsive/sobre-nos-hero-1440.webp.asset.json";
import pilares_esg_960 from "@/assets/responsive/pilares-esg-960.webp.asset.json";
import esg_soberania_960 from "@/assets/responsive/esg-soberania-960.webp.asset.json";
import docs_hero_960 from "@/assets/responsive/docs-hero-960.webp.asset.json";
import docs_hero_1440 from "@/assets/responsive/docs-hero-1440.webp.asset.json";
import docs_hero from "@/assets/docs-hero.webp";
import esg_ai_card from "@/assets/esg-ai-card.webp";
import esg_ambiental_hero from "@/assets/esg-ambiental-hero.webp";
import esg_quality_card from "@/assets/esg-quality-card.webp";
import esg_soberania from "@/assets/esg-soberania.webp";
import esg_social_card from "@/assets/esg-social-card.webp";
import esg_suppliers_card from "@/assets/esg-suppliers-card.webp";
import hero_floresta from "@/assets/hero-floresta.webp";
import pilares_esg from "@/assets/pilares-esg.webp";
import sobre_nos_hero from "@/assets/sobre-nos-hero.webp";

interface ImageSource {
  srcSet: string;
  width: number;
  height: number;
}

const imageSources: Record<string, ImageSource> = {
  ["/hero-img-02.webp"]: {
    srcSet: `${hero_img_02_960.url} 960w, ${hero_img_02_1440.url} 1440w, ${"/hero-img-02.webp"} 2816w`,
    width: 2816,
    height: 1329,
  },
  ["/hero-img-03.webp"]: {
    srcSet: `${hero_img_03_960.url} 960w, ${hero_img_03_1440.url} 1440w, ${"/hero-img-03.webp"} 2816w`,
    width: 2816,
    height: 1346,
  },
  [docs_hero]: {
    srcSet: `${docs_hero_960.url} 960w, ${docs_hero_1440.url} 1440w, ${docs_hero} 1920w`,
    width: 1920,
    height: 1080,
  },
  [esg_ai_card]: {
    srcSet: `${esg_ai_card_960.url} 960w, ${esg_ai_card_1440.url} 1440w, ${esg_ai_card} 1920w`,
    width: 1920,
    height: 1080,
  },
  [esg_ambiental_hero]: {
    srcSet: `${esg_ambiental_hero_960.url} 960w, ${esg_ambiental_hero_1440.url} 1440w, ${esg_ambiental_hero} 1920w`,
    width: 1920,
    height: 1025,
  },
  [esg_quality_card]: {
    srcSet: `${esg_quality_card_960.url} 960w, ${esg_quality_card_1440.url} 1440w, ${esg_quality_card} 1920w`,
    width: 1920,
    height: 1079,
  },
  [esg_soberania]: {
    srcSet: `${esg_soberania_960.url} 960w, ${esg_soberania} 1536w`,
    width: 1536,
    height: 1536,
  },
  [esg_social_card]: {
    srcSet: `${esg_social_card_960.url} 960w, ${esg_social_card} 1819w`,
    width: 1819,
    height: 1023,
  },
  [esg_suppliers_card]: {
    srcSet: `${esg_suppliers_card_960.url} 960w, ${esg_suppliers_card_1440.url} 1440w, ${esg_suppliers_card} 1920w`,
    width: 1920,
    height: 1079,
  },
  [hero_floresta]: {
    srcSet: `${hero_floresta_960.url} 960w, ${hero_floresta_1440.url} 1440w, ${hero_floresta} 1824w`,
    width: 1824,
    height: 994,
  },
  [pilares_esg]: {
    srcSet: `${pilares_esg_960.url} 960w, ${pilares_esg} 1459w`,
    width: 1459,
    height: 1459,
  },
  [sobre_nos_hero]: {
    srcSet: `${sobre_nos_hero_960.url} 960w, ${sobre_nos_hero_1440.url} 1440w, ${sobre_nos_hero} 1920w`,
    width: 1920,
    height: 1047,
  },
};

export function responsiveImageProps(src: string, sizes = "100vw"): Partial<ImageSource> & { sizes?: string } {
  const source = imageSources[src];
  return source ? { ...source, sizes } : {};
}
