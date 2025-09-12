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
import { useState, useRef, useCallback, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createLicense, uploadLicenseDocument, analyzeLicenseDocument, ExtractedLicenseFormData } from "@/services/licenses"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LicenseReconciliationDashboard } from "@/components/LicenseReconciliationDashboard"
import { IntelligentWorkflowWizard, WorkflowStep } from "@/components/IntelligentWorkflowWizard"

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
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload')
  const [stepsData, setStepsData] = useState<Record<WorkflowStep, any>>({
    upload: null,
    analyze: null,
    review: null,
    conditions: null,
    alerts: null,
    save: null
  })

  // Mutation for creating license
  const createLicenseMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: async (newLicense) => {
      if (uploadedFile) {
        try {
          await uploadLicenseDocument(newLicense.id, uploadedFile)
        } catch (error) {
          console.error('Error uploading document:', error)
          toast.error('Licença criada, mas houve erro no upload do documento')
        }
      }
      
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
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PDF, Excel, CSV ou imagens.')
      return
    }
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB.')
      return
    }
    
    setUploadedFile(file)
    setAnalysisData(null)
    setOverallConfidence(null)
    setAnalysisProgress(0)
    
    setStepsData(prev => ({
      ...prev,
      upload: { file, completed: true }
    }))
    
    setCurrentStep('analyze')
  }

  const handleAnalyzeDocument = async () => {
    if (!uploadedFile) {
      toast.error('Selecione um documento primeiro')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    setStepsData(prev => ({
      ...prev,
      analyze: { inProgress: true, progress: 0 }
    }))
    
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = Math.min(prev + 10, 90)
        setStepsData(prevData => ({
          ...prevData,
          analyze: { ...prevData.analyze, progress: newProgress }
        }))
        return newProgress
      })
    }, 200)
    
    try {
      const result = await analyzeLicenseDocument(uploadedFile)
      
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      
      if (result.success && result.extracted_data) {
        setAnalysisData(result.extracted_data)
        setOverallConfidence(result.overall_confidence || 0)
        
        setStepsData(prev => ({
          ...prev,
          analyze: { 
            completed: true, 
            progress: 100, 
            data: result.extracted_data,
            confidence: result.overall_confidence 
          }
        }))
        
        setCurrentStep('review')
        
        const confidence = result.overall_confidence || 0
        let message = `Documento analisado com sucesso!`
        
        if (result.file_type) {
          message += ` Tipo: ${result.file_type.toUpperCase()}`
        }
        
        if (result.analysis_type === 'hybrid_analysis') {
          message += ` 🔀 Análise híbrida (IA + nome do arquivo)`
        } else if (result.analysis_type === 'filename_heuristic') {
          message += ` 📝 Dados extraídos do nome do arquivo`
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
        setStepsData(prev => ({
          ...prev,
          analyze: { completed: false, error: result.error }
        }))
        toast.error(result.error || 'Erro na análise do documento')
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      setStepsData(prev => ({
        ...prev,
        analyze: { completed: false, error: error.message }
      }))
      toast.error('Erro ao analisar documento. Tente novamente.')
    } finally {
      clearInterval(progressInterval)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const applyFieldData = (field: string, value: any) => {
    const validFields = ["nome", "tipo", "orgaoEmissor", "numeroProcesso", "status", "dataEmissao", "dataVencimento", "condicionantes", "responsavel"] as const
    
    if (validFields.includes(field as any)) {
      if (field === 'dataEmissao' || field === 'dataVencimento') {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          form.setValue(field as any, date)
        }
      } else {
        form.setValue(field as any, value)
      }
      
      setStepsData(prev => ({
        ...prev,
        review: { ...prev.review, fieldsApplied: true }
      }))
      
      toast.success(`Campo ${field} aplicado com sucesso!`)
    }
  }

  const applyBulkData = () => {
    if (!analysisData) return

    let appliedFields = 0
    const fieldsToApply = ['nome', 'tipo', 'orgaoEmissor', 'numeroProcesso', 'status', 'condicionantes']
    
    fieldsToApply.forEach(field => {
      if (analysisData[field] && analysisData[field].trim()) {
        form.setValue(field as any, analysisData[field].trim())
        appliedFields++
      }
    })
    
    if (analysisData.dataEmissao) {
      try {
        const emissionDate = new Date(analysisData.dataEmissao)
        if (!isNaN(emissionDate.getTime()) && emissionDate.getFullYear() > 1900) {
          form.setValue('dataEmissao', emissionDate)
          appliedFields++
        }
      } catch (error) {
        console.error('Error parsing emission date:', error)
      }
    }
    
    if (analysisData.dataVencimento) {
      try {
        const expirationDate = new Date(analysisData.dataVencimento)
        if (!isNaN(expirationDate.getTime()) && expirationDate.getFullYear() > 1900) {
          form.setValue('dataVencimento', expirationDate)
          appliedFields++
        }
      } catch (error) {
        console.error('Error parsing expiration date:', error)
      }
    }

    setStepsData(prev => ({
      ...prev,
      review: { fieldsApplied: appliedFields > 0 }
    }))

    toast.success(`${appliedFields} campos aplicados com sucesso!`)
  }

  // Auto-start analysis when file is uploaded and we're on analyze step
  useEffect(() => {
    if (currentStep === 'analyze' && uploadedFile && !isAnalyzing && !analysisData) {
      handleAnalyzeDocument()
    }
  }, [currentStep, uploadedFile, isAnalyzing, analysisData])

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
      }

      createLicenseMutation.mutate(licenseData)
    } catch (error) {
      console.error('Error in form submission:', error)
      setIsSubmitting(false)
    }
  }

  // Workflow handlers
  const handleStepChange = (step: WorkflowStep) => {
    setCurrentStep(step)
  }

  const handleNext = () => {
    const steps: WorkflowStep[] = ['upload', 'analyze', 'review', 'conditions', 'alerts', 'save']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    const steps: WorkflowStep[] = ['upload', 'analyze', 'review', 'conditions', 'alerts', 'save']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleWorkflowSave = () => {
    const form_element = document.getElementById('licenca-form') as HTMLFormElement
    if (form_element) {
      form_element.requestSubmit()
    }
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Upload do Documento da Licença</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload do Documento</h3>
                <p className="text-muted-foreground mb-4">
                  Arraste e solte o arquivo da licença aqui ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, Excel, CSV ou imagens (máx. 20MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                />
              </div>

              {uploadedFile && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{uploadedFile.name}</p>
                        <p className="text-sm text-green-600">
                          {(uploadedFile.size / 1024 / 1024).toFixed(1)}MB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'analyze':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className={cn("h-5 w-5", isAnalyzing && "animate-spin")} />
                Análise Inteligente do Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="space-y-4 text-center py-8">
                  <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <h3 className="text-lg font-semibold">Analisando documento...</h3>
                  <Progress value={analysisProgress} className="w-full max-w-md mx-auto" />
                  <p className="text-muted-foreground">
                    {analysisProgress < 30 ? 'Processando documento...' :
                     analysisProgress < 70 ? 'Extraindo informações...' :
                     analysisProgress < 90 ? 'Analisando dados...' : 'Finalizando...'}
                  </p>
                </div>
              ) : analysisData ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Análise concluída!</span>
                      <Badge variant="outline" className="text-green-600">
                        Confiança: {Math.round((overallConfidence || 0) * 100)}%
                      </Badge>
                    </div>
                    <p className="text-green-700">
                      Dados extraídos com sucesso. Prossiga para a etapa de revisão.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={handleAnalyzeDocument} className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Iniciar Análise
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'review':
        return (
          <LicenseReconciliationDashboard
            analysisData={analysisData}
            overallConfidence={overallConfidence}
            form={form}
            onFieldApply={applyFieldData}
            onBulkApply={applyBulkData}
          />
        )

      case 'save':
        return (
          <Form {...form}>
            <form id="licenca-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
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
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {calculatePeriod() && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground">Período de Validade</Label>
                        <p className="text-sm mt-1">{calculatePeriod()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Licença</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status da Licença</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ativa">Ativa</SelectItem>
                              <SelectItem value="Vencida">Vencida</SelectItem>
                              <SelectItem value="Em Renovação">Em Renovação</SelectItem>
                              <SelectItem value="Suspensa">Suspensa</SelectItem>
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
                          <FormLabel>Responsável pela Licença</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do responsável" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condicionantes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condicionantes da Licença</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Liste as principais condicionantes da licença..."
                              className="resize-none"
                              rows={8}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </form>
          </Form>
        )

      default:
        return (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento.
                </p>
                <Button 
                  onClick={() => setStepsData(prev => ({ ...prev, [currentStep]: { configured: true } }))}
                  className="mt-4"
                >
                  Marcar como Configurado
                </Button>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <MainLayout>
      <IntelligentWorkflowWizard
        currentStep={currentStep}
        stepsData={stepsData}
        onStepChange={handleStepChange}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={handleWorkflowSave}
      >
        {renderStepContent()}
      </IntelligentWorkflowWizard>
    </MainLayout>
  )
}

export default CadastrarLicenca