import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Leaf, 
  Shield, 
  Users, 
  BarChart3, 
  FileCheck, 
  TrendingUp, 
  Award, 
  Building,
  ArrowLeft
} from "lucide-react";

interface CleanModuleSelectionStepProps {
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  companyProfile?: any;
}

const MODULES = [
  { id: 'inventario_gee', name: 'Inventário GEE', icon: Leaf },
  { id: 'gestao_licencas', name: 'Licenças Ambientais', icon: Shield },
  { id: 'gestao_pessoas', name: 'Gestão de Pessoas', icon: Users },
  { id: 'qualidade', name: 'Qualidade', icon: Award },
  { id: 'performance', name: 'Performance', icon: TrendingUp },
  { id: 'documentos', name: 'Documentos', icon: FileCheck },
  { id: 'analise_dados', name: 'Análise de Dados', icon: BarChart3 },
  { id: 'compliance', name: 'Compliance', icon: Building }
];

export function CleanModuleSelectionStep({ 
  selectedModules, 
  onModulesChange, 
  onNext, 
  onPrev
}: CleanModuleSelectionStepProps) {
  
  const handleModuleToggle = (moduleId: string) => {
    const isSelected = selectedModules.includes(moduleId);
    if (isSelected) {
      onModulesChange(selectedModules.filter(id => id !== moduleId));
    } else {
      onModulesChange([...selectedModules, moduleId]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Etapa 2 de 4</p>
          <h2 className="text-xl font-semibold tracking-tight">Selecione os Módulos</h2>
        </div>

        {/* Module List */}
        <div className="space-y-1">
          {MODULES.map((module) => (
            <label
              key={module.id}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(module.id)}
                onChange={() => handleModuleToggle(module.id)}
                className="w-4 h-4"
              />
              <module.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{module.name}</span>
            </label>
          ))}
        </div>

        {/* Selected Count */}
        {selectedModules.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {selectedModules.length} selecionado{selectedModules.length !== 1 ? 's' : ''}
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
