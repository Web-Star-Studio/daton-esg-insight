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
import { toast } from "sonner";
import { useEmployees } from "@/services/employees";

const salarySchema = z.object({
  employeeId: z.string().min(1, "Funcionário é obrigatório"),
  newSalary: z.string().min(1, "Novo salário é obrigatório"),
  adjustmentType: z.string().min(1, "Tipo de reajuste é obrigatório"),
  effectiveDate: z.string().min(1, "Data de vigência é obrigatória"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional(),
});

type SalaryFormData = z.infer<typeof salarySchema>;

interface SalaryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SalaryManagementModal({
  open,
  onOpenChange,
  onSuccess,
}: SalaryManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: employees = [] } = useEmployees();

  const form = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      employeeId: "",
      newSalary: "",
      adjustmentType: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: SalaryFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Reajuste salarial aplicado com sucesso!");
      
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao aplicar reajuste salarial");
    } finally {
      setIsLoading(false);
    }
  };

  const adjustmentTypes = [
    "Promoção",
    "Mérito",
    "Correção Salarial",
    "Reajuste Anual",
    "Mudança de Cargo",
    "Equiparação",
    "Correção de Mercado",
  ];

  const reasons = [
    "Promoção de cargo",
    "Avaliação de desempenho",
    "Correção salarial",
    "Dissídio coletivo",
    "Mudança de função",
    "Equiparação salarial",
    "Pesquisa salarial",
    "Outros",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reajuste Salarial</DialogTitle>
          <DialogDescription>
            Aplique um reajuste salarial para um funcionário
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionário</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.position || "Cargo não informado"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="newSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Salário (R$)</FormLabel>
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
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vigência</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Reajuste</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adjustmentTypes.map((type) => (
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

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o reajuste..."
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
                {isLoading ? "Aplicando..." : "Aplicar Reajuste"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}