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
import { Plus, Pencil, Trash2 } from "lucide-react"

// Mock data para a tabela
const mockData = [
  {
    id: 1,
    nome: "Frota de Caminhões Diesel",
    escopo: "Escopo 1",
    categoria: "Fontes Móveis",
    emissoes: "1.204",
    ultimaAtualizacao: "01/09/2025",
    status: "Ativo"
  },
  {
    id: 2,
    nome: "Caldeira Principal",
    escopo: "Escopo 1", 
    categoria: "Fontes Estacionárias",
    emissoes: "850",
    ultimaAtualizacao: "15/08/2025",
    status: "Ativo"
  },
  {
    id: 3,
    nome: "Consumo de Eletricidade - Matriz",
    escopo: "Escopo 2",
    categoria: "Energia Adquirida",
    emissoes: "2.150",
    ultimaAtualizacao: "31/08/2025",
    status: "Ativo"
  },
  {
    id: 4,
    nome: "Transporte de Funcionários",
    escopo: "Escopo 3",
    categoria: "Outras Fontes Indiretas",
    emissoes: "320",
    ultimaAtualizacao: "10/08/2025",
    status: "Inativo"
  }
]

const InventarioGEE = () => {
  const getStatusBadge = (status: string) => {
    return status === "Ativo" 
      ? <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>
      : <Badge variant="secondary" className="bg-muted text-muted-foreground">Inativo</Badge>
  }

  const renderTable = (data: typeof mockData) => (
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
                <TableCell className="font-medium">{fonte.nome}</TableCell>
                <TableCell>{fonte.escopo}</TableCell>
                <TableCell>{fonte.categoria}</TableCell>
                <TableCell className="text-right font-mono">{fonte.emissoes}</TableCell>
                <TableCell>{fonte.ultimaAtualizacao}</TableCell>
                <TableCell>{getStatusBadge(fonte.status)}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-accent"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
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
          <Button className="sm:ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Fonte de Emissão
          </Button>
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
            {renderTable(mockData)}
          </TabsContent>

          <TabsContent value="escopo1" className="space-y-4">
            {renderTable(mockData.filter(item => item.escopo === "Escopo 1"))}
          </TabsContent>

          <TabsContent value="escopo2" className="space-y-4">
            {renderTable(mockData.filter(item => item.escopo === "Escopo 2"))}
          </TabsContent>

          <TabsContent value="escopo3" className="space-y-4">
            {renderTable(mockData.filter(item => item.escopo === "Escopo 3"))}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

export default InventarioGEE