import { createCustomEmissionFactor } from './emissionFactors';

interface GHGFactorData {
  name: string;
  category: string;
  source: string;
  activity_unit: string;
  co2_factor?: number;
  ch4_factor?: number;
  n2o_factor?: number;
  year_of_validity: number;
  details_json: Record<string, any>;
}

// Seção 1: Combustão Estacionária - Combustíveis Fósseis
const stationaryCombustionFossil: GHGFactorData[] = [
  {
    name: "Acetileno",
    category: "Combustão Estacionária",
    source: "GHG Protocol Brasil 2025",
    activity_unit: "kg",
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "-",
      definition: "O acetileno é um hidrocarboneto (C₂H₂), gás incolor usado em solda/corte de metais",
      reference: "FISPQ",
      sectors: ["Energia", "Manufactura/Construção", "Comercial/Institucional", "Residencial/Agricultura/Florestal/Pesca"]
    }
  },
  {
    name: "Alcatrão",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "m³",
    co2_factor: 80.667,
    ch4_factor: 1, // Energia
    n2o_factor: 1.5,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Coal Tar",
      pci_gj_t: 35.8,
      density_kg_m3: 1000,
      definition: "Alcatrão obtido na transformação do Carvão Metalúrgico em Coque",
      reference: "BEN 2020",
      ch4_factors: { energia: 1, manufatura: 10, comercial: 10, residencial: 300 },
      n2o_factors: { energia: 1.5, manufatura: 1.5, comercial: 1.5, residencial: 1.5 }
    }
  },
  {
    name: "Asfaltos",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "m³",
    co2_factor: 80.667,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Bitumen",
      pci_gj_t: 41.0,
      density_kg_m3: 1025,
      definition: "Material escuro/sólido derivado de petróleo, mistura de hidrocarbonetos pesados (betumes)",
      reference: "ANP 2012"
    }
  },
  {
    name: "Carvão Metalúrgico Importado",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 94.600,
    ch4_factor: 1,
    n2o_factor: 1.5,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Coking Coal",
      pci_gj_t: 31.0,
      definition: "PCI da CSN; faixa de carvões importados para siderurgia",
      reference: "BEN 2020"
    }
  },
  {
    name: "Carvão Metalúrgico Nacional",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 94.600,
    ch4_factor: 1,
    n2o_factor: 1.5,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Coking Coal",
      pci_gj_t: 26.9,
      definition: "PCI fornecido pela CSN para carvão nacional",
      reference: "BEN 2020"
    }
  },
  {
    name: "Carvão Vapor 3100 kcal/kg",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 101.200,
    ch4_factor: 1,
    n2o_factor: 1.5,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other Bituminous Coal",
      pci_gj_t: 12.4,
      definition: "Carvão nacional com cinzas 20-54%, analisado em CIENTEC/CETEM"
    }
  },
  {
    name: "Carvão Vapor 4200 kcal/kg",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 96.067,
    ch4_factor: 1,
    n2o_factor: 1.5,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other Bituminous Coal",
      pci_gj_t: 16.7,
      definition: "Variação de carvão vapor"
    }
  },
  {
    name: "Carvão Vapor 6000 kcal/kg",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 94.600,
    ch4_factor: 1,
    n2o_factor: 1.5,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other Bituminous Coal",
      pci_gj_t: 23.9,
      definition: "Variação de carvão vapor"
    }
  },
  {
    name: "Coque de Carvão Mineral",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 107.067,
    ch4_factor: 1,
    n2o_factor: 1.5,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Coke Oven Coke and Lignite Coke",
      pci_gj_t: 28.9,
      definition: "PCI teórico via Equação de Dulong de amostragem média",
      reference: "BEN 2020"
    }
  },
  {
    name: "Coque de Petróleo",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "m³",
    co2_factor: 97.533,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Petroleum Coke",
      pci_gj_t: 35.1,
      density_kg_m3: 1040,
      definition: "Produto sólido negro de craqueamento de resíduos pesados, rico em carbono",
      reference: "ANP 2012"
    }
  },
  {
    name: "Etano",
    category: "Combustão Estacionária",
    source: "IPCC 2006",
    activity_unit: "t",
    co2_factor: 61.600,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Ethane",
      pci_gj_t: 46.4,
      definition: "Componente presente no gás de refinaria",
      reference: "ANP 2012"
    }
  },
  {
    name: "Gás de Coqueria",
    category: "Combustão Estacionária",
    source: "IPCC 2006",
    activity_unit: "t",
    co2_factor: 44.367,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Coke Oven Gas",
      pci_gj_t: 38.7,
      reference: "BEN 2020"
    }
  },
  {
    name: "Gás de Refinaria",
    category: "Combustão Estacionária",
    source: "IPCC 2006",
    activity_unit: "t",
    co2_factor: 57.567,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Refinery Gas",
      pci_gj_t: 49.5,
      definition: "Mistura de hidrocarbonetos gasosos produzida no refino de petróleo",
      reference: "ANP 2012"
    }
  },
  {
    name: "Gás Liquefeito de Petróleo (GLP)",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 63.067,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Liquefied Petroleum Gases",
      pci_gj_t: 46.5,
      definition: "Mistura de hidrocarbonetos com alta pressão de vapor do gás natural",
      reference: "ANP 2012",
      notes: "Densidade GLP líquido: 550 kg/m³; gasoso: 2,2 kg/m³"
    }
  },
  {
    name: "Gás Natural Úmido",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "m³",
    co2_factor: 56.100,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Natural Gas",
      pci_gj_t: 49.8,
      density_kg_m3: 0.74,
      definition: "Hidrocarboneto gasoso de reservatórios petrolíferos/gasíferos",
      reference: "ANP 2012"
    }
  },
  {
    name: "Gás Natural Seco",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "m³",
    co2_factor: 56.100,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Natural Gas",
      pci_gj_t: 56.2,
      density_kg_m3: 0.74,
      definition: "Hidrocarboneto gasoso que permanece na fase gasosa",
      reference: "ANP 2012"
    }
  },
  {
    name: "Gasolina Automotiva (comercial)",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "L",
    co2_factor: 69.300,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Motor Gasoline",
      pci_gj_t: 43.5,
      density_kg_l: 0.74,
      definition: "Gasolina(s) especificada(s) pela ANP, exceto aviação/competição",
      reference: "ANP 2012"
    }
  },
  {
    name: "Gasolina de Aviação",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "L",
    co2_factor: 70.033,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Aviation Gasoline",
      pci_gj_t: 44.4,
      density_kg_l: 0.73,
      definition: "Derivada de petróleo para motores de ignição por centelha em aeronaves",
      reference: "ANP 2012"
    }
  },
  {
    name: "Nafta",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "m³",
    co2_factor: 73.333,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Naphtha",
      pci_gj_t: 44.5,
      density_kg_m3: 702,
      definition: "Derivado de petróleo para petroquímica ou energia",
      reference: "ANP 2012"
    }
  },
  {
    name: "Óleo Combustível",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "L",
    co2_factor: 77.367,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Residual Fuel Oil",
      pci_gj_t: 40.2,
      density_kg_l: 1,
      definition: "Óleos residuais de alta viscosidade do refino",
      reference: "ANP 2012"
    }
  },
  {
    name: "Óleo Diesel (puro)",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "L",
    co2_factor: 74.067,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Diesel Oil",
      pci_gj_t: 42.3,
      density_kg_l: 0.840,
      definition: "Combustível para motores diesel rodoviário, sem biodiesel",
      reference: "ANP 2012"
    }
  },
  {
    name: "Querosene de Aviação",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 71.500,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Jet Kerosene",
      pci_gj_t: 43.5,
      definition: "Derivado de petróleo para turbinas de aeronaves",
      reference: "ANP 2012"
    }
  },
  {
    name: "Querosene Iluminante",
    category: "Combustão Estacionária",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 71.867,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other Kerosene",
      pci_gj_t: 43.5,
      definition: "Usado como solvente/combustível de lamparinas",
      reference: "ANP 2012"
    }
  }
];

