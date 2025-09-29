import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Rocket, 
  Play, 
  ArrowRight,
  Star,
  Trophy,
  Sparkles,
  Plus
} from "lucide-react";

interface CleanCompletionStepProps {
  selectedModules: string[];
  moduleConfigurations: Record<string, any>;
  onStartUsingPlatform: () => void;
  onTakeTour: () => void;
  onSetupInitialData?: () => void;
  onRunValidation?: () => void;
  onEmergencyComplete?: () => void;
}

const MODULE_NAMES: Record<string, string> = {
  inventario_gee: 'Inventário GEE',
  gestao_licencas: 'Licenças Ambientais',
  gestao_pessoas: 'Gestão de Pessoas',
  qualidade: 'Sistema de Qualidade',
  performance: 'Performance',
  documentos: 'Documentos',
  analise_dados: 'Análise de Dados',
  compliance: 'Compliance'
};

export function CleanCompletionStep({ 
  selectedModules, 
  moduleConfigurations, 
  onStartUsingPlatform, 
  onTakeTour, 
  onSetupInitialData,
  onRunValidation,
  onEmergencyComplete 
}: CleanCompletionStepProps) {

  const configuredModulesCount = Object.keys(moduleConfigurations).length;
  const totalConfigOptions = Object.values(moduleConfigurations).reduce(
    (acc, config) => acc + Object.values(config).filter(Boolean).length, 
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Animation Area */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-3">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <Trophy className="w-3 h-3 mr-1" />
              Configuração Concluída
            </Badge>
            
            <h2 className="text-3xl font-bold text-foreground">
              Parabéns! 🎉
            </h2>
            
            <p className="text-lg text-muted-foreground">
              Sua plataforma Daton está pronta para uso. 
              Todos os módulos foram configurados com sucesso!
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Resumo da Configuração
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {selectedModules.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Módulos ativos
                </div>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {totalConfigOptions}
                </div>
                <div className="text-xs text-muted-foreground">
                  Configurações aplicadas
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-foreground text-sm">
                Módulos Configurados:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedModules.map((moduleId) => (
                  <Badge key={moduleId} variant="secondary" className="text-xs">
                    {MODULE_NAMES[moduleId]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">
              Próximos Passos Recomendados:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Explore o Dashboard principal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Comece a inserir dados nos módulos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Configure notificações e lembretes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Gere seus primeiros relatórios
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons with new options */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                console.log('🎯 Tour button clicked');
                onTakeTour();
              }}
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="mr-2 h-4 w-4" />
              Fazer Tour Guiado
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-3">
            {onSetupInitialData && (
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('🧱 Setup inicial de dados - button clicked');
                  onSetupInitialData();
                }}
                size="lg"
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Configurar Dados
              </Button>
            )}
            
            {onRunValidation && (
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('🛡️ Validação do sistema - button clicked');
                  onRunValidation();
                }}
                size="lg"
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Validar Sistema
              </Button>
            )}
          </div>
          
          <Button 
            variant="outline"
            onClick={() => {
              console.log('🚀 Start using button clicked');
              onStartUsingPlatform();
            }}
            size="lg"
            className="w-full"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Começar a Usar
          </Button>
        </div>

        {/* Emergency Complete Button (for debugging) */}
        {onEmergencyComplete && (
          <div className="pt-4 border-t border-border/20">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🚨 Emergency complete button clicked');
                onEmergencyComplete();
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Forçar Conclusão (Debug)
            </Button>
          </div>
        )}

        {/* Thank you message */}
        <div className="text-center text-sm text-muted-foreground">
          Obrigado por escolher a Daton para sua gestão ESG! 🌱
        </div>
      </div>
    </div>
  );
}