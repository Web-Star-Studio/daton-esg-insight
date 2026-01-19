import { useState } from "react";
import { Check, Play, Clock, AlertTriangle, User, Calendar, FileText, Upload, X, Paperclip, Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  useActionPlans, 
  useUpdateActionPlan,
} from "@/hooks/useNonConformity";
import { NCActionPlan } from "@/services/nonConformityService";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EvidenceAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface NCStage5ImplementationProps {
  ncId: string;
  onComplete?: () => void;
}

export function NCStage5Implementation({ ncId, onComplete }: NCStage5ImplementationProps) {
  const [selectedPlan, setSelectedPlan] = useState<NCActionPlan | null>(null);
  const [evidence, setEvidence] = useState("");
  const [completionDate, setCompletionDate] = useState<Date>(new Date());
  const [attachments, setAttachments] = useState<EvidenceAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: plans, isLoading } = useActionPlans(ncId);
  const updateMutation = useUpdateActionPlan();

  const handleStartExecution = (plan: NCActionPlan) => {
    updateMutation.mutate({
      id: plan.id,
      updates: { status: "Em Execução" },
    });
  };

  const handleOpenComplete = (plan: NCActionPlan) => {
    setSelectedPlan(plan);
    setEvidence(plan.evidence || "");
    setCompletionDate((plan as any).completion_date ? new Date((plan as any).completion_date + 'T12:00:00') : new Date());
    setAttachments((plan as any).evidence_attachments || []);
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments: EvidenceAttachment[] = [];
      
      for (const file of Array.from(files)) {
        const sanitizedName = sanitizeFileName(file.name);
        const filePath = `${ncId}/${selectedPlan?.id}/${Date.now()}_${sanitizedName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('nc-evidence')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('nc-evidence')
          .getPublicUrl(filePath);

        newAttachments.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        });
      }

      setAttachments([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} arquivo(s) anexado(s)`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCompleteAction = () => {
    if (!selectedPlan) return;
    
    if (!evidence.trim()) {
      toast.error("Descreva a evidência de conclusão");
      return;
    }

    updateMutation.mutate({
      id: selectedPlan.id,
      updates: {
        status: "Concluída",
        evidence,
        evidence_attachments: attachments,
        completion_date: format(completionDate, "yyyy-MM-dd"),
        completed_at: new Date().toISOString(),
      } as any,
    }, {
      onSuccess: () => {
        setSelectedPlan(null);
        setEvidence("");
        setCompletionDate(new Date());
        setAttachments([]);
      },
    });
  };

  const getStatusInfo = (plan: NCActionPlan) => {
    const dueDate = new Date(plan.when_deadline);
    
    if (plan.status === "Concluída") {
      return {
        badge: <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Concluída</Badge>,
        canStart: false,
        canComplete: false,
      };
    }
    if (plan.status === "Cancelada") {
      return {
        badge: <Badge variant="secondary">Cancelada</Badge>,
        canStart: false,
        canComplete: false,
      };
    }
    if (isPast(dueDate) && !isToday(dueDate) && (plan.status as string) !== "Concluída") {
      return {
        badge: <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Atrasada</Badge>,
        canStart: plan.status === "Planejada",
        canComplete: plan.status === "Em Execução",
      };
    }
    if (plan.status === "Em Execução") {
      return {
        badge: <Badge className="bg-blue-100 text-blue-800"><Play className="h-3 w-3 mr-1" /> Em Execução</Badge>,
        canStart: false,
        canComplete: true,
      };
    }
    return {
      badge: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Planejada</Badge>,
      canStart: true,
      canComplete: false,
    };
  };

  // Calculate progress
  const completedCount = plans?.filter(p => p.status === "Concluída").length || 0;
  const totalCount = plans?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                Implementação das Ações
              </CardTitle>
              <CardDescription>
                Execute as ações planejadas e registre as evidências de conclusão
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progresso</p>
              <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          {plans && plans.length > 0 ? (
            <div className="space-y-4">
              {plans.map((plan, index) => {
                const statusInfo = getStatusInfo(plan);
                
                return (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg ${
                      plan.status === "Concluída" 
                        ? "bg-green-50/50 border-green-200" 
                        : plan.status === "Em Execução"
                        ? "bg-blue-50/50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm bg-muted px-2 py-0.5 rounded">
                            Ação {index + 1}
                          </span>
                          {statusInfo.badge}
                        </div>
                        
                        <h4 className="font-medium">{plan.what_action}</h4>
                        
                        {plan.how_method && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Como:</strong> {plan.how_method}
                          </p>
                        )}

                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {plan.responsible?.full_name || "Não definido"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(plan.when_deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>

                        {plan.evidence && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <FileText className="h-3 w-3" />
                              Evidência:
                            </div>
                            <p>{plan.evidence}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {statusInfo.canStart && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartExecution(plan)}
                            disabled={updateMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        {statusInfo.canComplete && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenComplete(plan)}
                            disabled={updateMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma ação para implementar.</p>
              <p className="text-sm">Volte à etapa de Planejamento para adicionar ações.</p>
            </div>
          )}

          {allCompleted && onComplete && (
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button onClick={onComplete}>
                <Check className="h-4 w-4 mr-2" />
                Concluir Implementação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Action Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => {
        if (!open) {
          setSelectedPlan(null);
          setCompletionDate(new Date());
          setAttachments([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Concluir Ação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedPlan?.what_action}</p>
            </div>

            <div>
              <Label>Data de Realização *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !completionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {completionDate ? format(completionDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={completionDate}
                    onSelect={(date) => date && setCompletionDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="evidence">Evidência de Conclusão *</Label>
              <Textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Descreva como a ação foi executada e qual foi o resultado..."
                rows={4}
                className="mt-2"
              />
            </div>

            {/* File Attachment Section */}
            <div>
              <Label>Anexos (Evidências, Lista de Presença, etc.)</Label>
              <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Clique para anexar arquivos</span>
                      <span className="text-xs">PDF, DOC, XLS, Imagens</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm truncate hover:underline text-primary"
                        >
                          {file.name}
                        </a>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        className="shrink-0 h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCompleteAction}
                disabled={updateMutation.isPending || isUploading}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Conclusão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