// Seção 2: Biomassa como Combustível
const biomassFuels: GHGFactorData[] = [
  {
    name: "Etanol Anidro",
    category: "Biomassa",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "L",
    co2_factor: 70.767,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other Liquid Biofuels",
      pci_gj_t: 28.3,
      density_kg_l: 0.791,
      definition: "Etanol anidro para mistura com gasolina C (ANP)",
      reference: "ANP 2012"
    }
  },
  {
    name: "Etanol Hidratado",
    category: "Biomassa",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "L",
    co2_factor: 70.767,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other Liquid Biofuels",
      pci_gj_t: 26.4,
      density_kg_l: 0.809,
      definition: "Etanol hidratado para consumidor final (ANP)",
      reference: "ANP 2012"
    }
  },
  {
    name: "Bagaço de Cana",
    category: "Biomassa",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 100.100,
    ch4_factor: 30,
    n2o_factor: 4,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other Primary Solid Biomass",
      pci_gj_t: 8.9,
      definition: "PCI calculado pelo IAA",
      reference: "BEN 2020"
    }
  },
  {
    name: "Biodiesel (B100)",
    category: "Biomassa",
    source: "IPCC 2006, BEN 2023",
    activity_unit: "L",
    co2_factor: 74.067,
    ch4_factor: 3,
    n2o_factor: 0.6,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Biodiesels",
      pci_gj_t: 37.7,
      density_kg_l: 0.880,
      definition: "Alquilésteres de ácidos graxos (transesterificação, ANP)",
      reference: "ANP 2012"
    }
  },
  {
    name: "Biogás (outros)",
    category: "Biomassa",
    source: "IPCC 2006, DEFRA 2023",
    activity_unit: "t",
    co2_factor: 85.271,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other biogas",
      pci_gj_t: 20.0,
      definition: "Gás bruto de decomposição orgânica",
      reference: "ANP 2015"
    }
  },
  {
    name: "Biogás de Aterro",
    category: "Biomassa",
    source: "IPCC 2006, DEFRA 2023",
    activity_unit: "t",
    co2_factor: 119.241,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Landfill biogas",
      pci_gj_t: 12.3,
      definition: "Biogás de aterros sanitários",
      reference: "ANP 2015"
    }
  },
  {
    name: "Biometano",
    category: "Biomassa",
    source: "IPCC 2006, DEFRA 2023",
    activity_unit: "t",
    co2_factor: 56.100,
    ch4_factor: 1,
    n2o_factor: 0.1,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Other biogas",
      pci_gj_t: 49.0,
      definition: "Biocombustível gasoso de purificação de biogás",
      reference: "ANP 2015"
    }
  },
  {
    name: "Carvão Vegetal",
    category: "Biomassa",
    source: "MCTIC 2016, BEN 2023",
    activity_unit: "t",
    co2_factor: 106.700,
    ch4_factor: 200,
    n2o_factor: 4,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Charcoal",
      pci_gj_t: 27.0,
      definition: "PCI de pesquisas em siderúrgicas",
      reference: "BEN 2020"
    }
  },
  {
    name: "Lenha Comercial",
    category: "Biomassa",
    source: "IPCC 2006, BEN 2023",
    activity_unit: "t",
    co2_factor: 111.833,
    ch4_factor: 30,
    n2o_factor: 4,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Wood / Wood Waste",
      pci_gj_t: 13.0,
      definition: "Madeira/resíduos queimados diretamente para energia",
      reference: "BEN 2022"
    }
  },
  {
    name: "Licor Negro (Lixívia)",
    category: "Biomassa",
    source: "IPCC 2006, BEN 2023",
    activity_unit: "t",
    co2_factor: 95.333,
    ch4_factor: 3,
    n2o_factor: 2,
    year_of_validity: 2025,
    details_json: {
      ipcc_code: "Sulphite lyes (Black Liquor)",
      pci_gj_t: 12.0,
      definition: "PCI adotado pela BRACELPA",
      reference: "BEN 2020"
    }
  }
];

