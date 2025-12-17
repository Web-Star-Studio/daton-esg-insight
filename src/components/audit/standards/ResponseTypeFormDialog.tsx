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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateResponseType, useUpdateResponseType } from "@/hooks/audit/useResponseTypes";
import { ResponseType } from "@/services/audit/responseTypes";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  name_en: z.string().max(100).optional(),
  name_es: z.string().max(100).optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ResponseTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseType?: ResponseType | null;
}

export function ResponseTypeFormDialog({ open, onOpenChange, responseType }: ResponseTypeFormDialogProps) {
  const createResponseType = useCreateResponseType();
  const updateResponseType = useUpdateResponseType();
  const isEditing = !!responseType;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      name_en: "",
      name_es: "",
      description: "",
    },
  });

  useEffect(() => {
    if (responseType) {
      form.reset({
        name: responseType.name,
        name_en: responseType.name_en || "",
        name_es: responseType.name_es || "",
        description: responseType.description || "",
      });
    } else {
      form.reset({
        name: "",
        name_en: "",
        name_es: "",
        description: "",
      });
    }
  }, [responseType, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateResponseType.mutateAsync({ id: responseType.id, data });
      } else {
        await createResponseType.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createResponseType.isPending || updateResponseType.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tipo de Resposta" : "Novo Tipo de Resposta"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do tipo de resposta"
              : "Crie um novo tipo de resposta para usar nas auditorias"
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
                    <Input placeholder="Ex: Conforme/Não Conforme" {...field} />
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
                      <Input placeholder="Ex: Compliant/Non-Compliant" {...field} />
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
                      <Input placeholder="Ex: Conforme/No Conforme" {...field} />
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
                      placeholder="Descreva o tipo de resposta..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Explique quando este tipo de resposta deve ser usado
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
