import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Upload, X, Check, ChevronsUpDown, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const formSchema = z.object({
  nomeProjeto: z.string().min(1, "Nome do projeto é obrigatório"),
  padraoCertificacao: z.string().min(1, "Padrão de certificação é obrigatório"),
  tipoProjeto: z.string().min(1, "Tipo de projeto é obrigatório"),
  quantidadeCreditos: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  custoTotal: z.number().min(0, "Custo deve ser positivo"),
  dataCompra: z.date({ required_error: "Data da compra é obrigatória" }),
  serialNumber: z.string().min(1, "ID de registro é obrigatório"),
})

const projetosExistentes = [
  "Reflorestamento Corredor Tupi",
  "Parque Eólico de Guajiru", 
  "Captura de Metano - Aterro Seropédica",
]

const RegistrarCreditosCarbono = () => {
  const navigate = useNavigate()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [isNovoProjetoMode, setIsNovoProjetoMode] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeProjeto: "",
      padraoCertificacao: "",
      tipoProjeto: "",
      quantidadeCreditos: 0,
      custoTotal: 0,
      serialNumber: "",
    },
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values)
    // Aqui seria a lógica de salvar
    navigate("/projetos-carbono")
  }

  const handleCancel = () => {
    navigate("/projetos-carbono")
  }

  const handleSelectProjeto = (projeto: string) => {
    if (projeto === "novo-projeto") {
      setIsNovoProjetoMode(true)
      form.setValue("nomeProjeto", "")
    } else {
      setIsNovoProjetoMode(false)
      form.setValue("nomeProjeto", projeto)
    }
    setOpenCombobox(false)
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Aquisição de Créditos de Carbono</h1>
            <p className="text-muted-foreground mt-1">
              Registre a compra de créditos de carbono para compensação de emissões
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="creditos-form">
              Salvar Registro
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="creditos-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout de duas colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna da Esquerda - Seções 1 e 2 */}
              <div className="space-y-6">
                {/* Seção 1: Detalhes do Projeto */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Detalhes do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="nomeProjeto"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Selecione ou adicione o projeto de origem dos créditos</FormLabel>
                          {!isNovoProjetoMode ? (
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value || "Busque pelo nome do projeto, ex: Parque Eólico de Guajiru"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Buscar projeto..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {projetosExistentes.map((projeto) => (
                                        <CommandItem
                                          key={projeto}
                                          value={projeto}
                                          onSelect={() => handleSelectProjeto(projeto)}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === projeto ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {projeto}
                                        </CommandItem>
                                      ))}
                                      <CommandItem
                                        value="novo-projeto"
                                        onSelect={() => handleSelectProjeto("novo-projeto")}
                                      >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        + Adicionar novo projeto
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div className="space-y-2">
                              <FormControl>
                                <Input 
                                  placeholder="Digite o nome do novo projeto"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsNovoProjetoMode(false)
                                  form.setValue("nomeProjeto", "")
                                }}
                              >
                                Selecionar projeto existente
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="padraoCertificacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Padrão de Certificação do Crédito</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o padrão" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VCS">Verified Carbon Standard (VCS - Verra)</SelectItem>
                              <SelectItem value="Gold Standard">Gold Standard</SelectItem>
                              <SelectItem value="ACR">American Carbon Registry (ACR)</SelectItem>
                              <SelectItem value="CAR">Climate Action Reserve (CAR)</SelectItem>
                              <SelectItem value="CERCARBONO">CERCARBONO</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoProjeto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Projeto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Energia Renovável, REDD+, Aterro Sanitário" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Seção 2: Detalhes da Transação */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Detalhes da Transação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="quantidadeCreditos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Créditos Adquiridos (em tCO₂e)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="1000"
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
                      name="custoTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Total da Transação</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="R$ 0,00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          {field.value > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Valor formatado: {formatCurrency(field.value)}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataCompra"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data da Aquisição</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
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
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Coluna da Direita - Seção 3 */}
              <div>
                {/* Seção 3: Registro e Comprovação */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Registro e Comprovação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel>ID de Registro dos Créditos (Serial Number)</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Este é o identificador único dos seus créditos na plataforma da certificadora (ex: Verra Registry).
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Input placeholder="Insira o número de série ou lote dos créditos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Upload de Certificado */}
                    <div className="space-y-3">
                      <Label>Anexar Certificado de Compra/Aposentadoria</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        {!uploadedFile ? (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                              Arraste um arquivo aqui ou
                            </div>
                            <Button type="button" variant="outline" size="sm">
                              <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                              Selecionar arquivo
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              PDF, DOC, JPG até 10MB
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                            <span className="text-sm font-medium">{uploadedFile.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  )
}

export default RegistrarCreditosCarbono