// Seção 3: Transporte - Combustíveis Fósseis para Fontes Móveis
const mobileTransportFossil: GHGFactorData[] = [
  {
    name: "Gasolina Automotiva (comercial) - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "L",
    co2_factor: 2212, // kg CO2/TJ convertido para kg/L
    ch4_factor: 0.8, // g/L convertido para kg/L
    n2o_factor: 0.26,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 10400,
      density_kg_l: 0.742,
      co2_kg_l: 2.212,
      ch4_g_l: 0.8,
      n2o_g_l: 0.26,
      usage: "transport"
    }
  },
  {
    name: "Óleo Diesel (comercial) - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "L",
    co2_factor: 2603,
    ch4_factor: 0.1,
    n2o_factor: 0.14,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 10100,
      density_kg_l: 0.840,
      co2_kg_l: 2.603,
      ch4_g_l: 0.1,
      n2o_g_l: 0.14,
      usage: "transport"
    }
  },
  {
    name: "Gás Natural - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "m³",
    co2_factor: 1999,
    ch4_factor: 3.4,
    n2o_factor: 0.11,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 8800,
      co2_kg_m3: 1.999,
      ch4_g_m3: 3.4,
      n2o_g_m3: 0.11,
      usage: "transport"
    }
  },
  {
    name: "GLP - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "kg",
    co2_factor: 2932,
    ch4_factor: 2.9,
    n2o_factor: 0.01,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 11100,
      co2_kg_kg: 2.932,
      ch4_g_kg: 2.9,
      n2o_g_kg: 0.01,
      usage: "transport"
    }
  },
  {
    name: "Querosene de Aviação - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "L",
    co2_factor: 2517,
    ch4_factor: 0.0,
    n2o_factor: 0.07,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 10400,
      density_kg_l: 0.799,
      co2_kg_l: 2.517,
      ch4_g_l: 0.0,
      n2o_g_l: 0.07,
      usage: "aviation"
    }
  }
];

