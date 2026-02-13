import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, TrendingUp, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from "@/utils/formErrorHandler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SWOTMatrix from "@/components/SWOTMatrix";
import OKRManagement from "@/components/OKRManagement";
import StrategicDashboard from "@/components/StrategicDashboard";
import EnhancedBSC from "@/components/EnhancedBSC";
import StrategicInitiatives from "@/components/StrategicInitiatives";

interface StrategicMap {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface BSCPerspective {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

export default function PlanejamentoEstrategico() {
  const [isCreateMapOpen, setIsCreateMapOpen] = useState(false);
  const [newMapData, setNewMapData] = useState({ name: "", description: "" });
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("maps");
  const queryClient = useQueryClient();

  const { data: strategicMaps, isLoading } = useQuery({
    queryKey: ["strategic-maps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_maps")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StrategicMap[];
    },
    staleTime: 30 * 1000,
  });

  const createMapMutation = useMutation({
    mutationFn: async (mapData: { name: string; description: string }) => {
      const { profile } = await formErrorHandler.checkAuth();

      const { data, error } = await supabase
        .from("strategic_maps")
        .insert([{ 
          ...mapData, 
          company_id: profile.company_id 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Mapa estratégico criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["strategic-maps"] });
      setIsCreateMapOpen(false);
      setNewMapData({ name: "", description: "" });
    },
    onError: (error: any) => {
      console.error("Error creating map:", error);
      toast.error(error.message || "Erro ao criar mapa estratégico");
    }
  });

  const handleCreateMap = async () => {
    if (!newMapData.name.trim()) {
      toast.error("Por favor, preencha o nome do mapa estratégico");
      return;
    }

    createMapMutation.mutate(newMapData);
  };

  // Auto-selecionar o primeiro mapa quando os dados carregarem
  useEffect(() => {
    if (strategicMaps?.length && !selectedMapId) {
      setSelectedMapId(strategicMaps[0].id);
    }
  }, [strategicMaps, selectedMapId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planejamento Estratégico</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie mapas estratégicos, BSC e OKRs da sua organização
          </p>
        </div>
        
        <Dialog open={isCreateMapOpen} onOpenChange={setIsCreateMapOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Mapa Estratégico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Mapa Estratégico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newMapData.name}
                  onChange={(e) => setNewMapData({...newMapData, name: e.target.value})}
                  placeholder="Nome do mapa estratégico"
                  required
                  autoFocus
                  disabled={createMapMutation.isPending}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newMapData.description}
                  onChange={(e) => setNewMapData({...newMapData, description: e.target.value})}
                  placeholder="Descrição do mapa estratégico (opcional)"
                  rows={4}
                  disabled={createMapMutation.isPending}
                />
              </div>
              <Button 
                onClick={handleCreateMap} 
                className="w-full"
                disabled={createMapMutation.isPending}
              >
                {createMapMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Criando...
                  </>
                ) : (
                  'Criar Mapa'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedMapId && (
        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Mapa Estratégico Ativo:</p>
                  <p className="text-lg font-semibold">
                    {strategicMaps?.find(m => m.id === selectedMapId)?.name}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab("maps")}
              >
                Trocar Mapa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="maps" className="min-w-fit">Mapas</TabsTrigger>
          <TabsTrigger value="bsc" className="min-w-fit">BSC</TabsTrigger>
          <TabsTrigger value="okrs" className="min-w-fit">OKRs</TabsTrigger>
          <TabsTrigger value="swot" className="min-w-fit">SWOT</TabsTrigger>
          <TabsTrigger value="initiatives" className="min-w-fit">Iniciativas</TabsTrigger>
          <TabsTrigger value="dashboard" className="min-w-fit">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="maps" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {strategicMaps?.map((map) => (
              <Card 
                key={map.id} 
                className={cn(
                  "hover:shadow-lg transition-all cursor-pointer",
                  selectedMapId === map.id && "ring-2 ring-primary shadow-xl"
                )}
                onClick={() => setSelectedMapId(map.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {map.name}
                  </CardTitle>
                  <CardDescription>{map.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant={selectedMapId === map.id ? "default" : "secondary"}>
                      {selectedMapId === map.id ? "Ativo" : "Disponível"}
                    </Badge>
                    <Button 
                      variant={selectedMapId === map.id ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMapId(map.id);
                        setActiveTab("bsc");
                        toast.success(`Visualizando: ${map.name}`);
                      }}
                    >
                      {selectedMapId === map.id ? (
                        <>
                          <Target className="h-4 w-4 mr-1" />
                          Selecionado
                        </>
                      ) : (
                        'Visualizar'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!strategicMaps?.length && (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum mapa estratégico</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro mapa estratégico para começar o planejamento
                  </p>
                  <Button onClick={() => setIsCreateMapOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Mapa
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bsc" className="space-y-4">
          <EnhancedBSC strategicMapId={selectedMapId || undefined} />
        </TabsContent>

        <TabsContent value="swot" className="space-y-4">
          <SWOTMatrix strategicMapId={selectedMapId || undefined} />
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          <StrategicInitiatives strategicMapId={selectedMapId || undefined} />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <StrategicDashboard />
        </TabsContent>

        <TabsContent value="okrs" className="space-y-4">
          <OKRManagement strategicMapId={selectedMapId || undefined} />
        </TabsContent>
      </Tabs>
    </>
  );
}