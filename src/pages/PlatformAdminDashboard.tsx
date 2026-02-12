import { Building2, Users, FileText, TrendingUp } from "lucide-react";
import { PlatformStatsCard } from "@/components/platform/PlatformStatsCard";
import { CompanyTable } from "@/components/platform/CompanyTable";
import { PlatformUsersTable } from "@/components/platform/PlatformUsersTable";
import { usePlatformAnalytics } from "@/hooks/usePlatformAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleSettingsPanel } from "@/components/platform/ModuleSettingsPanel";

export default function PlatformAdminDashboard() {
  const { data: analytics, isLoading } = usePlatformAnalytics('30d');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral e gerenciamento de todas as empresas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PlatformStatsCard
          title="Empresas Ativas"
          value={analytics?.overview.activeCompanies || 0}
          icon={Building2}
        />
        <PlatformStatsCard
          title="Total de Usuários"
          value={analytics?.overview.totalUsers || 0}
          icon={Users}
        />
        <PlatformStatsCard
          title="Usuários Ativos (30d)"
          value={analytics?.overview.activeUsers || 0}
          icon={TrendingUp}
        />
        <PlatformStatsCard
          title="Atividades (30d)"
          value={analytics?.overview.totalActivities || 0}
          icon={FileText}
        />
      </div>

      {/* Top Companies */}
      {analytics?.engagement.topCompanies && analytics.engagement.topCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Empresas Mais Ativas (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.engagement.topCompanies.slice(0, 5).map((company, index) => (
                <div key={company.cnpj} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.cnpj}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{company.count}</p>
                    <p className="text-sm text-muted-foreground">atividades</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Empresas & Usuários */}
      <Tabs defaultValue="empresas">
        <TabsList>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="modulos">Módulos</TabsTrigger>
        </TabsList>
        <TabsContent value="empresas">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Empresas</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformUsersTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="modulos">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Módulos</CardTitle>
            </CardHeader>
            <CardContent>
              <ModuleSettingsPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