// Seção 3: Transporte - Biocombustíveis para Fontes Móveis
const mobileTransportBio: GHGFactorData[] = [
  {
    name: "Etanol Hidratado - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "L",
    co2_factor: 1457,
    ch4_factor: 0.4,
    n2o_factor: 0.01,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 6300,
      density_kg_l: 0.809,
      co2_kg_l: 1.457,
      ch4_g_l: 0.4,
      n2o_g_l: 0.01,
      usage: "transport",
      fuel_type: "biofuel"
    }
  },
  {
    name: "Biodiesel - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "L",
    co2_factor: 2431,
    ch4_factor: 0.3,
    n2o_factor: 0.02,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 9000,
      density_kg_l: 0.880,
      co2_kg_l: 2.431,
      ch4_g_l: 0.3,
      n2o_g_l: 0.02,
      usage: "transport",
      fuel_type: "biofuel"
    }
  },
  {
    name: "Biometano - Transporte",
    category: "Combustão Móvel",
    source: "DEFRA 2024",
    activity_unit: "m³",
    co2_factor: 1993,
    ch4_factor: 3.3,
    n2o_factor: 0.11,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 8485,
      co2_kg_m3: 1.993,
      ch4_g_m3: 3.3,
      n2o_g_m3: 0.11,
      usage: "transport",
      fuel_type: "biofuel"
    }
  },
  {
    name: "Etanol Anidro - Transporte",
    category: "Combustão Móvel",
    source: "BEN 2023",
    activity_unit: "L",
    co2_factor: 1526,
    ch4_factor: 0.2,
    n2o_factor: 0.01,
    year_of_validity: 2025,
    details_json: {
      pci_kcal_kg: 6750,
      density_kg_l: 0.791,
      co2_kg_l: 1.526,
      ch4_g_l: 0.2,
      n2o_g_l: 0.01,
      usage: "transport",
      fuel_type: "biofuel"
    }
  }
];

// Fatores por Tipo de Veículo (exemplos representativos)
const vehicleSpecificFactors: GHGFactorData[] = [
  {
    name: "Automóvel a Gasolina - CH4/N2O",
    category: "Fatores Veiculares",
    source: "CETESB 2023",
    activity_unit: "km",
    ch4_factor: 0.003, // g/km convertido para kg/km
    n2o_factor: 0.0000,
    year_of_validity: 2024,
    details_json: {
      vehicle_type: "automobile",
      fuel_type: "gasoline",
      ch4_g_km: 0.003,
      n2o_g_km: 0.0000,
      consumption_km_l: 13.1
    }
  },
  {
    name: "Motocicleta a Gasolina - CH4/N2O",
    category: "Fatores Veiculares",
    source: "CETESB 2023",
    activity_unit: "km",
    ch4_factor: 0.026,
    n2o_factor: 0.0015,
    year_of_validity: 2024,
    details_json: {
      vehicle_type: "motorcycle",
      fuel_type: "gasoline",
      ch4_g_km: 0.026,
      n2o_g_km: 0.0015,
      consumption_km_l: 57.1
    }
  },
  {
    name: "Ônibus Urbano a Diesel - CH4/N2O",
    category: "Fatores Veiculares",
    source: "CETESB 2023",
    activity_unit: "km",
    ch4_factor: 0.060,
    n2o_factor: 0.0001,
    year_of_validity: 2024,
    details_json: {
      vehicle_type: "urban_bus",
      fuel_type: "diesel",
      ch4_g_km: 0.060,
      n2o_g_km: 0.0001,
      consumption_km_l: 2.1
    }
  },
  {
    name: "Caminhão Articulado (>33t) - CH4/N2O",
    category: "Fatores Veiculares",
    source: "CETESB 2023",
    activity_unit: "km",
    ch4_factor: 0.005,
    n2o_factor: 0.0001,
    year_of_validity: 2024,
    details_json: {
      vehicle_type: "articulated_truck",
      fuel_type: "diesel",
      ch4_g_km: 0.005,
      n2o_g_km: 0.0001,
      weight_category: ">33t"
    }
  }
];

