import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { EmissionFactor } from "@/services/emissionFactors"

const customFactorSchema = z.object({
  nome: z.string().min(1, "Nome do fator é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  co2: z.string().optional().refine((val) => !val || parseFloat(val) >= 0, {
    message: "Valor deve ser positivo"
  }),
  ch4: z.string().optional().refine((val) => !val || parseFloat(val) >= 0, {
    message: "Valor deve ser positivo"
  }),
  n2o: z.string().optional().refine((val) => !val || parseFloat(val) >= 0, {
    message: "Valor deve ser positivo"
  }),
  fonte: z.string().min(1, "Fonte é obrigatória"),
}).refine((data) => data.co2 || data.ch4 || data.n2o, {
  message: "Pelo menos um fator de emissão deve ser preenchido",
  path: ["co2"]
})

type CustomFactorData = z.infer<typeof customFactorSchema>

interface EditCustomFactorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  factor: EmissionFactor | null
}

const categorias = [
  "Combustão Estacionária",
  "Combustão Móvel", 
  "Emissões Fugitivas",
  "Processos Industriais"
]

const unidades = [
  "tonelada",
  "kg",
  "Litro", 
  "m³",
  "kWh",
  "unidade"
]

export function EditCustomFactorModal({ open, onOpenChange, factor }: EditCustomFactorModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<CustomFactorData>({
    resolver: zodResolver(customFactorSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      unidade: "",
      co2: "",
      ch4: "",
      n2o: "",
      fonte: "",
    },
  })

  const watchedUnidade = form.watch("unidade")

  // Pre-populate form when factor changes
  useEffect(() => {
    if (factor && open) {
      form.setValue("nome", factor.name)
      form.setValue("categoria", factor.category)
      form.setValue("unidade", factor.activity_unit)
      form.setValue("co2", factor.co2_factor ? factor.co2_factor.toString() : "")
      form.setValue("ch4", factor.ch4_factor ? factor.ch4_factor.toString() : "")
      form.setValue("n2o", factor.n2o_factor ? factor.n2o_factor.toString() : "")
      form.setValue("fonte", factor.source)

      // Set date range if year_of_validity exists
      if (factor.year_of_validity) {
        const startDate = new Date(factor.year_of_validity, 0, 1)
        const endDate = new Date(factor.year_of_validity, 11, 31)
        setDateRange({ from: startDate, to: endDate })
      } else {
        setDateRange(undefined)
      }
    }
  }, [factor, open, form])

  const onSubmit = async (data: CustomFactorData) => {
    if (!factor) return

    try {
      setIsLoading(true)
      console.log("Editando fator customizado:", { ...data, vigencia: dateRange })
      
      // Prepare the data for update
      const updateData = {
        name: data.nome,
        category: data.categoria,
        activity_unit: data.unidade,
        co2_factor: data.co2 ? parseFloat(data.co2) : undefined,
        ch4_factor: data.ch4 ? parseFloat(data.ch4) : undefined,
        n2o_factor: data.n2o ? parseFloat(data.n2o) : undefined,
        source: data.fonte,
        year_of_validity: dateRange?.from ? new Date(dateRange.from).getFullYear() : undefined,
      };

      // Import and call the service function
      const { updateCustomEmissionFactor } = await import("@/services/emissionFactors");
      await updateCustomEmissionFactor(factor.id, updateData);
      
      toast({
        title: "Fator Atualizado",
        description: "O fator customizado foi atualizado com sucesso.",
      });

      resetAndClose();
      
      // Trigger reload if there's a callback
      if (window.location.pathname === '/biblioteca-fatores') {
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Erro ao atualizar fator:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar fator de emissão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  }

  const resetAndClose = () => {
    form.reset()
    setDateRange(undefined)
    onOpenChange(false)
  }

  if (!factor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Editar Fator de Emissão Customizado
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção 1: Identificação e Aplicação */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Identificação e Aplicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Fator Customizado</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Biomassa de Eucalipto - Fornecedor Z" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aplicável à Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((categoria) => (
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
                  name="unidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida da Atividade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unidades.map((unidade) => (
                            <SelectItem key={unidade} value={unidade}>
                              {unidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção 2: Valores de Emissão por Gás */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Fatores de Emissão por Gás</CardTitle>
                {watchedUnidade && (
                  <p className="text-sm text-muted-foreground">
                    Unidade: kg de Gás / {watchedUnidade}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="co2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fator para Dióxido de Carbono (CO₂)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          placeholder="0.000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ch4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fator para Metano (CH₄)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          placeholder="0.000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="n2o"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fator para Óxido Nitroso (N₂O)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          placeholder="0.000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção 3: Documentação e Validade */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Documentação e Validade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fonte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonte do Fator</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Laudo do Fornecedor Z, Medição interna 2025" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Este fator é válido de:</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                              {format(dateRange.to, "dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          <span>Selecione o período de vigência</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Resumo do Cálculo */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Fator de Emissão em CO₂ Equivalente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O fator em tCO₂e será recalculado automaticamente com base nos Potenciais de Aquecimento Global (GWP) do IPCC ao salvar.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}