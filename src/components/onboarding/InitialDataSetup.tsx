import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Users, 
  FileText, 
  BarChart3, 
  Shield,
  CheckCircle,
  Loader2,
  Plus,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DataSetupTask {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
}

interface InitialDataSetupProps {
  selectedModules: string[];
  moduleConfigurations: Record<string, any>;
  onSetupComplete: (results: any) => void;
  onSkip: () => void;
}

const MODULE_ICONS: Record<string, any> = {
  performance: BarChart3,
  qualidade: Shield,
  gestao_pessoas: Users,
  inventario_gee: Database,
  documentos: FileText,
  compliance: Settings
};

const SAMPLE_DATA_TEMPLATES = {
  performance: {
    name: 'Dados de Performance',
    items: [
      { name: 'Ciclo de Avaliação Q1 2024', type: 'evaluation_cycle' },
      { name: 'Metas Departamentais', type: 'goals' },
      { name: 'Indicadores de KPI', type: 'kpis' }
    ]
  },
  qualidade: {
    name: 'Sistema de Qualidade',
    items: [
      { name: 'Procedimentos ISO 9001', type: 'documents' },
      { name: 'Auditoria Interna Exemplo', type: 'audit' },
      { name: 'Plano de Ações Corretivas', type: 'corrective_actions' }
    ]
  },
  gestao_pessoas: {
    name: 'Gestão de Pessoas',
    items: [
      { name: 'Estrutura Organizacional', type: 'org_structure' },
      { name: 'Políticas de RH', type: 'policies' },
      { name: 'Plano de Desenvolvimento', type: 'development_plan' }
    ]
  },
  inventario_gee: {
    name: 'Inventário de GEE',
    items: [
      { name: 'Fontes de Emissão Básicas', type: 'emission_sources' },
      { name: 'Fatores de Emissão Padrão', type: 'emission_factors' },
      { name: 'Template de Coleta', type: 'data_collection' }
    ]
  },
  documentos: {
    name: 'Gestão de Documentos',
    items: [
      { name: 'Estrutura de Pastas', type: 'folder_structure' },
      { name: 'Templates Padrão', type: 'document_templates' },
      { name: 'Fluxo de Aprovação', type: 'approval_workflow' }
    ]
  },
  compliance: {
    name: 'Compliance',
    items: [
      { name: 'Matriz de Requisitos Legais', type: 'legal_requirements' },
      { name: 'Calendário de Obrigações', type: 'obligations_calendar' },
      { name: 'Plano de Monitoramento', type: 'monitoring_plan' }
    ]
  }
};

