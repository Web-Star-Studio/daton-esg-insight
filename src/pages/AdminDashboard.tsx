import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { AuditTrailModule } from '@/components/admin/AuditTrailModule';
import { SystemStatsModule } from '@/components/admin/SystemStatsModule';
import { SystemConfigModule } from '@/components/admin/SystemConfigModule';
import { HealthCheckModule } from '@/components/admin/HealthCheckModule';
import { Shield, BarChart3, Settings, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

const AdminDashboard = () => {
  const { isPlatformAdmin, isSuperAdmin, isAdmin, isLoading } = usePermissions();
  const hasAdminAccess = isPlatformAdmin || isSuperAdmin || isAdmin;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar o Dashboard Administrativo.
            Esta área é restrita a administradores do sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Auditoria, estatísticas e configurações avançadas do sistema
        </p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Health Check</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <AuditTrailModule />
        </TabsContent>

        <TabsContent value="stats">
          <SystemStatsModule />
        </TabsContent>

        <TabsContent value="config">
          <PermissionGate 
            permission={['users.manage_permissions']} 
            showAlert
            fallback={
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  Apenas Platform Admins e Super Admins podem modificar configurações do sistema.
                </AlertDescription>
              </Alert>
            }
          >
            <SystemConfigModule />
          </PermissionGate>
        </TabsContent>

        <TabsContent value="health">
          <HealthCheckModule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
