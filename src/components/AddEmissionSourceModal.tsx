import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, ChevronLeft } from "lucide-react"

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

// Schema para o Passo 1
const step1Schema = z.object({
  nome: z.string().min(1, "Nome da fonte é obrigatório"),
  escopo: z.string().min(1, "Escopo é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
})

// Schema para o Passo 2 - Combustão Estacionária
const step2CombustaoSchema = z.object({
  tipoCombustivel: z.string().min(1, "Tipo de combustível é obrigatório"),
  consumo: z.string().min(1, "Consumo é obrigatório"),
  periodo: z.date({
    required_error: "Período é obrigatório",
  }),
})

// Schema para o Passo 2 - Eletricidade Adquirida
const step2EletricidadeSchema = z.object({
  localizacaoFornecedor: z.string().min(1, "Localização ou fornecedor é obrigatório"),
  consumoEletricidade: z.string().min(1, "Consumo de eletricidade é obrigatório"),
  periodo: z.date({
    required_error: "Período é obrigatório",
  }),
  fatorEmissao: z.string().min(1, "Fator de emissão é obrigatório"),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2CombustaoData = z.infer<typeof step2CombustaoSchema>
type Step2EletricidadeData = z.infer<typeof step2EletricidadeSchema>

interface AddEmissionSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categoriasPorEscopo = {
  "Escopo 1": [
    "Combustão Estacionária",
    "Combustão Móvel", 
    "Emissões Fugitivas",
    "Processos Industriais"
  ],
  "Escopo 2": [
    "Eletricidade Adquirida",
    "Vapor, Aquecimento ou Resfriamento Adquirido"
  ],
  "Escopo 3": [
    "Transporte de Funcionários",
    "Viagens Corporativas",
    "Resíduos Gerados"
  ]
}

const combustiveis = [
  { value: "gas-natural", label: "Gás Natural", unidade: "m³" },
  { value: "oleo-diesel", label: "Óleo Diesel", unidade: "Litros" },
  { value: "glp", label: "Gás Liquefeito de Petróleo (GLP)", unidade: "kg" },
  { value: "carvao-mineral", label: "Carvão Mineral", unidade: "toneladas" },
  { value: "biomassa", label: "Biomassa", unidade: "toneladas" },
]

export function AddEmissionSourceModal({ open, onOpenChange }: AddEmissionSourceModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [stepType, setStepType] = useState<'combustao' | 'eletricidade' | null>(null)

  // Form para Passo 1
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nome: "",
      escopo: "",
      categoria: "",
    },
  })

  // Form para Passo 2 - Combustão
  const form2Combustao = useForm<Step2CombustaoData>({
    resolver: zodResolver(step2CombustaoSchema),
    defaultValues: {
      tipoCombustivel: "",
      consumo: "",
    },
  })

  // Form para Passo 2 - Eletricidade
  const form2Eletricidade = useForm<Step2EletricidadeData>({
    resolver: zodResolver(step2EletricidadeSchema),
    defaultValues: {
      localizacaoFornecedor: "",
      consumoEletricidade: "",
      fatorEmissao: "61.7", // Valor padrão do SIN
    },
  })

  const watchedEscopo = form1.watch("escopo")
  const watchedTipoCombustivel = form2Combustao.watch("tipoCombustivel")
  
  const selectedCombustivel = combustiveis.find(c => c.value === watchedTipoCombustivel)

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data)
    
    // Determinar o tipo de passo 2 baseado na categoria
    if (data.escopo === "Escopo 1" && data.categoria === "Combustão Estacionária") {
      setStepType('combustao')
      setCurrentStep(2)
    } else if (data.escopo === "Escopo 2" && data.categoria === "Eletricidade Adquirida") {
      setStepType('eletricidade')
      setCurrentStep(2)
    } else {
      // Para outras combinações, salvar direto (por enquanto apenas mostrar sucesso)
      handleFinalSubmit(data, null)
    }
  }

  const onStep2CombustaoSubmit = (data: Step2CombustaoData) => {
    handleFinalSubmit(step1Data!, data)
  }

  const onStep2EletricidadeSubmit = (data: Step2EletricidadeData) => {
    handleFinalSubmit(step1Data!, data)
  }

  const handleFinalSubmit = (step1: Step1Data, step2: Step2CombustaoData | Step2EletricidadeData | null) => {
    console.log("Dados finais:", { step1, step2, stepType })
    // Aqui seria feita a integração com a API
    
    // Resetar forms e fechar modal
    resetAndClose()
  }

  const resetAndClose = () => {
    form1.reset()
    form2Combustao.reset()
    form2Eletricidade.reset()
    setCurrentStep(1)
    setStep1Data(null)
    setStepType(null)
    onOpenChange(false)
  }

  const goBack = () => {
    setCurrentStep(1)
    setStep1Data(null)
    setStepType(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Adicionar Nova Fonte de Emissão
          </DialogTitle>
        </DialogHeader>

        {currentStep === 1 && (
          <div className="space-y-6">
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
                <FormField
                  control={form1.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dê um nome para esta fonte</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Caldeira a Gás Natural - Unidade SP" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="escopo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecione o Escopo da Emissão</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value)
                        form1.setValue("categoria", "") // Reset categoria quando escopo muda
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o escopo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Escopo 1">Escopo 1</SelectItem>
                          <SelectItem value="Escopo 2">Escopo 2</SelectItem>
                          <SelectItem value="Escopo 3">Escopo 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecione a Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!watchedEscopo}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Primeiro selecione o escopo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {watchedEscopo && categoriasPorEscopo[watchedEscopo as keyof typeof categoriasPorEscopo]?.map((categoria) => (
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

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetAndClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Próximo
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {currentStep === 2 && stepType === 'combustao' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="p-1 h-auto"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              Dados da Combustão Estacionária
            </div>

            <Form {...form2Combustao}>
              <form onSubmit={form2Combustao.handleSubmit(onStep2CombustaoSubmit)} className="space-y-4">
                <FormField
                  control={form2Combustao.control}
                  name="tipoCombustivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecione o Combustível Utilizado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {combustiveis.map((combustivel) => (
                            <SelectItem key={combustivel.value} value={combustivel.value}>
                              {combustivel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form2Combustao.control}
                  name="consumo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insira a Quantidade Consumida</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="flex-1"
                            {...field} 
                          />
                          <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground min-w-[80px] justify-center">
                            {selectedCombustivel?.unidade || "unidade"}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form2Combustao.control}
                  name="periodo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Período de Referência do Consumo</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MMMM yyyy")
                              ) : (
                                <span>Selecione o período</span>
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
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seção de Estimativa */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Estimativa de Emissão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      O cálculo de tCO₂e será realizado automaticamente após salvar.
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={goBack}>
                    Voltar
                  </Button>
                  <Button type="submit">
                    Salvar Fonte
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {currentStep === 2 && stepType === 'eletricidade' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="p-1 h-auto"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              Dados de Eletricidade Adquirida
            </div>

            <Form {...form2Eletricidade}>
              <form onSubmit={form2Eletricidade.handleSubmit(onStep2EletricidadeSubmit)} className="space-y-4">
                <FormField
                  control={form2Eletricidade.control}
                  name="localizacaoFornecedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifique a localização ou o fornecedor</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Fatura de Energia - Unidade RJ" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form2Eletricidade.control}
                  name="consumoEletricidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insira o Consumo</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="flex-1"
                            {...field} 
                          />
                          <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground min-w-[60px] justify-center">
                            kWh
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form2Eletricidade.control}
                  name="periodo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Período de Referência do Consumo</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MMMM yyyy")
                              ) : (
                                <span>Selecione o período</span>
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
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form2Eletricidade.control}
                  name="fatorEmissao"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Fator de Emissão (gCO₂e/kWh)</FormLabel>
                        <div className="group relative">
                          <div className="cursor-help text-muted-foreground hover:text-foreground transition-colors">
                            ⓘ
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-popover border border-border rounded-md shadow-md text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            Utilizamos o fator de emissão médio mais recente do SIN publicado pelo MCTI. Você pode ajustar este valor se possuir um fator específico do seu fornecedor.
                          </div>
                        </div>
                      </div>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seção de Estimativa */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Estimativa de Emissão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      O cálculo de tCO₂e (Consumo kWh × Fator de Emissão) será realizado automaticamente após salvar.
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={goBack}>
                    Voltar
                  </Button>
                  <Button type="submit">
                    Salvar Fonte
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}