import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { format, differenceInYears, differenceInMonths, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Upload, X, Sparkles, CheckCircle2, AlertCircle, FileText, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createLicense, uploadLicenseDocument, analyzeLicenseDocument, ExtractedLicenseFormData } from "@/services/licenses"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  orgaoEmissor: z.string().min(1, "Órgão emissor é obrigatório"),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataEmissao: z.date({ required_error: "Data de emissão é obrigatória" }),
  dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
  status: z.string().min(1, "Status é obrigatório"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  condicionantes: z.string().optional(),
}).refine((data) => data.dataVencimento > data.dataEmissao, {
  message: "Data de vencimento deve ser posterior à data de emissão",
  path: ["dataVencimento"],
})

const CadastrarLicenca = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<ExtractedLicenseFormData | null>(null)
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mutation for creating license
  const createLicenseMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: async (newLicense) => {
      // If there's a file to upload, upload it
      if (uploadedFile) {
        try {
          await uploadLicenseDocument(newLicense.id, uploadedFile)
        } catch (error) {
          console.error('Error uploading document:', error)
          toast.error('Licença criada, mas houve erro no upload do documento')
        }
      }
      
      // Invalidate and refetch licenses
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license-stats'] })
      
      navigate("/licenciamento")
    },
    onError: (error) => {
      console.error('Error creating license:', error)
      toast.error('Erro ao criar licença')
      setIsSubmitting(false)
    }
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "",
      orgaoEmissor: "",
      numeroProcesso: "",
      status: "",
      responsavel: "",
      condicionantes: "",
    },
  })

  const watchedDates = form.watch(["dataEmissao", "dataVencimento"])
  
  const calculatePeriod = () => {
    const [emissao, vencimento] = watchedDates
    if (emissao && vencimento) {
      const years = differenceInYears(vencimento, emissao)
      const months = differenceInMonths(vencimento, emissao) % 12
      const days = differenceInDays(vencimento, emissao) % 30

      if (years > 0) {
        return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mês${months > 1 ? 'es' : ''}` : ''}`
      } else if (months > 0) {
        return `${months} mês${months > 1 ? 'es' : ''}${days > 0 ? ` e ${days} dia${days > 1 ? 's' : ''}` : ''}`
      } else {
        return `${days} dia${days > 1 ? 's' : ''}`
      }
    }
    return ""
  }

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PDF, Excel, CSV ou imagens.')
      return
    }
    
    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB.')
      return
    }
    
    setUploadedFile(file)
    setAnalysisData(null)
    setOverallConfidence(null)
    setAnalysisProgress(0)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setAnalysisData(null)
    setOverallConfidence(null)
    setAnalysisProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(extension || '')) return FileText
    if (['xlsx', 'xls', 'csv'].includes(extension || '')) return FileText
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return Eye
    return Upload
  }

  const handleAnalyzeDocument = async () => {
    if (!uploadedFile) {
      toast.error('Selecione um documento primeiro')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90))
    }, 200)
    
    try {
      const result = await analyzeLicenseDocument(uploadedFile)
      
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      
      if (result.success && result.extracted_data) {
        setAnalysisData(result.extracted_data)
        setOverallConfidence(result.overall_confidence || 0)
        
        // Custom success message based on confidence
        const confidence = result.overall_confidence || 0
        let message = `Documento analisado com sucesso!`
        
        if (result.file_type) {
          message += ` Tipo: ${result.file_type.toUpperCase()}`
        }
        
        if (confidence >= 0.8) {
          message += ` ✨ Alta confiança (${Math.round(confidence * 100)}%)`
        } else if (confidence >= 0.5) {
          message += ` ⚠️ Confiança moderada (${Math.round(confidence * 100)}%)`
        } else {
          message += ` ⚠️ Baixa confiança (${Math.round(confidence * 100)}%) - Revise os dados`
        }
        
        toast.success(message)
      } else {
        toast.error(result.error || 'Erro na análise do documento')
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      toast.error('Erro ao analisar documento. Tente novamente.')
    } finally {
      clearInterval(progressInterval)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const applyAnalysisData = () => {
    if (!analysisData) return

    let appliedFields = 0
    let skippedFields: string[] = []

    // Apply extracted data to form with validation
    if (analysisData.nome && analysisData.nome.trim()) {
      form.setValue('nome', analysisData.nome.trim())
      appliedFields++
    } else {
      skippedFields.push('nome')
    }
    
    if (analysisData.tipo && analysisData.tipo.trim()) {
      form.setValue('tipo', analysisData.tipo.trim())
      appliedFields++
    } else {
      skippedFields.push('tipo')
    }
    
    if (analysisData.orgaoEmissor && analysisData.orgaoEmissor.trim()) {
      form.setValue('orgaoEmissor', analysisData.orgaoEmissor.trim())
      appliedFields++
    } else {
      skippedFields.push('órgão emissor')
    }
    
    if (analysisData.numeroProcesso && analysisData.numeroProcesso.trim()) {
      form.setValue('numeroProcesso', analysisData.numeroProcesso.trim())
      appliedFields++
    } else {
      skippedFields.push('número do processo')
    }
    
    if (analysisData.status && analysisData.status.trim()) {
      form.setValue('status', analysisData.status.trim())
      appliedFields++
    } else {
      skippedFields.push('status')
    }
    
    if (analysisData.condicionantes && analysisData.condicionantes.trim()) {
      form.setValue('condicionantes', analysisData.condicionantes.trim())
      appliedFields++
    } else {
      skippedFields.push('condicionantes')
    }
    
    // Handle dates with better validation
    if (analysisData.dataEmissao) {
      try {
        const emissionDate = new Date(analysisData.dataEmissao)
        if (!isNaN(emissionDate.getTime()) && emissionDate.getFullYear() > 1900) {
          form.setValue('dataEmissao', emissionDate)
          appliedFields++
        } else {
          skippedFields.push('data de emissão')
        }
      } catch (error) {
        console.error('Error parsing emission date:', error)
        skippedFields.push('data de emissão')
      }
    } else {
      skippedFields.push('data de emissão')
    }
    
    if (analysisData.dataVencimento) {
      try {
        const expirationDate = new Date(analysisData.dataVencimento)
        if (!isNaN(expirationDate.getTime()) && expirationDate.getFullYear() > 1900) {
          form.setValue('dataVencimento', expirationDate)
          appliedFields++
        } else {
          skippedFields.push('data de vencimento')
        }
      } catch (error) {
        console.error('Error parsing expiration date:', error)
        skippedFields.push('data de vencimento')
      }
    } else {
      skippedFields.push('data de vencimento')
    }

    // Show success message with details
    const message = `${appliedFields} campos aplicados com sucesso!${skippedFields.length > 0 ? ` (${skippedFields.length} campos não preenchidos)` : ''}`
    toast.success(message)
    
    if (skippedFields.length > 0) {
      setTimeout(() => {
        toast.info(`Revise: ${skippedFields.join(', ')}`)
      }, 1000)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle2
    return AlertCircle
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const licenseData = {
        name: values.nome,
        type: values.tipo,
        issuing_body: values.orgaoEmissor,
        process_number: values.numeroProcesso,
        issue_date: values.dataEmissao,
        expiration_date: values.dataVencimento,
        status: values.status,
        conditions: values.condicionantes,
        // For now, we'll leave responsible_user_id empty
        // In a real app, this would be set to the selected user
      }

      createLicenseMutation.mutate(licenseData)
    } catch (error) {
      console.error('Error in form submission:', error)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate("/licenciamento")
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cadastrar Nova Licença Ambiental</h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados da nova licença ambiental
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="licenca-form" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="licenca-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout de duas colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna da Esquerda - Informações Principais */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Informações Principais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Identificação da Licença</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Licença de Operação - Fábrica Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Licença</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LP">Licença Prévia (LP)</SelectItem>
                            <SelectItem value="LI">Licença de Instalação (LI)</SelectItem>
                            <SelectItem value="LO">Licença de Operação (LO)</SelectItem>
                            <SelectItem value="LAS">Licença Ambiental Simplificada (LAS)</SelectItem>
                            <SelectItem value="LOC">Licença de Operação Corretiva (LOC)</SelectItem>
                            <SelectItem value="Outra">Outra</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orgaoEmissor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Ambiental Emissor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: IBAMA, CETESB, FEPAM, SEMAD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numeroProcesso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Processo ou Documento</FormLabel>
                        <FormControl>
                          <Input placeholder="Insira o número de referência oficial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Datas de Validade */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dataEmissao"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Emissão</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="dataVencimento"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Vencimento</FormLabel>
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
                                disabled={(date) => date < new Date()}
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

                  {/* Período de validade calculado */}
                  {watchedDates[0] && watchedDates[1] && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>Período de validade:</strong> {calculatePeriod()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Coluna da Direita - Detalhes e Anexos */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Detalhes e Anexos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ativa">Ativa</SelectItem>
                            <SelectItem value="Em Renovação">Em Renovação</SelectItem>
                            <SelectItem value="Suspensa">Suspensa</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável Interno</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ana Silva">Ana Silva</SelectItem>
                            <SelectItem value="Carlos Pereira">Carlos Pereira</SelectItem>
                            <SelectItem value="Mariana Costa">Mariana Costa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload de Arquivos */}
                  <div className="space-y-3">
                    <Label>Anexar Documento da Licença</Label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                        isDragOver ? "border-primary bg-primary/5" : "border-border",
                        uploadedFile ? "bg-muted/30" : ""
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {!uploadedFile ? (
                        <div className="space-y-3">
                          <Upload className={cn(
                            "h-10 w-10 mx-auto transition-colors",
                            isDragOver ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div className="space-y-2">
                            <div className="text-sm font-medium">
                              {isDragOver ? "Solte o arquivo aqui" : "Arraste um arquivo aqui"}
                            </div>
                            <div className="text-xs text-muted-foreground">ou</div>
                            <Button type="button" variant="outline" size="sm" onClick={triggerFileInput}>
                              Selecionar arquivo
                            </Button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={handleFileInputChange}
                          />
                          <div className="text-xs text-muted-foreground">
                            PDF, Excel, CSV, JPG até 20MB
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* File Info */}
                          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = getFileIcon(uploadedFile.name)
                                return <Icon className="h-4 w-4 text-muted-foreground" />
                              })()}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{uploadedFile.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(1)}MB
                                </span>
                              </div>
                            </div>
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
                          
                          {/* AI Analysis Section */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                type="button"
                                onClick={handleAnalyzeDocument}
                                disabled={isAnalyzing}
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Sparkles className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                                {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
                              </Button>
                              
                              {overallConfidence !== null && (
                                <Badge variant="outline" className={getConfidenceColor(overallConfidence)}>
                                  Confiança: {Math.round(overallConfidence * 100)}%
                                </Badge>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {isAnalyzing && (
                              <div className="space-y-2">
                                <Progress value={analysisProgress} className="w-full h-2" />
                                <p className="text-xs text-muted-foreground text-center">
                                  {analysisProgress < 30 ? 'Processando documento...' :
                                   analysisProgress < 70 ? 'Extraindo informações...' :
                                   analysisProgress < 90 ? 'Analisando dados...' : 'Finalizando...'}
                                </p>
                              </div>
                            )}

                            {analysisData && (
                              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <h4 className="text-sm font-medium">Dados Extraídos com IA</h4>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={applyAnalysisData}
                                    size="sm"
                                    className="bg-primary/90 hover:bg-primary"
                                  >
                                    Aplicar aos Campos
                                  </Button>
                                </div>
                                
                                {/* Confidence Scores Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {Object.entries(analysisData.confidence_scores).map(([field, confidence]) => {
                                    const Icon = getConfidenceIcon(confidence)
                                    return (
                                      <div key={field} className="flex items-center gap-1 p-2 bg-background/50 rounded">
                                        <Icon className={`h-3 w-3 ${getConfidenceColor(confidence)}`} />
                                        <span className="capitalize font-medium">{field}:</span>
                                        <span className={getConfidenceColor(confidence)}>
                                          {Math.round(confidence * 100)}%
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>

                                {/* Preview of extracted data */}
                                <div className="text-xs space-y-1 pt-2 border-t">
                                  <p className="font-medium text-muted-foreground">Prévia dos dados:</p>
                                  {analysisData.nome && (
                                    <p><span className="font-medium">Nome:</span> {analysisData.nome}</p>
                                  )}
                                  {analysisData.tipo && (
                                    <p><span className="font-medium">Tipo:</span> {analysisData.tipo}</p>
                                  )}
                                  {analysisData.orgaoEmissor && (
                                    <p><span className="font-medium">Órgão:</span> {analysisData.orgaoEmissor}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção de Condicionantes */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Condicionantes da Licença</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="condicionantes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Liste aqui todas as condicionantes e obrigações que devem ser cumpridas durante a vigência desta licença. Ex: 1. Apresentar relatório de monitoramento de efluentes semestralmente. 2. Realizar o inventário de resíduos sólidos anualmente."
                          className="min-h-[150px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </MainLayout>
  )
}

export default CadastrarLicenca