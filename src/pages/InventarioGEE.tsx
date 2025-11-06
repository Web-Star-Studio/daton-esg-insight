import { useState, useEffect, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Factory, 
  Zap, 
  TrendingUp, 
  CheckCircle, 
  Plus, 
  Pencil, 
  Trash2,
  BarChart3,
  Loader2,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Calendar,
  TrendingDown,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { AddEmissionSourceModal } from "@/components/AddEmissionSourceModal";
import EditEmissionSourceModal from "@/components/EditEmissionSourceModal";
import { ActivityDataModal } from "@/components/ActivityDataModal";
import { EmissionSourceWizard } from "@/components/emissions/EmissionSourceWizard";
import { StationaryCombustionModal } from "@/components/StationaryCombustionModal";
import { MobileCombustionModal } from "@/components/MobileCombustionModal";
import { FugitiveEmissionsModal } from "@/components/FugitiveEmissionsModal";
import { IndustrialProcessesModal } from "@/components/IndustrialProcessesModal";
import { AgricultureModal } from "@/components/AgricultureModal";
import { Scope3CategoryModal } from "@/components/Scope3CategoryModal";
import { AdvancedAnalyticsModal } from "@/components/AdvancedAnalyticsModal";
import { RecalculateEmissionsButton } from "@/components/RecalculateEmissionsButton";
import { GHGProtocolCompleteModal } from "@/components/GHGProtocolCompleteModal";
import { 
  getEmissionSourcesWithEmissions, 
  getEmissionStats, 
  deleteEmissionSource,
  type EmissionSource 
} from "@/services/emissions";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const InventarioGEE = () => {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [isMobileCombustionModalOpen, setIsMobileCombustionModalOpen] = useState(false)
  const [isFugitiveEmissionsModalOpen, setIsFugitiveEmissionsModalOpen] = useState(false)
  const [isIndustrialProcessesModalOpen, setIsIndustrialProcessesModalOpen] = useState(false)
  const [isAgricultureModalOpen, setIsAgricultureModalOpen] = useState(false)
  const [isScope3CategoryModalOpen, setIsScope3CategoryModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)
  const [isGHGCompleteModalOpen, setIsGHGCompleteModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<any>(null)
  const [activityDataSource, setActivityDataSource] = useState<any>(null)
  const [editingActivityData, setEditingActivityData] = useState<any>(null)
  const [emissionSources, setEmissionSources] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  
  // Enhanced filters and controls
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [showCharts, setShowCharts] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [scopeFilter, setScopeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // High emission threshold (configurable)
  const HIGH_EMISSION_THRESHOLD = 100; // tCO2e

  // Real chart data will come from API calculations
  const trendData = useMemo(() => {
    return [];
  }, []);

  const pieData = useMemo(() => [
    { name: 'Escopo 1', value: stats.escopo1 || 0, color: '#ef4444' },
    { name: 'Escopo 2', value: stats.escopo2 || 0, color: '#f97316' },
    { name: 'Escopo 3', value: stats.escopo3 || 0, color: '#eab308' },
  ], [stats]);

  // Filter and search logic with advanced filters
  const filteredSources = useMemo(() => {
    return emissionSources.filter(source => {
      const matchesSearch = searchTerm === "" || 
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesScope = scopeFilter === "all" || source.scope.toString() === scopeFilter;
      const matchesCategory = categoryFilter === "all" || source.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || source.status === statusFilter;
      
      return matchesSearch && matchesScope && matchesCategory && matchesStatus;
    });
  }, [emissionSources, searchTerm, scopeFilter, categoryFilter, statusFilter]);

  // High emission sources alert
  const highEmissionSources = useMemo(() => {
    return filteredSources.filter(source => source.ultima_emissao > HIGH_EMISSION_THRESHOLD);
  }, [filteredSources]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);

  const handleBulkDelete = async () => {
    if (selectedSources.length === 0) return;
    
    try {
      await Promise.all(selectedSources.map(id => deleteEmissionSource(id)));
      await loadData();
      setSelectedSources([]);
      toast({
        title: "Sucesso",
        description: `${selectedSources.length} fonte(s) de emissão excluída(s) com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir fontes de emissão",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSources(filteredSources.map(source => source.id));
    } else {
      setSelectedSources([]);
    }
  };

  const handleSourceSelect = (sourceId: string, checked: boolean) => {
    if (checked) {
      setSelectedSources(prev => [...prev, sourceId]);
    } else {
      setSelectedSources(prev => prev.filter(id => id !== sourceId));
    }
  };

  const exportData = (format: 'csv' | 'excel') => {
    try {
      if (format === 'csv') {
        const headers = [
          'Nome da Fonte',
          'Escopo', 
          'Categoria', 
          'Emissões (tCO2e)', 
          'Última Atualização',
          'Status',
          'Descrição'
        ];
        
        const rows = filteredSources.map(source => [
          source.name || '',
          source.scope ? `Escopo ${source.scope}` : '',
          source.category || '',
          source.ultima_emissao ? source.ultima_emissao.toFixed(3) : '0.000',
          source.ultima_atualizacao ? formatDate(source.ultima_atualizacao) : '',
          source.status || 'Inativo',
          source.description || ''
        ]);
        
        // Add summary rows
        rows.push([]);
        rows.push(['RESUMO']);
        rows.push(['Total de Emissões', '', '', stats.total ? stats.total.toFixed(3) : '0.000', '', '', '']);
        rows.push(['Escopo 1', '', '', stats.escopo1 ? stats.escopo1.toFixed(3) : '0.000', '', '', '']);
        rows.push(['Escopo 2', '', '', stats.escopo2 ? stats.escopo2.toFixed(3) : '0.000', '', '', '']);
        rows.push(['Escopo 3', '', '', stats.escopo3 ? stats.escopo3.toFixed(3) : '0.000', '', '', '']);
        rows.push(['Fontes Ativas', '', '', `${stats.ativas || 0} de ${stats.fontes_total || 0}`, '', '', '']);
        
        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n');
        
        // Add BOM for UTF-8 support in Excel
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario-gee-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Sucesso",
          description: filteredSources.length === 0 
            ? "Relatório vazio exportado com sucesso!"
            : `Relatório exportado com sucesso! ${filteredSources.length} fonte(s) incluída(s).`,
        });
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [sourcesData, statsData] = await Promise.all([
        getEmissionSourcesWithEmissions(),
        getEmissionStats()
      ])
      setEmissionSources(sourcesData)
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do inventário",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSource = (id: string) => {
    setSourceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sourceToDelete) return;
    
    try {
      await deleteEmissionSource(sourceToDelete);
      await loadData();
      toast({
        title: "Sucesso",
        description: "Fonte de emissão excluída com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir fonte:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir fonte de emissão",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
    }
  };

  const handleEditSource = (source: any) => {
    setSelectedSource(source)
    setIsEditModalOpen(true)
  }

  const handleManageActivityData = (source: any) => {
    setActivityDataSource(source)
    setEditingActivityData(null) // Reset editing state
    if (source.category === 'Combustão Móvel') {
      setIsMobileCombustionModalOpen(true)
    } else if (source.category === 'Emissões Fugitivas') {
      setIsFugitiveEmissionsModalOpen(true)
    } else if (source.category === 'Processos Industriais') {
      setIsIndustrialProcessesModalOpen(true)
    } else if (source.category === 'Agricultura') {
      setIsAgricultureModalOpen(true)
    } else if (source.scope === 3) {
      setIsScope3CategoryModalOpen(true)
    } else {
      setIsActivityModalOpen(true)
    }
  }

  const handleEditActivityData = (source: any, activityData: any) => {
    setActivityDataSource(source)
    setEditingActivityData(activityData)
    setIsActivityModalOpen(true)
  }
  
  const getStatusBadge = (status: string) => {
    return status === "Ativo" 
      ? <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>
      : <Badge variant="secondary" className="bg-muted text-muted-foreground">Inativo</Badge>
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const formatEmission = (value: number) => {
    return value ? value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'
  }

  const renderTable = (data: any[]) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando fontes de emissão...</p>
          </CardContent>
        </Card>
      )
    }

    if (data.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fonte de emissão encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Para começar seu inventário GEE, adicione uma fonte de emissão clicando no botão 'Adicionar Fonte de Emissão'."}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.length > 0 && selectedSources.length === data.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[150px]">Nome da Fonte</TableHead>
                <TableHead className="min-w-[100px]">Escopo</TableHead>
                <TableHead className="min-w-[120px]">Categoria</TableHead>
                <TableHead className="text-right min-w-[130px]">Emissões (tCO₂e)</TableHead>
                <TableHead className="min-w-[140px]">Última Atualização</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="text-center min-w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((fonte) => (
                <TableRow key={fonte.id} className={fonte.ultima_emissao > HIGH_EMISSION_THRESHOLD ? "bg-red-50 dark:bg-red-950/20" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSources.includes(fonte.id)}
                      onCheckedChange={(checked) => handleSourceSelect(fonte.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {fonte.name}
                      {fonte.ultima_emissao > HIGH_EMISSION_THRESHOLD && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>Escopo {fonte.scope}</TableCell>
                  <TableCell>{fonte.category}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={fonte.ultima_emissao > HIGH_EMISSION_THRESHOLD ? "text-red-600 font-semibold" : ""}>
                      {formatEmission(fonte.ultima_emissao)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(fonte.ultima_atualizacao)}</TableCell>
                  <TableCell>{getStatusBadge(fonte.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleManageActivityData(fonte)}
                        title="Gerenciar dados de atividade"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent"
                        onClick={() => handleEditSource(fonte)}
                        title="Editar fonte"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="Excluir fonte"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta fonte de emissão? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSource(fonte.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
        <div className="flex flex-col gap-4" data-tour="inventario-gee-header">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Inventário GEE</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gerencie e analise suas emissões de gases de efeito estufa</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData('csv')}
              disabled={isLoading}
              className="md:size-default"
            >
              <FileSpreadsheet className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            {(stats.fontes_total > 0) && (
              <RecalculateEmissionsButton onSuccess={loadData} />
            )}
            <Button 
              onClick={() => setIsWizardOpen(true)} 
              variant="default"
              size="sm"
              className="md:size-default flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Adicionar Fonte (Guiado)</span>
              <span className="sm:hidden">Guiado</span>
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)} 
              variant="outline"
              size="sm"
              className="md:size-default flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Adicionar Fonte (Rápido)</span>
              <span className="sm:hidden">Rápido</span>
            </Button>
            <Button 
              onClick={() => setIsAnalyticsModalOpen(true)}
              variant="outline"
              size="sm"
              className="md:size-default"
            >
              <BarChart3 className="h-4 w-4 md:mr-2" />
              <span className="hidden lg:inline">Analytics Avançado</span>
              <span className="lg:hidden">Analytics</span>
            </Button>
            <Button 
              onClick={() => setIsGHGCompleteModalOpen(true)} 
              variant="outline"
              size="sm"
              className="md:size-default"
            >
              <FileText className="h-4 w-4 md:mr-2" />
              <span className="hidden lg:inline">GHG Protocol 2025</span>
              <span className="lg:hidden">GHG 2025</span>
            </Button>
          </div>
        </div>

        {/* Alertas de alta emissão - Melhorado */}
        {highEmissionSources.length > 0 && (
          <Alert className="border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 dark:border-orange-700">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-pulse" />
            <AlertDescription className="text-orange-900 dark:text-orange-100">
              <div className="flex flex-col gap-2">
                <div className="font-semibold">
                  ⚠️ Atenção: {highEmissionSources.length} fonte(s) de emissão com valores elevados
                </div>
                <div className="text-sm">
                  Fontes acima de {HIGH_EMISSION_THRESHOLD} tCO₂e: {' '}
                  <span className="font-medium">
                    {highEmissionSources.slice(0, 3).map(s => s.name).join(', ')}
                    {highEmissionSources.length > 3 && ` e mais ${highEmissionSources.length - 3}`}
                  </span>
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  Recomendação: Priorize ações de redução para estas fontes de maior impacto.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Controles e filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fontes de emissão..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Select value={scopeFilter} onValueChange={setScopeFilter}>
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Escopo" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos Escopos</SelectItem>
                      <SelectItem value="1">Escopo 1</SelectItem>
                      <SelectItem value="2">Escopo 2</SelectItem>
                      <SelectItem value="3">Escopo 3</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-full sm:col-span-2 lg:col-span-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="3months">Últimos 3 meses</SelectItem>
                      <SelectItem value="6months">Últimos 6 meses</SelectItem>
                      <SelectItem value="12months">Último ano</SelectItem>
                      <SelectItem value="24months">Últimos 2 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCharts(!showCharts)}
                >
                  <BarChart3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{showCharts ? 'Ocultar' : 'Mostrar'} Gráficos</span>
                </Button>
                
                {selectedSources.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir ({selectedSources.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir {selectedSources.length} fonte(s) de emissão selecionada(s)? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Excluir Todas
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal para adicionar fonte */}
        <AddEmissionSourceModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen}
          onSuccess={loadData}
        />

        {/* Modal para adicionar fonte (Guiado) */}
        <EmissionSourceWizard 
          open={isWizardOpen} 
          onOpenChange={setIsWizardOpen}
          onSuccess={loadData}
        />

        {/* Modal para editar fonte */}
        <EditEmissionSourceModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          source={selectedSource}
          onSuccess={loadData}
        />

        {/* Modal para gerenciar dados de atividade */}
        {activityDataSource && (
          <>
            {/* Use specialized modal for stationary combustion */}
            {activityDataSource.category === 'Combustão Estacionária' ? (
              <StationaryCombustionModal
                open={isActivityModalOpen}
                onOpenChange={(open) => {
                  setIsActivityModalOpen(open);
                  if (!open) {
                    setEditingActivityData(null);
                  }
                }}
                emissionSourceId={activityDataSource.id}
                onSuccess={loadData}
                editingData={editingActivityData}
                source={activityDataSource}
              />
            ) : activityDataSource.category === 'Combustão Móvel' ? (
              <MobileCombustionModal
                isOpen={isMobileCombustionModalOpen}
                onClose={() => {
                  setIsMobileCombustionModalOpen(false);
                  setEditingActivityData(null);
                }}
                source={activityDataSource}
              />
            ) : activityDataSource.category === 'Emissões Fugitivas' ? (
              <FugitiveEmissionsModal
                isOpen={isFugitiveEmissionsModalOpen}
                onClose={() => {
                  setIsFugitiveEmissionsModalOpen(false);
                  setEditingActivityData(null);
                }}
                source={activityDataSource}
              />
            ) : activityDataSource.category === 'Processos Industriais' ? (
              <IndustrialProcessesModal
                isOpen={isIndustrialProcessesModalOpen}
                onClose={() => {
                  setIsIndustrialProcessesModalOpen(false);
                  setEditingActivityData(null);
                }}
                source={activityDataSource}
              />
            ) : activityDataSource.category === 'Agricultura' ? (
              <AgricultureModal
                isOpen={isAgricultureModalOpen}
                onClose={() => {
                  setIsAgricultureModalOpen(false);
                  setEditingActivityData(null);
                }}
                source={activityDataSource}
              />
            ) : activityDataSource.scope === 3 ? (
              <Scope3CategoryModal
                isOpen={isScope3CategoryModalOpen}
                onClose={() => {
                  setIsScope3CategoryModalOpen(false);
                  setEditingActivityData(null);
                }}
                onSuccess={loadData}
              />
            ) : (
              <ActivityDataModal
                open={isActivityModalOpen}
                onOpenChange={(open) => {
                  setIsActivityModalOpen(open);
                  if (!open) {
                    setEditingActivityData(null);
                  }
                }}
                source={activityDataSource}
                onSuccess={loadData}
                editingData={editingActivityData}
              />
            )}
          </>
        )}

        {/* Modal GHG Protocol Completo */}
        <GHGProtocolCompleteModal
          isOpen={isGHGCompleteModalOpen}
          onClose={() => setIsGHGCompleteModalOpen(false)}
          onSuccess={loadData}
        />

        {/* Modal Analytics Avançado */}
        <AdvancedAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
        />

        {/* Gráficos e Análises */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendência de Emissões */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendência de Emissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)} tCO₂e`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="escopo1" stroke="#ef4444" name="Escopo 1" />
                    <Line type="monotone" dataKey="escopo2" stroke="#f97316" name="Escopo 2" />
                    <Line type="monotone" dataKey="escopo3" stroke="#eab308" name="Escopo 3" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Escopo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribuição por Escopo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)} tCO₂e`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPIs Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Emissões</p>
                  <p className="text-2xl font-bold">{formatEmission(stats.total)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                  {stats.total > 1000 && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">Alto volume</span>
                    </div>
                  )}
                  {stats.total <= 1000 && stats.total > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500 font-medium">Dentro da meta</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escopo 1</p>
                  <p className="text-2xl font-bold text-red-600">{formatEmission(stats.escopo1)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                  <p className="text-xs text-muted-foreground">Emissões diretas</p>
                </div>
                <Factory className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escopo 2</p>
                  <p className="text-2xl font-bold text-orange-600">{formatEmission(stats.escopo2)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                  <p className="text-xs text-muted-foreground">Energia indireta</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escopo 3</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatEmission(stats.escopo3)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                  <p className="text-xs text-muted-foreground">Outras indiretas</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fontes Ativas</p>
                  <p className="text-2xl font-bold">{stats.ativas} <span className="text-sm font-normal text-muted-foreground">de {stats.fontes_total}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {stats.fontes_total > 0 ? `${((stats.ativas / stats.fontes_total) * 100).toFixed(0)}%` : '0%'} ativas
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de Abas */}
        <Tabs defaultValue="todas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="todas">Todas as Fontes</TabsTrigger>
            <TabsTrigger value="escopo1">Escopo 1</TabsTrigger>
            <TabsTrigger value="escopo2">Escopo 2</TabsTrigger>
            <TabsTrigger value="escopo3">Escopo 3</TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="space-y-4">
            {renderTable(filteredSources)}
          </TabsContent>

          <TabsContent value="escopo1" className="space-y-4">
            {renderTable(filteredSources.filter(item => item.scope === 1))}
          </TabsContent>

          <TabsContent value="escopo2" className="space-y-4">
            {renderTable(filteredSources.filter(item => item.scope === 2))}
          </TabsContent>

          <TabsContent value="escopo3" className="space-y-4">
            {renderTable(filteredSources.filter(item => item.scope === 3))}
          </TabsContent>
        </Tabs>
      </div>
  )
}

export default InventarioGEE