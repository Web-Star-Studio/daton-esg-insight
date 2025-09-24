import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, TrendingUp, Calendar, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface OKR {
  id: string;
  title: string;
  description: string;
  quarter: string;
  year: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress_percentage: number;
  created_at: string;
}

interface KeyResult {
  id: string;
  okr_id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  progress_percentage: number;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'at_risk';
}

interface OKRManagementProps {
  strategicMapId?: string;
}

export default function OKRManagement({ strategicMapId }: OKRManagementProps) {
  const [isCreateOKROpen, setIsCreateOKROpen] = useState(false);
  const [isCreateKROpen, setIsCreateKROpen] = useState(false);
  const [selectedOKR, setSelectedOKR] = useState<string | null>(null);
  const [newOKR, setNewOKR] = useState({
    title: "",
    description: "",
    quarter: "",
    year: new Date().getFullYear(),
  });
  const [newKR, setNewKR] = useState({
    title: "",
    description: "",
    target_value: 0,
    unit: "",
    due_date: "",
  });

  const queryClient = useQueryClient();

  const { data: okrs } = useQuery({
    queryKey: ["okrs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("okrs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as OKR[];
    },
  });

  const { data: keyResults } = useQuery({
    queryKey: ["key-results", selectedOKR],
    queryFn: async () => {
      if (!selectedOKR) return [];
      
      const { data, error } = await supabase
        .from("key_results")
        .select("*")
        .eq("okr_id", selectedOKR)
        .order("order_index");
      
      if (error) throw error;
      return data as KeyResult[];
    },
    enabled: !!selectedOKR,
  });

  const createOKRMutation = useMutation({
    mutationFn: async (okrData: typeof newOKR) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const { error } = await supabase
        .from("okrs")
        .insert([{ 
          ...okrData, 
          company_id: profile.company_id,
          strategic_map_id: strategicMapId,
          created_by_user_id: user.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
      toast.success("OKR criado com sucesso!");
      setIsCreateOKROpen(false);
      setNewOKR({ title: "", description: "", quarter: "", year: new Date().getFullYear() });
    },
    onError: () => {
      toast.error("Erro ao criar OKR");
    },
  });

  const createKRMutation = useMutation({
    mutationFn: async (krData: typeof newKR) => {
      if (!selectedOKR) throw new Error("Nenhum OKR selecionado");

      const { error } = await supabase
        .from("key_results")
        .insert([{ 
          ...krData, 
          okr_id: selectedOKR
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results", selectedOKR] });
      toast.success("Resultado-chave adicionado com sucesso!");
      setIsCreateKROpen(false);
      setNewKR({ title: "", description: "", target_value: 0, unit: "", due_date: "" });
    },
    onError: () => {
      toast.error("Erro ao adicionar resultado-chave");
    },
  });

  const updateKRProgressMutation = useMutation({
    mutationFn: async ({ krId, currentValue }: { krId: string; currentValue: number }) => {
      const kr = keyResults?.find(kr => kr.id === krId);
      if (!kr) throw new Error("Key Result não encontrado");

      const progressPercentage = kr.target_value > 0 ? Math.min((currentValue / kr.target_value) * 100, 100) : 0;
      
      const { error } = await supabase
        .from("key_results")
        .update({ 
          current_value: currentValue,
          progress_percentage: progressPercentage,
          status: progressPercentage >= 100 ? 'completed' : 
                 progressPercentage > 0 ? 'in_progress' : 'not_started'
        })
        .eq("id", krId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results", selectedOKR] });
      toast.success("Progresso atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar progresso");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': case 'in_progress': return 'secondary';
      case 'at_risk': return 'destructive';
      case 'draft': case 'not_started': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completo';
      case 'active': return 'Ativo';
      case 'in_progress': return 'Em Andamento';
      case 'at_risk': return 'Em Risco';
      case 'draft': return 'Rascunho';
      case 'not_started': return 'Não Iniciado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">OKRs - Objetivos e Resultados-Chave</h3>
          <p className="text-sm text-muted-foreground">
            Defina e acompanhe objetivos mensuráveis para sua organização
          </p>
        </div>
        
        <Dialog open={isCreateOKROpen} onOpenChange={setIsCreateOKROpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo OKR
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo OKR</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Objetivo</Label>
                <Input
                  id="title"
                  value={newOKR.title}
                  onChange={(e) => setNewOKR({...newOKR, title: e.target.value})}
                  placeholder="Ex: Aumentar satisfação do cliente"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newOKR.description}
                  onChange={(e) => setNewOKR({...newOKR, description: e.target.value})}
                  placeholder="Descrição detalhada do objetivo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trimestre</Label>
                  <Select value={newOKR.quarter} onValueChange={(value) => setNewOKR({...newOKR, quarter: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newOKR.year}
                    onChange={(e) => setNewOKR({...newOKR, year: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <Button 
                onClick={() => createOKRMutation.mutate(newOKR)} 
                className="w-full"
                disabled={createOKRMutation.isPending}
              >
                Criar OKR
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de OKRs */}
      <div className="grid gap-4">
        {okrs?.map((okr) => (
          <Card key={okr.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {okr.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {okr.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(okr.status) as any}>
                    {getStatusLabel(okr.status)}
                  </Badge>
                  <Badge variant="outline">
                    {okr.quarter} {okr.year}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso Geral</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(okr.progress_percentage)}%
                    </span>
                  </div>
                  <Progress value={okr.progress_percentage} className="h-2" />
                </div>

                {selectedOKR === okr.id && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Resultados-Chave</h4>
                      <Dialog open={isCreateKROpen} onOpenChange={setIsCreateKROpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar KR
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Resultado-Chave</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="kr_title">Resultado-Chave</Label>
                              <Input
                                id="kr_title"
                                value={newKR.title}
                                onChange={(e) => setNewKR({...newKR, title: e.target.value})}
                                placeholder="Ex: Atingir NPS de 70"
                              />
                            </div>
                            <div>
                              <Label htmlFor="kr_description">Descrição</Label>
                              <Textarea
                                id="kr_description"
                                value={newKR.description}
                                onChange={(e) => setNewKR({...newKR, description: e.target.value})}
                                placeholder="Como medir este resultado"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="target_value">Meta</Label>
                                <Input
                                  id="target_value"
                                  type="number"
                                  value={newKR.target_value}
                                  onChange={(e) => setNewKR({...newKR, target_value: parseFloat(e.target.value)})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="unit">Unidade</Label>
                                <Input
                                  id="unit"
                                  value={newKR.unit}
                                  onChange={(e) => setNewKR({...newKR, unit: e.target.value})}
                                  placeholder="%, pontos, etc"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="due_date">Data Limite</Label>
                              <Input
                                id="due_date"
                                type="date"
                                value={newKR.due_date}
                                onChange={(e) => setNewKR({...newKR, due_date: e.target.value})}
                              />
                            </div>
                            <Button 
                              onClick={() => createKRMutation.mutate(newKR)} 
                              className="w-full"
                              disabled={createKRMutation.isPending}
                            >
                              Adicionar Resultado-Chave
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {keyResults?.map((kr) => (
                      <div key={kr.id} className="p-3 border rounded-lg bg-background">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{kr.title}</h5>
                            {kr.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {kr.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={getStatusColor(kr.status) as any} className="text-xs">
                            {getStatusLabel(kr.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Progresso: {kr.current_value} / {kr.target_value} {kr.unit}</span>
                            <span>{Math.round(kr.progress_percentage)}%</span>
                          </div>
                          <Progress value={kr.progress_percentage} className="h-1" />
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs"
                              placeholder="Valor atual"
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  updateKRProgressMutation.mutate({ 
                                    krId: kr.id, 
                                    currentValue: value 
                                  });
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {kr.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(kr.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!keyResults?.length && (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        Nenhum resultado-chave definido. Adicione resultados mensuráveis para este objetivo.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOKR(selectedOKR === okr.id ? null : okr.id)}
                  className="w-full"
                >
                  {selectedOKR === okr.id ? 'Recolher' : 'Ver Detalhes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!okrs?.length && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum OKR criado</h3>
            <p className="text-muted-foreground mb-4">
              Comece definindo seus objetivos e resultados-chave para acompanhar o progresso
            </p>
            <Button onClick={() => setIsCreateOKROpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro OKR
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}