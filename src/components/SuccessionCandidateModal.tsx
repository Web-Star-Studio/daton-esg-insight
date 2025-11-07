import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateSuccessionCandidate } from "@/services/careerDevelopment";
import { useEmployees } from "@/services/employeeService";

const candidateSchema = z.object({
  succession_plan_id: z.string().uuid("ID do plano inválido"),
  employee_id: z.string().uuid("Selecione um candidato"),
  readiness_level: z.string().refine((val) => ["Pronto Agora", "1-2 Anos", "3+ Anos"].includes(val), {
    message: "Nível de prontidão inválido",
  }),
  readiness_score: z.number().min(0).max(100),
  development_needs: z.array(z.string()).default([]),
  notes: z.string().max(1000, "Observações muito longas").nullable(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface SuccessionCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  successionPlanId: string;
  existingCandidateIds?: string[];
  onSuccess?: () => void;
}

export const SuccessionCandidateModal = ({
  isOpen,
  onClose,
  successionPlanId,
  existingCandidateIds = [],
  onSuccess,
}: SuccessionCandidateModalProps) => {
  const { toast } = useToast();
  const createCandidate = useCreateSuccessionCandidate();
  const { data: employees } = useEmployees();
  const [developmentNeeds, setDevelopmentNeeds] = useState<string>("");

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      succession_plan_id: successionPlanId,
      readiness_score: 50,
      development_needs: [],
      notes: null,
    },
  });

  const readinessScore = watch("readiness_score");

  const onSubmit = async (data: CandidateFormData) => {
    try {
      // Parse development needs from textarea
      const needsArray = developmentNeeds
        .split("\n")
        .filter((need) => need.trim())
        .map((need) => need.trim());

      await createCandidate.mutateAsync({
        ...data,
        development_needs: needsArray,
      });

      toast({
        title: "Sucesso!",
        description: "Candidato adicionado ao plano de sucessão.",
      });
      reset();
      setDevelopmentNeeds("");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar candidato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Filter out employees already added as candidates
  const availableEmployees = employees?.filter(
    (emp) => !existingCandidateIds.includes(emp.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Candidato à Sucessão</DialogTitle>
          <DialogDescription>
            Identifique um funcionário como candidato potencial para esta posição crítica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee_id">Candidato *</Label>
              <Select
                onValueChange={(value) => setValue("employee_id", value)}
                defaultValue={watch("employee_id")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees?.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum funcionário disponível
                    </SelectItem>
                  ) : (
                    availableEmployees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} - {emp.position}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-sm text-destructive mt-1">{errors.employee_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="readiness_level">Nível de Prontidão *</Label>
              <Select
                onValueChange={(value) =>
                  setValue("readiness_level", value as "Pronto Agora" | "1-2 Anos" | "3+ Anos")
                }
                defaultValue={watch("readiness_level")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de prontidão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pronto Agora">Pronto Agora - Pode assumir imediatamente</SelectItem>
                  <SelectItem value="1-2 Anos">1-2 Anos - Precisa de desenvolvimento</SelectItem>
                  <SelectItem value="3+ Anos">3+ Anos - Desenvolvimento de longo prazo</SelectItem>
                </SelectContent>
              </Select>
              {errors.readiness_level && (
                <p className="text-sm text-destructive mt-1">{errors.readiness_level.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="readiness_score">
                Score de Prontidão: {readinessScore}%
              </Label>
              <Slider
                id="readiness_score"
                min={0}
                max={100}
                step={5}
                value={[readinessScore]}
                onValueChange={(value) => setValue("readiness_score", value[0])}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Avalie o quão preparado o candidato está para assumir a posição
              </p>
            </div>

            <div>
              <Label htmlFor="development_needs">Necessidades de Desenvolvimento</Label>
              <Textarea
                id="development_needs"
                placeholder="Liste as competências e experiências que o candidato precisa desenvolver (uma por linha)"
                value={developmentNeeds}
                onChange={(e) => setDevelopmentNeeds(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: Liderança de equipes grandes, Gestão financeira, Experiência internacional
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais sobre o candidato..."
                onChange={(e) => setValue("notes", e.target.value || null)}
                value={watch("notes") || ""}
                rows={3}
              />
              {errors.notes && (
                <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCandidate.isPending}>
              {createCandidate.isPending ? "Adicionando..." : "Adicionar Candidato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
