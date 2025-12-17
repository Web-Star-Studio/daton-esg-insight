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
import { Switch } from "@/components/ui/switch";
import { useCreateStandardItem, useUpdateStandardItem } from "@/hooks/audit/useStandards";
import { StandardItem, AuditStandard, FieldType } from "@/services/audit/standards";

const formSchema = z.object({
  item_number: z.string().min(1, "Número é obrigatório").max(50),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  field_type: z.enum(['question', 'guidance', 'text']),
  weight: z.number().min(0).max(100),
  is_required: z.boolean(),
  requires_justification: z.boolean(),
  guidance_text: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standard: AuditStandard;
  item?: StandardItem | null;
  parentId?: string;
}

export function ItemFormDialog({ open, onOpenChange, standard, item, parentId }: ItemFormDialogProps) {
  const createItem = useCreateStandardItem();
  const updateItem = useUpdateStandardItem();
  const isEditing = !!item;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_number: "",
      title: "",
      description: "",
      field_type: "question",
      weight: 1,
      is_required: false,
      requires_justification: false,
      guidance_text: "",
    },
  });

  const fieldType = form.watch('field_type');

  useEffect(() => {
    if (item) {
      form.reset({
        item_number: item.item_number,
        title: item.title,
        description: item.description || "",
        field_type: item.field_type,
        weight: item.weight,
        is_required: item.is_required,
        requires_justification: item.requires_justification,
        guidance_text: item.guidance_text || "",
      });
    } else {
      form.reset({
        item_number: "",
        title: "",
        description: "",
        field_type: "question",
        weight: 1,
        is_required: false,
        requires_justification: false,
        guidance_text: "",
      });
    }
  }, [item, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateItem.mutateAsync({
          id: item.id,
          data,
          standardId: standard.id,
        });
      } else {
        await createItem.mutateAsync({
          ...data,
          standard_id: standard.id,
          parent_id: parentId,
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Item" : parentId ? "Novo Sub-item" : "Novo Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do item"
              : "Adicione um novo item à norma"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="item_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 4.1.2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="field_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Campo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="question">Pergunta</SelectItem>
                        <SelectItem value="guidance">Texto Orientativo</SelectItem>
                        <SelectItem value="text">Campo de Texto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fieldType === 'question' && (
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Contexto da Organização" {...field} />
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
                  <FormLabel>Descrição / Requisito</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o requisito ou conteúdo do item..."
                      className="resize-none"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fieldType === 'question' && (
              <FormField
                control={form.control}
                name="guidance_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de Orientação para o Auditor</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Instruções sobre como auditar este item..."
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Este texto será exibido para o auditor durante a execução
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex flex-col gap-4">
              {fieldType === 'question' && (
                <FormField
                  control={form.control}
                  name="requires_justification"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requer Justificativa</FormLabel>
                        <FormDescription>
                          O auditor deve informar justificativa para a resposta
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {fieldType === 'text' && (
                <FormField
                  control={form.control}
                  name="is_required"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Campo Obrigatório</FormLabel>
                        <FormDescription>
                          O auditor deve preencher este campo para concluir a auditoria
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

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
