import { useState } from 'react'
import { MainLayout } from '@/components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Upload, 
  Brain, 
  FileCheck, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Plus
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LicenseWorkflowPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("upload")

  // Mock workflow data
  const workflows = [
    {
      id: 1,
      title: "Upload de Documento",
      description: "Faça upload de licenças para análise automática",
      status: "ready",
      icon: Upload,
      action: () => navigate('/licenciamento/workflow'),
    },
    {
      id: 2,
      title: "Análise com IA", 
      description: "Extração automática de dados do documento",
      status: "processing",
      icon: Brain,
      action: () => {},
    },
    {
      id: 3,
      title: "Validação e Aprovação",
      description: "Revisar e aprovar informações extraídas",
      status: "pending",
      icon: FileCheck,
      action: () => navigate('/licenciamento/reconciliacao'),
    }
  ]

  const recentAnalyses = [
    {
      id: 1,
      fileName: "LI_001_2024.pdf",
      status: "completed",
      confidence: 94,
      extractedAt: "2024-01-15T10:30:00",
      type: "Licença de Instalação"
    },
    {
      id: 2,
      fileName: "LO_002_2024.pdf", 
      status: "processing",
      confidence: null,
      extractedAt: "2024-01-15T09:15:00",
      type: "Licença de Operação"
    },
    {
      id: 3,
      fileName: "LP_003_2024.pdf",
      status: "failed", 
      confidence: null,
      extractedAt: "2024-01-14T16:45:00",
      type: "Licença Prévia"
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ready: { variant: "outline" as const, label: "Pronto", color: "text-blue-600" },
      processing: { variant: "secondary" as const, label: "Processando", color: "text-yellow-600" },
      completed: { variant: "default" as const, label: "Concluído", color: "text-green-600" },
      pending: { variant: "outline" as const, label: "Pendente", color: "text-gray-600" },
      failed: { variant: "destructive" as const, label: "Erro", color: "text-red-600" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/licenciamento')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Workflow de Licenciamento</h1>
              <p className="text-muted-foreground">
                Processamento automático de licenças ambientais com IA
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/licenciamento/workflow')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Workflow
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload & Análise
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <Clock className="w-4 h-4" />
              Em Progresso
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Concluídos
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <workflow.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{workflow.title}</CardTitle>
                        </div>
                      </div>
                      {getStatusBadge(workflow.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{workflow.description}</p>
                    <Button onClick={workflow.action} className="w-full">
                      {workflow.status === 'ready' ? 'Iniciar' : 'Continuar'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análises em Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAnalyses
                    .filter(analysis => analysis.status === 'processing')
                    .map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{analysis.fileName}</p>
                            <p className="text-sm text-muted-foreground">{analysis.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(analysis.status)}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Progresso
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {recentAnalyses.filter(a => a.status === 'processing').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma análise em progresso</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análises Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAnalyses
                    .filter(analysis => ['completed', 'failed'].includes(analysis.status))
                    .map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {analysis.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{analysis.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {analysis.type} • {analysis.confidence && `${analysis.confidence}% confiança`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(analysis.status)}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Resultado
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}