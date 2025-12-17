import { useState } from "react";
import { Plus, Trash2, FileText, Clock, Calendar, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  useTemplateStandards, 
  useTemplatePlannings,
  useAddStandardToTemplate,
  useRemoveStandardFromTemplate,
  useCreateTemplatePlanning,
  useDeleteTemplatePlanning,
} from "@/hooks/audit/useTemplates";
import { useStandards } from "@/hooks/audit/useStandards";
import { AuditTemplate } from "@/services/audit/templates";

interface TemplateDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AuditTemplate;
}

export function TemplateDetailsDialog({ open, onOpenChange, template }: TemplateDetailsDialogProps) {
  const { data: templateStandards, isLoading: loadingStandards } = useTemplateStandards(template.id);
  const { data: templatePlannings, isLoading: loadingPlannings } = useTemplatePlannings(template.id);
  const { data: allStandards } = useStandards();
  
  const addStandard = useAddStandardToTemplate();
  const removeStandard = useRemoveStandardFromTemplate();
  const createPlanning = useCreateTemplatePlanning();
  const deletePlanning = useDeleteTemplatePlanning();

  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [newPlanningName, setNewPlanningName] = useState("");

  const linkedStandardIds = templateStandards?.map(ts => ts.standard_id) || [];
  const availableStandards = allStandards?.filter(s => !linkedStandardIds.includes(s.id)) || [];

  const handleAddStandard = async () => {
    if (!selectedStandardId) return;
    await addStandard.mutateAsync({ templateId: template.id, standardId: selectedStandardId });
    setSelectedStandardId("");
  };

  const handleRemoveStandard = async (standardId: string) => {
    await removeStandard.mutateAsync({ templateId: template.id, standardId });
  };

  const handleAddPlanning = async () => {
    if (!newPlanningName.trim()) return;
    await createPlanning.mutateAsync({ 
      template_id: template.id, 
      name: newPlanningName.trim() 
    });
    setNewPlanningName("");
  };

  const handleDeletePlanning = async (planningId: string) => {
    await deletePlanning.mutateAsync({ id: planningId, templateId: template.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{template.name}</DialogTitle>
            {template.category && (
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: template.category.color_hex,
                  color: template.category.color_hex 
                }}
              >
                {template.category.title}
              </Badge>
            )}
          </div>
          <DialogDescription>
            {template.description || "Sem descrição"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="secondary">{template.default_audit_type}</Badge>
          {template.estimated_duration_hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {template.estimated_duration_hours}h estimadas
            </span>
          )}
        </div>

        <Separator />

        {/* Normas Vinculadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Normas Vinculadas</Label>
          </div>

          {loadingStandards ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {templateStandards?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma norma vinculada</p>
                ) : (
                  templateStandards?.map((ts) => (
                    <Badge key={ts.id} variant="secondary" className="gap-1 pr-1">
                      {ts.standard?.code} - {ts.standard?.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveStandard(ts.standard_id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>

              {availableStandards.length > 0 && (
                <div className="flex gap-2">
                  <Select value={selectedStandardId} onValueChange={setSelectedStandardId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma norma para adicionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStandards.map((standard) => (
                        <SelectItem key={standard.id} value={standard.id}>
                          {standard.code} - {standard.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddStandard} 
                    disabled={!selectedStandardId || addStandard.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Planejamentos Padrão */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Planejamentos Padrão</Label>
          </div>

          {loadingPlannings ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                {templatePlannings?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum planejamento definido</p>
                ) : (
                  templatePlannings?.map((planning) => (
                    <div 
                      key={planning.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{planning.name}</p>
                          {planning.suggested_duration_minutes && (
                            <p className="text-sm text-muted-foreground">
                              {planning.suggested_duration_minutes} minutos
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeletePlanning(planning.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nome do planejamento"
                  value={newPlanningName}
                  onChange={(e) => setNewPlanningName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlanning()}
                />
                <Button 
                  onClick={handleAddPlanning} 
                  disabled={!newPlanningName.trim() || createPlanning.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
