import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileCheck } from "lucide-react";
import { getModuleById, humanizeModuleId } from "./modulesCatalog";

interface CleanDataCreationStepProps {
  selectedModules: string[];
  moduleConfigurations: Record<string, any>;
  onConfigurationChange: (moduleId: string, config: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CONFIGURATION_OPTIONS: Record<string, Array<{ key: string; label: string }>> = {
  inventario_gee: [
    { key: 'auto_calculate', label: 'Cálculo automático' },
    { key: 'import_data', label: 'Importar histórico' },
    { key: 'notifications', label: 'Notificações' }
  ],
  energia: [
    { key: 'medir_consumo', label: 'Medir consumo' },
    { key: 'metas_reducao', label: 'Metas de redução' },
    { key: 'alertas_pico', label: 'Alertas de pico' }
  ],
  agua: [
    { key: 'monitorar_captacao', label: 'Monitorar captação' },
    { key: 'efluentes_conformidade', label: 'Conformidade de efluentes' },
    { key: 'alertas_consumo', label: 'Alertas de consumo' }
  ],
  residuos: [
    { key: 'rastreio_coleta', label: 'Rastreio de coleta' },
    { key: 'segregacao', label: 'Segregação' },
    { key: 'manifestos_digitais', label: 'Manifestos digitais' }
  ],
  biodiversidade: [
    { key: 'areas_protecao', label: 'Áreas de proteção' },
    { key: 'monitoramento_fauna', label: 'Monitoramento de fauna' },
    { key: 'planos_compensacao', label: 'Planos de compensação' }
  ],
  mudancas_climaticas: [
    { key: 'cenarios_climaticos', label: 'Cenários climáticos' },
    { key: 'riscos_transicao', label: 'Riscos de transição' },
    { key: 'inventario_escopo3', label: 'Inventário escopo 3' }
  ],
  economia_circular: [
    { key: 'rastrear_materiais', label: 'Rastrear materiais' },
    { key: 'indicadores_circularidade', label: 'Indicadores de circularidade' },
    { key: 'parceiros_reciclagem', label: 'Parceiros de reciclagem' }
  ],
  gestao_licencas: [
    { key: 'renewal_alerts', label: 'Alertas de renovação' },
    { key: 'compliance_check', label: 'Verificar compliance' },
    { key: 'document_scan', label: 'Scan de documentos' }
  ],
  gestao_pessoas: [
    { key: 'performance_reviews', label: 'Avaliações' },
    { key: 'training_tracking', label: 'Treinamentos' },
    { key: 'goal_setting', label: 'Metas' }
  ],
  saude_seguranca: [
    { key: 'incidentes', label: 'Registro de incidentes' },
    { key: 'inspecoes', label: 'Inspeções' },
    { key: 'treinamentos_obrigatorios', label: 'Treinamentos obrigatórios' }
  ],
  stakeholders: [
    { key: 'mapa_stakeholders', label: 'Mapa de stakeholders' },
    { key: 'registro_interacoes', label: 'Registro de interações' },
    { key: 'pesquisas_satisfacao', label: 'Pesquisas de satisfação' }
  ],
  riscos_esg: [
    { key: 'matriz_riscos', label: 'Matriz de riscos' },
    { key: 'controles_mitigacao', label: 'Controles de mitigação' },
    { key: 'monitoramento_eventos', label: 'Monitoramento de eventos' }
  ],
  qualidade: [
    { key: 'audit_scheduling', label: 'Auditorias' },
    { key: 'nonconformity_tracking', label: 'Não conformidades' },
    { key: 'procedure_management', label: 'Procedimentos' }
  ],
  performance: [
    { key: 'kpi_tracking', label: 'Rastreamento de KPIs' },
    { key: 'benchmarking', label: 'Benchmarking' },
    { key: 'dashboards', label: 'Dashboards' }
  ],
  inovacao: [
    { key: 'portfolio_ideias', label: 'Portfolio de ideias' },
    { key: 'pipeline_poc', label: 'Pipeline de POCs' },
    { key: 'indicadores_inovacao', label: 'Indicadores de inovação' }
  ],
  cadeia_suprimentos: [
    { key: 'homologacao_fornecedores', label: 'Homologação de fornecedores' },
    { key: 'due_diligence', label: 'Due diligence' },
    { key: 'desempenho_fornecedores', label: 'Desempenho de fornecedores' }
  ],
  compliance: [
    { key: 'regulatory_tracking', label: 'Rastreamento regulatório' },
    { key: 'reporting', label: 'Relatórios' },
    { key: 'certifications', label: 'Certificações' }
  ],
  documentos: [
    { key: 'version_control', label: 'Controle de versão' },
    { key: 'approval_workflow', label: 'Fluxo de aprovação' },
    { key: 'search', label: 'Busca avançada' }
  ],
  analise_dados: [
    { key: 'data_visualization', label: 'Visualização de dados' },
    { key: 'custom_reports', label: 'Relatórios personalizados' },
    { key: 'export', label: 'Exportação' }
  ]
};

export function CleanDataCreationStep({ 
  selectedModules, 
  moduleConfigurations, 
  onConfigurationChange, 
  onNext, 
  onPrev 
}: CleanDataCreationStepProps) {

  const handleConfigToggle = (moduleId: string, configKey: string, enabled: boolean) => {
    const currentConfig = moduleConfigurations[moduleId] || {};
    onConfigurationChange(moduleId, {
      ...currentConfig,
      [configKey]: enabled
    });
  };

  const handleQuickSetup = () => {
    selectedModules.forEach(moduleId => {
      const options = CONFIGURATION_OPTIONS[moduleId as keyof typeof CONFIGURATION_OPTIONS];
      if (options) {
        const quickConfig: Record<string, boolean> = {};
        options.forEach(opt => {
          quickConfig[opt.key] = true;
        });
        onConfigurationChange(moduleId, quickConfig);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index} 
                className={`h-1 rounded-full transition-all ${
                  index === 2 ? 'w-6 bg-primary' : index < 2 ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
                }`} 
              />
            ))}
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Configure os Módulos</h2>
          <p className="text-xs text-muted-foreground">Ative as funcionalidades desejadas</p>
        </div>

        {/* Quick Action */}
        <div className="flex justify-center">
          <Button
            onClick={handleQuickSetup}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            Ativar Tudo Recomendado
          </Button>
        </div>

        {/* Module Configurations */}
        <div className="space-y-4">
          {selectedModules.map((moduleId) => {
            const module = getModuleById(moduleId);
            const Icon = module?.icon ?? FileCheck;
            const moduleName = module?.name ?? humanizeModuleId(moduleId);
            const options = CONFIGURATION_OPTIONS[moduleId] || [];
            const config = moduleConfigurations[moduleId] || {};

            return (
              <div key={moduleId} className="space-y-2 p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-medium">{moduleName}</h3>
                </div>

                {options.length > 0 ? (
                  <div className="space-y-1.5 pl-5">
                    {options.map(option => (
                      <div key={option.key} className="flex items-center justify-between">
                        <Label htmlFor={`${moduleId}-${option.key}`} className="text-xs text-muted-foreground">
                          {option.label}
                        </Label>
                        <Switch
                          id={`${moduleId}-${option.key}`}
                          checked={config[option.key] || false}
                          onCheckedChange={(checked) => handleConfigToggle(moduleId, option.key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground pl-5">
                    Módulo pronto para uso. Você pode avançar.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onPrev}
            variant="outline"
            className="flex-1 h-10"
          >
            Voltar
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 h-10"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
