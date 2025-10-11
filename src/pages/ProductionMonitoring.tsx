import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemStatusDashboard } from "@/components/production/SystemStatusDashboard";
import { LogsViewer } from "@/components/production/LogsViewer";
import { PerformanceMetrics } from "@/components/production/PerformanceMetrics";
import { SystemSettings } from "@/components/production/SystemSettings";
import { SystemAlerts } from "@/components/production/SystemAlerts";
import { Activity, FileText, Gauge, Settings, Bell } from "lucide-react";

export default function ProductionMonitoring() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Monitoramento de Produção</h1>
          <p className="text-muted-foreground">
            Acompanhe status, logs e performance do sistema em tempo real
          </p>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6">
            <SystemStatusDashboard />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <SystemAlerts />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <LogsViewer />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
