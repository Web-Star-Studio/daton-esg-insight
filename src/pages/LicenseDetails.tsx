import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Pencil,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Paperclip,
  Calendar,
  Building,
  Hash,
  FileCheck,
  Brain,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { getLicenseById, getDocumentUrl, type LicenseDetail } from '@/services/licenses';
import { LicenseDocumentUploadModal } from '@/components/LicenseDocumentUploadModal';

const LicenseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: license, isLoading, error, refetch } = useQuery({
    queryKey: ['license-details', id],
    queryFn: () => getLicenseById(id!),
    enabled: !!id,
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Ativa": { variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
      "Vencida": { variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
      "Em Renovação": { variant: "secondary" as const, className: "bg-accent/10 text-accent border-accent/20" },
      "Suspensa": { variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap["Ativa"];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar o documento');
    }
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Erro ao visualizar o documento');
    }
  };

  if (!id) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
            <div>
              <h2 className="text-lg font-semibold">ID da licença não fornecido</h2>
              <p className="text-muted-foreground">
                Não foi possível identificar qual licença exibir.
              </p>
              <Button 
                onClick={() => navigate('/licenciamento')} 
                className="mt-4"
              >
                Voltar ao Licenciamento
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Erro ao carregar licença</h2>
              <p className="text-muted-foreground mt-2">
                {error.message.includes('No rows') 
                  ? 'Licença não encontrada ou você não tem permissão para acessá-la.'
                  : 'Ocorreu um erro ao carregar os detalhes da licença.'
                }
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => navigate('/licenciamento')}>
                  Voltar ao Licenciamento
                </Button>
                <Button onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
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
              <h1 className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-64" /> : license?.name}
              </h1>
              <p className="text-muted-foreground">
                {isLoading ? <Skeleton className="h-4 w-48" /> : `Licença ${license?.type} - ${license?.process_number}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowUploadModal(true)}>
              <Paperclip className="h-4 w-4 mr-2" />
              Anexar Documento
            </Button>
            <Button onClick={() => navigate(`/licenciamento/${id}/editar`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* License Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Informações da Licença
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Nome:</span>
                      <span>{license?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tipo:</span>
                      <span>{license?.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Órgão Emissor:</span>
                      <span>{license?.issuing_body}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nº do Processo:</span>
                      <span className="font-mono">{license?.process_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Data de Emissão:</span>
                      <span>{license?.issue_date ? formatDate(license.issue_date) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Data de Vencimento:</span>
                      <span>{license?.expiration_date ? formatDate(license.expiration_date) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(license?.status || '')}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documentos Anexados
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Anexar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                  </div>
                ) : license?.documents && license.documents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Arquivo</TableHead>
                        <TableHead>Data de Upload</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {license.documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.file_name}</TableCell>
                          <TableCell>{formatDate(doc.upload_date)}</TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDocument(doc.file_path)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento anexado</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Anexar primeiro documento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Analysis Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Análise de IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      {license?.ai_processing_status === 'completed' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Concluída
                        </Badge>
                      ) : license?.ai_processing_status === 'processing' ? (
                        <Badge variant="secondary" className="gap-1">
                          <Brain className="h-3 w-3" />
                          Processando
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Não analisada
                        </Badge>
                      )}
                    </div>
                    {license?.ai_confidence_score && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Confiança:</span>
                        <span className="font-medium">{Math.round(license.ai_confidence_score * 100)}%</span>
                      </div>
                    )}
                    {license?.compliance_score && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Conformidade:</span>
                        <span className="font-medium">{license.compliance_score}%</span>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/licenciamento/${id}/analise`)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Ver Análise Completa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Renovação
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Verificar Condicionantes
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {license && (
        <LicenseDocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            refetch();
            setShowUploadModal(false);
          }}
          licenseId={license.id}
          licenseName={license.name}
        />
      )}
    </MainLayout>
  );
};

export default LicenseDetails;