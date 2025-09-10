import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Upload, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const formSchema = z.object({
  mtr: z.string().min(1, "Nº MTR/Controle é obrigatório"),
  dataColeta: z.date({ required_error: "Data da coleta é obrigatória" }),
  descricaoResiduo: z.string().min(1, "Descrição do resíduo é obrigatória"),
  classe: z.string().min(1, "Classe é obrigatória"),
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  transportador: z.string().min(1, "Transportador é obrigatório"),
  cnpjTransportador: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido").optional().or(z.literal("")),
  destinador: z.string().min(1, "Destinador é obrigatório"),
  cnpjDestinador: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido").optional().or(z.literal("")),
  tipoDestinacao: z.string().min(1, "Tipo de destinação é obrigatório"),
  custo: z.number().min(0, "Custo deve ser positivo").optional(),
})

const RegistrarDestinacao = () => {
  const navigate = useNavigate()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mtr: "",
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
    },
  })

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
    navigate("/residuos")
  }

  const handleCancel = () => {
    navigate("/residuos")
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Destinação de Resíduo</h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados da movimentação de resíduo
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="residuo-form">
              Salvar Registro
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="residuo-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção 1: Identificação */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Identificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mtr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº do Manifesto (MTR) ou Controle Interno</FormLabel>
                        <FormControl>
                          <Input placeholder="Insira o código de rastreamento" {...field} />
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
                        <FormLabel>Data da Coleta/Saída do Resíduo</FormLabel>
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
                </div>
              </CardContent>
            </Card>

            {/* Seção 2: Caracterização do Resíduo */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Caracterização do Resíduo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="descricaoResiduo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Resíduo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sucata de metal ferroso, Embalagens plásticas contaminadas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="classe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classe (NBR 10004)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            placeholder="100"
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="tonelada">tonelada</SelectItem>
                            <SelectItem value="Litros">Litros</SelectItem>
                            <SelectItem value="m³">m³</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção 3: Agentes Envolvidos */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Agentes Envolvidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="transportador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa Transportadora</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do Transportador" {...field} />
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
                            <Input placeholder="00.000.000/0000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="destinador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa Destinadora</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do Destinador Final" {...field} />
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
                            <Input placeholder="00.000.000/0000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção 4: Detalhes da Destinação e Custos */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Detalhes da Destinação e Custos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tipoDestinacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Destinação Final</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Reciclagem">Reciclagem</SelectItem>
                            <SelectItem value="Aterro Sanitário">Aterro Sanitário</SelectItem>
                            <SelectItem value="Incineração">Incineração</SelectItem>
                            <SelectItem value="Co-processamento">Co-processamento</SelectItem>
                            <SelectItem value="Tratamento de Efluentes">Tratamento de Efluentes</SelectItem>
                            <SelectItem value="Reaproveitamento">Reaproveitamento</SelectItem>
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
                        <FormLabel>Custo Total da Destinação</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="R$ 0,00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Upload de CDF */}
                <div className="space-y-3">
                  <Label>Anexar Certificado de Destinação Final (CDF)</Label>
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
          </form>
        </Form>
      </div>
    </MainLayout>
  )
}

export default RegistrarDestinacao