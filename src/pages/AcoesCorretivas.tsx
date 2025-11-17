import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, CheckSquare, Calendar, AlertCircle, Clock, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserAndCompany } from '@/utils/auth';
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ActionPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  plan_type: string;
  objective: string | null;
  created_at: string;
  updated_at: string;
}

const AcoesCorretivas = () => {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [newActionPlan, setNewActionPlan] = useState({
    title: '',
    description: '',
    status: 'Planejado',
    plan_type: 'Corretiva',
    objective: ''
  });

  useEffect(() => {
    loadActionPlans();
  }, []);

  const loadActionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('action_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActionPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos de ação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos de ação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActionPlan = async () => {
    try {
      // Validar campos obrigatórios
      if (!newActionPlan.title.trim()) {
        toast({
          title: "Atenção",
          description: "O título do plano de ação é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);

      // Usar função utilitária getUserAndCompany()
      const userAndCompany = await getUserAndCompany();
      
      if (!userAndCompany?.company_id || !userAndCompany?.id) {
        throw new Error('Usuário não autenticado ou sem empresa vinculada');
      }

      const { error } = await supabase
        .from('action_plans')
        .insert([{
          ...newActionPlan,
          company_id: userAndCompany.company_id,
          created_by_user_id: userAndCompany.id
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de ação criado com sucesso!",
      });

      setIsCreateModalOpen(false);
      setNewActionPlan({
        title: '',
        description: '',
        status: 'Planejado',
        plan_type: 'Corretiva',
        objective: ''
      });
      
      loadActionPlans();
    } catch (error) {
      console.error('Erro ao criar plano de ação:', error);
      
      let errorMessage = "Não foi possível criar o plano de ação.";
      
      if (error instanceof Error) {
        if (error.message.includes('não autenticado')) {
          errorMessage = "Sessão expirada. Faça login novamente.";
        } else if (error.message.includes('empresa vinculada')) {
          errorMessage = "Seu usuário não está vinculado a uma empresa. Entre em contato com o suporte.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Planejado':
        return <Clock className="h-4 w-4" />;
      case 'Em Andamento':
        return <AlertCircle className="h-4 w-4" />;
      case 'Concluído':
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejado':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Em Andamento':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Concluído':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Corretiva':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'Preventiva':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Melhoria':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const filteredActionPlans = actionPlans.filter(plan =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ''
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando ações corretivas..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ações Corretivas</h1>
            <p className="text-muted-foreground">Gestão de planos de ação corretiva e preventiva</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Ação</DialogTitle>
                <DialogDescription>
                  Defina um novo plano de ação corretiva ou preventiva.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título da Ação</Label>
                  <Input
                    id="title"
                    value={newActionPlan.title}
                    onChange={(e) => setNewActionPlan({ ...newActionPlan, title: e.target.value })}
                    placeholder="Ex: Correção de não conformidade no processo..."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newActionPlan.description}
                    onChange={(e) => setNewActionPlan({ ...newActionPlan, description: e.target.value })}
                    placeholder="Descreva detalhadamente a ação a ser executada..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="objective">Objetivo</Label>
                  <Textarea
                    id="objective"
                    value={newActionPlan.objective}
                    onChange={(e) => setNewActionPlan({ ...newActionPlan, objective: e.target.value })}
                    placeholder="Qual o objetivo desta ação?"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan_type">Tipo</Label>
                    <Select value={newActionPlan.plan_type} onValueChange={(value) => setNewActionPlan({ ...newActionPlan, plan_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Corretiva">Corretiva</SelectItem>
                        <SelectItem value="Preventiva">Preventiva</SelectItem>
                        <SelectItem value="Melhoria">Melhoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newActionPlan.status} onValueChange={(value) => setNewActionPlan({ ...newActionPlan, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planejado">Planejado</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateActionPlan} 
                  disabled={isCreating || !newActionPlan.title.trim()}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Ação'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar ações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Planos de Ação
            </CardTitle>
            <CardDescription>
              Gestão de ações corretivas, preventivas e de melhoria do SGQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredActionPlans.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhuma ação encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente uma pesquisa diferente.' : 'Comece criando sua primeira ação corretiva.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActionPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.title}</p>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {plan.description.substring(0, 80)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(plan.plan_type)}>
                          {plan.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${getStatusColor(plan.status)}`}>
                          {getStatusIcon(plan.status)}
                          {plan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcoesCorretivas;