import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "./modulesCatalog";

interface CleanModuleSelectionStepProps {
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  companyProfile?: any;
}


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
        <div className="space-y-3 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Selecione os Módulos</h2>
          <p className="text-sm text-muted-foreground">
            Escolha os módulos que melhor atendem às necessidades da sua empresa
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index} 
                className={`h-1 rounded-full transition-all ${
                  index === 1 ? 'w-6 bg-primary' : 
                  index < 1 ? 'w-4 bg-primary/40' : 
                  'w-4 bg-muted'
                }`} 
              />
            ))}
          </div>
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
