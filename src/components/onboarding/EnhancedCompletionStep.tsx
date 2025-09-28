import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Rocket, ArrowRight, Trophy, BarChart3, 
  FileText, Users, Target, BookOpen, Calendar, Settings,
  Leaf, Shield, Award, GraduationCap, FolderOpen, Star,
  Zap, TrendingUp, Clock, Gift
} from "lucide-react";

interface EnhancedCompletionStepProps {
  selectedModules: string[];
  moduleConfigurations: any;
  onStartUsingPlatform: () => void;
  onTakeTour: () => void;
}

const MODULE_INFO = {
  inventario_gee: {
    name: 'Inventário GEE',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'text-green-600',
    nextSteps: ['Cadastrar mais fontes de emissão', 'Inserir dados de atividade mensais', 'Gerar primeiro relatório de emissões'],
    benefit: 'Cálculo automático de pegada de carbono'
  },
  gestao_licencas: {
    name: 'Gestão de Licenças',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-blue-600',
    nextSteps: ['Cadastrar demais licenças', 'Configurar alertas por email', 'Upload de documentos digitais'],
    benefit: 'Alertas automáticos de vencimento'
  },
  metas_sustentabilidade: {
    name: 'Metas de Sustentabilidade',
    icon: <Leaf className="h-4 w-4" />,
    color: 'text-emerald-600',
    nextSteps: ['Definir indicadores de progresso', 'Conectar com ODS', 'Configurar dashboard executivo'],
    benefit: 'Acompanhamento automático de progresso'
  },
  sistema_qualidade: {
    name: 'Sistema de Qualidade',
    icon: <Target className="h-4 w-4" />,
    color: 'text-purple-600',
    nextSteps: ['Mapear processos organizacionais', 'Configurar fluxo de aprovações', 'Definir indicadores de qualidade'],
    benefit: 'Melhoria contínua automatizada'
  },
  gestao_riscos: {
    name: 'Gestão de Riscos',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-red-600',
    nextSteps: ['Criar matriz completa de riscos', 'Definir planos de mitigação', 'Configurar monitoramento contínuo'],
    benefit: 'Antecipação e prevenção de problemas'
  },
  gestao_desempenho: {
    name: 'Gestão de Desempenho',
    icon: <Users className="h-4 w-4" />,
    color: 'text-purple-600',
    nextSteps: ['Cadastrar colaboradores', 'Definir mais competências', 'Configurar primeiro ciclo de avaliação'],
    benefit: 'Desenvolvimento direcionado da equipe'
  },
  treinamentos: {
    name: 'Treinamentos',
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'text-orange-600',
    nextSteps: ['Criar trilhas de aprendizado', 'Cadastrar instrutores', 'Configurar certificações automáticas'],
    benefit: 'Capacitação contínua e estruturada'
  },
  documentos: {
    name: 'Gestão Documental',
    icon: <FolderOpen className="h-4 w-4" />,
    color: 'text-indigo-600',
    nextSteps: ['Organizar estrutura de pastas', 'Configurar fluxos de aprovação', 'Implementar controle de versão'],
    benefit: 'Organização inteligente de documentos'
  },
  relatorios_esg: {
    name: 'Relatórios ESG',
    icon: <Award className="h-4 w-4" />,
    color: 'text-cyan-600',
    nextSteps: ['Configurar templates GRI', 'Definir métricas SASB', 'Automatizar geração de relatórios'],
    benefit: 'Relatórios de sustentabilidade automáticos'
  }
};

const QUICK_ACTIONS = [
  {
    title: 'Tour Interativo',
    description: 'Conheça todas as funcionalidades com um tour guiado personalizado',
    icon: <BookOpen className="h-5 w-5" />,
    action: 'tour',
    variant: 'outline' as const,
    color: 'text-blue-600',
    highlight: 'Recomendado'
  },
  {
    title: 'Centro de Ajuda',
    description: 'Acesse tutoriais em vídeo, documentação e FAQ completa',
    icon: <Settings className="h-5 w-5" />,
    action: 'help',
    variant: 'outline' as const,
    color: 'text-green-600'
  },
  {
    title: 'Agendar Consultoria',
    description: 'Sessão personalizada com nossos especialistas em ESG',
    icon: <Calendar className="h-5 w-5" />,
    action: 'schedule',
    variant: 'outline' as const,
    color: 'text-purple-600',
    highlight: 'Grátis'
  }
];

