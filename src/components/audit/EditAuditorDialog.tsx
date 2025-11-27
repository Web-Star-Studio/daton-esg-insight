import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditAuditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditor: any;
}

export function EditAuditorDialog({ open, onOpenChange, auditor }: EditAuditorDialogProps) {
  const { register, handleSubmit, setValue } = useForm();
  const [certifications, setCertifications] = useState<string[]>([]);
  const [standards, setStandards] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");
  const [newStandard, setNewStandard] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (auditor) {
      setValue("qualification_level", auditor.qualification_level);
      setValue("audit_hours_completed", auditor.audit_hours_completed);
      setValue("is_independent", auditor.is_independent ? "true" : "false");
      setCertifications(auditor.certifications || []);
      setStandards(auditor.standards_competent || []);
    }
  }, [auditor, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('auditor_profiles')
        .update({
          qualification_level: data.qualification_level,
          certifications: certifications,
          standards_competent: standards,
          audit_hours_completed: parseInt(data.audit_hours_completed) || 0,
          is_independent: data.is_independent === 'true',
        })
        .eq('id', auditor.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditor-profiles'] });
      toast({
        title: "Auditor atualizado",
        description: "O perfil de auditor foi atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil de auditor.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const addCertification = () => {
    if (newCert.trim()) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const addStandard = () => {
    if (newStandard.trim()) {
      setStandards([...standards, newStandard.trim()]);
      setNewStandard("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Auditor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Auditor</Label>
            <Input value={auditor?.user?.full_name} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualification_level">Nível de Qualificação *</Label>
            <Select
              defaultValue={auditor?.qualification_level}
              onValueChange={(value) => setValue("qualification_level", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auditor_in_training">Auditor em Treinamento</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="lead_auditor">Auditor Líder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Certificações</Label>
            <div className="flex gap-2">
              <Input
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                placeholder="Ex: ISO 9001 Lead Auditor"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              />
              <Button type="button" onClick={addCertification}>Adicionar</Button>
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {certifications.map((cert, i) => (
                <div key={i} className="bg-secondary px-3 py-1 rounded-md text-sm flex items-center gap-2">
                  {cert}
                  <button
                    type="button"
                    onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}
                    className="text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Normas Competentes</Label>
            <div className="flex gap-2">
              <Input
                value={newStandard}
                onChange={(e) => setNewStandard(e.target.value)}
                placeholder="Ex: ISO 9001:2015"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStandard())}
              />
              <Button type="button" onClick={addStandard}>Adicionar</Button>
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {standards.map((std, i) => (
                <div key={i} className="bg-secondary px-3 py-1 rounded-md text-sm flex items-center gap-2">
                  {std}
                  <button
                    type="button"
                    onClick={() => setStandards(standards.filter((_, idx) => idx !== i))}
                    className="text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit_hours_completed">Horas de Auditoria Completadas</Label>
            <Input
              id="audit_hours_completed"
              type="number"
              {...register("audit_hours_completed")}
              defaultValue={auditor?.audit_hours_completed}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_independent">Independência</Label>
            <Select
              defaultValue={auditor?.is_independent ? "true" : "false"}
              onValueChange={(value) => setValue("is_independent", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim (Independente)</SelectItem>
                <SelectItem value="false">Não (Interno)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
