import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Pencil,
  Paperclip,
  Brain,
  RefreshCw,
  BarChart3,
  Bell,
  Filter,
  Trash2,
  Archive,
  FileText,
  Calendar,
  Map,
  ExternalLink,
  MoreVertical,
  MoreHorizontal,
  Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLicenses, getLicenseStats, deleteLicense, type LicenseListItem, type LicenseStats } from "@/services/licenses";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { IntelligentAlertsSystem } from "@/components/IntelligentAlertsSystem";
import { LicenseDocumentUploadModal } from "@/components/LicenseDocumentUploadModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";


const Licenciamento = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLicenseForUpload, setSelectedLicenseForUpload] = useState<{id: string, name: string} | null>(null);
  
  // Selection and filtering states
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [licensesToDelete, setLicensesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch licenses data
  const { data: licenses, isLoading: licensesLoading, error: licensesError } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => getLicenses(),
  });

  // Fetch license statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['license-stats'],
    queryFn: () => getLicenseStats(),
  });

  const handleAddLicenca = () => {
    navigate("/licenciamento/novo");
  };

  const handleAttachFile = (licenseId: string, licenseName: string) => {
    setSelectedLicenseForUpload({ id: licenseId, name: licenseName });
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    // Refetch licenses to update the data
    // The useQuery will automatically refetch
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-stats'] });
      toast.success('Licença(s) deletada(s) com sucesso!');
      setSelectedLicenses([]);
    },
    onError: (error) => {
      console.error('Erro ao deletar licença:', error);
      toast.error('Erro ao deletar licença(s)');
    }
  });

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLicenses(filteredLicenses?.map(license => license.id) || []);
    } else {
      setSelectedLicenses([]);
    }
  };

  const handleSelectLicense = (licenseId: string, checked: boolean) => {
    if (checked) {
      setSelectedLicenses(prev => [...prev, licenseId]);
    } else {
      setSelectedLicenses(prev => prev.filter(id => id !== licenseId));
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    setLicensesToDelete(selectedLicenses);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      for (const licenseId of licensesToDelete) {
        await deleteMutation.mutateAsync(licenseId);
      }
    } catch (error) {
      console.error('Error deleting licenses:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setLicensesToDelete([]);
    }
  };

  // Filter licenses based on search and filters
  const filteredLicenses = licenses?.filter(license => {
    const matchesSearch = license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.issuing_body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.process_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || license.status === statusFilter;
    const matchesType = typeFilter === "all" || license.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique values for filters
  const availableStatuses = [...new Set(licenses?.map(l => l.status) || [])];
  const availableTypes = [...new Set(licenses?.map(l => l.type) || [])];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isLoading = licensesLoading || statsLoading;
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

  if (licensesError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Erro ao carregar licenças</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Licenciamento Ambiental</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as licenças ambientais da empresa
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/licenciamento/workflow')} variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              Análise com IA
            </Button>
            <Button className="sm:ml-auto" onClick={handleAddLicenca}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Licença
            </Button>
          </div>
        </div>

        {/* Cards de Resumo (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Licenças</CardTitle>
              <Award className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.total || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.active || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas do Vencimento (90d)</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.upcoming || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <XCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.expired || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card className="shadow-card">
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Licenças Ambientais</CardTitle>
              
              {selectedLicenses.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedLicenses.length} selecionada(s)
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ações em lote
                        <MoreHorizontal className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar selecionadas
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar selecionadas
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar selecionadas
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome, órgão emissor ou nº do processo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos tipos</SelectItem>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredLicenses && selectedLicenses.length === filteredLicenses.length && filteredLicenses.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todas as licenças"
                    />
                  </TableHead>
                  <TableHead>Nome da Licença</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Órgão Emissor</TableHead>
                  <TableHead>Nº do Processo</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLicenses && filteredLicenses.length > 0 ? (
                  filteredLicenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLicenses.includes(license.id)}
                          onCheckedChange={(checked) => handleSelectLicense(license.id, !!checked)}
                          aria-label={`Selecionar licença ${license.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{license.name}</TableCell>
                      <TableCell>{license.type}</TableCell>
                      <TableCell>{license.issuing_body}</TableCell>
                      <TableCell className="font-mono text-sm">{license.process_number || '-'}</TableCell>
                      <TableCell>{license.issue_date ? formatDate(license.issue_date) : '-'}</TableCell>
                      <TableCell>{formatDate(license.expiration_date)}</TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      <TableCell>
                        {license.ai_processing_status === 'completed' ? (
                          <Badge variant="default" className="gap-1">
                            <Brain className="h-3 w-3" />
                            {license.compliance_score}%
                          </Badge>
                        ) : license.ai_processing_status === 'processing' ? (
                          <Badge variant="secondary" className="gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Processando
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Não analisada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Análise IA"
                            onClick={() => navigate(`/licenciamento/${license.id}/analise`)}
                          >
                            <Brain className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Ver Detalhes"
                            onClick={() => navigate(`/licenciamento/${license.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Editar"
                            onClick={() => navigate(`/licenciamento/${license.id}/editar`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Anexar Arquivo"
                            onClick={() => handleAttachFile(license.id, license.name)}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {licenses && licenses.length > 0 ? (
                          <div>
                            <p>Nenhuma licença encontrada com os filtros aplicados</p>
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                                setTypeFilter("all");
                              }}
                            >
                              Limpar filtros
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p>Nenhuma licença encontrada</p>
                            <Button onClick={handleAddLicenca} className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar primeira licença
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      {selectedLicenseForUpload && (
        <LicenseDocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedLicenseForUpload(null);
          }}
          onSuccess={handleUploadSuccess}
          licenseId={selectedLicenseForUpload.id}
          licenseName={selectedLicenseForUpload.name}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar {licensesToDelete.length === 1 ? 'esta licença' : `estas ${licensesToDelete.length} licenças`}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Licenciamento;