import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSocialProject, updateSocialProject, SocialProject } from "@/services/socialProjects";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const projectSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  objective: z.string().optional(),
  target_audience: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().min(0, "Orçamento deve ser positivo").optional(),
  invested_amount: z.number().min(0, "Valor investido deve ser positivo"),
  status: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
  beneficiaries_target: z.number().min(0).optional(),
  beneficiaries_reached: z.number().min(0).optional(),
  category: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface SocialProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  project?: SocialProject;
}

export function SocialProjectModal({ open, onOpenChange, onSuccess, project }: SocialProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description || "",
      objective: project.objective || "",
      target_audience: project.target_audience || "",
      location: project.location || "",
      budget: project.budget || 0,
      invested_amount: project.invested_amount,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date || undefined,
      beneficiaries_target: (project.impact_metrics as any)?.beneficiaries_target || 0,
      beneficiaries_reached: (project.impact_metrics as any)?.beneficiaries_reached || 0,
      category: (project.impact_metrics as any)?.category || "",
    } : {
      status: "Planejado",
      invested_amount: 0,
      budget: 0,
      beneficiaries_target: 0,
      beneficiaries_reached: 0,
    }
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const { beneficiaries_target, beneficiaries_reached, category, ...projectData } = data;
      
      const projectPayload = {
        ...projectData,
        impact_metrics: {
          beneficiaries_target,
          beneficiaries_reached,
          category,
        }
      };

      if (project) {
        await updateSocialProject(project.id, projectPayload);
        toast.success("Projeto atualizado com sucesso!");
      } else {
        await createSocialProject(projectPayload as any);
        toast.success("Projeto criado com sucesso!");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar projeto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Editar" : "Novo"} Projeto Social</DialogTitle>
          <DialogDescription>
            {project ? "Atualize as informações" : "Preencha os dados"} do projeto de impacto social
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register("description")} rows={2} />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Textarea id="objective" {...register("objective")} rows={2} />
            </div>

            <div>
              <Label htmlFor="target_audience">Público-Alvo</Label>
              <Input id="target_audience" {...register("target_audience")} />
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              <Input id="location" {...register("location")} />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" {...register("category")} placeholder="Ex: Educação, Saúde, Meio Ambiente" />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select onValueChange={(value) => setValue("status", value as any)} defaultValue={watch("status")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejado">Planejado</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
            </div>

            <div>
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input 
                id="budget" 
                type="number" 
                step="0.01"
                {...register("budget", { valueAsNumber: true })} 
              />
            </div>

            <div>
              <Label htmlFor="invested_amount">Valor Investido (R$) *</Label>
              <Input 
                id="invested_amount" 
                type="number" 
                step="0.01"
                {...register("invested_amount", { valueAsNumber: true })} 
              />
              {errors.invested_amount && <p className="text-sm text-destructive mt-1">{errors.invested_amount.message}</p>}
            </div>

            <div>
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>}
            </div>

            <div>
              <Label htmlFor="end_date">Data de Término</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>

            <div>
              <Label htmlFor="beneficiaries_target">Meta de Beneficiários</Label>
              <Input 
                id="beneficiaries_target" 
                type="number"
                {...register("beneficiaries_target", { valueAsNumber: true })} 
              />
            </div>

            <div>
              <Label htmlFor="beneficiaries_reached">Beneficiários Alcançados</Label>
              <Input 
                id="beneficiaries_reached" 
                type="number"
                {...register("beneficiaries_reached", { valueAsNumber: true })} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project ? "Atualizar" : "Criar"} Projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
