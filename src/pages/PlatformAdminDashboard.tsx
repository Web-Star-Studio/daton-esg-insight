import { Users, FileText, TrendingUp, MousePointerClick } from "lucide-react";
import { PlatformStatsCard } from "@/components/platform/PlatformStatsCard";
import { CompanyTable } from "@/components/platform/CompanyTable";
import { PlatformUsersTable } from "@/components/platform/PlatformUsersTable";
import { UsageAnalyticsTab } from "@/components/platform/UsageAnalyticsTab";
import { GabardoViewTab } from "@/components/platform/GabardoViewTab";
import { ErrorsPerfTab } from "@/components/platform/ErrorsPerfTab";
import { AdminAuditTab } from "@/components/platform/AdminAuditTab";
import { useGabardoMetrics } from "@/hooks/useGabardoMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlatformAdminDashboard() {
  const { data: gabardo, isLoading } = useGabardoMetrics("30d");

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
          Foco operacional na Gabardo (único cliente ativo)
        </p>
      </div>

      {/* KPIs — escopo Gabardo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PlatformStatsCard
          title="Usuários Gabardo"
          value={gabardo?.totals.total_users ?? 0}
          icon={Users}
        />
        <PlatformStatsCard
          title="Usuários Ativos (30d)"
          value={gabardo?.totals.active_users ?? 0}
          icon={TrendingUp}
        />
        <PlatformStatsCard
          title="Pageviews (30d)"
          value={gabardo?.totals.pageviews ?? 0}
          icon={MousePointerClick}
        />
        <PlatformStatsCard
          title="Eventos (30d)"
          value={gabardo?.totals.events ?? 0}
          icon={FileText}
        />
      </div>

      {/* Tabs: Gabardo View (foco), Erros & Perf, Auditoria, Empresas, Usuários, Uso */}
      <Tabs defaultValue="gabardo">
        <TabsList>
          <TabsTrigger value="gabardo">Gabardo View</TabsTrigger>
          <TabsTrigger value="errors-perf">Erros & Performance</TabsTrigger>
          <TabsTrigger value="audit">Auditoria Admin</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="uso">Custos & Infra IA</TabsTrigger>
        </TabsList>
        <TabsContent value="gabardo">
          <GabardoViewTab />
        </TabsContent>
        <TabsContent value="errors-perf">
          <ErrorsPerfTab />
        </TabsContent>
        <TabsContent value="audit">
          <AdminAuditTab />
        </TabsContent>
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
        <TabsContent value="uso">
          <UsageAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
