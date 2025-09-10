import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Pencil,
  Paperclip
} from "lucide-react"
import { useNavigate } from "react-router-dom"

// Mock data para as licenças
const mockLicencas = [
  {
    id: 1,
    nome: "Licença de Operação (LO) - Unidade MG",
    tipo: "LO - Operação",
    orgaoEmissor: "CETESB",
    numeroProcesso: "2024/001234-5",
    dataEmissao: "15/10/2022",
    dataVencimento: "15/10/2026",
    status: "Ativa"
  },
  {
    id: 2,
    nome: "Licença Prévia (LP) - Expansão",
    tipo: "LP - Prévia",
    orgaoEmissor: "IBAMA",
    numeroProcesso: "2023/005678-9",
    dataEmissao: "08/03/2023",
    dataVencimento: "08/03/2025",
    status: "Vence em 60 dias"
  },
  {
    id: 3,
    nome: "Licença de Instalação (LI) - Novo Galpão",
    tipo: "LI - Instalação",
    orgaoEmissor: "SEMAD",
    numeroProcesso: "2022/009876-1",
    dataEmissao: "20/06/2022",
    dataVencimento: "20/06/2024",
    status: "Vencida"
  },
  {
    id: 4,
    nome: "Licença Ambiental Única (LAU) - Filial RJ",
    tipo: "LAU - Única",
    orgaoEmissor: "INEA",
    numeroProcesso: "2024/002468-3",
    dataEmissao: "10/01/2024",
    dataVencimento: "10/01/2029",
    status: "Em Renovação"
  },
  {
    id: 5,
    nome: "Licença de Operação (LO) - Unidade SP",
    tipo: "LO - Operação",
    orgaoEmissor: "CETESB",
    numeroProcesso: "2023/003691-7",
    dataEmissao: "25/09/2023",
    dataVencimento: "25/03/2025",
    status: "Vence em 60 dias"
  }
]

const Licenciamento = () => {
  const navigate = useNavigate()

  const handleAddLicenca = () => {
    navigate("/licenciamento/novo")
  }
  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Ativa": { variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
      "Vence em 60 dias": { variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" },
      "Vencida": { variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
      "Em Renovação": { variant: "secondary" as const, className: "bg-accent/10 text-accent border-accent/20" }
    }

    const config = statusMap[status as keyof typeof statusMap] || statusMap["Ativa"]
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
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
          <Button className="sm:ml-auto" onClick={handleAddLicenca}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Licença
          </Button>
        </div>

        {/* Cards de Resumo (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Licenças</CardTitle>
              <Award className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">9</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas do Vencimento (90d)</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <XCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Licenças */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Licenças Ambientais</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Licença</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Órgão Emissor</TableHead>
                  <TableHead>Nº do Processo</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLicencas.map((licenca) => (
                  <TableRow key={licenca.id}>
                    <TableCell className="font-medium">{licenca.nome}</TableCell>
                    <TableCell>{licenca.tipo}</TableCell>
                    <TableCell>{licenca.orgaoEmissor}</TableCell>
                    <TableCell className="font-mono text-sm">{licenca.numeroProcesso}</TableCell>
                    <TableCell>{licenca.dataEmissao}</TableCell>
                    <TableCell>{licenca.dataVencimento}</TableCell>
                    <TableCell>{getStatusBadge(licenca.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent"
                          title="Anexar Arquivo"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default Licenciamento