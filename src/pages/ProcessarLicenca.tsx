import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Brain, 
  FileCheck, 
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  Clock,
  Eye,
  FileText 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LicenseReconciliationModal } from '@/components/LicenseReconciliationModal';

interface License {
  id: string;
  name: string;
  type: string;
  status: string;
  ai_processing_status?: string;
  ai_confidence_score?: number;
  ai_extracted_data?: any;
  documents?: Array<{
    id: string;
    file_name: string;
    ai_processing_status?: string;
  }>;
}

export default function ProcessarLicenca() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [uploadingFile, setUploadingFile] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadLicenses();
    
    // Real-time subscription for license updates
    const channel = supabase
      .channel('license-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'licenses'
      }, () => {
        loadLicenses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load documents for each license
      const licensesWithDocs = await Promise.all((data || []).map(async (license) => {
        const { data: docs } = await supabase
          .from('documents')
          .select('id, file_name, ai_processing_status')
          .eq('related_id', license.id)
          .eq('related_model', 'license');
        
        return { ...license, documents: docs || [] };
      }));
      
      setLicenses(licensesWithDocs);
    } catch (error) {
      console.error('Error loading licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Apenas arquivos PDF são aceitos"
      });
      return;
    }

    setUploadingFile(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Call unified license processor
      const { data, error } = await supabase.functions.invoke('license-ai-analyzer', {
        body: {
          action: 'upload',
          file: {
            name: file.name,
            type: file.type,
            data: base64Data
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Upload realizado!",
          description: "Análise IA iniciada. Aguarde a extração dos dados."
        });
        loadLicenses();
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Erro durante upload",
        description: "Tente novamente"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleReconciliation = (license: License) => {
    setSelectedLicense(license);
    setReconciliationOpen(true);
  };

  const handleReconciliationApprove = async (data: any) => {
    if (!selectedLicense) return;

    try {
      const { error } = await supabase.functions.invoke('license-ai-analyzer', {
        body: {
          action: 'reconcile',
          licenseId: selectedLicense.id,
          reconciliationData: data
        }
      });

      if (error) throw error;
      
      toast({
        title: "Dados aprovados!",
        description: "Licença finalizada com sucesso."
      });
      
      setReconciliationOpen(false);
      loadLicenses();
    } catch (error) {
      console.error('Reconciliation error:', error);
      toast({
        variant: "destructive",
        title: "Erro na reconciliação",
        description: "Tente novamente"
      });
    }
  };

  // Filter licenses by processing stage
  const processingLicenses = licenses.filter(l => 
    l.ai_processing_status === 'processing'
  );
  
  const pendingReview = licenses.filter(l => 
    l.ai_processing_status === 'completed' && l.status !== 'Ativa'
  );
  
  const completedLicenses = licenses.filter(l => 
    l.status === 'Ativa' && l.ai_processing_status === 'completed'
  );

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/licenciamento')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Processar Licenças</h1>
              <p className="text-muted-foreground">
                Upload → Análise IA → Reconciliação Manual
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              1. Upload PDF
            </TabsTrigger>
            <TabsTrigger value="processing" className="gap-2">
              <Brain className="w-4 h-4" />
              2. Análise IA ({processingLicenses.length + pendingReview.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              3. Finalizadas ({completedLicenses.length})
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload de Licença PDF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Envie o PDF da licença ambiental
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    A IA extrairá automaticamente todos os dados importantes
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
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
                          Enviando e analisando...
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

            {/* Processing Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Como funciona o processamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Upload do PDF</h4>
                      <p className="text-sm text-muted-foreground">Envie o documento da licença</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Análise Automática</h4>
                      <p className="text-sm text-muted-foreground">IA extrai dados automaticamente</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Reconciliação Manual</h4>
                      <p className="text-sm text-muted-foreground">Revise e aprove os dados extraídos</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-4">
            {/* Processing Licenses */}
            {processingLicenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                    Analisando com IA ({processingLicenses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {processingLicenses.map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                          <div>
                            <p className="font-medium">
                              {license.documents?.[0]?.file_name || 'Processando...'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Extraindo dados automaticamente...
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Processando
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Review */}
            {pendingReview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                    Aguardando Reconciliação ({pendingReview.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingReview.map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium">
                              {license.name || license.documents?.[0]?.file_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Análise concluída • {license.ai_confidence_score && `${Math.round(license.ai_confidence_score * 100)}% confiança`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Aguardando revisão</Badge>
                          <Button 
                            size="sm" 
                            onClick={() => handleReconciliation(license)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Revisar Dados
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(processingLicenses.length === 0 && pendingReview.length === 0) && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Nenhuma licença sendo processada</p>
                    <p className="text-sm">Faça upload de um PDF para começar</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Licenças Finalizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando...</p>
                  </div>
                ) : completedLicenses.length > 0 ? (
                  <div className="space-y-3">
                    {completedLicenses.map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">{license.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {license.type} • Processada com sucesso
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Ativa</Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/licenciamento/${license.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Nenhuma licença finalizada ainda</p>
                    <p className="text-sm">Complete o processamento de uma licença para vê-la aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reconciliation Modal */}
        <LicenseReconciliationModal
          isOpen={reconciliationOpen}
          onClose={() => setReconciliationOpen(false)}
          onApprove={handleReconciliationApprove}
          licenseData={selectedLicense?.ai_extracted_data || {}}
          documentFileName={selectedLicense?.documents?.[0]?.file_name || 'Documento'}
        />
      </div>
    </MainLayout>
  );
}