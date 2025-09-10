import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Scale, 
  Recycle, 
  Trash2, 
  DollarSign,
  Eye,
  Pencil,
  FileText
} from "lucide-react"

const Residuos = () => {
  // Mock data for KPIs
  const kpiData = [
    {
      title: "Total Gerado no Mês",
      value: "2.5 Toneladas",
      icon: Scale,
      iconColor: "text-foreground"
    },
    {
      title: "Taxa de Reciclagem",
      value: "45%",
      icon: Recycle,
      iconColor: "text-success"
    },
    {
      title: "Destinado a Aterro",
      value: "1.2 Toneladas",
      icon: Trash2,
      iconColor: "text-warning"
    },
    {
      title: "Custo de Destinação (Mês)",
      value: "R$ 3.450,00",
      icon: DollarSign,
      iconColor: "text-foreground"
    }
  ]

  // Mock data for MTR table
  const mtrData = [
    {
      mtr: "MTR-0012345",
      residuo: "Papel e Papelão",
      classe: "Classe II A - Não Inertes",
      dataColeta: "05/09/2025",
      quantidade: "800 kg",
      destinador: "Recicla Tudo Ltda.",
      status: "Destinação Finalizada",
      statusVariant: "success" as const
    },
    {
      mtr: "CI-00876",
      residuo: "Resíduo Orgânico",
      classe: "Classe II A - Não Inertes",
      dataColeta: "03/09/2025",
      quantidade: "1.2 ton",
      destinador: "Aterro Sanitário Central",
      status: "Em Trânsito",
      statusVariant: "warning" as const
    },
    {
      mtr: "MTR-0012401",
      residuo: "Óleo Contaminado",
      classe: "Classe I - Perigoso",
      dataColeta: "01/09/2025",
      quantidade: "150 L",
      destinador: "Lwarb Lubrificantes",
      status: "Coletado",
      statusVariant: "secondary" as const
    },
    {
      mtr: "MTR-0012398",
      residuo: "Sucata Metálica",
      classe: "Classe II B - Inertes",
      dataColeta: "28/08/2025",
      quantidade: "450 kg",
      destinador: "MetalRecicla S.A.",
      status: "Destinação Finalizada",
      statusVariant: "success" as const
    }
  ]

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case "success":
        return "secondary" // Using secondary with custom styling
      case "warning":
        return "secondary"
      case "secondary":
        return "outline"
      default:
        return "outline"
    }
  }

  const getBadgeClassName = (variant: string) => {
    switch (variant) {
      case "success":
        return "bg-success/10 text-success border-success/20"
      case "warning":
        return "bg-warning/10 text-warning border-warning/20"
      case "secondary":
        return "bg-accent/10 text-accent border-accent/20"
      default:
        return ""
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Gestão de Resíduos Sólidos</h1>
          </div>
          <Button className="w-fit">
            + Registrar Destinação
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <Card key={index} className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabela de Movimentações de Resíduos (MTR) */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Movimentações de Resíduos (Log de MTR)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Nº MTR / Controle</TableHead>
                    <TableHead>Resíduo</TableHead>
                    <TableHead className="w-[160px]">Classe</TableHead>
                    <TableHead className="w-[120px]">Data da Coleta</TableHead>
                    <TableHead className="w-[100px]">Quantidade</TableHead>
                    <TableHead>Destinador</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mtrData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.mtr}</TableCell>
                      <TableCell>{item.residuo}</TableCell>
                      <TableCell>
                        <span className="text-sm">{item.classe}</span>
                      </TableCell>
                      <TableCell>{item.dataColeta}</TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell>{item.destinador}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getBadgeVariant(item.statusVariant)}
                          className={getBadgeClassName(item.statusVariant)}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Ver Detalhes/CDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default Residuos