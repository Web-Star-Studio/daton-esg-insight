import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/audit/useTemplates";
import { useCategories } from "@/hooks/audit/useCategories";
import { AuditTemplate } from "@/services/audit/templates";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  description: z.string().optional(),
  category_id: z.string().optional(),
  default_audit_type: z.string().min(1, "Tipo é obrigatório"),
  estimated_duration_hours: z.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: AuditTemplate | null;
}

export function TemplateFormDialog({ open, onOpenChange, template }: TemplateFormDialogProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const { data: categories } = useCategories();
  const isEditing = !!template;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      default_audit_type: "Interna",
      estimated_duration_hours: undefined,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        category_id: template.category_id || "",
        default_audit_type: template.default_audit_type,
        estimated_duration_hours: template.estimated_duration_hours || undefined,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category_id: "",
        default_audit_type: "Interna",
        estimated_duration_hours: undefined,
      });
    }
  }, [template, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const submitData = {
        ...data,
        category_id: data.category_id || undefined,
      };

      if (isEditing) {
        await updateTemplate.mutateAsync({ id: template.id, data: submitData });
      } else {
        await createTemplate.mutateAsync(submitData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Template" : "Novo Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do template"
              : "Crie um novo template de auditoria reutilizável"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Auditoria ISO 9001 - Processos Produtivos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o objetivo e escopo do template..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.color_hex }} 
                              />
                              {cat.title}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_audit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Auditoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Interna">Interna</SelectItem>
                        <SelectItem value="Externa">Externa</SelectItem>
                        <SelectItem value="Certificação">Certificação</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimated_duration_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração Estimada (horas)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      placeholder="Ex: 8"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Tempo estimado para execução completa da auditoria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
