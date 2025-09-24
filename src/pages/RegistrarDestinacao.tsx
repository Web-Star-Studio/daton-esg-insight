
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
import { CalendarIcon, Upload, X, FileText, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { createWasteLog, uploadWasteDocument } from "@/services/waste"
import { useToast } from "@/hooks/use-toast"
import { getActivePGRSPlan } from "@/services/pgrsReports"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MTROCRModal } from "@/components/MTROCRModal"

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
  pgrsSourceId: z.string().optional(),
  pgrsWasteTypeId: z.string().optional(),
})

const RegistrarDestinacao = () => {
  const navigate = useNavigate()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showMTROCR, setShowMTROCR] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch active PGRS plan
  const { data: activePGRS } = useQuery({
    queryKey: ['active-pgrs'],
    queryFn: getActivePGRSPlan,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

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
      pgrsSourceId: "",
      pgrsWasteTypeId: "",
    },
  })

  // Auto-fill waste type when PGRS waste type is selected
  useEffect(() => {
    const selectedPgrsWasteTypeId = form.watch("pgrsWasteTypeId")
    if (selectedPgrsWasteTypeId && activePGRS?.sources) {
      for (const source of activePGRS.sources) {
        const wasteType = source.waste_types?.find((wt: any) => wt.id === selectedPgrsWasteTypeId)
        if (wasteType) {
          form.setValue("descricaoResiduo", wasteType.waste_name)
          form.setValue("classe", wasteType.hazard_class)
          form.setValue("unidade", wasteType.unit)
          break
        }
      }
    }
  }, [form.watch("pgrsWasteTypeId"), activePGRS, form])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  const handleOCRDataExtracted = (extractedData: any) => {
    // Auto-fill form with OCR data
    if (extractedData.mtr_number) form.setValue("mtr", extractedData.mtr_number)
    if (extractedData.collection_date) form.setValue("dataColeta", new Date(extractedData.collection_date))
    if (extractedData.waste_description) form.setValue("descricaoResiduo", extractedData.waste_description)
    if (extractedData.waste_class) form.setValue("classe", extractedData.waste_class)
    if (extractedData.quantity) form.setValue("quantidade", extractedData.quantity)
    if (extractedData.unit) form.setValue("unidade", extractedData.unit)
    if (extractedData.transporter_name) form.setValue("transportador", extractedData.transporter_name)
    if (extractedData.transporter_cnpj) form.setValue("cnpjTransportador", extractedData.transporter_cnpj)
    if (extractedData.destination_name) form.setValue("destinador", extractedData.destination_name)
    if (extractedData.destination_cnpj) form.setValue("cnpjDestinador", extractedData.destination_cnpj)
    if (extractedData.final_treatment_type) form.setValue("tipoDestinacao", extractedData.final_treatment_type)

    toast({
      title: "Dados Preenchidos!",
      description: "Os campos foram preenchidos automaticamente com os dados extraídos do MTR.",
    })
  }

  // Create waste log mutation
  const createWasteLogMutation = useMutation({
    mutationFn: createWasteLog,
    onSuccess: async (data) => {
      // If there's a file, upload it
      if (uploadedFile) {
        try {
          await uploadWasteDocument(data.id, uploadedFile)
          toast({
            title: "Sucesso!",
            description: "Registro de resíduo e documento salvos com sucesso.",
          })
        } catch (error) {
          toast({
            title: "Aviso",
            description: "Registro salvo, mas houve erro no upload do documento.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Sucesso!",
          description: "Registro de resíduo salvo com sucesso.",
        })
      }
      
      // Invalidate and refetch waste logs
      queryClient.invalidateQueries({ queryKey: ['waste-logs'] })
      queryClient.invalidateQueries({ queryKey: ['waste-dashboard'] })
      
      navigate("/residuos")
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar registro de resíduo.",
        variant: "destructive",
      })
    }
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const wasteData = {
      mtr_number: values.mtr,
      waste_description: values.descricaoResiduo,
      waste_class: values.classe as "Classe I - Perigoso" | "Classe II A - Não Inerte" | "Classe II B - Inerte",
      collection_date: values.dataColeta.toISOString().split('T')[0],
      quantity: values.quantidade,
      unit: values.unidade,
      transporter_name: values.transportador || undefined,
      transporter_cnpj: values.cnpjTransportador || undefined,
      destination_name: values.destinador || undefined,
      destination_cnpj: values.cnpjDestinador || undefined,
      final_treatment_type: values.tipoDestinacao || undefined,
      cost: values.custo || undefined,
      status: 'Coletado' as const
    }

    createWasteLogMutation.mutate(wasteData)
  }

  const handleCancel = () => {
    navigate("/residuos")
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* PGRS Status Alert */}
        {activePGRS && (
          <Alert className="border-green-200 bg-green-50">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center gap-2">
                <span>PGRS Ativo: <strong>{(activePGRS as any).plan_name}</strong></span>
                <Badge variant="outline">v{(activePGRS as any).version}</Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Destinação de Resíduo</h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados da movimentação de resíduo
              {activePGRS && " - Relacionar com PGRS ativo"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="residuo-form"
              disabled={createWasteLogMutation.isPending}
            >
              {createWasteLogMutation.isPending ? "Salvando..." : "Salvar Registro"}
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
                {/* PGRS Integration Section */}
                {activePGRS && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <FormField
                      control={form.control}
                      name="pgrsSourceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fonte Geradora (PGRS)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma fonte do PGRS" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(activePGRS as any).sources?.map((source: any) => (
                                <SelectItem key={source.id} value={source.id}>
                                  {source.source_name} - {source.source_type}
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
                      name="pgrsWasteTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Resíduo (PGRS)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo do PGRS" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(activePGRS as any).sources?.flatMap((source: any) => 
                                source.waste_types?.map((wasteType: any) => (
                                  <SelectItem key={wasteType.id} value={wasteType.id}>
                                    {wasteType.waste_name} ({wasteType.hazard_class})
                                  </SelectItem>
                                )) || []
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

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
              </CardContent>
            </Card>

            {/* Seção 5: Upload de Documentos */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos e OCR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMTROCR(true)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Extrair dados do MTR (OCR)
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>Upload Manual de Documento (Opcional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Clique para fazer upload ou arraste o arquivo aqui
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, JPG, PNG (máx. 10MB)
                      </span>
                    </label>
                  </div>

                  {uploadedFile && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* MTR OCR Modal */}
        <MTROCRModal
          open={showMTROCR}
          onOpenChange={setShowMTROCR}
          onDataExtracted={handleOCRDataExtracted}
        />
      </div>
    </MainLayout>
  )
}

export default RegistrarDestinacao