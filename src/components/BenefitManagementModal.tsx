import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const benefitSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  description: z.string().optional(),
  monthlyCost: z.string().min(1, "Custo mensal é obrigatório"),
  eligibilityRules: z.string().optional(),
  isActive: z.boolean(),
  provider: z.string().optional(),
  contractNumber: z.string().optional(),
});

type BenefitFormData = z.infer<typeof benefitSchema>;

interface Benefit {
  id?: string;
  name: string;
  type: string;
  description?: string;
  monthlyCost: number;
  eligibilityRules?: string;
  isActive: boolean;
  provider?: string;
  contractNumber?: string;
}

interface BenefitManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit?: Benefit;
  onSuccess: () => void;
}

export function BenefitManagementModal({
  open,
  onOpenChange,
  benefit,
  onSuccess,
}: BenefitManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!benefit;

  const form = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      monthlyCost: "",
      eligibilityRules: "",
      isActive: true,
      provider: "",
      contractNumber: "",
    },
  });

  useEffect(() => {
    if (benefit) {
      form.reset({
        name: benefit.name,
        type: benefit.type,
        description: benefit.description || "",
        monthlyCost: benefit.monthlyCost.toString(),
        eligibilityRules: benefit.eligibilityRules || "",
        isActive: benefit.isActive,
        provider: benefit.provider || "",
        contractNumber: benefit.contractNumber || "",
      });
    } else {
      form.reset({
        name: "",
        type: "",
        description: "",
        monthlyCost: "",
        eligibilityRules: "",
        isActive: true,
        provider: "",
        contractNumber: "",
      });
    }
  }, [benefit, form]);

  const onSubmit = async (data: BenefitFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const action = isEditing ? "atualizado" : "criado";
      toast.success(`Benefício ${action} com sucesso!`);
      
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao salvar benefício");
    } finally {
      setIsLoading(false);
    }
  };

  const benefitTypes = [
    "Saúde",
    "Alimentação",
    "Transporte",
    "Seguro",
    "Educação",
    "Lazer",
    "Auxílio Creche",
    "Auxílio Combustível",
    "Plano Odontológico",
    "Gympass",
    "Outros",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Benefício" : "Novo Benefício"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere as informações do benefício"
              : "Preencha os dados para criar um novo benefício"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Benefício</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Plano de Saúde" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {benefitTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      placeholder="Descreva o benefício..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Mensal (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0,00"
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa fornecedora" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Contrato</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CT-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Benefício Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Disponível para os funcionários
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="eligibilityRules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regras de Elegibilidade</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Funcionários efetivos com mais de 90 dias de empresa..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar Benefício"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}