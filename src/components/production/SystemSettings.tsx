import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { usePerformanceManager } from '@/hooks/usePerformanceManager';
import { Slider } from '@/components/ui/slider';

export const SystemSettings = () => {
  const { settings, updateSettings, optimizeCache } = usePerformanceManager();
  
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('Configurações salvas com sucesso');
  };

  const handleReset = () => {
    const defaultSettings = {
      auto_refresh_enabled: true,
      cache_duration: 300000,
      background_sync: true,
      performance_mode: 'balanced' as const,
      notification_throttle: 5000
    };
    setLocalSettings(defaultSettings);
    updateSettings(defaultSettings);
    toast.info('Configurações restauradas para padrão');
  };

  const handleOptimizeCache = () => {
    optimizeCache();
    toast.success('Cache otimizado com sucesso');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Configure o modo de performance do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modo de Performance</Label>
              <Select
                value={localSettings.performance_mode}
                onValueChange={(value: 'balanced' | 'performance' | 'battery') =>
                  setLocalSettings({ ...localSettings, performance_mode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Alta Performance</SelectItem>
                  <SelectItem value="balanced">Balanceado</SelectItem>
                  <SelectItem value="battery">Economia de Energia</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {localSettings.performance_mode === 'performance' && 'Máxima velocidade, maior consumo'}
                {localSettings.performance_mode === 'balanced' && 'Equilíbrio entre velocidade e consumo'}
                {localSettings.performance_mode === 'battery' && 'Menor consumo, atualizações reduzidas'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh">Atualização Automática</Label>
                <Switch
                  id="auto-refresh"
                  checked={localSettings.auto_refresh_enabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, auto_refresh_enabled: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Atualiza métricas e dados automaticamente
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="background-sync">Sincronização em Background</Label>
                <Switch
                  id="background-sync"
                  checked={localSettings.background_sync}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, background_sync: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mantém dados sincronizados mesmo quando inativo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cache Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cache</CardTitle>
            <CardDescription>
              Gerencie o armazenamento em cache
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Duração do Cache: {Math.round(localSettings.cache_duration / 60000)} min</Label>
              <Slider
                value={[localSettings.cache_duration / 60000]}
                onValueChange={([value]) =>
                  setLocalSettings({ ...localSettings, cache_duration: value * 60000 })
                }
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Tempo que os dados permanecem em cache
              </p>
            </div>

            <div className="space-y-2">
              <Label>Throttle de Notificações: {localSettings.notification_throttle / 1000}s</Label>
              <Slider
                value={[localSettings.notification_throttle / 1000]}
                onValueChange={([value]) =>
                  setLocalSettings({ ...localSettings, notification_throttle: value * 1000 })
                }
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Intervalo mínimo entre notificações
              </p>
            </div>

            <Button onClick={handleOptimizeCache} variant="outline" className="w-full">
              Otimizar Cache Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
