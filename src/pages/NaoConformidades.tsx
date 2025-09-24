import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle, CheckCircle, Clock, Eye, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NonConformity {
  id: string;
  nc_number: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  source: string;
  detected_date: string;
  status: string;
  created_at: string;
}

export default function NaoConformidades() {
  const [isCreateNCOpen, setIsCreateNCOpen] = useState(false);
  const [newNCData, setNewNCData] = useState({
    title: "",
    description: "",
    category: "",
    severity: "Baixa",
    source: "Processo",
    detected_date: new Date().toISOString().split('T')[0]
  });

  const { data: nonConformities, isLoading } = useQuery({
    queryKey: ["non-conformities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("non_conformities")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as NonConformity[];
    },
  });

  const generateNCNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `NC-${year}${month}${day}-${timestamp}`;
  };

  const handleCreateNC = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const ncNumber = generateNCNumber();
      const { error } = await supabase
        .from("non_conformities")
        .insert([{
          ...newNCData,
          nc_number: ncNumber,
          company_id: profile.company_id
        }]);

      if (error) throw error;

      toast.success("Não conformidade registrada com sucesso!");
      setIsCreateNCOpen(false);
      setNewNCData({
        title: "",
        description: "",
        category: "",
        severity: "Baixa",
        source: "Processo",
        detected_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error("Erro ao registrar não conformidade");
      console.error(error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Crítica": return "bg-red-100 text-red-800 border-red-200";
      case "Alta": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Média": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Baixa": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberta": return "bg-red-100 text-red-800";
      case "Em Análise": return "bg-yellow-100 text-yellow-800";
      case "Em Correção": return "bg-blue-100 text-blue-800";
      case "Fechada": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aberta": return <AlertCircle className="h-4 w-4" />;
      case "Em Análise": return <Clock className="h-4 w-4" />;
      case "Em Correção": return <Clock className="h-4 w-4" />;
      case "Fechada": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Stats calculations
  const totalNCs = nonConformities?.length || 0;
  const openNCs = nonConformities?.filter(nc => nc.status === "Aberta").length || 0;
  const criticalNCs = nonConformities?.filter(nc => nc.severity === "Crítica").length || 0;
  const closedNCs = nonConformities?.filter(nc => nc.status === "Fechada").length || 0;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Não Conformidades</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie não conformidades e ações corretivas
          </p>
        </div>
        
        <Dialog open={isCreateNCOpen} onOpenChange={setIsCreateNCOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar NC
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Não Conformidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newNCData.title}
                    onChange={(e) => setNewNCData({...newNCData, title: e.target.value})}
                    placeholder="Título da não conformidade"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={newNCData.category}
                    onChange={(e) => setNewNCData({...newNCData, category: e.target.value})}
                    placeholder="Ex: Qualidade, Segurança"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="severity">Severidade</Label>
                  <Select
                    value={newNCData.severity}
                    onValueChange={(value) => setNewNCData({...newNCData, severity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Crítica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Fonte</Label>
                  <Select
                    value={newNCData.source}
                    onValueChange={(value) => setNewNCData({...newNCData, source: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auditoria Interna">Auditoria Interna</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                      <SelectItem value="Processo">Processo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="detected_date">Data de Detecção</Label>
                  <Input
                    id="detected_date"
                    type="date"
                    value={newNCData.detected_date}
                    onChange={(e) => setNewNCData({...newNCData, detected_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newNCData.description}
                  onChange={(e) => setNewNCData({...newNCData, description: e.target.value})}
                  placeholder="Descrição detalhada da não conformidade"
                  rows={4}
                />
              </div>
              
              <Button onClick={handleCreateNC} className="w-full">
                Registrar Não Conformidade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de NCs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNCs}</div>
            <p className="text-xs text-muted-foreground">
              registradas no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs Abertas</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openNCs}</div>
            <p className="text-xs text-muted-foreground">
              aguardando resolução
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs Críticas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalNCs}</div>
            <p className="text-xs text-muted-foreground">
              requerem atenção imediata
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCs Fechadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{closedNCs}</div>
            <p className="text-xs text-muted-foreground">
              resolvidas com sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NCs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Não Conformidades</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as não conformidades registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nonConformities?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonConformities.map((nc) => (
                  <TableRow key={nc.id}>
                    <TableCell className="font-mono text-sm">
                      {nc.nc_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {nc.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {nc.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(nc.severity)}>
                        {nc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(nc.status)}>
                        {getStatusIcon(nc.status)}
                        <span className="ml-1">{nc.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(nc.detected_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma não conformidade registrada</h3>
              <p className="text-muted-foreground mb-4">
                Registre a primeira não conformidade para começar o controle
              </p>
              <Button onClick={() => setIsCreateNCOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira NC
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}