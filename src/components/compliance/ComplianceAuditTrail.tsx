import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Edit,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';

// Mock data para demonstração - em produção viria da API
const auditTrailData = [
  {
    id: '1',
    action: 'task_created',
    description: 'Nova tarefa criada: "Relatório Mensal ESG"',
    user: { name: 'João Silva', initials: 'JS' },
    timestamp: '2024-01-15T10:30:00Z',
    details: {
      taskTitle: 'Relatório Mensal ESG',
      status: 'Pendente',
      dueDate: '2024-02-15'
    }
  },
  {
    id: '2',
    action: 'task_updated',
    description: 'Status alterado de "Pendente" para "Em Andamento"',
    user: { name: 'Maria Santos', initials: 'MS' },
    timestamp: '2024-01-14T14:20:00Z',
    details: {
      taskTitle: 'Auditoria Trimestral',
      oldStatus: 'Pendente',
      newStatus: 'Em Andamento'
    }
  },
  {
    id: '3',
    action: 'task_completed',
    description: 'Tarefa concluída: "Treinamento de Compliance"',
    user: { name: 'Carlos Oliveira', initials: 'CO' },
    timestamp: '2024-01-13T16:45:00Z',
    details: {
      taskTitle: 'Treinamento de Compliance',
      completionDate: '2024-01-13'
    }
  },
  {
    id: '4',
    action: 'requirement_added',
    description: 'Novo requisito regulatório adicionado',
    user: { name: 'Ana Costa', initials: 'AC' },
    timestamp: '2024-01-12T09:15:00Z',
    details: {
      requirementTitle: 'Lei Geral de Proteção de Dados - Art. 50',
      jurisdiction: 'Federal'
    }
  },
  {
    id: '5',
    action: 'bulk_update',
    description: 'Atualização em lote: 5 tarefas tiveram prazo prorrogado',
    user: { name: 'Roberto Lima', initials: 'RL' },
    timestamp: '2024-01-11T11:30:00Z',
    details: {
      tasksCount: 5,
      action: 'Prazo prorrogado em 7 dias'
    }
  }
];

const getActionIcon = (action: string) => {
  switch (action) {
    case 'task_created':
      return <Plus className="h-4 w-4 text-green-600" />;
    case 'task_updated':
      return <Edit className="h-4 w-4 text-blue-600" />;
    case 'task_completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'task_deleted':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'requirement_added':
      return <FileText className="h-4 w-4 text-purple-600" />;
    case 'bulk_update':
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'task_created':
    case 'task_completed':
      return 'success';
    case 'task_updated':
      return 'secondary';
    case 'task_deleted':
      return 'destructive';
    case 'requirement_added':
      return 'default';
    case 'bulk_update':
      return 'warning';
    default:
      return 'secondary';
  }
};

export function ComplianceAuditTrail() {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Trilha de Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 pr-4">
          <div className="space-y-4">
            {auditTrailData.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Linha vertical conectora */}
                {index < auditTrailData.length - 1 && (
                  <div className="absolute left-5 top-12 w-px h-8 bg-border" />
                )}
                
                <div className="flex gap-3">
                  {/* Ícone da ação */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 bg-background flex items-center justify-center">
                    {getActionIcon(entry.action)}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {entry.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">
                              {entry.user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {entry.user.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={getActionColor(entry.action) as any}
                          className="text-xs"
                        >
                          {entry.action.replace('_', ' ').toUpperCase()}
                        </Badge>
                        
                        <div className="text-xs text-muted-foreground text-right">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.timestamp).date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(entry.timestamp).time}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detalhes adicionais */}
                    {entry.details && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        {Object.entries(entry.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                            </span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}