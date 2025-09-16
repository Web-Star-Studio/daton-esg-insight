import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/MainLayout";
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
import { StationaryCombustionModal } from "@/components/StationaryCombustionModal";
import { MobileCombustionModal } from "@/components/MobileCombustionModal";
import { FugitiveEmissionsModal } from "@/components/FugitiveEmissionsModal";
import { IndustrialProcessesModal } from "@/components/IndustrialProcessesModal";
import { AgricultureModal } from "@/components/AgricultureModal";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [isMobileCombustionModalOpen, setIsMobileCombustionModalOpen] = useState(false)
  const [isFugitiveEmissionsModalOpen, setIsFugitiveEmissionsModalOpen] = useState(false)
  const [isIndustrialProcessesModalOpen, setIsIndustrialProcessesModalOpen] = useState(false)
  const [isAgricultureModalOpen, setIsAgricultureModalOpen] = useState(false)
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
  
  // High emission threshold (configurable)
  const HIGH_EMISSION_THRESHOLD = 100; // tCO2e

  // Mock data for charts (in real app, this would come from API)
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM yyyy', { locale: ptBR }),
        total: Math.random() * 1000 + 500,
        escopo1: Math.random() * 300 + 100,
        escopo2: Math.random() * 400 + 200,
        escopo3: Math.random() * 300 + 200,
      });
    }
    return months;
  }, []);

  const pieData = useMemo(() => [
    { name: 'Escopo 1', value: stats.escopo1 || 0, color: '#ef4444' },
    { name: 'Escopo 2', value: stats.escopo2 || 0, color: '#f97316' },
    { name: 'Escopo 3', value: stats.escopo3 || 0, color: '#eab308' },
  ], [stats]);

  // Filter and search logic
  const filteredSources = useMemo(() => {
    return emissionSources.filter(source => {
      const matchesSearch = searchTerm === "" || 
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [emissionSources, searchTerm]);

  // High emission sources alert
  const highEmissionSources = useMemo(() => {
    return filteredSources.filter(source => source.ultima_emissao > HIGH_EMISSION_THRESHOLD);
  }, [filteredSources]);

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
    // Simple CSV export (in real app, use proper library)
    if (format === 'csv') {
      const headers = ['Nome', 'Escopo', 'Categoria', 'Emissões (tCO2e)', 'Status'];
      const rows = filteredSources.map(source => [
        source.name,
        `Escopo ${source.scope}`,
        source.category,
        formatEmission(source.ultima_emissao),
        source.status
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario-gee-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
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

  const handleDeleteSource = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta fonte de emissão?')) {
      try {
        await deleteEmissionSource(id)
        await loadData()
        toast({
          title: "Sucesso",
          description: "Fonte de emissão excluída com sucesso!",
        })
      } catch (error) {
        console.error('Erro ao excluir fonte:', error)
        toast({
          title: "Erro",
          description: "Erro ao excluir fonte de emissão",
          variant: "destructive",
        })
      }
    }
  }

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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.length > 0 && selectedSources.length === data.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Nome da Fonte</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Emissões (tCO₂e)</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteSource(fonte.id)}
                        title="Excluir fonte"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventário GEE</h1>
            <p className="text-muted-foreground">Gerencie e analise suas emissões de gases de efeito estufa</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportData('csv')}
              disabled={filteredSources.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            {(stats.fontes_total > 0) && (
              <RecalculateEmissionsButton onSuccess={loadData} />
            )}
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Fonte de Emissão
            </Button>
            <Button 
              onClick={() => setIsGHGCompleteModalOpen(true)} 
              variant="outline" 
              className="ml-2"
            >
              <FileText className="mr-2 h-4 w-4" />
              GHG Protocol 2025
            </Button>
          </div>
        </div>

        {/* Alertas de alta emissão */}
        {highEmissionSources.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Atenção:</strong> {highEmissionSources.length} fonte(s) de emissão com valores altos (&gt;{HIGH_EMISSION_THRESHOLD} tCO₂e): {' '}
              {highEmissionSources.map(s => s.name).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Controles e filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fontes de emissão..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Últimos 3 meses</SelectItem>
                    <SelectItem value="6months">Últimos 6 meses</SelectItem>
                    <SelectItem value="12months">Último ano</SelectItem>
                    <SelectItem value="24months">Últimos 2 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCharts(!showCharts)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {showCharts ? 'Ocultar' : 'Mostrar'} Gráficos
                </Button>
                
                {selectedSources.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir ({selectedSources.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir {selectedSources.length} fonte(s) de emissão selecionada(s)? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Emissões</p>
                  <p className="text-2xl font-bold">{formatEmission(stats.total)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                  {stats.total > 1000 && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">Alto volume</span>
                    </div>
                  )}
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
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
    </MainLayout>
  )
}

export default InventarioGEE