import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Target, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SWOTAnalysis {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface SWOTItem {
  id: string;
  category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  item_text: string;
  description: string;
  impact_level: 'low' | 'medium' | 'high';
}

interface SWOTMatrixProps {
  strategicMapId?: string;
}

export default function SWOTMatrix({ strategicMapId }: SWOTMatrixProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newAnalysis, setNewAnalysis] = useState({ title: "", description: "" });
  const [newItem, setNewItem] = useState<{
    item_text: string;
    description: string;
    impact_level: 'low' | 'medium' | 'high';
  }>({ 
    item_text: "", 
    description: "", 
    impact_level: "medium"
  });

  const queryClient = useQueryClient();

  const { data: analyses } = useQuery({
    queryKey: ["swot-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swot_analysis")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as SWOTAnalysis[];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["swot-items", selectedAnalysis],
    queryFn: async () => {
      if (!selectedAnalysis) return [];
      
      const { data, error } = await supabase
        .from("swot_items")
        .select("*")
        .eq("swot_analysis_id", selectedAnalysis)
        .order("order_index");
      
      if (error) throw error;
      return data as SWOTItem[];
    },
    enabled: !!selectedAnalysis,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async (analysisData: typeof newAnalysis) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const { error } = await supabase
        .from("swot_analysis")
        .insert([{ 
          ...analysisData, 
          company_id: profile.company_id,
          strategic_map_id: strategicMapId
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-analyses"] });
      toast.success("Análise SWOT criada com sucesso!");
      setIsCreateOpen(false);
      setNewAnalysis({ title: "", description: "" });
    },
    onError: () => {
      toast.error("Erro ao criar análise SWOT");
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (itemData: typeof newItem & { category: string }) => {
      if (!selectedAnalysis) throw new Error("Nenhuma análise selecionada");

      const { error } = await supabase
        .from("swot_items")
        .insert([{ 
          ...itemData, 
          swot_analysis_id: selectedAnalysis,
          category: itemData.category as SWOTItem['category']
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-items", selectedAnalysis] });
      toast.success("Item adicionado com sucesso!");
      setIsItemOpen(false);
      setNewItem({ item_text: "", description: "", impact_level: "medium" });
      setSelectedCategory('');
    },
    onError: () => {
      toast.error("Erro ao adicionar item");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("swot_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-items", selectedAnalysis] });
      toast.success("Item removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover item");
    },
  });

  const getImpactColor = (level: string): "destructive" | "secondary" | "outline" => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'strengths':
        return { 
          label: 'Forças', 
          icon: Shield, 
          color: 'text-green-600',
          bg: 'bg-green-50 border-green-200'
        };
      case 'weaknesses':
        return { 
          label: 'Fraquezas', 
          icon: AlertTriangle, 
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200'
        };
      case 'opportunities':
        return { 
          label: 'Oportunidades', 
          icon: TrendingUp, 
          color: 'text-blue-600',
          bg: 'bg-blue-50 border-blue-200'
        };
      case 'threats':
        return { 
          label: 'Ameaças', 
          icon: Target, 
          color: 'text-orange-600',
          bg: 'bg-orange-50 border-orange-200'
        };
      default:
        return { 
          label: 'Categoria', 
          icon: Target, 
          color: 'text-muted-foreground',
          bg: 'bg-muted'
        };
    }
  };

  const groupedItems = items?.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SWOTItem[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Análise SWOT</h3>
          <p className="text-sm text-muted-foreground">
            Analise forças, fraquezas, oportunidades e ameaças
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Análise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Análise SWOT</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newAnalysis.title}
                  onChange={(e) => setNewAnalysis({...newAnalysis, title: e.target.value})}
                  placeholder="Nome da análise SWOT"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newAnalysis.description}
                  onChange={(e) => setNewAnalysis({...newAnalysis, description: e.target.value})}
                  placeholder="Descrição da análise"
                />
              </div>
              <Button 
                onClick={() => createAnalysisMutation.mutate(newAnalysis)} 
                className="w-full"
                disabled={createAnalysisMutation.isPending}
              >
                Criar Análise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Análise */}
      {analyses && analyses.length > 0 && (
        <Select value={selectedAnalysis || "none"} onValueChange={setSelectedAnalysis}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma análise SWOT" />
          </SelectTrigger>
          <SelectContent>
            {analyses.map((analysis) => (
              <SelectItem key={analysis.id} value={analysis.id}>
                {analysis.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedAnalysis && (
        <>
          {/* Botão para adicionar item */}
          <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Item SWOT</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strengths">Forças</SelectItem>
                      <SelectItem value="weaknesses">Fraquezas</SelectItem>
                      <SelectItem value="opportunities">Oportunidades</SelectItem>
                      <SelectItem value="threats">Ameaças</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="item_text">Item</Label>
                  <Input
                    id="item_text"
                    value={newItem.item_text}
                    onChange={(e) => setNewItem({...newItem, item_text: e.target.value})}
                    placeholder="Descreva o item"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Descrição detalhada"
                  />
                </div>
                <div>
                  <Label>Nível de Impacto</Label>
                  <Select 
                    value={newItem.impact_level} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setNewItem({...newItem, impact_level: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => createItemMutation.mutate({...newItem, category: selectedCategory})} 
                  className="w-full"
                  disabled={createItemMutation.isPending || !selectedCategory}
                >
                  Adicionar Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Matriz SWOT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['strengths', 'weaknesses', 'opportunities', 'threats'].map((category) => {
              const categoryInfo = getCategoryInfo(category);
              const categoryItems = groupedItems[category] || [];
              const Icon = categoryInfo.icon;

              return (
                <Card key={category} className={categoryInfo.bg}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`flex items-center gap-2 ${categoryInfo.color}`}>
                      <Icon className="h-5 w-5" />
                      {categoryInfo.label}
                    </CardTitle>
                    <CardDescription>
                      {categoryItems.length} itens identificados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-background rounded-lg border shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.item_text}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={getImpactColor(item.impact_level) as "destructive" | "secondary" | "outline"}
                              className="text-xs"
                            >
                              {item.impact_level === 'high' ? 'Alto' : 
                               item.impact_level === 'medium' ? 'Médio' : 'Baixo'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {categoryItems.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        Nenhum item cadastrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!analyses?.length && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma análise SWOT</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira análise SWOT para identificar forças, fraquezas, oportunidades e ameaças
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Análise
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}