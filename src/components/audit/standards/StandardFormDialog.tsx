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
import { useCreateStandard, useUpdateStandard } from "@/hooks/audit/useStandards";
import { useResponseTypes } from "@/hooks/audit/useResponseTypes";
import { AuditStandard } from "@/services/audit/standards";

const formSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").max(50),
  name: z.string().min(1, "Nome é obrigatório").max(200),
  name_en: z.string().max(200).optional(),
  name_es: z.string().max(200).optional(),
  version: z.string().max(50).optional(),
  description: z.string().optional(),
  response_type_id: z.string().optional(),
  calculation_method: z.enum(['weight_based', 'quantity_based']),
  auto_numbering: z.boolean(),
  allow_partial_response: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface StandardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standard?: AuditStandard | null;
}

export function StandardFormDialog({ open, onOpenChange, standard }: StandardFormDialogProps) {
  const createStandard = useCreateStandard();
  const updateStandard = useUpdateStandard();
  const { data: responseTypes } = useResponseTypes();
  const isEditing = !!standard;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      name_es: "",
      version: "",
      description: "",
      response_type_id: "",
      calculation_method: "weight_based",
      auto_numbering: true,
      allow_partial_response: false,
    },
  });

  useEffect(() => {
    if (standard) {
      form.reset({
        code: standard.code,
        name: standard.name,
        name_en: standard.name_en || "",
        name_es: standard.name_es || "",
        version: standard.version || "",
        description: standard.description || "",
        response_type_id: standard.response_type_id || "",
        calculation_method: standard.calculation_method,
        auto_numbering: standard.auto_numbering,
        allow_partial_response: standard.allow_partial_response,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        name_en: "",
        name_es: "",
        version: "",
        description: "",
        response_type_id: "",
        calculation_method: "weight_based",
        auto_numbering: true,
        allow_partial_response: false,
      });
    }
  }, [standard, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const submitData = {
        ...data,
        response_type_id: data.response_type_id || undefined,
      };

      if (isEditing) {
        await updateStandard.mutateAsync({ id: standard.id, data: submitData });
      } else {
        await createStandard.mutateAsync(submitData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createStandard.isPending || updateStandard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Norma" : "Nova Norma"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações da norma"
              : "Cadastre uma nova norma para usar nas auditorias"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ISO_9001_2015" {...field} />
                    </FormControl>
                    <FormDescription>Identificador único da norma</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2015" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: ISO 9001:2015 - Sistema de Gestão da Qualidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome (Inglês)</FormLabel>
                    <FormControl>
                      <Input placeholder="ISO 9001:2015 - Quality Management System" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name_es"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome (Espanhol)</FormLabel>
                    <FormControl>
                      <Input placeholder="ISO 9001:2015 - Sistema de Gestión de Calidad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a norma e seus objetivos..."
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
                name="response_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Resposta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {responseTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tipo de resposta padrão para os itens desta norma
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calculation_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Cálculo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weight_based">Aderência Ponderada</SelectItem>
                        <SelectItem value="quantity_based">Porcentagem Simples</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === 'weight_based' 
                        ? 'Σ(Peso × Valor) / Σ(Pesos)'
                        : 'Qtd Conformes / Total × 100'
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="auto_numbering"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Numeração Automática</FormLabel>
                      <FormDescription>
                        Gerar números sequenciais automaticamente para os itens
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allow_partial_response"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Permitir Respostas Parciais</FormLabel>
                      <FormDescription>
                        Permitir salvar auditoria com itens não respondidos
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
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
