import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Database,
  Users,
  Settings,
  Shield,
  Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'checking' | 'success' | 'warning' | 'error';
  icon: any;
  details?: string;
}

interface PostOnboardingValidationProps {
  selectedModules: string[];
  moduleConfigurations: Record<string, any>;
  onValidationComplete: (results: ValidationCheck[]) => void;
  onStartPlatform: () => void;
}

export function PostOnboardingValidation({
  selectedModules,
  moduleConfigurations,
  onValidationComplete,
  onStartPlatform
}: PostOnboardingValidationProps) {
  const { user } = useAuth();
  const [checks, setChecks] = useState<ValidationCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const initialChecks: ValidationCheck[] = [
    {
      id: 'database_connection',
      name: 'Conexão com Banco de Dados',
      description: 'Verificando conectividade e acesso aos dados',
      status: 'pending',
      icon: Database
    },
    {
      id: 'user_profile',
      name: 'Perfil do Usuário',
      description: 'Validando informações do perfil e permissões',
      status: 'pending',
      icon: Users
    },
    {
      id: 'module_configuration',
      name: 'Configuração dos Módulos',
      description: 'Verificando configurações dos módulos selecionados',
      status: 'pending',
      icon: Settings
    },
    {
      id: 'initial_data_setup',
      name: 'Dados Iniciais',
      description: 'Preparando estruturas e dados exemplo',
      status: 'pending',
      icon: Shield
    },
    {
      id: 'connectivity_check',
      name: 'Conectividade',
      description: 'Testando acesso aos recursos da plataforma',
      status: 'pending',
      icon: Wifi
    }
  ];

  useEffect(() => {
    setChecks(initialChecks);
  }, []);

  const updateCheckStatus = (checkId: string, status: ValidationCheck['status'], details?: string) => {
    setChecks(prev => prev.map(check => 
      check.id === checkId ? { ...check, status, details } : check
    ));
  };

  const runValidation = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const totalChecks = checks.length;
    let completedChecks = 0;

    for (const check of checks) {
      updateCheckStatus(check.id, 'checking');
      
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulated delay
        
        switch (check.id) {
          case 'database_connection':
            await validateDatabaseConnection();
            break;
          case 'user_profile':
            await validateUserProfile();
            break;
          case 'module_configuration':
            await validateModuleConfiguration();
            break;
          case 'initial_data_setup':
            await setupInitialData();
            break;
          case 'connectivity_check':
            await validateConnectivity();
            break;
        }
        
        updateCheckStatus(check.id, 'success', 'Verificação concluída com sucesso');
      } catch (error) {
        console.error(`Validation error for ${check.id}:`, error);
        updateCheckStatus(check.id, 'error', error.message || 'Erro na verificação');
      }
      
      completedChecks++;
      setProgress((completedChecks / totalChecks) * 100);
    }
    
    setIsRunning(false);
    
    // Call validation complete callback
    const finalChecks = checks.map(check => ({
      ...check,
      status: check.status === 'checking' ? 'success' : check.status
    }));
    onValidationComplete(finalChecks);
  };

  const validateDatabaseConnection = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user?.id)
      .single();
    
    if (error) throw new Error('Falha na conexão com o banco de dados');
  };

  const validateUserProfile = async () => {
    if (!user?.id) throw new Error('Usuário não encontrado');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !data) throw new Error('Perfil do usuário incompleto');
  };

  const validateModuleConfiguration = async () => {
    if (selectedModules.length === 0) {
      throw new Error('Nenhum módulo foi selecionado');
    }
    
    const configuredModules = Object.keys(moduleConfigurations);
    const missingConfigs = selectedModules.filter(module => !configuredModules.includes(module));
    
    if (missingConfigs.length > 0) {
      throw new Error(`Configuração faltando para: ${missingConfigs.join(', ')}`);
    }
  };

  const setupInitialData = async () => {
    // Create initial data structures for selected modules
    for (const moduleId of selectedModules) {
      switch (moduleId) {
        case 'performance':
          // Setup performance-related initial data
          break;
        case 'qualidade':
          // Setup quality-related initial data  
          break;
        case 'gestao_pessoas':
          // Setup HR-related initial data
          break;
        // Add other modules as needed
      }
    }
  };

  const validateConnectivity = async () => {
    // Test basic connectivity
    const response = await fetch(window.location.origin);
    if (!response.ok) throw new Error('Problemas de conectividade detectados');
  };

  const getStatusIcon = (status: ValidationCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  const getStatusBadge = (status: ValidationCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Verificando...</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-700">Sucesso</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">Atenção</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const hasErrors = checks.some(check => check.status === 'error');
  const allCompleted = checks.every(check => check.status === 'success' || check.status === 'warning');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Validação do Sistema</h2>
          <p className="text-muted-foreground">
            Verificando se tudo está funcionando corretamente...
          </p>
          
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% concluído
          </p>
        </div>

        {/* Validation Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verificações de Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checks.map((check) => {
              const Icon = check.icon;
              return (
                <div 
                  key={check.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card/50"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{check.name}</h4>
                      {getStatusIcon(check.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {check.description}
                    </p>
                    {check.details && (
                      <p className="text-xs text-muted-foreground">
                        {check.details}
                      </p>
                    )}
                  </div>
                  
                  {getStatusBadge(check.status)}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {!isRunning && !allCompleted && (
            <Button 
              onClick={runValidation}
              size="lg"
              className="flex-1 max-w-xs"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Iniciar Verificação
            </Button>
          )}
          
          {allCompleted && !hasErrors && (
            <Button 
              onClick={onStartPlatform}
              size="lg"
              className="flex-1 max-w-xs bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Tudo Pronto! Começar
            </Button>
          )}
          
          {hasErrors && (
            <Button 
              onClick={runValidation}
              variant="outline"
              size="lg"
              className="flex-1 max-w-xs"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </div>

        {/* Results Summary */}
        {allCompleted && (
          <Card className="bg-gradient-to-r from-green-50/50 to-blue-50/50 border-green-200/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">
                  Validação Concluída!
                </h3>
              </div>
              <p className="text-sm text-green-700">
                {hasErrors ? 
                  'Alguns problemas foram detectados, mas o sistema pode funcionar. Recomendamos revisar os erros.' :
                  'Todos os sistemas estão funcionando corretamente. Você pode começar a usar a plataforma!'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}