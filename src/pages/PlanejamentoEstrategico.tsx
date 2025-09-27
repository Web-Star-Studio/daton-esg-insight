import { useState } from "react";
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
  });

  const handleCreateMap = async () => {
    return formErrorHandler.createRecord(async () => {
      const { profile } = await formErrorHandler.checkAuth();

      const { data, error } = await supabase
        .from("strategic_maps")
        .insert([{ 
          ...newMapData, 
          company_id: profile.company_id 
        }])
        .select()
        .single();

      if (error) throw error;

      setIsCreateMapOpen(false);
      setNewMapData({ name: "", description: "" });
      return data;
    }, { 
      formType: 'Mapa Estratégico',
      successMessage: 'Mapa estratégico criado com sucesso!'
    });
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
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newMapData.description}
                  onChange={(e) => setNewMapData({...newMapData, description: e.target.value})}
                  placeholder="Descrição do mapa estratégico"
                />
              </div>
              <Button onClick={handleCreateMap} className="w-full">
                Criar Mapa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="maps" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="maps">Mapas</TabsTrigger>
          <TabsTrigger value="bsc">BSC</TabsTrigger>
          <TabsTrigger value="okrs">OKRs</TabsTrigger>
          <TabsTrigger value="swot">SWOT</TabsTrigger>
          <TabsTrigger value="initiatives">Iniciativas</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="maps" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {strategicMaps?.map((map) => (
              <Card key={map.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {map.name}
                  </CardTitle>
                  <CardDescription>{map.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">Ativo</Badge>
                    <Button variant="outline" size="sm">
                      Visualizar
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
          <EnhancedBSC strategicMapId={strategicMaps?.[0]?.id} />
        </TabsContent>

        <TabsContent value="swot" className="space-y-4">
          <SWOTMatrix />
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          <StrategicInitiatives />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <StrategicDashboard />
        </TabsContent>

        <TabsContent value="okrs" className="space-y-4">
          <OKRManagement />
        </TabsContent>
      </Tabs>
    </>
  );
}