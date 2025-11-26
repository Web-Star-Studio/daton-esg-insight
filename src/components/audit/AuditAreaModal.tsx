import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller } from "react-hook-form";
import { useAuditAreas } from "@/hooks/useAuditAreas";
import { AuditArea } from "@/services/auditArea";
import { useEffect, useState } from "react";

interface AuditAreaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: AuditArea | null;
}

interface FormData {
  name: string;
  description: string;
  department: string;
  risk_level: string;
  next_audit_date: string;
}

const ISO_STANDARDS = [
  { id: 'ISO_9001', label: 'ISO 9001 - Qualidade' },
  { id: 'ISO_14001', label: 'ISO 14001 - Meio Ambiente' },
  { id: 'ISO_39001', label: 'ISO 39001 - Segurança Viária' },
  { id: 'ISO_45001', label: 'ISO 45001 - Saúde e Segurança' },
];

export function AuditAreaModal({ open, onOpenChange, area }: AuditAreaModalProps) {
  const { createArea, updateArea, isCreating, isUpdating } = useAuditAreas();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>();
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);

  useEffect(() => {
    if (area) {
      reset({
        name: area.name,
        description: area.description || '',
        department: area.department || '',
        risk_level: area.risk_level,
        next_audit_date: area.next_audit_date || '',
      });
      
      if (area.applicable_standards) {
        const standards = Array.isArray(area.applicable_standards) 
          ? area.applicable_standards 
          : Object.keys(area.applicable_standards);
        setSelectedStandards(standards);
      }
    } else {
      reset({
        name: '',
        description: '',
        department: '',
        risk_level: 'medium',
        next_audit_date: '',
      });
      setSelectedStandards([]);
    }
  }, [area, reset, open]);

  const onSubmit = (data: FormData) => {
    const areaData = {
      ...data,
      risk_level: data.risk_level as any,
      applicable_standards: selectedStandards.reduce((acc, std) => ({ ...acc, [std]: true }), {}),
    };

    if (area) {
      updateArea({ id: area.id, updates: areaData as any });
    } else {
      createArea(areaData as any);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {area ? 'Editar Área Auditável' : 'Nova Área Auditável'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Área/Processo *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="Ex: Gestão de Resíduos, Treinamento de Colaboradores"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o escopo e responsabilidades desta área..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="Ex: Operações, RH, Qualidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_level">Nível de Risco *</Label>
              <Controller
                name="risk_level"
                control={control}
                rules={{ required: 'Nível de risco é obrigatório' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.risk_level && (
                <p className="text-sm text-destructive">{errors.risk_level.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_audit_date">Próxima Auditoria Planejada</Label>
            <Input
              id="next_audit_date"
              type="date"
              {...register('next_audit_date')}
            />
          </div>

          <div className="space-y-2">
            <Label>Normas Aplicáveis</Label>
            <div className="grid gap-3">
              {ISO_STANDARDS.map((standard) => (
                <div key={standard.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={standard.id}
                    checked={selectedStandards.includes(standard.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStandards([...selectedStandards, standard.id]);
                      } else {
                        setSelectedStandards(selectedStandards.filter(s => s !== standard.id));
                      }
                    }}
                  />
                  <Label
                    htmlFor={standard.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {standard.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {area ? 'Atualizar' : 'Criar'} Área
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
