import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useCallback, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createLicense, analyzeLicenseDocument, ExtractedLicenseFormData } from "@/services/licenses"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  Upload, 
  Brain, 
  CheckCircle2, 
  X, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  ArrowLeft,
  Eye,
  Save,
  Edit
} from "lucide-react"


type WorkflowStep = 'upload' | 'analyze' | 'review' | 'save'

const LicenseAnalysis = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisData, setAnalysisData] = useState<ExtractedLicenseFormData | null>(null)
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Create license mutation
  const createLicenseMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license-stats'] })
      toast.success('Licença criada com sucesso!')
      navigate("/licenciamento")
    },
    onError: (error) => {
      console.error('Error creating license:', error)
      toast.error('Erro ao criar licença')
    }
  })

  const steps = [
    {
      id: 'upload' as WorkflowStep,
      title: "Upload do Documento",
      description: "Envie o documento da licença",
      icon: Upload,
      status: getStepStatus('upload')
    },
    {
      id: 'analyze' as WorkflowStep,
      title: "Análise com IA",
      description: "Extração automática dos dados",
      icon: Brain,
      status: getStepStatus('analyze')
    },
    {
      id: 'review' as WorkflowStep,
      title: "Reconciliação",
      description: "Revisar e aprovar os dados",
      icon: CheckCircle2,
      status: getStepStatus('review')
    },
    {
      id: 'save' as WorkflowStep,
      title: "Salvar Licença",
      description: "Criar licença no sistema",
      icon: Save,
      status: getStepStatus('save')
    }
  ]

  function getStepStatus(stepId: WorkflowStep) {
    const stepOrder = ['upload', 'analyze', 'review', 'save']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(stepId)
    
    if (stepIndex === currentIndex) return 'current'
    if (stepIndex < currentIndex) return 'completed'
    return 'upcoming'
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
    setAnalysisError(null)
    setAnalysisProgress(0)
    setCurrentStep('analyze')
  }

  const handleAnalyzeDocument = async () => {
    if (!uploadedFile) {
      toast.error('Selecione um documento primeiro')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
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
        setAnalysisError(null)
        setCurrentStep('review')
        
        const confidence = result.overall_confidence || 0
        let message = `Documento analisado com sucesso!`
        
        if (confidence >= 0.8) {
          message += ` ✨ Alta confiança (${Math.round(confidence * 100)}%)`
        } else if (confidence >= 0.5) {
          message += ` ⚠️ Confiança moderada (${Math.round(confidence * 100)}%)`
        } else {
          message += ` ⚠️ Baixa confiança (${Math.round(confidence * 100)}%) - Revise os dados`
        }
        
        toast.success(message)
      } else {
        const errorMessage = result.error || 'Erro na análise do documento'
        setAnalysisError(errorMessage)
        setAnalysisData(null)
        setOverallConfidence(null)
        toast.error('Análise incompleta - verifique os dados ou insira manualmente.')
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao analisar documento. Tente novamente.'
      setAnalysisError(errorMessage)
      setAnalysisData(null)
      setOverallConfidence(null)
    } finally {
      clearInterval(progressInterval)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  // Auto-start analysis when file is uploaded
  useEffect(() => {
    if (currentStep === 'analyze' && uploadedFile && !isAnalyzing && !analysisData) {
      handleAnalyzeDocument()
    }
  }, [currentStep, uploadedFile, isAnalyzing, analysisData])

  const handleSaveLicense = () => {
    if (!analysisData) {
      toast.error('Nenhum dado extraído para salvar')
      return
    }

    const licenseData = {
      name: analysisData.nome,
      type: analysisData.tipo,
      issuing_body: analysisData.orgaoEmissor,
      process_number: analysisData.numeroProcesso,
      issue_date: new Date(analysisData.dataEmissao),
      expiration_date: new Date(analysisData.dataVencimento),
      status: analysisData.status,
      conditions: analysisData.condicionantes,
    }

    createLicenseMutation.mutate(licenseData)
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

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeFile = () => {
    setUploadedFile(null)
    setAnalysisData(null)
    setOverallConfidence(null)
    setAnalysisError(null)
    setAnalysisProgress(0)
    setCurrentStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
                <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-success">{uploadedFile.name}</p>
                        <p className="text-sm text-success/80">
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
                <Brain className="h-5 w-5" />
                Análise com IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    <span>Analisando documento com IA...</span>
                  </div>
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Extraindo dados do documento. Isso pode levar alguns segundos.
                  </p>
                </div>
              ) : analysisError ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>Erro na análise</span>
                  </div>
                  <p className="text-destructive">{analysisError}</p>
                  <div className="flex gap-2">
                    <Button onClick={handleAnalyzeDocument}>
                      Tentar Novamente
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                      Voltar ao Upload
                    </Button>
                  </div>
                </div>
              ) : analysisData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Análise concluída com sucesso!</span>
                  </div>
                  {overallConfidence && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Confiança geral:</span>
                      <Badge variant={overallConfidence >= 0.8 ? "default" : "secondary"}>
                        {Math.round(overallConfidence * 100)}%
                      </Badge>
                    </div>
                  )}
                  <Button onClick={() => setCurrentStep('review')} className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Revisar Dados Extraídos
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )

      case 'review':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Reconciliação de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Revise os dados extraídos abaixo. Você pode editar qualquer campo antes de salvar.
                </p>
                {overallConfidence && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
                    <span>Confiança da análise:</span>
                    <Badge variant={overallConfidence >= 0.8 ? "default" : "secondary"}>
                      {Math.round(overallConfidence * 100)}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {analysisData && (
              <div className="space-y-4">
                {Object.entries(analysisData).map(([key, value]) => {
                  if (key === 'confidence_scores') return null
                  
                  const confidence = analysisData.confidence_scores?.[key] || 0
                  const fieldLabels: { [key: string]: string } = {
                    nome: 'Nome da Licença',
                    tipo: 'Tipo',
                    orgaoEmissor: 'Órgão Emissor',
                    numeroProcesso: 'Número do Processo',
                    dataEmissao: 'Data de Emissão',
                    dataVencimento: 'Data de Vencimento',
                    status: 'Status',
                    condicionantes: 'Condicionantes'
                  }
                  
                  return (
                    <Card key={key}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">{fieldLabels[key] || key}</Label>
                          <Badge variant={confidence >= 0.8 ? "default" : "secondary"}>
                            {Math.round(confidence * 100)}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="p-3 bg-muted rounded border">
                            {value || <span className="text-muted-foreground italic">Não extraído</span>}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const updatedData = { ...analysisData, [key]: value }
                              setAnalysisData(updatedData)
                              toast.success(`Campo ${fieldLabels[key]} editado`)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'save':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Salvar Licença
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Pronto para criar a licença com os dados analisados.
              </p>
              <Button onClick={handleSaveLicense} className="w-full" disabled={createLicenseMutation.isPending}>
                {createLicenseMutation.isPending ? 'Salvando...' : 'Criar Licença'}
              </Button>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Análise Inteligente de Licenças</h1>
            <p className="text-muted-foreground">
              Use nossa IA para extrair automaticamente dados de documentos de licenciamento
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/licenciamento')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                        step.status === 'completed' 
                          ? 'bg-success/10 border-success text-success' 
                          : step.status === 'current'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted border-border text-muted-foreground'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <div className={cn(
                          "text-sm font-medium",
                          step.status === 'current' ? 'text-primary' : 
                          step.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                        )}>
                          {step.title}
                        </div>
                        <div className="text-xs text-muted-foreground max-w-[120px]">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "h-0.5 w-20 mx-4 transition-all",
                        step.status === 'completed' ? 'bg-success' : 'bg-border'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              const stepOrder = ['upload', 'analyze', 'review', 'save'] as WorkflowStep[]
              const currentIndex = stepOrder.indexOf(currentStep)
              if (currentIndex > 0) {
                setCurrentStep(stepOrder[currentIndex - 1])
              }
            }}
            disabled={currentStep === 'upload'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <Button 
            onClick={() => {
              const stepOrder = ['upload', 'analyze', 'review', 'save'] as WorkflowStep[]
              const currentIndex = stepOrder.indexOf(currentStep)
              if (currentIndex < stepOrder.length - 1) {
                setCurrentStep(stepOrder[currentIndex + 1])
              }
            }}
            disabled={
              (currentStep === 'upload' && !uploadedFile) ||
              (currentStep === 'analyze' && !analysisData) ||
              (currentStep === 'review' && !analysisData) ||
              currentStep === 'save'
            }
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

export default LicenseAnalysis