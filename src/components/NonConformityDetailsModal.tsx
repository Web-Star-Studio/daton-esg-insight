import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { NonConformityTimelineModal } from "./NonConformityTimelineModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Target,
  TrendingUp,
  History
} from "lucide-react";

interface NonConformityDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nonConformityId: string;
}

export function NonConformityDetailsModal({ 
  open, 
  onOpenChange, 
  nonConformityId 
}: NonConformityDetailsModalProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const queryClient = useQueryClient();

  // Etapa 1: Query otimizada com Promise.all e cache
  const { data: nonConformity, isLoading } = useQuery({
    queryKey: ["non-conformity", nonConformityId],
    queryFn: async () => {
      // Query paralela - NC + perfis ao mesmo tempo
      const [ncResult, profilesResult] = await Promise.all([
        // Buscar NC completo
        supabase
          .from("non_conformities")
          .select("*")
          .eq("id", nonConformityId)
          .single(),
        
        // Pré-carregar perfis comuns
        supabase
          .from("profiles")
          .select("id, full_name")
          .limit(50)
      ]);

      if (ncResult.error) throw ncResult.error;
      
      const nc = ncResult.data;
      const profiles = profilesResult.data || [];
      
      // Enriquecer com dados de usuário
      return {
        ...nc,
        responsible: profiles.find(p => p.id === nc.responsible_user_id),
        approved_by: profiles.find(p => p.id === nc.approved_by_user_id)
      };
    },
    enabled: open && !!nonConformityId,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados "frescos"
    gcTime: 5 * 60 * 1000, // 5 minutos - cache mantido
  });

  // Etapa 6: Optimistic updates
  const handleSave = async () => {
    // Atualiza UI imediatamente (optimistic)
    queryClient.setQueryData(["non-conformity", nonConformityId], editData);
    
    setIsEditing(false);
    toast.success("Salvando alterações...");

    try {
      const { error } = await supabase
        .from("non_conformities")
        .update(editData)
        .eq("id", nonConformityId);

      if (error) throw error;

      toast.success("Não conformidade atualizada!");
      queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
    } catch (error) {
      // Reverter em caso de erro
      queryClient.invalidateQueries({ queryKey: ["non-conformity", nonConformityId] });
      toast.error("Erro ao atualizar. Revertendo mudanças...");
      console.error(error);
    }
  };

  const handleApprove = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("non_conformities")
        .update({
          approved_by_user_id: user.id,
          approval_date: new Date().toISOString(),
          status: "Aprovada"
        })
        .eq("id", nonConformityId);

      if (error) throw error;

      toast.success("Não conformidade aprovada!");
      queryClient.invalidateQueries({ queryKey: ["non-conformity", nonConformityId] });
    } catch (error) {
      toast.error("Erro ao aprovar não conformidade");
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
      case "Aprovada": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Etapa 4: Skeleton loading melhorado
  if (isLoading || !nonConformity) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <div className="h-6 bg-muted animate-pulse rounded w-48" />
            <div className="h-4 bg-muted animate-pulse rounded w-96 mt-2" />
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded" />
              ))}
            </div>
            <div className="h-48 bg-muted animate-pulse rounded" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  NC {nonConformity.nc_number}
                  {/* Etapa 5: Cache indicator */}
                  <Badge variant="outline" className="text-xs ml-2">
                    {queryClient.getQueryState(["non-conformity", nonConformityId])?.dataUpdatedAt 
                      ? `Cache: ${format(new Date(queryClient.getQueryState(["non-conformity", nonConformityId])!.dataUpdatedAt), 'HH:mm:ss')}`
                      : 'Carregando...'
                    }
                  </Badge>
                </DialogTitle>
                <p className="text-muted-foreground mt-1">{nonConformity.title}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTimeline(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Timeline
                </Button>
                {!nonConformity.approved_by_user_id && (
                  <Button
                    size="sm"
                    onClick={handleApprove}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                )}
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                      setEditData(nonConformity);
                    }
                  }}
                >
                  {isEditing ? "Salvar" : "Editar"}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="analysis">Análise</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
                <TabsTrigger value="effectiveness">Eficácia</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Status Atual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={getStatusColor(nonConformity.status)}>
                        {nonConformity.status}
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Severidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={getSeverityColor(nonConformity.severity)}>
                        {nonConformity.severity}
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Grau de Dano</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline">
                        {nonConformity.damage_level || "Não avaliado"}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Categoria</Label>
                        <p className="text-sm text-muted-foreground">{nonConformity.category}</p>
                      </div>
                      <div>
                        <Label>Fonte</Label>
                        <p className="text-sm text-muted-foreground">{nonConformity.source}</p>
                      </div>
                      <div>
                        <Label>Data de Detecção</Label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(nonConformity.detected_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {nonConformity.responsible_user_id && (
                        <div>
                          <Label>Responsável</Label>
                          <p className="text-sm text-muted-foreground">
                            {nonConformity.responsible?.full_name || 'Não informado'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Descrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={editData.description || ""}
                          onChange={(e) => setEditData({...editData, description: e.target.value})}
                          rows={6}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{nonConformity.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Impacto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        placeholder="Descreva o impacto da não conformidade..."
                        value={editData.impact_analysis || ""}
                        onChange={(e) => setEditData({...editData, impact_analysis: e.target.value})}
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {nonConformity.impact_analysis || "Análise de impacto não realizada"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Causa Raiz</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        placeholder="Identifique a causa raiz da não conformidade..."
                        value={editData.root_cause_analysis || ""}
                        onChange={(e) => setEditData({...editData, root_cause_analysis: e.target.value})}
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {nonConformity.root_cause_analysis || "Análise de causa raiz não realizada"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Corretivas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        placeholder="Descreva as ações corretivas a serem implementadas..."
                        value={editData.corrective_actions || ""}
                        onChange={(e) => setEditData({...editData, corrective_actions: e.target.value})}
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {nonConformity.corrective_actions || "Ações corretivas não definidas"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ações Preventivas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        placeholder="Descreva as ações preventivas para evitar recorrência..."
                        value={editData.preventive_actions || ""}
                        onChange={(e) => setEditData({...editData, preventive_actions: e.target.value})}
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {nonConformity.preventive_actions || "Ações preventivas não definidas"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Prazo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.due_date || ""}
                          onChange={(e) => setEditData({...editData, due_date: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm">
                          {nonConformity.due_date 
                            ? format(new Date(nonConformity.due_date), "dd/MM/yyyy", { locale: ptBR })
                            : "Não definido"
                          }
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data de Conclusão</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.completion_date || ""}
                          onChange={(e) => setEditData({...editData, completion_date: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm">
                          {nonConformity.completion_date 
                            ? format(new Date(nonConformity.completion_date), "dd/MM/yyyy", { locale: ptBR })
                            : "Não concluído"
                          }
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="effectiveness" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliação de Eficácia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        placeholder="Avalie a eficácia das ações implementadas..."
                        value={editData.effectiveness_evaluation || ""}
                        onChange={(e) => setEditData({...editData, effectiveness_evaluation: e.target.value})}
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {nonConformity.effectiveness_evaluation || "Avaliação de eficácia não realizada"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data da Avaliação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.effectiveness_date || ""}
                          onChange={(e) => setEditData({...editData, effectiveness_date: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm">
                          {nonConformity.effectiveness_date 
                            ? format(new Date(nonConformity.effectiveness_date), "dd/MM/yyyy", { locale: ptBR })
                            : "Não avaliado"
                          }
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recorrências</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{nonConformity.recurrence_count || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <NonConformityTimelineModal
        open={showTimeline}
        onOpenChange={setShowTimeline}
        nonConformityId={nonConformityId}
      />
    </>
  );
}