import { useState } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { IndicatorTarget } from "@/services/indicatorTargets";

interface EditTargetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: IndicatorTarget;
  measurementUnit: string;
  onSave: (updates: Partial<IndicatorTarget>) => void;
  isLoading?: boolean;
}

const createTargetSchema = (measurementUnit: string) => {
  const isPercentage = measurementUnit === '%';
  
  return z.object({
    target_value: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
    upper_limit: z.coerce.number().min(0, "Deve ser maior ou igual a 0").optional().nullable(),
    lower_limit: z.coerce.number().min(0, "Deve ser maior ou igual a 0").optional().nullable(),
    critical_upper_limit: z.coerce.number().min(0, "Deve ser maior ou igual a 0")
      .max(isPercentage ? 100 : 999999, isPercentage ? "Para indicadores em %, o limite não pode exceder 100%" : undefined)
      .optional().nullable(),
    critical_lower_limit: z.coerce.number().min(0, "Deve ser maior ou igual a 0")
      .max(isPercentage ? 100 : 999999, isPercentage ? "Para indicadores em %, o limite não pode exceder 100%" : undefined)
      .optional().nullable(),
    valid_from: z.string().min(1, "Data obrigatória"),
    valid_until: z.string().optional().nullable(),
  }).refine((data) => {
    // Validar lógica: limite inferior < meta < limite superior
    if (data.lower_limit != null && data.target_value < data.lower_limit) {
      return false;
    }
    if (data.upper_limit != null && data.target_value > data.upper_limit) {
      return false;
    }
    return true;
  }, {
    message: "A meta deve estar entre os limites inferior e superior",
    path: ["target_value"],
  }).refine((data) => {
    // Validar que limite crítico superior seja maior que limite superior
    if (data.upper_limit != null && data.critical_upper_limit != null) {
      return data.critical_upper_limit >= data.upper_limit;
    }
    return true;
  }, {
    message: "O limite crítico superior deve ser maior ou igual ao limite superior",
    path: ["critical_upper_limit"],
  }).refine((data) => {
    // Validar que limite crítico inferior seja menor que limite inferior
    if (data.lower_limit != null && data.critical_lower_limit != null) {
      return data.critical_lower_limit <= data.lower_limit;
    }
    return true;
  }, {
    message: "O limite crítico inferior deve ser menor ou igual ao limite inferior",
    path: ["critical_lower_limit"],
  });
};

export function EditTargetModal({
  open,
  onOpenChange,
  target,
  measurementUnit,
  onSave,
  isLoading,
}: EditTargetModalProps) {
  const [showWarning, setShowWarning] = useState(false);
  
  const form = useForm<z.infer<ReturnType<typeof createTargetSchema>>>({
    resolver: zodResolver(createTargetSchema(measurementUnit)),
    defaultValues: {
      target_value: target.target_value,
      upper_limit: target.upper_limit ?? undefined,
      lower_limit: target.lower_limit ?? undefined,
      critical_upper_limit: target.critical_upper_limit ?? undefined,
      critical_lower_limit: target.critical_lower_limit ?? undefined,
      valid_from: target.valid_from,
      valid_until: target.valid_until ?? undefined,
    },
  });

  const handleSubmit = (values: z.infer<ReturnType<typeof createTargetSchema>>) => {
    // Verificar valores suspeitos
    const isPercentage = measurementUnit === '%';
    const hasSuspiciousValue = isPercentage && (
      (values.critical_upper_limit && values.critical_upper_limit > 100) ||
      (values.critical_lower_limit && values.critical_lower_limit > 100) ||
      (values.upper_limit && values.upper_limit > 100) ||
      (values.lower_limit && values.lower_limit > 100) ||
      values.target_value > 100
    );

    if (hasSuspiciousValue && !showWarning) {
      setShowWarning(true);
      return;
    }

    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Meta do Indicador</DialogTitle>
          <DialogDescription>
            Ajuste os valores de meta e limites. Unidade: {measurementUnit}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {showWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Atenção! Você está definindo valores acima de 100% para um indicador percentual.
                  Tem certeza? Clique novamente em Salvar para confirmar.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Meta *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 95" {...field} />
                    </FormControl>
                    <FormDescription>Valor alvo do indicador</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válido Desde *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Válido Até (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormDescription>Deixe em branco se não houver data de término</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">Limites de Alerta</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="upper_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Superior</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Ex: 98" 
                          {...field} 
                          value={field.value ?? ''} 
                        />
                      </FormControl>
                      <FormDescription>Alerta de atenção</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lower_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Inferior</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Ex: 90" 
                          {...field} 
                          value={field.value ?? ''} 
                        />
                      </FormControl>
                      <FormDescription>Alerta de atenção</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3 text-destructive">Limites Críticos</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="critical_upper_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Crítico Superior</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Ex: 100" 
                          {...field} 
                          value={field.value ?? ''} 
                        />
                      </FormControl>
                      <FormDescription>Alerta crítico</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="critical_lower_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Crítico Inferior</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Ex: 85" 
                          {...field} 
                          value={field.value ?? ''} 
                        />
                      </FormControl>
                      <FormDescription>Alerta crítico</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Meta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
