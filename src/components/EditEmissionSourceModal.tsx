import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateEmissionSource } from "@/services/emissions";
import { useToast } from "@/hooks/use-toast";

const editSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  scope: z.number().min(1).max(3),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditEmissionSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: {
    id: string;
    name: string;
    scope: number;
    category: string;
    description?: string;
  } | null;
  onSuccess: () => void;
}

const categoriasPorEscopo = {
  1: [
    "Combustão Estacionária",
    "Combustão Móvel",
    "Emissões Fugitivas",
    "Processos Industriais"
  ],
  2: [
    "Eletricidade Adquirida",
    "Vapor Adquirido",
    "Aquecimento/Resfriamento Adquirido"
  ],
  3: [
    "Transporte e Distribuição",
    "Viagens de Negócios",
    "Deslocamento de Funcionários",
    "Resíduos Gerados",
    "Bens e Serviços Adquiridos",
    "Uso de Produtos Vendidos"
  ]
};

export default function EditEmissionSourceModal({
  open,
  onOpenChange,
  source,
  onSuccess
}: EditEmissionSourceModalProps) {
  const { toast } = useToast();
  
  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      scope: 1,
      category: "",
      description: "",
    }
  });

  const selectedScope = form.watch("scope");

  useEffect(() => {
    if (source) {
      form.reset({
        name: source.name,
        scope: source.scope,
        category: source.category,
        description: source.description || "",
      });
    }
  }, [source, form]);

  const handleSubmit = async (data: EditFormData) => {
    if (!source) return;

    try {
      await updateEmissionSource(source.id, data);
      toast({
        title: "Sucesso",
        description: "Fonte de emissão atualizada com sucesso!",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar fonte de emissão.",
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Fonte de Emissão</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Fonte</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Caldeira Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escopo</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      form.setValue("category", "");
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o escopo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Escopo 1 - Emissões Diretas</SelectItem>
                      <SelectItem value="2">Escopo 2 - Emissões Indiretas de Energia</SelectItem>
                      <SelectItem value="3">Escopo 3 - Outras Emissões Indiretas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriasPorEscopo[selectedScope as keyof typeof categoriasPorEscopo]?.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhes sobre esta fonte de emissão..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}