import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Loader2, Factory, Zap, Truck } from "lucide-react"
import { AddEmissionSourceModal } from "@/components/AddEmissionSourceModal"
import EditEmissionSourceModal from "@/components/EditEmissionSourceModal"
import { useState, useEffect } from "react"
import { 
  getEmissionSourcesWithEmissions, 
  deleteEmissionSource,
  getEmissionStats
} from "@/services/emissions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

const InventarioGEE = () => {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<any>(null)
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
                    <div className="flex justify-center gap-2">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventário de Emissões GEE</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas fontes de emissão de Gases de Efeito Estufa
            </p>
          </div>
          <Button className="sm:ml-auto" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Fonte de Emissão
          </Button>
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

        {/* KPIs Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Fontes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Escopo 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.escopo1 || 0}</div>
              <p className="text-xs text-muted-foreground">Emissões Diretas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Escopo 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.escopo2 || 0}</div>
              <p className="text-xs text-muted-foreground">Energia Adquirida</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Escopo 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.escopo3 || 0}</div>
              <p className="text-xs text-muted-foreground">Outras Indiretas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fontes Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ativas || 0}</div>
              <div className="text-xs text-muted-foreground">
                {stats.total ? Math.round((stats.ativas / stats.total) * 100) : 0}% do total
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