import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { AddEmissionSourceModal } from "@/components/AddEmissionSourceModal"
import { useState, useEffect } from "react"
import { getEmissionSourcesWithEmissions, deleteEmissionSource } from "@/services/emissions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const InventarioGEE = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [emissionSources, setEmissionSources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEmissionSources()
  }, [])

  const loadEmissionSources = async () => {
    try {
      setIsLoading(true)
      const data = await getEmissionSourcesWithEmissions()
      setEmissionSources(data)
    } catch (error) {
      console.error('Erro ao carregar fontes de emissão:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSource = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta fonte de emissão?')) {
      try {
        await deleteEmissionSource(id)
        await loadEmissionSources() // Recarregar a lista
      } catch (error) {
        console.error('Erro ao excluir fonte:', error)
      }
    }
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
        />

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