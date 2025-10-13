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
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Selecione Módulos 2/4
            </div>
          </div>

          {/* Modules List */}
          <div className="space-y-2">
            {MODULES.map((module) => {
              const Icon = module.icon;
              const isSelected = selectedModules.includes(module.id);
              
              return (
                <div 
                  key={module.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleModuleToggle(module.id)}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => handleModuleToggle(module.id)}
                  />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Label className="cursor-pointer flex-1">
                    {module.name}
                  </Label>
                </div>
              );
            })}
          </div>

          {/* Selected Count */}
          <div className="text-sm text-muted-foreground">
            {selectedModules.length} selecionados
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={onPrev} size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              onClick={onNext}
              disabled={selectedModules.length === 0}
              size="sm"
            >
              Avançar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
