import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Check } from "lucide-react";

interface QuickSetupModeProps {
  selectedModules: string[];
  onApplyQuickSetup: () => void;
}

const QUICK_SETUP_CONFIG = {
  inventario_gee: { auto_calculate: true, notifications: true, import_data: false },
  gestao_licencas: { renewal_alerts: true, compliance_check: true, document_scan: false },
  gestao_pessoas: { performance_reviews: true, training_tracking: true, goal_setting: false },
  qualidade: { audit_scheduling: true, nonconformity_tracking: true, procedure_management: false }
};

export function QuickSetupMode({ selectedModules, onApplyQuickSetup }: QuickSetupModeProps) {
  const hasQuickSetup = selectedModules.some(id => id in QUICK_SETUP_CONFIG);

  if (!hasQuickSetup) return null;

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 shadow-sm animate-slide-up">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-1">
                Modo Setup Rápido Disponível
                <Badge className="bg-amber-600 hover:bg-amber-700 text-xs">
                  Recomendado
                </Badge>
              </h3>
              <p className="text-sm text-amber-700 leading-relaxed">
                Aplique automaticamente as configurações mais populares e comece a usar em segundos. 
                Você pode ajustar depois.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-800">O que será configurado:</p>
              <div className="grid gap-1.5 text-xs text-amber-700">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-amber-600" />
                  <span>Cálculos automáticos e notificações</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-amber-600" />
                  <span>Alertas de renovação e compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-amber-600" />
                  <span>Avaliações e controle de treinamentos</span>
                </div>
              </div>
            </div>

            <Button
              onClick={onApplyQuickSetup}
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-700 shadow-md hover:shadow-lg transition-all"
            >
              <Zap className="mr-2 h-3 w-3" />
              Aplicar Setup Rápido
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
