import { useState } from "react"
import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Eye, Plus } from "lucide-react"

interface EmissionFactor {
  id: string
  name: string
  category: string
  factor: string
  source: string
  validity: string
  type: "system" | "custom"
}

const mockFactors: EmissionFactor[] = [
  {
    id: "1",
    name: "Eletricidade - Sistema Interligado Nacional (SIN)",
    category: "Energia Adquirida",
    factor: "61.7 gCO₂e/kWh",
    source: "MCTI",
    validity: "Ano 2025",
    type: "system"
  },
  {
    id: "2",
    name: "Óleo Diesel Rodoviário",
    category: "Fontes Móveis",
    factor: "2.68 kgCO₂e/Litro",
    source: "GHG Protocol",
    validity: "Padrão 2022",
    type: "system"
  },
  {
    id: "3",
    name: "Gás Natural",
    category: "Combustão Estacionária",
    factor: "2.02 kgCO₂e/m³",
    source: "IPCC",
    validity: "Padrão 2021",
    type: "system"
  },
  {
    id: "4",
    name: "Gasolina Comum",
    category: "Fontes Móveis",
    factor: "2.23 kgCO₂e/Litro",
    source: "GHG Protocol",
    validity: "Padrão 2022",
    type: "system"
  },
  {
    id: "5",
    name: "Processo Térmico Customizado - Caldeira Industrial",
    category: "Processos Industriais",
    factor: "3.15 kgCO₂e/Unidade",
    source: "Dados da Empresa",
    validity: "2024-2025",
    type: "custom"
  }
]

const categories = [
  "Todas as Categorias",
  "Energia Adquirida",
  "Fontes Móveis", 
  "Combustão Estacionária",
  "Processos Industriais"
]

export default function BibliotecaFatores() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Todas as Categorias")

  const filteredFactors = mockFactors.filter(factor => {
    const matchesSearch = factor.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "Todas as Categorias" || factor.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Fatores de Emissão</h1>
            <p className="text-muted-foreground mt-2">
              Consulte os fatores de emissão padrão do sistema (baseados no GHG Protocol e MCTI) e gerencie fatores customizados.
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4" />
            Adicionar Fator Customizado
          </Button>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
            <CardDescription>
              Encontre rapidamente os fatores de emissão que você precisa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Ex: Diesel, Eletricidade, Gás..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-[240px]">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fatores de Emissão</CardTitle>
            <CardDescription>
              {filteredFactors.length} {filteredFactors.length === 1 ? 'fator encontrado' : 'fatores encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Fator</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fator (CO₂e)</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFactors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum fator encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFactors.map((factor) => (
                      <TableRow key={factor.id}>
                        <TableCell className="font-medium">
                          {factor.name}
                        </TableCell>
                        <TableCell>{factor.category}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {factor.factor}
                        </TableCell>
                        <TableCell>{factor.source}</TableCell>
                        <TableCell>{factor.validity}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={factor.type === "system" ? "default" : "secondary"}
                          >
                            {factor.type === "system" ? "Padrão do Sistema" : "Customizado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}