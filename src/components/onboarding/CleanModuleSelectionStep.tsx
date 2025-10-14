import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface CleanModuleSelectionStepProps {
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  companyProfile?: any;
}

const MODULES = [
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

export function CleanModuleSelectionStep({ 
  selectedModules, 
  onModulesChange, 
  onNext, 
  onPrev
}: CleanModuleSelectionStepProps) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  const handleModuleToggle = (moduleId: string) => {
    const isSelected = selectedModules.includes(moduleId);
    if (isSelected) {
      onModulesChange(selectedModules.filter(id => id !== moduleId));
    } else {
      onModulesChange([...selectedModules, moduleId]);
    }
  };

  const categories = Array.from(new Set(MODULES.map(m => m.category)));
  const filteredModules = filterCategory 
    ? MODULES.filter(m => m.category === filterCategory)
    : MODULES;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Ambiental': 'text-green-600 bg-green-50 border-green-200',
      'Social': 'text-blue-600 bg-blue-50 border-blue-200',
      'Governança': 'text-purple-600 bg-purple-50 border-purple-200',
      'Gestão': 'text-orange-600 bg-orange-50 border-orange-200',
      'Suporte': 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[category] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Etapa 2 de 4</p>
          <h2 className="text-xl font-semibold tracking-tight">Selecione os Módulos</h2>
          <p className="text-sm text-muted-foreground">
            Escolha os módulos que melhor atendem às necessidades da sua empresa
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={filterCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(null)}
            className="text-xs"
          >
            Todos ({MODULES.length})
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(category)}
              className="text-xs"
            >
              {category} ({MODULES.filter(m => m.category === category).length})
            </Button>
          ))}
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
          {filteredModules.map((module) => (
            <label
              key={module.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                selectedModules.includes(module.id)
                  ? 'bg-primary/5 border-primary'
                  : 'bg-card border-border hover:border-primary/30 hover:bg-accent/30'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(module.id)}
                onChange={() => handleModuleToggle(module.id)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <module.icon className={`h-4 w-4 ${
                selectedModules.includes(module.id) ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{module.name}</div>
                <Badge variant="outline" className={`text-[9px] mt-0.5 ${getCategoryColor(module.category)}`}>
                  {module.category}
                </Badge>
              </div>
            </label>
          ))}
        </div>

        {/* Selected Count */}
        {selectedModules.length > 0 && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {selectedModules.length} módulo{selectedModules.length !== 1 ? 's' : ''} selecionado{selectedModules.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onPrev}
            variant="outline"
            className="flex-1 h-11"
          >
            Voltar
          </Button>
          <Button
            onClick={onNext}
            disabled={selectedModules.length === 0}
            className="flex-1 h-11"
          >
            Avançar
          </Button>
        </div>
      </div>
    </div>
  );
}
