import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NonConformityTimelineModal } from "./NonConformityTimelineModal";
import { NCPrintView } from "./non-conformity/NCPrintView";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getNCStatusLabel, getNCStatusColor, getNCseravityColor } from "@/utils/ncStatusUtils";
import { 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Target,
  TrendingUp,
  History,
  Printer,
  Check,
  X
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

interface NonConformityDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nonConformityId: string;
  mode?: 'view' | 'edit';
}

export function NonConformityDetailsModal({ 
  open, 
  onOpenChange, 
  nonConformityId,
  mode = 'view'
}: NonConformityDetailsModalProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [editData, setEditData] = useState<any>({});
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `NC-${nonConformityId}`,
  });

  useEffect(() => {
    if (open) {
      setIsEditing(mode === 'edit');
    }
  }, [open, mode]);

  // Query principal da NC
  const { data: nonConformity, isLoading } = useQuery({
    queryKey: ["non-conformity", nonConformityId],
    queryFn: async () => {
      const [ncResult, profilesResult] = await Promise.all([
        supabase
          .from("non_conformities")
          .select("*")
          .eq("id", nonConformityId)
          .single(),
        supabase
          .from("profiles")
          .select("id, full_name")
          .limit(50)
      ]);

      if (ncResult.error) throw ncResult.error;
      
      const nc = ncResult.data;
      const profiles = profilesResult.data || [];
      
      return {
        ...nc,
        responsible: profiles.find(p => p.id === nc.responsible_user_id),
        approved_by: profiles.find(p => p.id === nc.approved_by_user_id)
      };
    },
    enabled: open && !!nonConformityId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Query das Ações Imediatas
  const { data: immediateActions } = useQuery({
    queryKey: ["nc-immediate-actions-modal", nonConformityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nc_immediate_actions")
        .select("*, responsible:profiles!nc_immediate_actions_responsible_user_id_fkey(id, full_name)")
        .eq("non_conformity_id", nonConformityId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!nonConformityId,
  });

  // Query da Análise de Causa
  const { data: causeAnalysis } = useQuery({
    queryKey: ["nc-cause-analysis-modal", nonConformityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nc_cause_analysis")
        .select("*")
        .eq("non_conformity_id", nonConformityId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!nonConformityId,
  });

  // Query dos Planos de Ação
  const { data: actionPlans } = useQuery({
    queryKey: ["nc-action-plans-modal", nonConformityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nc_action_plans")
        .select("*, who_responsible:profiles!nc_action_plans_who_responsible_id_fkey(id, full_name)")
        .eq("non_conformity_id", nonConformityId)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!nonConformityId,
  });

  // Query da Eficácia
  const { data: effectiveness } = useQuery({
    queryKey: ["nc-effectiveness-modal", nonConformityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nc_effectiveness")
        .select("*")
        .eq("non_conformity_id", nonConformityId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!nonConformityId,
  });

  const handleSave = async () => {
    setIsEditing(false);
    toast.success("Salvando alterações...");

    try {
      const allowedFields = [
        'title', 'description', 'category', 'severity', 'source',
        'detected_date', 'status', 'root_cause_analysis', 'damage_level',
        'impact_analysis', 'corrective_actions', 'preventive_actions',
        'effectiveness_evaluation', 'effectiveness_date', 'responsible_user_id',
        'approved_by_user_id', 'approval_date', 'approval_notes',
        'attachments', 'due_date', 'completion_date', 'recurrence_count',
        'similar_nc_ids'
      ];

      const sanitizedData = Object.keys(editData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = editData[key];
          return obj;
        }, {} as any);

      queryClient.setQueryData(["non-conformity", nonConformityId], {
        ...nonConformity,
        ...sanitizedData
      });

      const { error } = await supabase
        .from("non_conformities")
        .update(sanitizedData)
        .eq("id", nonConformityId);

      if (error) throw error;

      toast.success("Não conformidade atualizada!");
      queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
    } catch (error) {
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

  const getAnalysisMethodLabel = (method: string) => {
    switch (method) {
      case "5_whys": return "5 Porquês";
      case "ishikawa": return "Diagrama de Ishikawa";
      case "root_cause": return "Análise de Causa Raiz";
      default: return method || "Não especificado";
    }
  };

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
                  <Badge variant={isEditing ? "default" : "secondary"} className="text-xs">
                    {isEditing ? "Modo Edição" : "Modo Visualização"}
                  </Badge>
                </DialogTitle>
                <p className="text-muted-foreground mt-1">{nonConformity.title}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint()}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTimeline(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Histórico
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
                      <Badge className={getNCStatusColor(nonConformity.status)}>
                        {getNCStatusLabel(nonConformity.status)}
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Severidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={getNCseravityColor(nonConformity.severity)}>
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
                        <p className="text-sm text-muted-foreground">{nonConformity.category || "Não especificada"}</p>
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

                {/* Ações Imediatas Resumo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      Ações Imediatas ({immediateActions?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {immediateActions && immediateActions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ação</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {immediateActions.slice(0, 3).map((action: any) => (
                            <TableRow key={action.id}>
                              <TableCell className="max-w-[200px] truncate">{action.description}</TableCell>
                              <TableCell>{action.responsible?.full_name || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant={action.status === "Concluída" ? "default" : "secondary"}>
                                  {action.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhuma ação imediata registrada.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      Análise de Causa Raiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {causeAnalysis ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Método de Análise</Label>
                            <p className="text-sm font-medium">{getAnalysisMethodLabel(causeAnalysis.analysis_method)}</p>
                          </div>
                        </div>
                        <div>
                          <Label>Causa Raiz Identificada</Label>
                          <p className="text-sm p-3 bg-yellow-50 rounded border border-yellow-200 mt-1">
                            {causeAnalysis.root_cause || "Não identificada"}
                          </p>
                        </div>
                        
                        {/* 5 Whys Display */}
                        {causeAnalysis.analysis_method === "5_whys" && causeAnalysis.five_whys_data && (
                          <div className="mt-4">
                            <Label>Análise dos 5 Porquês</Label>
                            <div className="space-y-2 mt-2">
                              {(causeAnalysis.five_whys_data as any[]).map((item: any, idx: number) => (
                                <div key={idx} className="pl-4 border-l-2 border-yellow-300 py-1">
                                  <p className="text-xs text-muted-foreground">{idx + 1}º Por quê: {item.pergunta}</p>
                                  <p className="text-sm font-medium">{item.resposta || "Sem resposta"}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Análise de causa raiz não realizada.</p>
                    )}
                  </CardContent>
                </Card>

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
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      Plano de Ações 5W2H ({actionPlans?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actionPlans && actionPlans.length > 0 ? (
                      <div className="space-y-4">
                        {actionPlans.map((plan: any, idx: number) => (
                          <div key={plan.id} className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline">Ação {idx + 1}</Badge>
                              <Badge variant={plan.status === "Concluída" ? "default" : "secondary"}>
                                {plan.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">O quê (What)?</p>
                                <p className="font-medium">{plan.what_action}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Por quê (Why)?</p>
                                <p>{plan.why_reason || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Quem (Who)?</p>
                                <p>{plan.who_responsible?.full_name || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase">Quando (When)?</p>
                                <p>{format(new Date(plan.when_deadline), "dd/MM/yyyy", { locale: ptBR })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhuma ação planejada.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ações Corretivas (Legado)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        placeholder="Descreva as ações corretivas..."
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
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">6</span>
                      Avaliação de Eficácia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {effectiveness ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Resultado</Label>
                            <div className="flex items-center gap-2 mt-1">
                              {effectiveness.is_effective ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" /> Eficaz
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <X className="h-3 w-3 mr-1" /> Não Eficaz
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label>Data de Avaliação</Label>
                            <p className="text-sm">
                              {effectiveness.evaluated_at 
                                ? format(new Date(effectiveness.evaluated_at), "dd/MM/yyyy", { locale: ptBR })
                                : "N/A"
                              }
                            </p>
                          </div>
                        </div>
                        
                        {effectiveness.risk_update_notes && (
                          <div>
                            <Label>Observações sobre Riscos</Label>
                            <p className="text-sm p-3 bg-muted rounded mt-1 whitespace-pre-wrap">
                              {effectiveness.risk_update_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {isEditing ? (
                          <Textarea
                            placeholder="Avalie a eficácia das ações implementadas..."
                            value={editData.effectiveness_evaluation || ""}
                            onChange={(e) => setEditData({...editData, effectiveness_evaluation: e.target.value})}
                            rows={4}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Avaliação de eficácia não realizada.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data da Avaliação (Legado)</CardTitle>
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

      {/* Hidden Print View */}
      <div className="hidden">
        <NCPrintView
          ref={printRef}
          nc={nonConformity}
          immediateActions={immediateActions as any}
          causeAnalysis={causeAnalysis as any}
          actionPlans={actionPlans as any}
          effectiveness={effectiveness as any}
        />
      </div>

      <NonConformityTimelineModal
        open={showTimeline}
        onOpenChange={setShowTimeline}
        nonConformityId={nonConformityId}
      />
    </>
  );
}
