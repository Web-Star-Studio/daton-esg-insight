import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createSocialProject, updateSocialProject, deleteSocialProject, SocialProject } from "@/services/socialProjects";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from "@/utils/formErrorHandler";

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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
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

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const { user, profile } = await formErrorHandler.checkAuth();
        setCompanyId(profile.company_id);
      } catch (error) {
        console.error('Error fetching company_id:', error);
        toast.error('Erro ao carregar informações do usuário');
        onOpenChange(false);
      }
    };

    if (open) {
      fetchCompanyId();
    }
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open && project) {
      reset({
        name: project.name,
        description: project.description || "",
        objective: project.objective || "",
        target_audience: project.target_audience || "",
        location: project.location || "",
        budget: project.budget || 0,
        invested_amount: project.invested_amount,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date || "",
        beneficiaries_target: (project.impact_metrics as any)?.beneficiaries_target || 0,
        beneficiaries_reached: (project.impact_metrics as any)?.beneficiaries_reached || 0,
        category: (project.impact_metrics as any)?.category || "",
      });
    } else if (open && !project) {
      reset({
        name: "",
        description: "",
        objective: "",
        target_audience: "",
        location: "",
        status: "Planejado",
        invested_amount: 0,
        budget: 0,
        start_date: "",
        end_date: "",
        beneficiaries_target: 0,
        beneficiaries_reached: 0,
        category: "",
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    console.log('=== SOCIAL PROJECT SUBMISSION ===');
    console.log('Form data:', data);
    console.log('Company ID:', companyId);
    
    if (!companyId) {
      toast.error('Erro ao identificar empresa. Tente novamente.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { beneficiaries_target, beneficiaries_reached, category, ...projectData } = data;
      
      const projectPayload = {
        ...projectData,
        company_id: companyId,
        impact_metrics: {
          beneficiaries_target,
          beneficiaries_reached,
          category,
        }
      };

      console.log('Final payload:', projectPayload);

      if (project) {
        await formErrorHandler.updateRecord(
          () => updateSocialProject(project.id, projectPayload),
          {
            formType: 'Projeto Social',
            successMessage: 'Projeto atualizado com sucesso!'
          }
        );
      } else {
        await formErrorHandler.createRecord(
          () => createSocialProject(projectPayload as any),
          {
            formType: 'Projeto Social',
            successMessage: 'Projeto criado com sucesso!'
          }
        );
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting project:', error);
      formErrorHandler.handleError(error, {
        formType: 'Projeto Social',
        operation: project ? 'update' : 'create'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    
    setIsDeleting(true);
    try {
      await deleteSocialProject(project.id);
      toast.success('Projeto excluído com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erro ao excluir projeto');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
          <p className="text-xs text-muted-foreground mt-2">
            Campos marcados com * são obrigatórios
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input id="name" {...register("name")} className={errors.name ? "border-destructive" : ""} />
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
                className={errors.invested_amount ? "border-destructive" : ""}
              />
              {errors.invested_amount && <p className="text-sm text-destructive mt-1">{errors.invested_amount.message}</p>}
            </div>

            <div>
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input id="start_date" type="date" {...register("start_date")} className={errors.start_date ? "border-destructive" : ""} />
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

          <DialogFooter className="flex justify-between">
            {project && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isDeleting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {project ? "Atualizar" : "Criar"} Projeto
              </Button>
            </div>
          </DialogFooter>
        </form>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o projeto "{project?.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir Projeto'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
