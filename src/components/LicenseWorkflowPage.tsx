import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Plus,
  FileText,
  RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { LicenseReconciliationModal } from '@/components/LicenseReconciliationModal'

interface License {
  id: string;
  name: string;
  type: string;
  status: string;
  ai_processing_status?: string | null;
  ai_confidence_score?: number | null;
  created_at: string;
  process_number?: string | null;
  issue_date?: string | null;
  expiration_date: string;
  issuing_body: string;
  conditions?: string | null;
  ai_extracted_data?: any;
  company_id: string;
  documents?: {
    id: string;
    file_name: string;
    ai_processing_status?: string;
  }[];
}

export default function LicenseWorkflowPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("upload")
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [reconciliationOpen, setReconciliationOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Load licenses data
  useEffect(() => {
    loadLicenses()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('license-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'licenses'
      }, () => {
        loadLicenses()  // Reload when licenses change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Get documents separately for each license
      const licensesWithDocs = await Promise.all((data || []).map(async (license) => {
        const { data: docs } = await supabase
          .from('documents')
          .select('id, file_name, ai_processing_status')
          .eq('related_id', license.id)
          .eq('related_model', 'license')
        
        return { ...license, documents: docs || [] }
      }))
      
      setLicenses(licensesWithDocs as any)
    } catch (error) {
      console.error('Error loading licenses:', error)
      toast.error('Erro ao carregar licenças')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Apenas arquivos PDF são aceitos')
      return
    }

    setUploadingFile(true)
    
    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:application/pdf;base64, prefix
        }
      })
      reader.readAsDataURL(file)
      const base64Data = await base64Promise

      // Call workflow processor
      const { data, error } = await supabase.functions.invoke('license-workflow-processor', {
        body: {
          action: 'upload',
          file: {
            name: file.name,
            type: file.type,
            data: base64Data
          }
        }
      })

      if (error) throw error

      if (data.success) {
        toast.success('Upload realizado com sucesso! Análise IA iniciada.')
        loadLicenses() // Reload to show new license
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erro durante o upload')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleReconciliation = (license: License) => {
    setSelectedLicense(license)
    setReconciliationOpen(true)
  }

  const handleReconciliationApprove = async (data: any) => {
    if (!selectedLicense) return

    const { error } = await supabase.functions.invoke('license-workflow-processor', {
      body: {
        action: 'reconcile',
        licenseId: selectedLicense.id,
        reconciliationData: data
      }
    })

    if (error) throw error
    
    loadLicenses() // Reload licenses
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'processing': { variant: "secondary" as const, label: "Processando", color: "text-yellow-600" },
      'completed': { variant: "default" as const, label: "Análise Concluída", color: "text-green-600" },
      'failed': { variant: "destructive" as const, label: "Erro", color: "text-red-600" },
      'approved': { variant: "default" as const, label: "Aprovada", color: "text-green-600" },
      'Em Análise': { variant: "secondary" as const, label: "Em Análise", color: "text-blue-600" },
      'Aguardando Revisão': { variant: "outline" as const, label: "Aguardando Revisão", color: "text-orange-600" },
      'Ativa': { variant: "default" as const, label: "Ativa", color: "text-green-600" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['processing']
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getProcessingLicenses = () => {
    return licenses.filter(license => 
      license.ai_processing_status === 'processing' || 
      license.status === 'Em Análise'
    )
  }

  const getCompletedLicenses = () => {
    return licenses.filter(license => 
      license.ai_processing_status === 'completed' || 
      license.ai_processing_status === 'approved' ||
      license.status === 'Ativa' ||
      license.ai_processing_status === 'failed'
    )
  }

  const getPendingReviewLicenses = () => {
    return licenses.filter(license => 
      license.status === 'Aguardando Revisão' ||
      (license.ai_processing_status === 'completed' && license.status !== 'Ativa')
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
            {/* File Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload de Licença Ambiental
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Faça upload da sua licença ambiental
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Apenas arquivos PDF. A IA irá extrair automaticamente os dados da licença.
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                    className="hidden"
                    id="pdf-upload"
                    disabled={uploadingFile}
                  />
                  <Button 
                    asChild
                    disabled={uploadingFile}
                    size="lg"
                  >
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      {uploadingFile ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar PDF
                        </>
                      )}
                    </label>
                  </Button>
                </div>
                
                {uploadingFile && (
                  <div className="mt-4">
                    <Progress value={50} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground mt-2">
                      Enviando arquivo e iniciando análise IA...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Review */}
            {getPendingReviewLicenses().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                    Aguardando Revisão ({getPendingReviewLicenses().length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getPendingReviewLicenses().map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium">
                              {license.name || license.documents?.[0]?.file_name || 'Licença'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {license.ai_confidence_score && `${license.ai_confidence_score}% confiança`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(license.status || 'pending')}
                          <Button 
                            size="sm" 
                            onClick={() => handleReconciliation(license)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Revisar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Análises em Progresso ({getProcessingLicenses().length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getProcessingLicenses().map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                          <div>
                            <p className="font-medium">
                              {license.documents?.[0]?.file_name || 'Documento de Licença'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Análise IA em andamento...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(license.ai_processing_status || 'processing')}
                          <Button variant="outline" size="sm" disabled>
                            <Clock className="h-4 w-4 mr-2" />
                            Processando
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {getProcessingLicenses().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma análise em progresso</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Licenças Processadas ({getCompletedLicenses().length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getCompletedLicenses().map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {license.ai_processing_status === 'failed' ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {license.name || license.documents?.[0]?.file_name || 'Licença'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {license.type} • {license.ai_confidence_score && `${license.ai_confidence_score}% confiança`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(license.status || license.ai_processing_status || 'completed')}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {getCompletedLicenses().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma licença processada ainda</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reconciliation Modal */}
        <LicenseReconciliationModal
          isOpen={reconciliationOpen}
          onClose={() => {
            setReconciliationOpen(false)
            setSelectedLicense(null)
          }}
          onApprove={handleReconciliationApprove}
          licenseData={selectedLicense}
          documentFileName={selectedLicense?.documents?.[0]?.file_name}
        />
      </div>
    </MainLayout>
  )
}