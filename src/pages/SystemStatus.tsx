import { SystemStatusDashboard } from "@/components/production/SystemStatusDashboard";

export default function SystemStatus() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Status do Sistema</h1>
        <p className="text-muted-foreground">
          Monitore a prontidão para produção e configurações do sistema
        </p>
      </div>
      
      <SystemStatusDashboard />
    </div>
  );
}
