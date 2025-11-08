import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWasteLogById, updateWasteLog } from "@/services/waste";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// Helper functions for CNPJ formatting
const onlyDigits = (s: string) => s.replace(/\D/g, "");

const formatCNPJ = (value: string) => {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
};

const CNPJ_REGEX = /^(\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/;

const formSchema = z.object({
  mtr: z.string().min(1, "Nº MTR/Controle é obrigatório"),
  dataColeta: z.date({ message: "Data da coleta é obrigatória" }),
  descricaoResiduo: z.string().min(1, "Descrição do resíduo é obrigatória"),
  classe: z.string().min(1, "Classe é obrigatória"),
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  transportador: z.string().optional(),
  cnpjTransportador: z.string().optional().transform(v => (v ?? "").trim())
    .refine(v => v === "" || CNPJ_REGEX.test(v), { message: "CNPJ inválido" }),
  destinador: z.string().optional(),
  cnpjDestinador: z.string().optional().transform(v => (v ?? "").trim())
    .refine(v => v === "" || CNPJ_REGEX.test(v), { message: "CNPJ inválido" }),
  tipoDestinacao: z.string().optional(),
  custo: z.number().min(0, "Custo deve ser positivo").optional(),
  status: z.string().min(1, "Status é obrigatório"),
});

interface WasteLogEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wasteLogId: string;
  onSuccess?: () => void;
}

export function WasteLogEditModal({ open, onOpenChange, wasteLogId, onSuccess }: WasteLogEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wasteLog, isLoading } = useQuery({
    queryKey: ['waste-logs', 'detail', wasteLogId],
    queryFn: () => getWasteLogById(wasteLogId),
    enabled: open && !!wasteLogId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mtr: "",
      dataColeta: new Date(),
      descricaoResiduo: "",
      classe: "",
      quantidade: 0,
      unidade: "",
      transportador: "",
      cnpjTransportador: "",
      destinador: "",
      cnpjDestinador: "",
      tipoDestinacao: "",
      custo: 0,
      status: "Coletado",
    },
  });

  // Populate form when wasteLog data is loaded
  useEffect(() => {
    if (wasteLog) {
      form.reset({
        mtr: wasteLog.mtr_number,
        dataColeta: new Date(wasteLog.collection_date),
        descricaoResiduo: wasteLog.waste_description,
        classe: wasteLog.waste_class || "",
        quantidade: wasteLog.quantity,
        unidade: wasteLog.unit,
        transportador: wasteLog.transporter_name || "",
        cnpjTransportador: wasteLog.transporter_cnpj ? formatCNPJ(wasteLog.transporter_cnpj) : "",
        destinador: wasteLog.destination_name || "",
        cnpjDestinador: wasteLog.destination_cnpj ? formatCNPJ(wasteLog.destination_cnpj) : "",
        tipoDestinacao: wasteLog.final_treatment_type || "",
        custo: wasteLog.cost || 0,
        status: wasteLog.status,
      });
    }
  }, [wasteLog, form]);

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const sanitizeCNPJ = (v?: string) => (v ? onlyDigits(v) : undefined);
      
      return updateWasteLog(wasteLogId, {
        mtr_number: data.mtr,
        waste_description: data.descricaoResiduo,
        waste_class: data.classe as "Classe I - Perigoso" | "Classe II A - Não Inerte" | "Classe II B - Inerte",
        collection_date: data.dataColeta.toISOString().split('T')[0],
        quantity: data.quantidade,
        unit: data.unidade,
        transporter_name: data.transportador || undefined,
        transporter_cnpj: sanitizeCNPJ(data.cnpjTransportador),
        destination_name: data.destinador || undefined,
        destination_cnpj: sanitizeCNPJ(data.cnpjDestinador),
        final_treatment_type: data.tipoDestinacao || undefined,
        cost: data.custo || undefined,
        status: data.status as 'Coletado' | 'Destinação Finalizada' | 'Em Trânsito',
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Registro atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['waste-logs'] });
      queryClient.invalidateQueries({ queryKey: ['waste-dashboard'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Registro de Resíduo</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Identificação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mtr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº do MTR/Controle</FormLabel>
                      <FormControl>
                        <Input placeholder="Código de rastreamento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataColeta"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Coleta</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Caracterização do Resíduo */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="descricaoResiduo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Resíduo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Resíduos de tinta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="classe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classe</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a classe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Classe I - Perigoso">Classe I - Perigoso</SelectItem>
                            <SelectItem value="Classe II A - Não Inerte">Classe II A - Não Inerte</SelectItem>
                            <SelectItem value="Classe II B - Inerte">Classe II B - Inerte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="ton">ton</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="m³">m³</SelectItem>
                            <SelectItem value="un">un</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Transportador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transportador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transportador</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do transportador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpjTransportador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ do Transportador</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Destinador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destinador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinador Final</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do destinador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpjDestinador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ do Destinador</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo de Destinação e Custo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoDestinacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Destinação Final</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Reciclagem">Reciclagem</SelectItem>
                          <SelectItem value="Aterro Sanitário">Aterro Sanitário</SelectItem>
                          <SelectItem value="Incineração">Incineração</SelectItem>
                          <SelectItem value="Coprocessamento">Coprocessamento</SelectItem>
                          <SelectItem value="Compostagem">Compostagem</SelectItem>
                          <SelectItem value="Reutilização">Reutilização</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo de Destinação (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                        <SelectContent>
                          <SelectItem value="Coletado">Coletado</SelectItem>
                          <SelectItem value="Em Trânsito">Em Trânsito</SelectItem>
                          <SelectItem value="Destinação Finalizada">Destinação Finalizada</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
