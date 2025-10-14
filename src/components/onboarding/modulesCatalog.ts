import {
  Leaf,
  Shield,
  Users,
  BarChart3,
  FileCheck,
  TrendingUp,
  Award,
  Building,
  Droplet,
  Zap,
  Trash2,
  Sprout,
  Package,
  Lightbulb,
  HeartPulse,
  AlertTriangle,
  Recycle,
  CloudRain,
  MessageSquare
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Module {
  id: string;
  name: string;
  icon: LucideIcon;
  category: string;
}

export const MODULES: Module[] = [
  // Módulos Ambientais
  { id: 'inventario_gee', name: 'Inventário GEE', icon: Leaf, category: 'Ambiental' },
  { id: 'energia', name: 'Energia e Eficiência Energética', icon: Zap, category: 'Ambiental' },
  { id: 'agua', name: 'Gestão de Água e Efluentes', icon: Droplet, category: 'Ambiental' },
  { id: 'residuos', name: 'Gestão de Resíduos', icon: Trash2, category: 'Ambiental' },
  { id: 'biodiversidade', name: 'Biodiversidade e Conservação', icon: Sprout, category: 'Ambiental' },
  { id: 'mudancas_climaticas', name: 'Mudanças Climáticas', icon: CloudRain, category: 'Ambiental' },
  { id: 'economia_circular', name: 'Economia Circular', icon: Recycle, category: 'Ambiental' },
  
  // Módulos Sociais
  { id: 'gestao_pessoas', name: 'Gestão de Pessoas', icon: Users, category: 'Social' },
  { id: 'saude_seguranca', name: 'Saúde e Segurança Ocupacional', icon: HeartPulse, category: 'Social' },
  { id: 'stakeholders', name: 'Engajamento de Stakeholders', icon: MessageSquare, category: 'Social' },
  
  // Módulos de Governança
  { id: 'gestao_licencas', name: 'Licenças Ambientais', icon: Shield, category: 'Governança' },
  { id: 'compliance', name: 'Compliance e Relatórios', icon: Building, category: 'Governança' },
  { id: 'riscos_esg', name: 'Gestão de Riscos ESG', icon: AlertTriangle, category: 'Governança' },
  
  // Módulos de Gestão
  { id: 'qualidade', name: 'Qualidade', icon: Award, category: 'Gestão' },
  { id: 'performance', name: 'Performance', icon: TrendingUp, category: 'Gestão' },
  { id: 'inovacao', name: 'Inovação e P&D', icon: Lightbulb, category: 'Gestão' },
  { id: 'cadeia_suprimentos', name: 'Cadeia de Suprimentos', icon: Package, category: 'Gestão' },
  
  // Módulos de Suporte
  { id: 'documentos', name: 'Documentos', icon: FileCheck, category: 'Suporte' },
  { id: 'analise_dados', name: 'Análise de Dados', icon: BarChart3, category: 'Suporte' }
];

export const MODULE_MAP_BY_ID: Record<string, Module> = MODULES.reduce((acc, module) => {
  acc[module.id] = module;
  return acc;
}, {} as Record<string, Module>);

export function getModuleById(id: string): Module | undefined {
  return MODULE_MAP_BY_ID[id];
}

export function humanizeModuleId(id: string): string {
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validates that all modules in the catalog are properly configured
 * @returns true if all modules are valid
 */
export function validateModuleCatalog(): boolean {
  return MODULES.every(module => {
    const isValid = module.id && module.name && module.icon && module.category;
    if (!isValid) {
      console.error('❌ Módulo inválido no catálogo:', module);
    }
    return isValid;
  });
}
