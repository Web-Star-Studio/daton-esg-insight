import { useState } from "react";
import { Plus, GripVertical, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useResponseOptions,
  useCreateResponseOption,
  useUpdateResponseOption,
  useDeleteResponseOption,
} from "@/hooks/audit/useResponseTypes";
import { ResponseType, ResponseOption } from "@/services/audit/responseTypes";

interface ResponseOptionBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseType: ResponseType;
}

interface OptionFormData {
  label: string;
  adherence_value: number;
  is_not_counted: boolean;
  triggers_occurrence: boolean;
  color_hex: string;
}

const defaultColors = [
  "#22C55E", // green
  "#EAB308", // yellow
  "#F97316", // orange
  "#EF4444", // red
  "#6B7280", // gray
  "#3B82F6", // blue
];

export function ResponseOptionBuilder({ open, onOpenChange, responseType }: ResponseOptionBuilderProps) {
  const { data: options, isLoading } = useResponseOptions(responseType.id);
  const createOption = useCreateResponseOption();
  const updateOption = useUpdateResponseOption();
  const deleteOption = useDeleteResponseOption();

  const [newOption, setNewOption] = useState<OptionFormData>({
    label: "",
    adherence_value: 100,
    is_not_counted: false,
    triggers_occurrence: false,
    color_hex: "#22C55E",
  });

  const handleAddOption = async () => {
    if (!newOption.label.trim()) return;

    await createOption.mutateAsync({
      response_type_id: responseType.id,
      ...newOption,
      display_order: options?.length || 0,
    });

    setNewOption({
      label: "",
      adherence_value: 100,
      is_not_counted: false,
      triggers_occurrence: false,
      color_hex: defaultColors[(options?.length || 0) % defaultColors.length],
    });
  };

  const handleUpdateOption = async (option: ResponseOption, field: keyof OptionFormData, value: any) => {
    await updateOption.mutateAsync({
      id: option.id,
      data: { [field]: value },
      responseTypeId: responseType.id,
    });
  };

  const handleDeleteOption = async (id: string) => {
    await deleteOption.mutateAsync({ id, responseTypeId: responseType.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opções de Resposta: {responseType.name}</DialogTitle>
          <DialogDescription>
            Configure as opções disponíveis para este tipo de resposta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Options */}
          <div className="space-y-3">
            <Label>Opções Cadastradas</Label>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : options?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma opção cadastrada. Adicione a primeira opção abaixo.
              </p>
            ) : (
              <div className="space-y-2">
                {options?.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color_hex }}
                    />

                    <div className="flex-1 min-w-0">
                      <Input
                        value={option.label}
                        onChange={(e) => handleUpdateOption(option, 'label', e.target.value)}
                        className="h-8"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={option.adherence_value}
                          onChange={(e) => handleUpdateOption(option, 'adherence_value', parseInt(e.target.value)) }
                          className="w-16 h-8 text-center"
                          disabled={option.is_not_counted}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>

                      {option.is_not_counted && (
                        <Badge variant="secondary" className="text-xs">N/A</Badge>
                      )}

                      {option.triggers_occurrence && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          NC
                        </Badge>
                      )}

                      <input
                        type="color"
                        value={option.color_hex}
                        onChange={(e) => handleUpdateOption(option, 'color_hex', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Option */}
          <div className="space-y-4 border-t pt-4">
            <Label>Adicionar Nova Opção</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Texto da Opção</Label>
                <Input
                  placeholder="Ex: Conforme"
                  value={newOption.label}
                  onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Valor de Aderência (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newOption.adherence_value}
                  onChange={(e) => setNewOption({ ...newOption, adherence_value: parseInt(e.target.value) || 0 })}
                  disabled={newOption.is_not_counted}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newOption.is_not_counted}
                  onCheckedChange={(checked) => setNewOption({ ...newOption, is_not_counted: checked })}
                />
                <Label className="text-sm">Não contabilizar (N/A)</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newOption.triggers_occurrence}
                  onCheckedChange={(checked) => setNewOption({ ...newOption, triggers_occurrence: checked })}
                />
                <Label className="text-sm">Gera ocorrência (NC)</Label>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm">Cor:</Label>
                <input
                  type="color"
                  value={newOption.color_hex}
                  onChange={(e) => setNewOption({ ...newOption, color_hex: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            <Button 
              onClick={handleAddOption} 
              disabled={!newOption.label.trim() || createOption.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Opção
            </Button>
          </div>

          {/* Preview */}
          {options && options.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm mb-3 block">Preview</Label>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: option.color_hex }}
                  >
                    {option.label}
                    {!option.is_not_counted && (
                      <span className="ml-1 opacity-75">({option.adherence_value}%)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
