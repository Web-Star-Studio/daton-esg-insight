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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBenefit } from "@/services/benefits";

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

interface BenefitModalProps {
  id?: string;
  name: string;
  type: string;
  description?: string;
  monthly_cost: number;
  eligibility_rules?: string;
  is_active: boolean;
  provider?: string;
  contract_number?: string;
  created_at?: string;
  updated_at?: string;
}

interface BenefitManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit?: BenefitModalProps | null;
  onSuccess: () => void;
}

export function BenefitManagementModal({
  open,
  onOpenChange,
  benefit,
  onSuccess,
}: BenefitManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = !!benefit;

  const handleDelete = async () => {
    if (!benefit?.id) return;
    
    setIsDeleting(true);
    try {
      await deleteBenefit(benefit.id);
      toast.success("Benefício excluído com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error("Erro ao excluir benefício");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

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
        monthlyCost: benefit.monthly_cost?.toString() || "",
        eligibilityRules: benefit.eligibility_rules || "",
        isActive: benefit.is_active,
        provider: benefit.provider || "",
        contractNumber: benefit.contract_number || "",
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
      const { createBenefit, updateBenefit } = await import("@/services/benefits");
      
      const benefitData = {
        name: data.name,
        type: data.type,
        description: data.description,
        monthly_cost: parseFloat(data.monthlyCost),
        eligibility_rules: data.eligibilityRules,
        is_active: data.isActive,
        provider: data.provider,
        contract_number: data.contractNumber,
      };

      if (isEditing && benefit?.id) {
        await updateBenefit(benefit.id, benefitData);
        toast.success("Benefício atualizado com sucesso!");
      } else {
        await createBenefit(benefitData);
        toast.success("Benefício criado com sucesso!");
      }
      
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving benefit:', error);
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

            <div className="flex justify-between pt-6">
              {isEditing ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={isLoading || isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              ) : (
                <div />
              )}
              <div className="flex space-x-2">
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
            </div>
          </form>
        </Form>

        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Benefício</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o benefício "{benefit?.name}"?
                Esta ação não pode ser desfeita e removerá todas as inscrições de funcionários neste benefício.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}