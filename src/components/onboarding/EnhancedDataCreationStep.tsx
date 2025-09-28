import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  Info,
  AlertCircle,
  Leaf,
  FileText,
  Award,
  TrendingUp,
  ExternalLink,
  Database,
  Plus
} from 'lucide-react';

interface EnhancedDataCreationStepProps {
  selectedModules: string[];
  moduleConfigurations: any;
  onConfigurationChange: (moduleId: string, config: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function EnhancedDataCreationStep({
  selectedModules,
  moduleConfigurations,
  onConfigurationChange,
  onNext,
  onPrev
}: EnhancedDataCreationStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [generateExampleData, setGenerateExampleData] = useState<Record<string, boolean>>({});

  // Mapeamento de módulos para rotas e informações de atalho
  const MODULE_SHORTCUTS: Record<string, {
    title: string;
    icon: React.ReactNode;
    color: string;
    route: string;
    description: string;
    quickActions: Array<{
      label: string;
      description: string;
      route?: string;
    }>;
    exampleDataInfo?: string;
  }> = {
    inventario_gee: {
      title: 'Inventário de Gases de Efeito Estufa',
      icon: <Leaf className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-600',
      route: '/inventario-gee',
      description: 'Monitore e gerencie suas emissões de GEE com ferramentas completas de inventário.',
      quickActions: [
        { label: 'Cadastrar Fontes de Emissão', description: 'Configure suas principais fontes emissoras' },
        { label: 'Inserir Dados de Atividade', description: 'Registre consumos e atividades que geram emissões' },
        { label: 'Visualizar Dashboard', description: 'Acompanhe suas emissões em tempo real', route: '/dashboard-ghg' }
      ],
      exampleDataInfo: 'frota de veículos, consumo de energia elétrica e geração de resíduos'
    },
    gestao_licencas: {
      title: 'Gestão de Licenças Ambientais',
      icon: <FileText className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-600',
      route: '/licenciamento',
      description: 'Controle todas suas licenças ambientais com alertas automáticos de vencimento.',
      quickActions: [
        { label: 'Cadastrar Nova Licença', description: 'Registre licenças LP, LI, LO ou LAU', route: '/licenciamento/novo' },
        { label: 'Processar Renovações', description: 'Gerencie processos de renovação', route: '/licenciamento/processar' },
        { label: 'Relatórios de Compliance', description: 'Acompanhe status e vencimentos' }
      ],
      exampleDataInfo: 'licenças de operação, instalação e certificados ambientais'
    },
    sistema_qualidade: {
      title: 'Sistema de Gestão da Qualidade',
      icon: <Award className="h-5 w-5" />,
      color: 'from-purple-500 to-violet-600',
      route: '/nao-conformidades',
      description: 'Gerencie não conformidades, auditorias e processos de melhoria contínua.',
      quickActions: [
        { label: 'Registrar Não Conformidade', description: 'Identifique e documente problemas' },
        { label: 'Planejar Auditoria', description: 'Configure auditorias internas', route: '/auditoria' },
        { label: 'Gestão de Riscos', description: 'Avalie e mitigue riscos', route: '/gestao-riscos' },
        { label: 'Planos de Ação 5W2H', description: 'Crie planos estruturados', route: '/plano-acao-5w2h' }
      ],
      exampleDataInfo: 'não conformidades de processo, auditorias e planos de ação'
    },
    gestao_desempenho: {
      title: 'Gestão de Desempenho',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-orange-500 to-red-600',
      route: '/gestao-desempenho',
      description: 'Monitore KPIs, metas organizacionais e desempenho individual dos colaboradores.',
      quickActions: [
        { label: 'Definir Metas', description: 'Configure objetivos organizacionais', route: '/metas' },
        { label: 'Avaliar Funcionários', description: 'Conduza avaliações de desempenho' },
        { label: 'Dashboard Executivo', description: 'Visualize indicadores estratégicos' },
        { label: 'Planejamento Estratégico', description: 'Defina diretrizes estratégicas', route: '/planejamento-estrategico' }
      ],
      exampleDataInfo: 'metas de sustentabilidade, KPIs operacionais e avaliações de desempenho'
    }
  };

  const currentModule = selectedModules[currentModuleIndex];
  const moduleInfo = MODULE_SHORTCUTS[currentModule];

  const handleGenerateExampleData = async (moduleId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Salvar preferência de geração de dados de exemplo
      setGenerateExampleData(prev => ({ ...prev, [moduleId]: true }));
      
      // Salvar no contexto que dados de exemplo serão gerados
      onConfigurationChange(moduleId, { generateExampleData: true });

      toast({
        title: 'Dados de exemplo configurados!',
        description: `Dados de exemplo para ${moduleInfo?.title} serão criados quando você acessar o módulo.`,
      });

    } catch (error) {
      console.error('Error configuring example data:', error);
      toast({
        title: 'Erro na configuração',
        description: 'Não foi possível configurar os dados de exemplo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToNextModule = () => {
    if (currentModuleIndex < selectedModules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    } else {
      onNext();
    }
  };

  const goToPrevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    } else {
      onPrev();
    }
  };

  const handleNavigateToModule = (route: string) => {
    // Salvar progresso no módulo atual
    onConfigurationChange(currentModule, { visited: true, configuredAt: new Date().toISOString() });
    navigate(route);
  };

  if (!moduleInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Módulo não encontrado</h2>
          <p className="text-muted-foreground">O módulo selecionado não está disponível.</p>
          <Button onClick={onPrev} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full bg-gradient-to-r ${moduleInfo.color} text-white shadow-lg`}>
              {moduleInfo.icon}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Atalhos Guiados
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            {moduleInfo.title}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2" />
              Módulo {currentModuleIndex + 1} de {selectedModules.length}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Acesso direto
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentModuleIndex + 1) / selectedModules.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
              style={{ width: `${((currentModuleIndex + 1) / selectedModules.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Module Description */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Como começar com {moduleInfo.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {moduleInfo.description}
                  </p>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {moduleInfo.quickActions.map((action, index) => (
                      <div 
                        key={index}
                        className="p-4 bg-background rounded-lg border border-border hover:border-primary/20 transition-colors cursor-pointer group"
                        onClick={() => action.route && handleNavigateToModule(action.route)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {action.label}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardHeader className={`bg-gradient-to-r ${moduleInfo.color} text-white rounded-t-lg`}>
              <div className="flex items-center gap-3">
                {moduleInfo.icon}
                <div>
                  <CardTitle className="text-xl text-white">
                    Começar a usar {moduleInfo.title}
                  </CardTitle>
                  <p className="text-white/90 text-sm mt-1">
                    Escolha como deseja começar
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Primary Action: Go to Module */}
              <div className="space-y-4">
                <Button
                  onClick={() => handleNavigateToModule(moduleInfo.route)}
                  className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5" />
                    <div className="text-left">
                      <div>Ir para {moduleInfo.title}</div>
                      <div className="text-sm font-normal opacity-90">Começar configuração manual</div>
                    </div>
                  </div>
                </Button>
              </div>

              {/* Secondary Action: Generate Example Data */}
              {moduleInfo.exampleDataInfo && (
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <h4 className="font-medium text-foreground">Dados de Exemplo</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gerar automaticamente exemplos de: <strong>{moduleInfo.exampleDataInfo}</strong>
                    </p>
                    <Button
                      onClick={() => handleGenerateExampleData(currentModule)}
                      variant="outline"
                      className="w-full"
                      disabled={generateExampleData[currentModule] || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Configurando...
                        </>
                      ) : generateExampleData[currentModule] ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Dados de exemplo configurados
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Configurar dados de exemplo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPrevModule}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentModuleIndex === 0 ? 'Voltar' : 'Módulo Anterior'}
            </Button>

            <Button
              onClick={goToNextModule}
              className="flex items-center gap-2 px-6 py-2 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <ArrowRight className="h-4 w-4" />
              {currentModuleIndex === selectedModules.length - 1 ? 'Finalizar Tour' : 'Próximo Módulo'}
            </Button>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tour dos Módulos
            </h3>
            <p className="text-sm text-muted-foreground">
              Explore todos os módulos selecionados
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedModules.map((moduleId, index) => {
              const shortcut = MODULE_SHORTCUTS[moduleId];
              const isActive = currentModuleIndex === index;
              const isVisited = moduleConfigurations[moduleId]?.visited;
              const isPast = currentModuleIndex > index;
              
              if (!shortcut) return null;
              
              return (
                <Card 
                  key={moduleId} 
                  className={`
                    transition-all cursor-pointer border
                    ${isActive 
                      ? `border-primary shadow-lg bg-gradient-to-r ${shortcut.color} text-white` 
                      : isVisited 
                        ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                        : isPast 
                          ? 'border-muted bg-muted/50' 
                          : 'border-border bg-background hover:bg-muted/50'
                    }
                  `}
                  onClick={() => setCurrentModuleIndex(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-full flex-shrink-0
                        ${isActive 
                          ? 'bg-white/20 text-white' 
                          : isVisited 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {isVisited ? <CheckCircle className="h-4 w-4" /> : shortcut.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`
                          font-medium text-sm leading-tight
                          ${isActive ? 'text-white' : isVisited ? 'text-green-800' : 'text-foreground'}
                        `}>
                          {shortcut.title}
                        </h4>
                        <p className={`
                          text-xs mt-1
                          ${isActive ? 'text-white/80' : isVisited ? 'text-green-600' : 'text-muted-foreground'}
                        `}>
                          {isVisited ? 'Visitado' : isActive ? 'Explorando...' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}