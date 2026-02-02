import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save, History, Settings, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useSystemSettings, 
  useSettingsHistory, 
  useUpdateMultipleSettings,
  SETTING_CONSTRAINTS,
  type SettingUpdatePayload
} from '@/hooks/admin/useSystemSettings';

const SETTING_ICONS: Record<string, { label: string; description: string }> = {
  session_timeout_minutes: {
    label: 'Timeout de Sessão',
    description: 'Tempo em minutos antes da sessão expirar por inatividade',
  },
  max_upload_size_mb: {
    label: 'Tamanho Máx. Upload',
    description: 'Limite de tamanho de arquivo em MB para uploads',
  },
  max_login_attempts: {
    label: 'Tentativas de Login',
    description: 'Número máximo de tentativas antes de bloquear a conta',
  },
  login_lock_duration_minutes: {
    label: 'Duração do Bloqueio',
    description: 'Tempo em minutos que a conta fica bloqueada após exceder tentativas',
  },
};

export const SystemConfigModule = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  const { data: history, isLoading: historyLoading } = useSettingsHistory();
  const updateSettings = useUpdateMultipleSettings();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form values when settings load
  useEffect(() => {
    if (settings) {
      const values: Record<string, string> = {};
      settings.forEach(s => {
        values[s.setting_key] = String(s.setting_value);
      });
      setFormValues(values);
      setHasChanges(false);
    }
  }, [settings]);

  const handleValueChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!settings) return;

    const updates: SettingUpdatePayload[] = [];
    settings.forEach(s => {
      const newValue = formValues[s.setting_key];
      if (newValue !== String(s.setting_value)) {
        updates.push({
          setting_key: s.setting_key,
          setting_value: newValue,
        });
      }
    });

    if (updates.length > 0) {
      updateSettings.mutate(updates);
    }
  };

  const getValidationError = (key: string, value: string): string | null => {
    const constraint = SETTING_CONSTRAINTS[key];
    if (!constraint) return null;

    const numValue = Number(value);
    if (isNaN(numValue)) return 'Valor deve ser numérico';
    if (numValue < constraint.min) return `Mínimo: ${constraint.min}`;
    if (numValue > constraint.max) return `Máximo: ${constraint.max}`;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        Erro ao carregar configurações
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Ajuste parâmetros de segurança e operação da plataforma
              </CardDescription>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {settings?.filter(s => SETTING_ICONS[s.setting_key]).map(setting => {
              const info = SETTING_ICONS[setting.setting_key];
              const constraint = SETTING_CONSTRAINTS[setting.setting_key];
              const currentValue = formValues[setting.setting_key] || '';
              const validationError = getValidationError(setting.setting_key, currentValue);

              return (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.setting_key}>{info.label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={setting.setting_key}
                      type="number"
                      value={currentValue}
                      onChange={(e) => handleValueChange(setting.setting_key, e.target.value)}
                      min={constraint?.min}
                      max={constraint?.max}
                      className={validationError ? 'border-destructive' : ''}
                    />
                    {constraint && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({constraint.min}-{constraint.max})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                  {validationError && (
                    <p className="text-xs text-destructive">{validationError}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Settings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
          <CardDescription>
            Registro imutável de todas as mudanças de configuração
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma alteração registrada
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Configuração</TableHead>
                    <TableHead>Valor Anterior</TableHead>
                    <TableHead>Novo Valor</TableHead>
                    <TableHead>Alterado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(entry.changed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {SETTING_ICONS[entry.setting_key]?.label || entry.setting_key}
                      </TableCell>
                      <TableCell className="font-mono">
                        {String(entry.old_value || '-')}
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {String(entry.new_value)}
                      </TableCell>
                      <TableCell>{entry.user_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
