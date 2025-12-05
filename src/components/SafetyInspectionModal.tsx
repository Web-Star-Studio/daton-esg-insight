import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Minus, Plus } from "lucide-react";
import { useCreateSafetyInspection, useUpdateSafetyInspection } from "@/hooks/useSafetyInspections";
import { SafetyInspection, ChecklistItem } from "@/services/safetyInspections";
import {
  INSPECTION_TYPES,
  INSPECTION_STATUSES,
  INSPECTION_RESULTS,
  CHECKLIST_TEMPLATES,
  getInspectionTypeLabel,
} from "@/constants/safetyInspectionTypes";

interface SafetyInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection?: SafetyInspection;
}

export default function SafetyInspectionModal({
  isOpen,
  onClose,
  inspection,
}: SafetyInspectionModalProps) {
  const createMutation = useCreateSafetyInspection();
  const updateMutation = useUpdateSafetyInspection();
  const isEditing = !!inspection;

  const [formData, setFormData] = useState({
    title: "",
    inspection_type: "",
    area_location: "",
    inspector_name: "",
    accompanied_by: "",
    scheduled_date: "",
    inspection_date: "",
    due_date: "",
    status: "Pendente",
    result: "",
    observations: "",
    non_conformities: "",
    corrective_actions: "",
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (inspection) {
      setFormData({
        title: inspection.title || "",
        inspection_type: inspection.inspection_type || "",
        area_location: inspection.area_location || "",
        inspector_name: inspection.inspector_name || "",
        accompanied_by: inspection.accompanied_by || "",
        scheduled_date: inspection.scheduled_date || "",
        inspection_date: inspection.inspection_date || "",
        due_date: inspection.due_date || "",
        status: inspection.status || "Pendente",
        result: inspection.result || "",
        observations: inspection.observations || "",
        non_conformities: inspection.non_conformities || "",
        corrective_actions: inspection.corrective_actions || "",
      });
      setChecklistItems(inspection.checklist_items || []);
    } else {
      setFormData({
        title: "",
        inspection_type: "",
        area_location: "",
        inspector_name: "",
        accompanied_by: "",
        scheduled_date: "",
        inspection_date: "",
        due_date: "",
        status: "Pendente",
        result: "",
        observations: "",
        non_conformities: "",
        corrective_actions: "",
      });
      setChecklistItems([]);
    }
  }, [inspection, isOpen]);

  const handleInspectionTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, inspection_type: type }));
    
    // Load checklist template if not editing
    if (!isEditing && CHECKLIST_TEMPLATES[type]) {
      const template = CHECKLIST_TEMPLATES[type].map(item => ({
        ...item,
        status: 'pendente' as const,
        observation: '',
      }));
      setChecklistItems(template);
    }
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: string) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      item: "",
      category: "Personalizado",
      status: "pendente",
      observation: "",
    };
    setChecklistItems(prev => [...prev, newItem]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateScore = (): number => {
    const evaluated = checklistItems.filter(item => item.status !== 'pendente' && item.status !== 'na');
    if (evaluated.length === 0) return 0;
    
    const conforme = evaluated.filter(item => item.status === 'conforme').length;
    return Math.round((conforme / evaluated.length) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const score = calculateScore();
    const nonConformities = checklistItems
      .filter(item => item.status === 'nao_conforme')
      .map(item => `- ${item.item}${item.observation ? `: ${item.observation}` : ''}`)
      .join('\n');

    const submissionData = {
      ...formData,
      checklist_items: checklistItems,
      score,
      non_conformities: formData.non_conformities || nonConformities || undefined,
      company_id: '',
    };

    try {
      if (isEditing && inspection) {
        await updateMutation.mutateAsync({
          id: inspection.id,
          updates: submissionData,
        });
      } else {
        await createMutation.mutateAsync(submissionData as any);
      }
      onClose();
    } catch (error) {
      console.error("Error saving inspection:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conforme': return 'bg-success text-success-foreground';
      case 'nao_conforme': return 'bg-destructive text-destructive-foreground';
      case 'na': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Inspeção" : "Nova Inspeção de Segurança"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Título da Inspeção *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Inspeção de EPIs - Setor Produção"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Inspeção *</Label>
                  <Select
                    value={formData.inspection_type}
                    onValueChange={handleInspectionTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSPECTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_location">Área/Local</Label>
                  <Input
                    id="area_location"
                    value={formData.area_location}
                    onChange={e => setFormData(prev => ({ ...prev, area_location: e.target.value }))}
                    placeholder="Ex: Linha de Produção A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspector_name">Inspetor Responsável *</Label>
                  <Input
                    id="inspector_name"
                    value={formData.inspector_name}
                    onChange={e => setFormData(prev => ({ ...prev, inspector_name: e.target.value }))}
                    placeholder="Nome do inspetor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accompanied_by">Acompanhado por</Label>
                  <Input
                    id="accompanied_by"
                    value={formData.accompanied_by}
                    onChange={e => setFormData(prev => ({ ...prev, accompanied_by: e.target.value }))}
                    placeholder="Nome do acompanhante"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Data Agendada</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={e => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspection_date">Data da Inspeção</Label>
                  <Input
                    id="inspection_date"
                    type="date"
                    value={formData.inspection_date}
                    onChange={e => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Prazo para Correções</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Status and Result */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSPECTION_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resultado</Label>
                  <Select
                    value={formData.result}
                    onValueChange={v => setFormData(prev => ({ ...prev, result: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSPECTION_RESULTS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Score Calculado</Label>
                  <div className="h-10 flex items-center">
                    <Badge variant={calculateScore() >= 80 ? "default" : calculateScore() >= 50 ? "secondary" : "destructive"}>
                      {calculateScore()}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              {checklistItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Checklist de Verificação</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg divide-y">
                    {checklistItems.map((item, index) => (
                      <div key={item.id} className="p-3 space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                          
                          {item.id.startsWith('custom-') ? (
                            <Input
                              value={item.item}
                              onChange={e => updateChecklistItem(item.id, 'item', e.target.value)}
                              placeholder="Descrição do item"
                              className="flex-1"
                            />
                          ) : (
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.item}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          )}

                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={item.status === 'conforme' ? 'default' : 'outline'}
                              className={item.status === 'conforme' ? 'bg-success hover:bg-success/90' : ''}
                              onClick={() => updateChecklistItem(item.id, 'status', item.status === 'conforme' ? 'pendente' : 'conforme')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={item.status === 'nao_conforme' ? 'default' : 'outline'}
                              className={item.status === 'nao_conforme' ? 'bg-destructive hover:bg-destructive/90' : ''}
                              onClick={() => updateChecklistItem(item.id, 'status', item.status === 'nao_conforme' ? 'pendente' : 'nao_conforme')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={item.status === 'na' ? 'default' : 'outline'}
                              onClick={() => updateChecklistItem(item.id, 'status', item.status === 'na' ? 'pendente' : 'na')}
                            >
                              N/A
                            </Button>
                            {item.id.startsWith('custom-') && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeChecklistItem(item.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {item.status === 'nao_conforme' && (
                          <Input
                            value={item.observation || ''}
                            onChange={e => updateChecklistItem(item.id, 'observation', e.target.value)}
                            placeholder="Observação sobre a não conformidade"
                            className="ml-9"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações Gerais</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={e => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Observações adicionais sobre a inspeção"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="corrective_actions">Ações Corretivas Requeridas</Label>
                <Textarea
                  id="corrective_actions"
                  value={formData.corrective_actions}
                  onChange={e => setFormData(prev => ({ ...prev, corrective_actions: e.target.value }))}
                  placeholder="Liste as ações corretivas necessárias"
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? "Salvar Alterações" : "Registrar Inspeção"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
