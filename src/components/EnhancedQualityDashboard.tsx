import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  TrendingUp,
  Users,
  FileText,
  Target,
  Zap,
  Brain
} from 'lucide-react';

interface NonConformity {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  detectedDate: Date;
  responsibleUser: string;
  category: string;
}

interface ActionPlan {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed';
  progress: number;
  responsible: string;
}

export const EnhancedQualityDashboard: React.FC = () => {
  const { toast } = useToast();
  const [isNCModalOpen, setIsNCModalOpen] = useState(false);
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
  const [newNC, setNewNC] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    category: '',
    responsibleUser: ''
  });
  const [newActionPlan, setNewActionPlan] = useState({
    title: '',
    description: '',
    dueDate: '',
    responsible: ''
  });

  // Mock data - in real app this would come from API
  const nonConformities: NonConformity[] = [
    {
      id: '1',
      title: 'Falha no processo de calibração',
      description: 'Equipamento de medição não calibrado conforme cronograma',
      severity: 'high',
      status: 'open',
      detectedDate: new Date('2024-01-15'),
      responsibleUser: 'João Silva',
      category: 'Equipamentos'
    },
    {
      id: '2',
      title: 'Documentação incompleta',
      description: 'Procedimento operacional não atualizado',
      severity: 'medium',
      status: 'in_progress',
      detectedDate: new Date('2024-01-10'),
      responsibleUser: 'Maria Santos',
      category: 'Documentação'
    }
  ];

  const actionPlans: ActionPlan[] = [
    {
      id: '1',
      title: 'Implementar novo sistema de calibração',
      description: 'Criar cronograma automatizado para calibração de equipamentos',
      dueDate: new Date('2024-02-15'),
      status: 'in_progress',
      progress: 65,
      responsible: 'João Silva'
    },
    {
      id: '2',
      title: 'Atualização de procedimentos',
      description: 'Revisar e atualizar todos os POPs do setor',
      dueDate: new Date('2024-02-28'),
      status: 'planned',
      progress: 0,
      responsible: 'Maria Santos'
    }
  ];

  const handleCreateNC = () => {
    // In real app, this would call an API
    toast({
      title: "Não Conformidade Criada",
      description: `NC "${newNC.title}" foi registrada com sucesso.`,
    });
    setIsNCModalOpen(false);
    setNewNC({ title: '', description: '', severity: 'medium', category: '', responsibleUser: '' });
  };

  const handleCreateActionPlan = () => {
    // In real app, this would call an API
    toast({
      title: "Plano de Ação Criado",
      description: `Plano "${newActionPlan.title}" foi criado com sucesso.`,
    });
    setIsActionPlanModalOpen(false);
    setNewActionPlan({ title: '', description: '', dueDate: '', responsible: '' });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500';
      case 'medium': return 'bg-warning/10 text-warning border-warning';
      case 'low': return 'bg-muted text-muted-foreground border-muted-foreground';
      default: return 'bg-muted text-muted-foreground border-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success';
      case 'in_progress': return 'bg-warning/10 text-warning';
      case 'planned': return 'bg-muted text-muted-foreground';
      case 'open': return 'bg-destructive/10 text-destructive';
      case 'resolved': return 'bg-success/10 text-success';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Gestão da Qualidade</h2>
          <p className="text-muted-foreground">Gerencie não conformidades e planos de ação</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNCModalOpen} onOpenChange={setIsNCModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova NC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Não Conformidade</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova não conformidade identificada
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nc-title">Título</Label>
                  <Input
                    id="nc-title"
                    placeholder="Descreva brevemente a não conformidade"
                    value={newNC.title}
                    onChange={(e) => setNewNC({ ...newNC, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="nc-description">Descrição</Label>
                  <Textarea
                    id="nc-description"
                    placeholder="Descreva detalhadamente a não conformidade"
                    value={newNC.description}
                    onChange={(e) => setNewNC({ ...newNC, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nc-severity">Severidade</Label>
                    <Select value={newNC.severity} onValueChange={(value: any) => setNewNC({ ...newNC, severity: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nc-category">Categoria</Label>
                    <Input
                      id="nc-category"
                      placeholder="Ex: Equipamentos, Documentação"
                      value={newNC.category}
                      onChange={(e) => setNewNC({ ...newNC, category: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nc-responsible">Responsável</Label>
                  <Input
                    id="nc-responsible"
                    placeholder="Nome do responsável"
                    value={newNC.responsibleUser}
                    onChange={(e) => setNewNC({ ...newNC, responsibleUser: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNCModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateNC}>
                    Registrar NC
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isActionPlanModalOpen} onOpenChange={setIsActionPlanModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Plano de Ação</DialogTitle>
                <DialogDescription>
                  Defina as ações para correção e prevenção
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan-title">Título do Plano</Label>
                  <Input
                    id="plan-title"
                    placeholder="Nome do plano de ação"
                    value={newActionPlan.title}
                    onChange={(e) => setNewActionPlan({ ...newActionPlan, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="plan-description">Descrição</Label>
                  <Textarea
                    id="plan-description"
                    placeholder="Descreva as ações a serem executadas"
                    value={newActionPlan.description}
                    onChange={(e) => setNewActionPlan({ ...newActionPlan, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan-due-date">Data Limite</Label>
                    <Input
                      id="plan-due-date"
                      type="date"
                      value={newActionPlan.dueDate}
                      onChange={(e) => setNewActionPlan({ ...newActionPlan, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-responsible">Responsável</Label>
                    <Input
                      id="plan-responsible"
                      placeholder="Nome do responsável"
                      value={newActionPlan.responsible}
                      onChange={(e) => setNewActionPlan({ ...newActionPlan, responsible: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsActionPlanModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateActionPlan}>
                    Criar Plano
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="nonconformities">Não Conformidades</TabsTrigger>
          <TabsTrigger value="actionplans">Planos de Ação</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">NCs Abertas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 desde ontem</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
                <Target className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">3 com prazo próximo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Resolução</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">+5% este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficácia</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">Ações eficazes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Non-Conformities Tab */}
        <TabsContent value="nonconformities" className="space-y-4">
          <div className="space-y-4">
            {nonConformities.map((nc) => (
              <Card key={nc.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{nc.title}</CardTitle>
                      <CardDescription>{nc.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(nc.severity)}>
                        {nc.severity === 'critical' ? 'Crítica' : 
                         nc.severity === 'high' ? 'Alta' :
                         nc.severity === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <Badge className={getStatusColor(nc.status)}>
                        {nc.status === 'open' ? 'Aberta' :
                         nc.status === 'in_progress' ? 'Em Andamento' :
                         nc.status === 'resolved' ? 'Resolvida' : 'Fechada'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Responsável: {nc.responsibleUser}</span>
                    <span>Detectada em: {nc.detectedDate.toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Action Plans Tab */}
        <TabsContent value="actionplans" className="space-y-4">
          {actionPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(plan.status)}>
                    {plan.status === 'completed' ? 'Concluído' :
                     plan.status === 'in_progress' ? 'Em Andamento' : 'Planejado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} className="h-2" />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Responsável: {plan.responsible}</span>
                  <span>Prazo: {plan.dueDate.toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Análises Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg border-l-4 border-accent">
                <h4 className="font-medium">Tendência Identificada</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Aumento de 30% em NCs relacionadas a equipamentos no último trimestre
                </p>
              </div>
              <div className="p-4 bg-warning/10 rounded-lg border-l-4 border-warning">
                <h4 className="font-medium">Recomendação</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Implementar programa preventivo de manutenção pode reduzir NCs em 40%
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border-l-4 border-success">
                <h4 className="font-medium">Destaque Positivo</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Taxa de resolução de NCs melhorou 15% após implementação do novo sistema
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};