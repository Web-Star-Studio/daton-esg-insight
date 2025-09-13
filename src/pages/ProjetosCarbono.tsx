import { useState, useEffect } from "react"
import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Wallet, ShieldCheck, Trees, DollarSign, Eye, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { carbonProjectsService, type CarbonProject, type CreditPurchase } from "@/services/carbonProjects"
import { CreditRetirementModal } from "@/components/CreditRetirementModal"

export default function ProjetosCarbono() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [projects, setProjects] = useState<CarbonProject[]>([])
  const [purchases, setPurchases] = useState<CreditPurchase[]>([])
  const [stats, setStats] = useState({
    totalPurchased: 0,
    totalAvailable: 0,
    totalRetired: 0,
    totalInvestment: 0,
    projectsCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [retirementModalOpen, setRetirementModalOpen] = useState(false)

  // SEO
  useEffect(() => {
    document.title = 'Projetos de Carbono | Gestão de Créditos de Carbono';
    const desc = 'Gerencie projetos de carbono, compras e aposentadoria de créditos para compensação de emissões.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/projetos-carbono`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, purchasesData, statsData] = await Promise.all([
        carbonProjectsService.getProjects(),
        carbonProjectsService.getPurchases(),
        carbonProjectsService.getDashboardStats(),
      ]);

      setProjects(projectsData);
      setPurchases(purchasesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos projetos de carbono",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const kpis = [
    {
      title: "Créditos Disponíveis",
      value: `${formatNumber(stats.totalAvailable)} tCO₂e`,
      icon: Wallet,
    },
    {
      title: "Total Compensado (Aposentado)",
      value: `${formatNumber(stats.totalRetired)} tCO₂e`,
      icon: ShieldCheck,
      iconColor: "text-green-600",
    },
    {
      title: "Projetos Apoiados",
      value: stats.projectsCount.toString(),
      icon: Trees,
    },
    {
      title: "Investimento Total",
      value: formatCurrency(stats.totalInvestment),
      icon: DollarSign,
    },
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Portfólio de Projetos de Carbono</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie e acompanhe seus investimentos em créditos de carbono para a compensação de emissões.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

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
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setRetirementModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Aposentar Créditos
            </Button>
            <Button 
              onClick={() => navigate("/projetos-carbono/registrar-creditos")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Compra
            </Button>
          </div>
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

        {/* Credit Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Compras de Créditos de Carbono</CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-12">
                <Trees className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma compra registrada</h3>
                <p className="text-muted-foreground mb-4">
                  Registre sua primeira compra de créditos de carbono para começar
                </p>
                <Button onClick={() => navigate("/projetos-carbono/registrar-creditos")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primeira Compra
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Tipo / Metodologia</TableHead>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Créditos Comprados</TableHead>
                    <TableHead>Disponíveis</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>Data da Compra</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.project_name_text || `Projeto ID: ${purchase.project_id?.substring(0, 8)}`}
                      </TableCell>
                      <TableCell>{purchase.type_methodology || '-'}</TableCell>
                      <TableCell>{purchase.standard || '-'}</TableCell>
                      <TableCell>{formatNumber(purchase.quantity_tco2e)} tCO₂e</TableCell>
                      <TableCell>
                        <Badge variant={purchase.available_quantity > 0 ? "default" : "secondary"}>
                          {formatNumber(purchase.available_quantity)} tCO₂e
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {purchase.total_cost ? formatCurrency(purchase.total_cost) : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(purchase.purchase_date).toLocaleDateString('pt-BR')}
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
            )}
          </CardContent>
        </Card>

        {/* Projects Table */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projetos de Carbono Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Projeto</TableHead>
                    <TableHead>Tipo / Metodologia</TableHead>
                    <TableHead>Padrão / Certificadora</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.type_methodology}</TableCell>
                      <TableCell>{project.standard}</TableCell>
                      <TableCell>{project.location || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={project.status === "Ativo" ? "default" : "secondary"}
                          className={
                            project.status === "Ativo"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : ""
                          }
                        >
                          {project.status}
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
        )}
      </div>

      {/* Modals */}
      <CreditRetirementModal
        open={retirementModalOpen}
        onClose={() => setRetirementModalOpen(false)}
        onRetirementCreated={loadData}
      />
    </MainLayout>
  )
}