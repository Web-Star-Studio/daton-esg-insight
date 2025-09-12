import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Calendar,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Save
} from "lucide-react"
import { cn } from "@/lib/utils"

export type WorkflowStep = 'upload' | 'analyze' | 'review' | 'conditions' | 'alerts' | 'save'

interface WorkflowStepData {
  id: WorkflowStep
  title: string
  description: string
  icon: any
  status: 'pending' | 'active' | 'completed' | 'error'
  progress?: number
}

interface IntelligentWorkflowWizardProps {
  currentStep: WorkflowStep
  stepsData: Record<WorkflowStep, any>
  onStepChange: (step: WorkflowStep) => void
  onNext: () => void
  onPrevious: () => void
  onSave: () => void
  children: React.ReactNode
}

export const IntelligentWorkflowWizard = ({
  currentStep,
  stepsData,
  onStepChange,
  onNext,
  onPrevious,
  onSave,
  children
}: IntelligentWorkflowWizardProps) => {
  const [workflowProgress, setWorkflowProgress] = useState(0)

  const steps: WorkflowStepData[] = [
    {
      id: 'upload',
      title: 'Upload do Documento',
      description: 'Faça upload do documento da licença',
      icon: Upload,
      status: currentStep === 'upload' ? 'active' : stepsData.upload ? 'completed' : 'pending'
    },
    {
      id: 'analyze',
      title: 'Análise de IA',
      description: 'Extração automática de dados',
      icon: Sparkles,
      status: currentStep === 'analyze' ? 'active' : stepsData.analyze ? 'completed' : 'pending',
      progress: stepsData.analyze?.progress || 0
    },
    {
      id: 'review',
      title: 'Revisão e Reconciliação',
      description: 'Verifique e ajuste os dados extraídos',
      icon: CheckCircle2,
      status: currentStep === 'review' ? 'active' : stepsData.review ? 'completed' : 'pending'
    },
    {
      id: 'conditions',
      title: 'Condicionantes',
      description: 'Configuração de condicionantes e prazos',
      icon: Clock,
      status: currentStep === 'conditions' ? 'active' : stepsData.conditions ? 'completed' : 'pending'
    },
    {
      id: 'alerts',
      title: 'Alertas e Cronogramas',
      description: 'Configuração de alertas automáticos',
      icon: Calendar,
      status: currentStep === 'alerts' ? 'active' : stepsData.alerts ? 'completed' : 'pending'
    },
    {
      id: 'save',
      title: 'Finalização',
      description: 'Salvar licença e ativar monitoramento',
      icon: Save,
      status: currentStep === 'save' ? 'active' : stepsData.save ? 'completed' : 'pending'
    }
  ]

  const getStepProgress = () => {
    const activeIndex = steps.findIndex(step => step.id === currentStep)
    return ((activeIndex + 1) / steps.length) * 100
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200'
      case 'active': return 'text-primary bg-primary/10 border-primary/20'
      case 'error': return 'text-red-600 bg-red-100 border-red-200'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getStepIcon = (step: WorkflowStepData) => {
    if (step.status === 'completed') return CheckCircle2
    if (step.status === 'error') return AlertCircle
    return step.icon
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'upload': return !!stepsData.upload
      case 'analyze': return !!stepsData.analyze?.completed
      case 'review': return !!stepsData.review?.fieldsApplied
      case 'conditions': return !!stepsData.conditions?.configured
      case 'alerts': return !!stepsData.alerts?.configured
      case 'save': return true
      default: return false
    }
  }

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Workflow Inteligente de Licenciamento
            </CardTitle>
            <Badge variant="outline" className="text-primary">
              Etapa {currentStepIndex + 1} de {steps.length}
            </Badge>
          </div>
          
          <div className="space-y-4">
            <Progress value={getStepProgress()} className="w-full h-2" />
            
            {/* Steps Timeline */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {steps.map((step, index) => {
                const Icon = getStepIcon(step)
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                      getStepStatusColor(step.status),
                      step.status === 'active' && "ring-2 ring-primary/20"
                    )}
                    onClick={() => onStepChange(step.id)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Icon className="h-5 w-5" />
                      <div>
                        <p className="text-xs font-medium">{step.title}</p>
                        <p className="text-xs opacity-75 hidden sm:block">{step.description}</p>
                      </div>
                      
                      {step.progress !== undefined && step.status === 'active' && (
                        <Progress value={step.progress} className="w-full h-1" />
                      )}
                    </div>
                    
                    {index < steps.length - 1 && (
                      <ArrowRight className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hidden lg:block" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const currentStepData = steps.find(step => step.id === currentStep)
              const Icon = currentStepData ? getStepIcon(currentStepData) : FileText
              return <Icon className="h-5 w-5" />
            })()}
            {steps.find(step => step.id === currentStep)?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>
              )}
              
              {/* Step-specific info */}
              <div className="text-sm text-muted-foreground">
                {currentStep === 'upload' && "Selecione um documento para começar"}
                {currentStep === 'analyze' && "Aguarde a análise da IA"}
                {currentStep === 'review' && "Revise os dados extraídos"}
                {currentStep === 'conditions' && "Configure as condicionantes"}
                {currentStep === 'alerts' && "Configure os alertas"}
                {currentStep === 'save' && "Finalize e salve a licença"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Progress indicator for current step */}
              {stepsData[currentStep]?.inProgress && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Processando...
                </div>
              )}

              {isLastStep ? (
                <Button
                  onClick={onSave}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Licença
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Step-specific alerts */}
          {!canProceed() && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {currentStep === 'upload' && "Faça upload de um documento para continuar"}
                {currentStep === 'analyze' && "Aguarde a conclusão da análise"}
                {currentStep === 'review' && "Aplique pelo menos um campo extraído"}
                {currentStep === 'conditions' && "Configure as condicionantes da licença"}
                {currentStep === 'alerts' && "Configure os alertas de monitoramento"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}