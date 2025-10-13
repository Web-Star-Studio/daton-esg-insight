import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckCircle, 
  Rocket, 
  Play, 
  ArrowRight,
  Star,
  Trophy,
  Sparkles,
  Plus,
  Shield
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
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Success Animation Area */}
          <div className="text-center space-y-6 animate-scale-in">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30 animate-pulse">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full blur-xl -z-10"></div>
            </div>
            
            <div className="space-y-3">
              <Badge className="bg-gradient-to-r from-green-100 to-green-50 text-green-700 hover:from-green-100 hover:to-green-100 border-green-200 shadow-sm">
                <Trophy className="w-3 h-3 mr-1" />
                Configuração Concluída
              </Badge>
              
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Parabéns! 🎉
              </h2>
              
              <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                Sua plataforma Daton está pronta para uso. 
                <span className="font-semibold text-foreground"> Todos os módulos foram configurados com sucesso!</span>
              </p>
            </div>
          </div>

        {/* Summary Card */}
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm hover:shadow-[0_20px_50px_rgba(0,191,99,0.1)] transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="bg-gradient-to-b from-muted/10 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              Resumo da Configuração
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-border/40 hover:border-primary/30 transition-all hover-scale cursor-help">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                      {selectedModules.length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Módulos ativos
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total de módulos ativados e configurados</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-border/40 hover:border-primary/30 transition-all hover-scale cursor-help">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                      {totalConfigOptions}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Configurações aplicadas
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Opções de configuração personalizadas</p>
                </TooltipContent>
              </Tooltip>
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
        <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20 shadow-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Próximos Passos Recomendados:
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Explore o Dashboard principal</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Comece a inserir dados nos módulos</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Configure notificações e lembretes</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Gere seus primeiros relatórios</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons with new options */}
        <div className="space-y-3 sm:space-y-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => {
                  console.log('🎯 Tour button clicked');
                  onTakeTour();
                }}
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary hover:via-primary/95 hover:to-primary/85 shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all hover-scale group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Play className="mr-2 h-5 w-5 relative z-10 group-hover:scale-110 transition-transform" />
                <span className="relative z-10 font-semibold">Fazer Tour Guiado</span>
                <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Explore a plataforma com um guia interativo</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {onSetupInitialData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      console.log('🧱 Setup inicial de dados - button clicked');
                      onSetupInitialData();
                    }}
                    size="lg"
                    className="flex-1 hover-scale border-2 hover:border-primary/30"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Configurar Dados
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure dados iniciais dos módulos</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onRunValidation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      console.log('🛡️ Validação do sistema - button clicked');
                      onRunValidation();
                    }}
                    size="lg"
                    className="flex-1 hover-scale border-2 hover:border-primary/30"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Validar Sistema
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verificar configurações e integridade</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('🚀 Start using button clicked');
                  onStartUsingPlatform();
                }}
                size="lg"
                className="w-full hover-scale border-2 hover:border-primary/30"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Começar a Usar Agora
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ir direto para o dashboard principal</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Emergency Complete Button (for debugging) */}
        {onEmergencyComplete && (
          <div className="pt-4 border-t border-border/20">
            <Button 
              variant="destructive"
              size="sm"
              onClick={() => {
                console.log('🚨 Emergency complete button clicked');
                onEmergencyComplete();
              }}
              className="w-full text-xs"
            >
              🚨 Forçar Conclusão do Onboarding
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Use apenas se o onboarding estiver travado
            </p>
          </div>
        )}

        {/* Thank you message */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30">
            <span className="text-xl">🌱</span>
            <p className="text-sm text-muted-foreground">
              Obrigado por escolher a <span className="font-semibold text-foreground">Daton</span> para sua gestão ESG!
            </p>
          </div>
        </div>
        </div>
      </div>
    </TooltipProvider>
  );
}