const ACHIEVEMENTS = [
  {
    icon: <Trophy className="h-5 w-5 text-yellow-600" />,
    title: 'Setup Completo',
    description: 'Configuração inicial finalizada com sucesso'
  },
  {
    icon: <Zap className="h-5 w-5 text-blue-600" />,
    title: 'Dados Reais Criados',
    description: 'Registros funcionais em cada módulo'
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
    title: 'Pronto para Usar',
    description: 'Plataforma 100% operacional'
  }
];

export function EnhancedCompletionStep({ 
  selectedModules, 
  moduleConfigurations, 
  onStartUsingPlatform, 
  onTakeTour 
}: EnhancedCompletionStepProps) {
  
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'tour':
        onTakeTour();
        break;
      case 'help':
        window.open('https://help.daton.com.br', '_blank');
        break;
      case 'schedule':
        window.open('https://calendly.com/daton-consultoria', '_blank');
        break;
      default:
        break;
    }
  };

  const getEstimatedTimeToValue = () => {
    // Baseado no número de módulos, estimamos tempo para ver valor
    const moduleCount = selectedModules.length;
    if (moduleCount <= 2) return '1-2 semanas';
    if (moduleCount <= 4) return '2-3 semanas';
    return '3-4 semanas';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl">
                  <Trophy className="h-12 w-12 text-white animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center animate-pulse">
                    <Star className="h-4 w-4 text-yellow-800" />
                  </div>
                </div>
              </div>
            </div>
            
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              🎉 Parabéns! Setup Concluído!
            </CardTitle>
            
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Sua plataforma Daton está <strong>100% configurada e operacional</strong>! 
              Você criou seus primeiros dados reais em cada módulo e já pode começar a extrair insights valiosos.
            </p>

            {/* Achievement Badges */}
            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              {ACHIEVEMENTS.map((achievement, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-gray-200">
                  {achievement.icon}
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-800">{achievement.title}</p>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Configuration Summary */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Settings className="h-6 w-6 text-primary" />
              Resumo da Configuração
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Módulos configurados com dados reais prontos para uso
              </p>
              <Badge className="bg-green-600 hover:bg-green-700 px-4 py-2">
                <Clock className="w-4 h-4 mr-1" />
                ROI em {getEstimatedTimeToValue()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {selectedModules.map((moduleId) => {
                const module = MODULE_INFO[moduleId as keyof typeof MODULE_INFO];
                if (!module) return null;
                
                return (
                  <div
                    key={moduleId}
                    className="group p-4 rounded-lg border border-border/50 bg-gradient-to-r from-card/50 to-card hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <div className={`p-1.5 rounded-md bg-background shadow-sm ${module.color}`}>
                            {module.icon}
                          </div>
                          {module.name}
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded-lg border border-border/20">
                        <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {module.benefit}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Próximos passos sugeridos:
                        </p>
                        <ul className="space-y-1">
                          {module.nextSteps.slice(0, 2).map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ArrowRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Como deseja continuar?</CardTitle>
            <p className="text-muted-foreground">
              Escolha sua próxima ação para maximizar o valor da plataforma
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {QUICK_ACTIONS.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-start space-y-3 text-left relative group hover:shadow-md transition-all duration-200"
                  onClick={() => handleQuickAction(action.action)}
                >
                  {action.highlight && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1">
                      {action.highlight}
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-2 rounded-lg bg-background shadow-sm ${action.color}`}>
                      {action.icon}
                    </div>
                    <span className="font-semibold">{action.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-normal leading-relaxed">
                    {action.description}
                  </p>
                </Button>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={onTakeTour}
                variant="outline"
                className="flex-1 max-w-64 hover:bg-blue-50 hover:border-blue-200"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Fazer Tour Guiado
              </Button>
              
              <Button 
                size="lg" 
                onClick={onStartUsingPlatform}
                className="flex-1 max-w-64 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Ir para Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Metrics Preview */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                O que você pode esperar nas próximas semanas
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600 mb-1">30%</div>
                  <p className="text-gray-600">Redução no tempo de relatórios ESG</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-green-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">50%</div>
                  <p className="text-gray-600">Melhora na organização documental</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">80%</div>
                  <p className="text-gray-600">Aumento na visibilidade de processos</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Baseado na experiência de mais de 500 empresas que usam o Daton para gestão ESG e sustentabilidade.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}