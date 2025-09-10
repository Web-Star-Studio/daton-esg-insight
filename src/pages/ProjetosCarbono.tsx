import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Wallet, ShieldCheck, Trees, DollarSign, Eye, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function ProjetosCarbono() {
  const navigate = useNavigate()
  const kpis = [
    {
      title: "Créditos Disponíveis",
      value: "1.500 tCO₂e",
      icon: Wallet,
    },
    {
      title: "Total Compensado (Aposentado)",
      value: "5.250 tCO₂e",
      icon: ShieldCheck,
      iconColor: "text-green-600",
    },
    {
      title: "Projetos Apoiados",
      value: "3",
      icon: Trees,
    },
    {
      title: "Investimento Total",
      value: "R$ 472.500,00",
      icon: DollarSign,
    },
  ]

  const projetos = [
    {
      id: 1,
      nome: "Reflorestamento Corredor Tupi",
      tipo: "Nature-Based (REDD+)",
      padrao: "VCS (Verra)",
      creditos: "3.000",
      status: "Ativo",
    },
    {
      id: 2,
      nome: "Parque Eólico de Guajiru",
      tipo: "Energia Renovável",
      padrao: "Gold Standard",
      creditos: "2.500",
      status: "Ativo",
    },
    {
      id: 3,
      nome: "Captura de Metano - Aterro Seropédica",
      tipo: "Gestão de Resíduos",
      padrao: "CERCARBONO",
      creditos: "1.250",
      status: "Encerrado",
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfólio de Projetos de Carbono</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e acompanhe seus investimentos em créditos de carbono para a compensação de emissões.
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => navigate("/projetos-carbono/registrar-creditos")}
          >
            <Plus className="h-4 w-4" />
            Registrar Compra de Créditos
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor || "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos de Carbono</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Projeto</TableHead>
                  <TableHead>Tipo / Metodologia</TableHead>
                  <TableHead>Padrão / Certificadora</TableHead>
                  <TableHead>Créditos Adquiridos (tCO₂e)</TableHead>
                  <TableHead>Status do Projeto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projetos.map((projeto) => (
                  <TableRow key={projeto.id}>
                    <TableCell className="font-medium">{projeto.nome}</TableCell>
                    <TableCell>{projeto.tipo}</TableCell>
                    <TableCell>{projeto.padrao}</TableCell>
                    <TableCell>{projeto.creditos}</TableCell>
                    <TableCell>
                      <Badge
                        variant={projeto.status === "Ativo" ? "default" : "secondary"}
                        className={
                          projeto.status === "Ativo"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : ""
                        }
                      >
                        {projeto.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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