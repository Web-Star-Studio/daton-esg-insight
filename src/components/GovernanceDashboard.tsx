import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Shield,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface GovernanceDashboardProps {
  governanceMetrics?: any;
  riskMetrics?: any;
}

export function GovernanceDashboard({ governanceMetrics, riskMetrics }: GovernanceDashboardProps) {
  if (!governanceMetrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { board, policies, ethics } = governanceMetrics;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros do Conselho</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{board?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {board?.independentMembers || 0} independentes
            </p>
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs">Independência:</span>
                <Badge variant={board?.independenceRate >= 50 ? "default" : "secondary"}>
                  {Math.round(board?.independenceRate || 0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Políticas Corporativas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies?.totalPolicies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {policies?.activePolicies || 0} ativas
            </p>
            <div className="mt-2">
              <Progress 
                value={policies?.reviewComplianceRate || 0} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(policies?.reviewComplianceRate || 0)}% em conformidade
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canal de Ética</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ethics?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              {ethics?.currentYearReports || 0} este ano
            </p>
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs">Resolução:</span>
                <Badge variant={ethics?.resolutionRate >= 80 ? "default" : "secondary"}>
                  {Math.round(ethics?.resolutionRate || 0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riscos ESG</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskMetrics?.totalRisks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {riskMetrics?.criticalRisks || 0} críticos
            </p>
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs">Mitigados:</span>
                <Badge variant={riskMetrics?.mitigatedRisks >= riskMetrics?.totalRisks * 0.8 ? "default" : "secondary"}>
                  {riskMetrics?.mitigatedRisks || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diversity Breakdown */}
      {board?.genderDiversity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Diversidade do Conselho</CardTitle>
            <CardDescription>Composição por gênero</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(board.genderDiversity).map(([gender, count]) => (
                <div key={gender} className="text-center">
                  <div className="text-2xl font-bold">{count as number}</div>
                  <div className="text-sm text-muted-foreground">{gender}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(((count as number) / board.totalMembers) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Review Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status das Políticas</CardTitle>
          <CardDescription>Situação das revisões e conformidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">{(policies?.totalPolicies || 0) - (policies?.policiesNeedingReview || 0)}</div>
                <div className="text-sm text-muted-foreground">Em Dia</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">{policies?.policiesNeedingReview || 0}</div>
                <div className="text-sm text-muted-foreground">Precisam Revisão</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">{policies?.activePolicies || 0}</div>
                <div className="text-sm text-muted-foreground">Ativas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ethics Report Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tendências do Canal de Ética</CardTitle>
          <CardDescription>Resumo de relatórios e resoluções</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{ethics?.totalReports || 0}</div>
              <div className="text-sm text-muted-foreground">Total de Relatórios</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{ethics?.openReports || 0}</div>
              <div className="text-sm text-muted-foreground">Em Andamento</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {(ethics?.totalReports || 0) - (ethics?.openReports || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Resolvidos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{ethics?.currentYearReports || 0}</div>
              <div className="text-sm text-muted-foreground">Este Ano</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}