// GWP - Potencial de Aquecimento Global
const gwpFactors: GHGFactorData[] = [
  {
    name: "Dióxido de carbono (CO₂)",
    category: "GWP",
    source: "IPCC 2013",
    activity_unit: "kg",
    co2_factor: 1,
    year_of_validity: 2025,
    details_json: {
      gas_family: "CO2",
      gwp_100_years: 1,
      reference: "IPCC AR5"
    }
  },
  {
    name: "Metano (CH₄)",
    category: "GWP", 
    source: "IPCC 2013",
    activity_unit: "kg",
    co2_factor: 28, // GWP convertido para CO2 equivalente
    year_of_validity: 2025,
    details_json: {
      gas_family: "CH4",
      gwp_100_years: 28,
      reference: "IPCC AR5"
    }
  },
  {
    name: "Óxido nitroso (N₂O)",
    category: "GWP",
    source: "IPCC 2013", 
    activity_unit: "kg",
    co2_factor: 265,
    year_of_validity: 2025,
    details_json: {
      gas_family: "N2O",
      gwp_100_years: 265,
      reference: "IPCC AR5"
    }
  },
  {
    name: "HFC-23",
    category: "GWP",
    source: "IPCC 2013",
    activity_unit: "kg",
    co2_factor: 12400,
    year_of_validity: 2025,
    details_json: {
      gas_family: "HFC",
      gwp_100_years: 12400,
      reference: "IPCC AR5"
    }
  },
  {
    name: "HFC-32",
    category: "GWP",
    source: "IPCC 2013",
    activity_unit: "kg", 
    co2_factor: 677,
    year_of_validity: 2025,
    details_json: {
      gas_family: "HFC",
      gwp_100_years: 677,
      reference: "IPCC AR5"
    }
  },
  {
    name: "SF₆ (Hexafluoreto de Enxofre)",
    category: "GWP",
    source: "IPCC 2013",
    activity_unit: "kg",
    co2_factor: 23500,
    year_of_validity: 2025,
    details_json: {
      gas_family: "SF6",
      gwp_100_years: 23500,
      reference: "IPCC AR5"
    }
  }
];

// Combinar todos os fatores
const allGHGFactors = [
  ...stationaryCombustionFossil,
  ...biomassFuels,
  ...mobileTransportFossil,
  ...mobileTransportBio,
  ...vehicleSpecificFactors,
  ...gwpFactors
];

export async function importGHGProtocol2025(): Promise<{
  success: number;
  errors: number;
  message: string;
  details: { section: string; count: number; errors: string[] }[];
}> {
  let totalSuccess = 0;
  let totalErrors = 0;
  const importDetails: { section: string; count: number; errors: string[] }[] = [];

  const sections = [
    { name: "Combustão Estacionária - Fósseis", data: stationaryCombustionFossil },
    { name: "Biomassa", data: biomassFuels },
    { name: "Transporte Móvel - Fósseis", data: mobileTransportFossil },
    { name: "Transporte Móvel - Biocombustíveis", data: mobileTransportBio },
    { name: "Fatores Veiculares", data: vehicleSpecificFactors },
    { name: "GWP - Potencial de Aquecimento Global", data: gwpFactors }
  ];

  for (const section of sections) {
    let sectionSuccess = 0;
    const sectionErrors: string[] = [];

    console.log(`Importando seção: ${section.name} (${section.data.length} fatores)`);

    for (const factor of section.data) {
      try {
        await createCustomEmissionFactor({
          name: factor.name,
          category: factor.category,
          source: factor.source,
          activity_unit: factor.activity_unit,
          co2_factor: factor.co2_factor,
          ch4_factor: factor.ch4_factor,
          n2o_factor: factor.n2o_factor,
          year_of_validity: factor.year_of_validity,
          details_json: factor.details_json
        });
        sectionSuccess++;
      } catch (error) {
        console.error(`Erro ao importar ${factor.name}:`, error);
        sectionErrors.push(`${factor.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    totalSuccess += sectionSuccess;
    totalErrors += sectionErrors.length;
    
    importDetails.push({
      section: section.name,
      count: sectionSuccess,
      errors: sectionErrors
    });
  }

  const message = `Importação GHG Protocol 2025 concluída: ${totalSuccess} fatores importados com sucesso, ${totalErrors} erros`;
  
  return {
    success: totalSuccess,
    errors: totalErrors,
    message,
    details: importDetails
  };
}