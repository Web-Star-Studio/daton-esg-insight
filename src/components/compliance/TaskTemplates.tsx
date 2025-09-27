import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, User } from 'lucide-react';
import { useCompliance } from '@/contexts/ComplianceContext';

const taskTemplates = [
  {
    id: 'monthly-report',
    title: 'Relatório Mensal de Compliance',
    description: 'Compilação das atividades de compliance do mês',
    frequency: 'Mensal',
    estimatedHours: 4,
    responsibleArea: 'Compliance'
  },
  {
    id: 'quarterly-audit',
    title: 'Auditoria Trimestral',
    description: 'Revisão trimestral dos processos e controles',
    frequency: 'Trimestral',
    estimatedHours: 8,
    responsibleArea: 'Auditoria Interna'
  },
  {
    id: 'regulatory-update',
    title: 'Atualização Regulatória',
    description: 'Monitoramento e implementação de novas regulamentações',
    frequency: 'Sob Demanda',
    estimatedHours: 2,
    responsibleArea: 'Jurídico'
  },
  {
    id: 'training-completion',
    title: 'Conclusão de Treinamento Obrigatório',
    description: 'Verificação da conclusão de treinamentos obrigatórios',
    frequency: 'Anual',
    estimatedHours: 1,
    responsibleArea: 'RH'
  }
];

export function TaskTemplates() {
  const { createTask, setShowTaskModal, users } = useCompliance();

  const handleUseTemplate = (template: any) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 dias a partir de hoje

    const taskData = {
      title: template.title,
      description: template.description,
      frequency: template.frequency,
      due_date: dueDate.toISOString().split('T')[0],
      notes: `Tarefa criada a partir do template: ${template.title}. Tempo estimado: ${template.estimatedHours}h`
    };

    createTask(taskData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Tarefas</h3>
          <p className="text-sm text-muted-foreground">
            Use templates para criar tarefas recorrentes rapidamente
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Criar Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {taskTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{template.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {template.frequency}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {template.estimatedHours}h
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {template.responsibleArea}
                </Badge>
              </div>

              <Button 
                onClick={() => handleUseTemplate(template)}
                className="w-full" 
                size="sm"
              >
                Usar Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}