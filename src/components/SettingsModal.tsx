import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  Zap,
  Bell,
  Palette,
  Database,
  Shield,
  Clock,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { useSystemOptimization } from '@/hooks/useSystemOptimization';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { metrics, settings, updateSettings, optimizeCache } = useSystemOptimization();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleCacheOptimization = async () => {
    setIsOptimizing(true);
    try {
      await optimizeCache();
      toast.success('Cache otimizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao otimizar cache');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSettings({ ...settings, [key]: value });
    toast.success('Configuração atualizada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
          <DialogDescription>
            Configure as preferências e otimizações do Centro de Comando ESG
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Monitoramento em tempo real da performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Performance Score</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={metrics.performance_score > 80 ? 'default' : 'secondary'}>
                        {metrics.performance_score}%
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {metrics.system_health.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo de Resposta da API</Label>
                    <div className="text-sm">
                      {metrics.api_response_time}ms
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-refresh Habilitado</Label>
                      <div className="text-sm text-muted-foreground">
                        Atualização automática dos dados
                      </div>
                    </div>
                    <Switch
                      checked={settings.auto_refresh_enabled}
                      onCheckedChange={(checked) => 
                        handleSettingChange('auto_refresh_enabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo de Performance</Label>
                      <div className="text-sm text-muted-foreground">
                        Modo atual: {settings.performance_mode}
                      </div>
                    </div>
                    <select
                      value={settings.performance_mode}
                      onChange={(e) => handleSettingChange('performance_mode', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="battery">Econômico</option>
                      <option value="balanced">Balanceado</option>
                      <option value="performance">Alta Performance</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCacheOptimization}
                    disabled={isOptimizing}
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
                    {isOptimizing ? 'Otimizando...' : 'Otimizar Cache'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Configurações de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações em Tempo Real</Label>
                      <div className="text-sm text-muted-foreground">
                        Alertas instantâneos sobre mudanças críticas
                      </div>
                    </div>
                    <Switch
                      checked={settings.background_sync}
                      onCheckedChange={(checked) => 
                        handleSettingChange('background_sync', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Throttle de Notificações</Label>
                      <div className="text-sm text-muted-foreground">
                        Intervalo mínimo: {settings.notification_throttle}ms
                      </div>
                    </div>
                    <select
                      value={settings.notification_throttle}
                      onChange={(e) => handleSettingChange('notification_throttle', parseInt(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={1000}>1 segundo</option>
                      <option value={5000}>5 segundos</option>
                      <option value={10000}>10 segundos</option>
                      <option value={30000}>30 segundos</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Personalização Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  As configurações visuais serão implementadas em uma próxima versão.
                  Por enquanto, utilize as configurações de performance e notificações.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Gestão de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Duração do Cache</Label>
                      <div className="text-sm text-muted-foreground">
                        Tempo de retenção: {settings.cache_duration / 1000}s
                      </div>
                    </div>
                    <select
                      value={settings.cache_duration}
                      onChange={(e) => handleSettingChange('cache_duration', parseInt(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={30000}>30 segundos</option>
                      <option value={60000}>1 minuto</option>
                      <option value={300000}>5 minutos</option>
                      <option value={900000}>15 minutos</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sincronização em Background</Label>
                      <div className="text-sm text-muted-foreground">
                        Carrega dados em segundo plano
                      </div>
                    </div>
                    <Switch
                      checked={settings.background_sync}
                      onCheckedChange={(checked) => 
                        handleSettingChange('background_sync', checked)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Backup de Dados
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;