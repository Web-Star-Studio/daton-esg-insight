import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Leaf, Zap, Users } from "lucide-react"

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard ESG</h1>
          <p className="text-muted-foreground">
            Visão geral dos indicadores de sustentabilidade e governança corporativa
          </p>
        </div>

        {/* Cards de métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score ESG Geral</CardTitle>
              <Leaf className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">87.5</div>
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                +2.3% vs mês anterior
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emissões CO²</CardTitle>
              <Zap className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2.4t</div>
              <div className="flex items-center gap-1 text-xs text-destructive">
                <TrendingUp className="h-3 w-3" />
                +0.8% vs mês anterior
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diversidade</CardTitle>
              <Users className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">68%</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Minus className="h-3 w-3" />
                Sem alteração
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área de conteúdo em desenvolvimento */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                Em Desenvolvimento
              </Badge>
              Área Principal de Conteúdo
            </CardTitle>
            <CardDescription>
              Esta é a base do seu dashboard ESG profissional. 
              A sidebar retrátil e o header estão prontos para receber os módulos de gestão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Próximos passos sugeridos:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Adicionar itens de navegação na sidebar</li>
                <li>Implementar módulos de relatórios ESG</li>
                <li>Criar dashboards de métricas ambientais</li>
                <li>Desenvolver sistema de alertas e notificações</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
