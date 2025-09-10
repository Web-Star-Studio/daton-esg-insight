import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Flag, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  CheckCircle,
  Clock,
  Circle
} from "lucide-react"

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard ESG</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) de volta, João Silva!
          </p>
        </div>

        {/* Primeira Linha - Cards de Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Próximas Metas */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Metas</CardTitle>
              <Flag className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Reduzir emissões em 15% até dezembro de 2025
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="text-foreground font-medium">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Card Alertas Ativos */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                1 licença ambiental vencendo em 30 dias
              </p>
            </CardContent>
          </Card>

          {/* Card Último Relatório */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Relatório</CardTitle>
              <FileText className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Relatório ESG - Novembro 2024
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Baixar PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Segunda Linha - KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Score ESG */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score ESG</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">75</div>
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                +3.2% vs. Mês anterior
              </div>
            </CardContent>
          </Card>

          {/* Emissões Totais */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emissões Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">6.248 tCO₂e</div>
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingDown className="h-3 w-3" />
                -1.1% vs. Mês anterior
              </div>
            </CardContent>
          </Card>

          {/* Projetos Carbono */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Carbono</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0 ativos</div>
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                +2.9% vs. Mês anterior
              </div>
            </CardContent>
          </Card>

          {/* Resíduos Reciclados */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resíduos Reciclados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0.0%</div>
              <div className="flex items-center gap-1 text-xs text-destructive">
                <TrendingDown className="h-3 w-3" />
                -4.5% vs. Mês anterior
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terceira Linha - Conteúdo Dinâmico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Insights de IA */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Insights de IA</CardTitle>
              <Sparkles className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nossos algoritmos estão analisando seus dados em busca de oportunidades de melhoria.
              </p>
            </CardContent>
          </Card>

          {/* Card Próximas Tarefas */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Próximas Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Atualizar relatório trimestral de emissões</span>
                  <Badge variant="outline" className="ml-auto text-xs">Pendente</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm text-foreground">Revisar metas de redução de carbono 2024</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-warning/10 text-warning">Em Andamento</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Instalar sensores IoT de emissão</span>
                  <Badge variant="outline" className="ml-auto text-xs">Pendente</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm line-through text-muted-foreground">Enviar relatório de água</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-success/10 text-success">Concluído</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
