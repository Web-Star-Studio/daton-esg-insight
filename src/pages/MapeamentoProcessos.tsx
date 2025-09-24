import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, GitBranch, Clock, User, Settings } from "lucide-react";
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

interface ProcessMap {
  id: string;
  name: string;
  description: string;
  process_type: string;
  status: string;
  created_at: string;
}

export default function MapeamentoProcessos() {
  const [isCreateProcessOpen, setIsCreateProcessOpen] = useState(false);
  const [newProcessData, setNewProcessData] = useState({
    name: "",
    description: "",
    process_type: "Operacional"
  });

  const { data: processMaps, isLoading } = useQuery({
    queryKey: ["process-maps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_maps")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ProcessMap[];
    },
  });

  const handleCreateProcess = async () => {
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
        .from("process_maps")
        .insert([{ ...newProcessData, company_id: profile.company_id }]);

      if (error) throw error;

      toast.success("Processo criado com sucesso!");
      setIsCreateProcessOpen(false);
      setNewProcessData({ name: "", description: "", process_type: "Operacional" });
    } catch (error) {
      toast.error("Erro ao criar processo");
      console.error(error);
    }
  };

  const getProcessTypeColor = (type: string) => {
    switch (type) {
      case "Estratégico": return "bg-purple-100 text-purple-800";
      case "Operacional": return "bg-blue-100 text-blue-800";
      case "Apoio": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mapeamento de Processos</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie os processos da sua organização
          </p>
        </div>
        
        <Dialog open={isCreateProcessOpen} onOpenChange={setIsCreateProcessOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Processo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Processo</Label>
                <Input
                  id="name"
                  value={newProcessData.name}
                  onChange={(e) => setNewProcessData({...newProcessData, name: e.target.value})}
                  placeholder="Ex: Atendimento ao Cliente"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Processo</Label>
                <Select
                  value={newProcessData.process_type}
                  onValueChange={(value) => setNewProcessData({...newProcessData, process_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estratégico">Estratégico</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Apoio">Apoio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newProcessData.description}
                  onChange={(e) => setNewProcessData({...newProcessData, description: e.target.value})}
                  placeholder="Descrição do processo"
                />
              </div>
              <Button onClick={handleCreateProcess} className="w-full">
                Criar Processo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="processes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="processes">Processos</TabsTrigger>
          <TabsTrigger value="sipoc">SIPOC</TabsTrigger>
          <TabsTrigger value="turtle">Tartaruga</TabsTrigger>
          <TabsTrigger value="stakeholders">Partes Interessadas</TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processMaps?.map((process) => (
              <Card key={process.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-primary" />
                    {process.name}
                  </CardTitle>
                  <CardDescription>{process.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Badge className={getProcessTypeColor(process.process_type)}>
                      {process.process_type}
                    </Badge>
                    <Badge variant={process.status === "Ativo" ? "default" : "secondary"}>
                      {process.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <GitBranch className="h-4 w-4 mr-1" />
                      Mapear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!processMaps?.length && (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum processo mapeado</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro processo para começar o mapeamento
                  </p>
                  <Button onClick={() => setIsCreateProcessOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Processo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sipoc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Diagrama SIPOC
              </CardTitle>
              <CardDescription>
                Suppliers, Inputs, Process, Outputs, Customers
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Ferramenta SIPOC estará disponível em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turtle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Diagrama de Tartaruga
              </CardTitle>
              <CardDescription>
                Visualização completa dos elementos do processo
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Diagrama de Tartaruga estará disponível em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stakeholders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Partes Interessadas dos Processos
              </CardTitle>
              <CardDescription>
                Identifique e gerencie as partes interessadas de cada processo
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Integração com gestão de stakeholders estará disponível em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}