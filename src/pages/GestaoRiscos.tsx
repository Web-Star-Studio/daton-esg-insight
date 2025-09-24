import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertTriangle, Shield, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface RiskMatrix {
  id: string;
  name: string;
  description: string;
  matrix_type: string;
  created_at: string;
}

interface RiskAssessment {
  id: string;
  risk_title: string;
  risk_description: string;
  category: string;
  probability: string;
  impact: string;
  risk_level: string;
  status: string;
}

export default function GestaoRiscos() {
  const [isCreateMatrixOpen, setIsCreateMatrixOpen] = useState(false);
  const [isCreateRiskOpen, setIsCreateRiskOpen] = useState(false);
  const [newMatrixData, setNewMatrixData] = useState({
    name: "",
    description: "",
    matrix_type: "Operacional"
  });
  const [newRiskData, setNewRiskData] = useState({
    risk_title: "",
    risk_description: "",
    category: "",
    probability: "Baixa",
    impact: "Baixo"
  });

  const { data: riskMatrices, isLoading: matricesLoading } = useQuery({
    queryKey: ["risk-matrices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_matrices")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as RiskMatrix[];
    },
  });

  const handleCreateMatrix = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const { error } = await supabase
        .from("risk_matrices")
        .insert([{ ...newMatrixData, company_id: profile.company_id }]);

      if (error) throw error;

      toast.success("Matriz de risco criada com sucesso!");
      setIsCreateMatrixOpen(false);
      setNewMatrixData({ name: "", description: "", matrix_type: "Operacional" });
    } catch (error) {
      toast.error("Erro ao criar matriz de risco");
      console.error(error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "crítico": return "bg-red-100 text-red-800 border-red-200";
      case "alto": return "bg-orange-100 text-orange-800 border-orange-200";
      case "médio": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "baixo": return "bg-green-100 text-green-800 border-green-200";
      case "muito baixo": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMatrixTypeIcon = (type: string) => {
    switch (type) {
      case "Estratégico": return <TrendingUp className="h-4 w-4" />;
      case "Operacional": return <Shield className="h-4 w-4" />;
      case "Financeiro": return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (matricesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Riscos</h1>
          <p className="text-muted-foreground mt-2">
            Identifique, avalie e gerencie os riscos da sua organização
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateMatrixOpen} onOpenChange={setIsCreateMatrixOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Matriz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Matriz de Risco</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="matrix-name">Nome da Matriz</Label>
                  <Input
                    id="matrix-name"
                    value={newMatrixData.name}
                    onChange={(e) => setNewMatrixData({...newMatrixData, name: e.target.value})}
                    placeholder="Ex: Riscos Operacionais 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="matrix-type">Tipo da Matriz</Label>
                  <Select
                    value={newMatrixData.matrix_type}
                    onValueChange={(value) => setNewMatrixData({...newMatrixData, matrix_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Estratégico">Estratégico</SelectItem>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="matrix-description">Descrição</Label>
                  <Textarea
                    id="matrix-description"
                    value={newMatrixData.description}
                    onChange={(e) => setNewMatrixData({...newMatrixData, description: e.target.value})}
                    placeholder="Descrição da matriz de risco"
                  />
                </div>
                <Button onClick={handleCreateMatrix} className="w-full">
                  Criar Matriz
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateRiskOpen} onOpenChange={setIsCreateRiskOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Risco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Identificar Novo Risco</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="risk-title">Título do Risco</Label>
                  <Input
                    id="risk-title"
                    value={newRiskData.risk_title}
                    onChange={(e) => setNewRiskData({...newRiskData, risk_title: e.target.value})}
                    placeholder="Ex: Falha no sistema de produção"
                  />
                </div>
                <div>
                  <Label htmlFor="risk-category">Categoria</Label>
                  <Input
                    id="risk-category"
                    value={newRiskData.category}
                    onChange={(e) => setNewRiskData({...newRiskData, category: e.target.value})}
                    placeholder="Ex: Tecnológico"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="probability">Probabilidade</Label>
                    <Select
                      value={newRiskData.probability}
                      onValueChange={(value) => setNewRiskData({...newRiskData, probability: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="impact">Impacto</Label>
                    <Select
                      value={newRiskData.impact}
                      onValueChange={(value) => setNewRiskData({...newRiskData, impact: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixo">Baixo</SelectItem>
                        <SelectItem value="Médio">Médio</SelectItem>
                        <SelectItem value="Alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="risk-description">Descrição</Label>
                  <Textarea
                    id="risk-description"
                    value={newRiskData.risk_description}
                    onChange={(e) => setNewRiskData({...newRiskData, risk_description: e.target.value})}
                    placeholder="Descrição detalhada do risco"
                  />
                </div>
                <Button className="w-full">
                  Identificar Risco
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="matrices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrices">Matrizes de Risco</TabsTrigger>
          <TabsTrigger value="risks">Riscos Identificados</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
        </TabsList>

        <TabsContent value="matrices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {riskMatrices?.map((matrix) => (
              <Card key={matrix.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getMatrixTypeIcon(matrix.matrix_type)}
                    {matrix.name}
                  </CardTitle>
                  <CardDescription>{matrix.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="secondary">
                      {matrix.matrix_type}
                    </Badge>
                    <Badge variant="default">
                      Ativa
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Riscos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!riskMatrices?.length && (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma matriz de risco</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira matriz para começar a gestão de riscos
                  </p>
                  <Button onClick={() => setIsCreateMatrixOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Matriz
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum risco identificado</h3>
              <p className="text-muted-foreground mb-4">
                Identifique e avalie os riscos da sua organização
              </p>
              <Button onClick={() => setIsCreateRiskOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Identificar Primeiro Risco
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mapa de Oportunidades
              </CardTitle>
              <CardDescription>
                Identifique e gerencie oportunidades de melhoria
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Módulo de oportunidades estará disponível em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}