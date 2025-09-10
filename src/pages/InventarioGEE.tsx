import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Loader2
} from "lucide-react";
import { AddEmissionSourceModal } from "@/components/AddEmissionSourceModal";
import EditEmissionSourceModal from "@/components/EditEmissionSourceModal";
import { ActivityDataModal } from "@/components/ActivityDataModal";
import { RecalculateEmissionsButton } from "@/components/RecalculateEmissionsButton";
import { 
  getEmissionSourcesWithEmissions, 
  getEmissionStats, 
  deleteEmissionSource,
  type EmissionSource 
} from "@/services/emissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const InventarioGEE = () => {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<any>(null)
  const [activityDataSource, setActivityDataSource] = useState<any>(null)
  const [emissionSources, setEmissionSources] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

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
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma fonte de emissão encontrada para este escopo.</p>
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
                <TableRow key={fonte.id}>
                  <TableCell className="font-medium">{fonte.name}</TableCell>
                  <TableCell>Escopo {fonte.scope}</TableCell>
                  <TableCell>{fonte.category}</TableCell>
                  <TableCell className="text-right font-mono">{formatEmission(fonte.ultima_emissao)}</TableCell>
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
            <h1 className="text-3xl font-bold">Inventário GEE</h1>
            <div className="flex gap-2">
              <RecalculateEmissionsButton onSuccess={loadData} />
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Fonte de Emissão
              </Button>
            </div>
          </div>

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
          <ActivityDataModal
            open={isActivityModalOpen}
            onOpenChange={setIsActivityModalOpen}
            source={activityDataSource}
            onSuccess={loadData}
          />
        )}

        {/* KPIs Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Emissões</p>
                  <p className="text-2xl font-bold">{stats.total} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
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
                  <p className="text-2xl font-bold">{stats.escopo1} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                </div>
                <Factory className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escopo 2</p>
                  <p className="text-2xl font-bold">{stats.escopo2} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escopo 3</p>
                  <p className="text-2xl font-bold">{stats.escopo3} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fontes Ativas</p>
                  <p className="text-2xl font-bold">{stats.ativas} <span className="text-sm font-normal text-muted-foreground">de {stats.fontes_total}</span></p>
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
            {renderTable(emissionSources)}
          </TabsContent>

          <TabsContent value="escopo1" className="space-y-4">
            {renderTable(emissionSources.filter(item => item.scope === 1))}
          </TabsContent>

          <TabsContent value="escopo2" className="space-y-4">
            {renderTable(emissionSources.filter(item => item.scope === 2))}
          </TabsContent>

          <TabsContent value="escopo3" className="space-y-4">
            {renderTable(emissionSources.filter(item => item.scope === 3))}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

export default InventarioGEE