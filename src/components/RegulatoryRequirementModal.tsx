import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { complianceService, type CreateRegulatoryRequirementData } from "@/services/compliance";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  reference_code: z.string().optional(),
  jurisdiction: z.enum(["Federal", "Estadual", "Municipal"]),
  summary: z.string().optional(),
  source_url: z.string().url("URL deve ser válida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface RegulatoryRequirementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegulatoryRequirementModal({ open, onOpenChange }: RegulatoryRequirementModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      reference_code: "",
      jurisdiction: "Federal",
      summary: "",
      source_url: "",
    },
  });

  const createRequirement = useMutation({
    mutationFn: (data: CreateRegulatoryRequirementData) => complianceService.createRequirement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulatory-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-stats'] });
      toast({
        title: "Requisito mapeado",
        description: "O requisito regulatório foi mapeado com sucesso.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao mapear requisito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        title: values.title,
        reference_code: values.reference_code,
        jurisdiction: values.jurisdiction,
        summary: values.summary,
        source_url: values.source_url || undefined,
      };
      await createRequirement.mutateAsync(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapear Novo Requisito Regulatório</DialogTitle>
          <DialogDescription>
            Adicione uma nova lei, norma ou regulamento à matriz regulatória da empresa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Requisito</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Política Nacional de Resíduos Sólidos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Referência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lei Nº 12.305/2010" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurisdição</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a jurisdição" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Federal">Federal</SelectItem>
                        <SelectItem value="Estadual">Estadual</SelectItem>
                        <SelectItem value="Municipal">Municipal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumo</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva brevemente o que o requisito regulamenta e sua aplicabilidade à empresa..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Fonte (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Mapeando..." : "Mapear Requisito"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}