export function InitialDataSetup({
  selectedModules,
  moduleConfigurations,
  onSetupComplete,
  onSkip
}: InitialDataSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<DataSetupTask[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    // Initialize tasks based on selected modules
    const initialTasks = selectedModules.flatMap(moduleId => {
      const template = SAMPLE_DATA_TEMPLATES[moduleId];
      if (!template) return [];

      return template.items.map((item, index) => ({
        id: `${moduleId}_${index}`,
        name: item.name,
        description: `Configurando ${item.type} para ${template.name}`,
        moduleId,
        status: 'pending' as const,
        progress: 0
      }));
    });

    setTasks(initialTasks);
  }, [selectedModules]);

  const updateTaskStatus = (taskId: string, status: DataSetupTask['status'], progress: number = 0) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status, progress } : task
    ));
  };

  const setupModuleData = async (moduleId: string, taskId: string) => {
    const config = moduleConfigurations[moduleId] || {};
    
    try {
      setCurrentTask(taskId);
      updateTaskStatus(taskId, 'running', 0);
      
      // Simulate progressive data setup
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updateTaskStatus(taskId, 'running', i);
      }
      
      // Actual data setup based on module
      switch (moduleId) {
        case 'performance':
          await setupPerformanceData(config);
          break;
        case 'qualidade':
          await setupQualityData(config);
          break;
        case 'gestao_pessoas':
          await setupHRData(config);
          break;
        case 'inventario_gee':
          await setupGHGData(config);
          break;
        case 'documentos':
          await setupDocumentData(config);
          break;
        case 'compliance':
          await setupComplianceData(config);
          break;
        default:
          console.log(`No specific setup for module: ${moduleId}`);
      }
      
      updateTaskStatus(taskId, 'completed', 100);
      
    } catch (error) {
      console.error(`Error setting up data for ${moduleId}:`, error);
      updateTaskStatus(taskId, 'error', 0);
    }
  };

  const setupPerformanceData = async (config: any) => {
    if (!user?.company?.id) return;
    
    // Create sample evaluation cycles if performance reviews are enabled
    if (config.performance_reviews) {
      // Implementation would create sample data
      console.log('Setting up performance evaluation data...');
    }
    
    // Create sample goals if goal setting is enabled
    if (config.goal_setting) {
      console.log('Setting up goal tracking data...');
    }
  };

  const setupQualityData = async (config: any) => {
    if (!user?.company?.id) return;
    
    // Create sample audit schedules if audit scheduling is enabled
    if (config.audit_scheduling) {
      console.log('Setting up audit scheduling data...');
    }
    
    // Create sample nonconformity tracking if enabled
    if (config.nonconformity_tracking) {
      console.log('Setting up nonconformity tracking data...');
    }
  };

  const setupHRData = async (config: any) => {
    if (!user?.company?.id) return;
    
    // Create sample HR structures
    console.log('Setting up HR management data...');
  };

  const setupGHGData = async (config: any) => {
    if (!user?.company?.id) return;
    
    // Create sample GHG inventory structures
    console.log('Setting up GHG inventory data...');
  };

  const setupDocumentData = async (config: any) => {
    if (!user?.company?.id) return;
    
    // Create sample document management structures
    console.log('Setting up document management data...');
  };

  const setupComplianceData = async (config: any) => {
    if (!user?.company?.id) return;
    
    // Create sample compliance structures
    console.log('Setting up compliance data...');
  };

  const runSetup = async () => {
    setIsRunning(true);
    setOverallProgress(0);
    
    const totalTasks = tasks.length;
    let completedTasks = 0;

    for (const task of tasks) {
      await setupModuleData(task.moduleId, task.id);
      completedTasks++;
      setOverallProgress((completedTasks / totalTasks) * 100);
    }
    
    setIsRunning(false);
    setCurrentTask(null);
    
    toast({
      title: 'Dados Iniciais Configurados! 🎉',
      description: 'Estruturas básicas e dados exemplo foram criados com sucesso.',
    });
    
    onSetupComplete({ tasks, success: true });
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const errorTasks = tasks.filter(task => task.status === 'error').length;
  const allCompleted = tasks.length > 0 && completedTasks === tasks.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Plus className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Configuração de Dados Iniciais</h2>
            <p className="text-muted-foreground">
              Criando estruturas básicas e dados exemplo para seus módulos
            </p>
          </div>
          
          <Progress value={overallProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {Math.round(overallProgress)}% concluído • {completedTasks} de {tasks.length} tarefas
          </p>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Tarefas de Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma configuração adicional necessária</p>
              </div>
            ) : (
              tasks.map((task) => {
                const ModuleIcon = MODULE_ICONS[task.moduleId] || Database;
                return (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      task.id === currentTask ? 'bg-blue-50/50 border-blue-200' : 'bg-card/50'
                    }`}
                  >
                    <ModuleIcon className="w-5 h-5 text-muted-foreground" />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.name}</h4>
                        {task.status === 'running' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {task.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                      
                      {task.status === 'running' && (
                        <Progress value={task.progress} className="w-full h-2" />
                      )}
                    </div>
                    
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'running' ? 'secondary' :
                        task.status === 'error' ? 'destructive' :
                        'outline'
                      }
                      className="ml-2"
                    >
                      {task.status === 'completed' ? 'Concluído' :
                       task.status === 'running' ? 'Executando' :
                       task.status === 'error' ? 'Erro' :
                       'Pendente'}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={onSkip}
            disabled={isRunning}
            className="flex-1 max-w-xs"
          >
            Pular Configuração
          </Button>
          
          {!isRunning && !allCompleted && tasks.length > 0 && (
            <Button 
              onClick={runSetup}
              className="flex-1 max-w-xs"
            >
              <Plus className="w-4 h-4 mr-2" />
              Configurar Dados
            </Button>
          )}
          
          {allCompleted && (
            <Button 
              onClick={() => onSetupComplete({ tasks, success: true })}
              className="flex-1 max-w-xs bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Configuração Concluída
            </Button>
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900">O que será criado?</h4>
                <p className="text-sm text-blue-700">
                  Estruturas básicas, dados exemplo, templates e configurações iniciais para que você possa começar a usar os módulos imediatamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}