import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, Building, Database, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrimeiroPassoItem {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  priority: 'alta' | 'media' | 'baixa';
}

const primeirosPassos: PrimeiroPassoItem[] = [
  {
    id: 'config-org',
    title: 'Configure sua Organização',
    description: 'Defina dados básicos, estrutura organizacional e informações gerais',
    path: '/configuracao-organizacao',
    icon: Building,
    completed: false,
    priority: 'alta'
  },
  {
    id: 'primeira-emissao',
    title: 'Adicione sua Primeira Fonte de Emissão',
    description: 'Comece seu inventário GEE cadastrando uma fonte de emissão',
    path: '/inventario-gee',
    icon: Database,
    completed: false,
    priority: 'alta'
  },
  {
    id: 'primeiro-relatorio',
    title: 'Crie seu Primeiro Relatório',
    description: 'Gere um relatório inicial para visualizar seus dados ESG',
    path: '/gerador-relatorios',
    icon: FileBarChart,
    completed: false,
    priority: 'media'
  }
];

export function PrimeirosPassosWidget() {
  const navigate = useNavigate();
  const completedSteps = primeirosPassos.filter(step => step.completed).length;
  const progress = (completedSteps / primeirosPassos.length) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return priority;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Primeiros Passos</CardTitle>
            <CardDescription>
              Complete estas ações essenciais para começar a usar o sistema
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{completedSteps}/{primeirosPassos.length}</div>
            <div className="text-xs text-muted-foreground">concluídos</div>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {primeirosPassos.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate(step.path)}
          >
            <div className="flex-shrink-0 mt-1">
              {step.completed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <step.icon className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">{step.title}</h4>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(step.priority)}`}
                >
                  {getPriorityLabel(step.priority)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
            </div>
            
            <div className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {completedSteps === primeirosPassos.length && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-medium text-green-800 mb-1">Parabéns!</h4>
            <p className="text-sm text-green-600">
              Você completou todos os primeiros passos. Agora explore as funcionalidades avançadas do sistema.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}