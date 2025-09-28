import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info, Zap } from 'lucide-react';

interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'pattern' | 'custom' | 'recommendation';
  message: string;
  severity: 'error' | 'warning' | 'info';
  autoFix?: boolean;
}

interface SmartValidationHelperProps {
  currentStep: number;
  data: any;
  onValidationChange: (isValid: boolean, errors: ValidationRule[]) => void;
  onAutoFix?: (fixes: any) => void;
}

export function SmartValidationHelper({
  currentStep,
  data,
  onValidationChange,
  onAutoFix
}: SmartValidationHelperProps) {
  const [validationResults, setValidationResults] = useState<ValidationRule[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateStep = async (step: number, stepData: any) => {
    setIsValidating(true);
    const errors: ValidationRule[] = [];

    switch (step) {
      case 1: // Module Selection
        if (!stepData.selectedModules || stepData.selectedModules.length === 0) {
          errors.push({
            id: 'no_modules',
            field: 'selectedModules',
            type: 'required',
            message: 'Selecione pelo menos um módulo para continuar',
            severity: 'error'
          });
        }

        if (stepData.selectedModules?.length > 6) {
          errors.push({
            id: 'too_many_modules',
            field: 'selectedModules',
            type: 'recommendation',
            message: 'Muitos módulos podem tornar a implementação complexa. Considere começar com 3-4 módulos.',
            severity: 'warning',
            autoFix: true
          });
        }

        // Smart recommendations based on combinations
        if (stepData.selectedModules?.includes('inventario_gee') && 
            !stepData.selectedModules?.includes('gestao_licencas')) {
          errors.push({
            id: 'gee_license_combo',
            field: 'selectedModules',
            type: 'recommendation',
            message: 'Empresas com Inventário GEE frequentemente precisam de Gestão de Licenças também.',
            severity: 'info'
          });
        }
        break;

      case 2: // Configuration
        const selectedModules = stepData.selectedModules || [];
        const configurations = stepData.moduleConfigurations || {};

        selectedModules.forEach((moduleId: string) => {
          if (!configurations[moduleId]) {
            errors.push({
              id: `config_missing_${moduleId}`,
              field: 'moduleConfigurations',
              type: 'required',
              message: `Configure os atalhos para o módulo ${getModuleName(moduleId)}`,
              severity: 'error'
            });
          } else {
            // Validate specific module configurations
            const config = configurations[moduleId];
            const moduleErrors = validateModuleConfig(moduleId, config);
            errors.push(...moduleErrors);
          }
        });
        break;
    }

    // Performance recommendations
    if (stepData.selectedModules?.length > 0) {
      const estimatedSetupTime = calculateSetupTime(stepData.selectedModules);
      if (estimatedSetupTime > 30) {
        errors.push({
          id: 'long_setup_time',
          field: 'general',
          type: 'recommendation',
          message: `Configuração estimada em ${estimatedSetupTime} dias. Considere implementar por fases.`,
          severity: 'warning'
        });
      }
    }

    setValidationResults(errors);
    onValidationChange(errors.filter(e => e.severity === 'error').length === 0, errors);
    setIsValidating(false);
  };

  const validateModuleConfig = (moduleId: string, config: any): ValidationRule[] => {
    const errors: ValidationRule[] = [];

    switch (moduleId) {
      case 'inventario_gee':
        if (!config.ano_base) {
          errors.push({
            id: `${moduleId}_year`,
            field: 'ano_base',
            type: 'required',
            message: 'Ano base é obrigatório para o Inventário GEE',
            severity: 'error'
          });
        }
        
        if (!config.escopo || config.escopo.length === 0) {
          errors.push({
            id: `${moduleId}_scope`,
            field: 'escopo',
            type: 'recommendation',
            message: 'Defina pelo menos um escopo de emissões para começar',
            severity: 'warning'
          });
        }
        break;

      case 'gestao_licencas':
        if (!config.orgaos_reguladores || config.orgaos_reguladores.length === 0) {
          errors.push({
            id: `${moduleId}_regulators`,
            field: 'orgaos_reguladores',
            type: 'required',
            message: 'Selecione pelo menos um órgão regulador',
            severity: 'error'
          });
        }
        break;

      case 'gestao_desempenho':
        if (!config.ciclo_avaliacao) {
          errors.push({
            id: `${moduleId}_cycle`,
            field: 'ciclo_avaliacao',
            type: 'required',
            message: 'Defina o ciclo de avaliação de desempenho',
            severity: 'error'
          });
        }
        break;
    }

    return errors;
  };

  const getModuleName = (moduleId: string): string => {
    const names: Record<string, string> = {
      'inventario_gee': 'Inventário GEE',
      'gestao_licencas': 'Gestão de Licenças',
      'gestao_desempenho': 'Gestão de Desempenho',
      'sistema_qualidade': 'Sistema de Qualidade',
      'treinamentos': 'Treinamentos'
    };
    return names[moduleId] || moduleId;
  };

  const calculateSetupTime = (modules: string[]): number => {
    const timeMap: Record<string, number> = {
      'inventario_gee': 10,
      'gestao_licencas': 5,
      'gestao_desempenho': 8,
      'sistema_qualidade': 12,
      'treinamentos': 3
    };
    
    return modules.reduce((total, moduleId) => total + (timeMap[moduleId] || 5), 0);
  };

  const handleAutoFix = () => {
    const fixes: any = {};
    
    validationResults.forEach(error => {
      if (error.autoFix) {
        switch (error.id) {
          case 'too_many_modules':
            // Keep only the first 4 modules
            fixes.selectedModules = data.selectedModules?.slice(0, 4);
            break;
        }
      }
    });

    if (onAutoFix && Object.keys(fixes).length > 0) {
      onAutoFix(fixes);
    }
  };

  useEffect(() => {
    validateStep(currentStep, data);
  }, [currentStep, data]);

  const errors = validationResults.filter(r => r.severity === 'error');
  const warnings = validationResults.filter(r => r.severity === 'warning');
  const infos = validationResults.filter(r => r.severity === 'info');

  if (isValidating) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-700">Validando configurações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (validationResults.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Tudo está configurado corretamente!
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Errors */}
      {errors.map((error) => (
        <Alert key={error.id} className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <div className="flex items-center justify-between">
              <span>{error.message}</span>
              <Badge variant="destructive" className="text-xs">
                Obrigatório
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      ))}

      {/* Warnings */}
      {warnings.map((warning) => (
        <Alert key={warning.id} className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <div className="flex items-center justify-between">
              <span>{warning.message}</span>
              <div className="flex items-center gap-2">
                {warning.autoFix && (
                  <button
                    onClick={handleAutoFix}
                    className="text-xs bg-amber-200 hover:bg-amber-300 px-2 py-1 rounded"
                  >
                    Corrigir automaticamente
                  </button>
                )}
                <Badge variant="secondary" className="text-xs">
                  Recomendação
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ))}

      {/* Info/Tips */}
      {infos.map((info) => (
        <Alert key={info.id} className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <div className="flex items-center justify-between">
              <span>{info.message}</span>
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                Dica
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
