import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  AlertTriangle, 
  Bell, 
  Scale, 
  Clock, 
  Save, 
  RefreshCw,
  Users,
  Info,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getFailureConfig, 
  updateFailureConfig, 
  previewConfigImpact,
  type SupplierFailureConfig 
} from '@/services/supplierFailureConfigService';

export default function SupplierFailureConfigPage() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [formData, setFormData] = useState<Partial<SupplierFailureConfig>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['supplier-failure-config'],
    queryFn: getFailureConfig,
  });

  const { data: preview, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['supplier-failure-config-preview', formData],
    queryFn: () => previewConfigImpact({
      max_failures_allowed: formData.max_failures_allowed ?? config?.max_failures_allowed,
      failure_period_months: formData.failure_period_months ?? config?.failure_period_months,
      severity_weight_low: formData.severity_weight_low ?? config?.severity_weight_low,
      severity_weight_medium: formData.severity_weight_medium ?? config?.severity_weight_medium,
      severity_weight_high: formData.severity_weight_high ?? config?.severity_weight_high,
      severity_weight_critical: formData.severity_weight_critical ?? config?.severity_weight_critical,
    }),
    enabled: !!config,
  });

  const updateMutation = useMutation({
    mutationFn: updateFailureConfig,
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso');
      queryClient.invalidateQueries({ queryKey: ['supplier-failure-config'] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    },
  });

  const handleChange = (field: keyof SupplierFailureConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const getValue = (field: keyof SupplierFailureConfig): any => {
    return formData[field as keyof typeof formData] ?? config?.[field];
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes('@')) {
      const currentEmails = getValue('notify_emails') || [];
      if (!currentEmails.includes(newEmail)) {
        handleChange('notify_emails', [...currentEmails, newEmail]);
        setNewEmail('');
      }
    }
  };

  const handleRemoveEmail = (email: string) => {
    const currentEmails = getValue('notify_emails') || [];
    handleChange('notify_emails', currentEmails.filter(e => e !== email));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuração de Falhas de Fornecimento
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure as regras de inativação automática e notificações
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critérios de Inativação */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critérios de Inativação
            </CardTitle>
            <CardDescription>
              Defina quando um fornecedor deve ser automaticamente inativado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_failures">Máximo de Falhas Permitidas</Label>
                <Input
                  id="max_failures"
                  type="number"
                  min={1}
                  max={20}
                  value={getValue('max_failures_allowed') || 3}
                  onChange={(e) => handleChange('max_failures_allowed', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Pontuação ponderada máxima antes da inativação
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Período de Análise (meses)</Label>
                <Input
                  id="period"
                  type="number"
                  min={1}
                  max={36}
                  value={getValue('failure_period_months') || 12}
                  onChange={(e) => handleChange('failure_period_months', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Janela de tempo para contagem de falhas
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Scale className="h-4 w-4" />
                Pesos por Severidade
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Defina o peso de cada nível de severidade no cálculo da pontuação
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_low" className="text-blue-600">Baixa</Label>
                  <Input
                    id="weight_low"
                    type="number"
                    step={0.1}
                    min={0}
                    max={5}
                    value={getValue('severity_weight_low') || 0.5}
                    onChange={(e) => handleChange('severity_weight_low', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_medium" className="text-yellow-600">Média</Label>
                  <Input
                    id="weight_medium"
                    type="number"
                    step={0.1}
                    min={0}
                    max={5}
                    value={getValue('severity_weight_medium') || 1.0}
                    onChange={(e) => handleChange('severity_weight_medium', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_high" className="text-orange-600">Alta</Label>
                  <Input
                    id="weight_high"
                    type="number"
                    step={0.1}
                    min={0}
                    max={5}
                    value={getValue('severity_weight_high') || 1.5}
                    onChange={(e) => handleChange('severity_weight_high', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_critical" className="text-red-600">Crítica</Label>
                  <Input
                    id="weight_critical"
                    type="number"
                    step={0.1}
                    min={0}
                    max={5}
                    value={getValue('severity_weight_critical') || 2.0}
                    onChange={(e) => handleChange('severity_weight_critical', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="block_days" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Dias de Bloqueio após Inativação
              </Label>
              <Input
                id="block_days"
                type="number"
                min={0}
                max={365}
                value={getValue('reactivation_block_days') || 90}
                onChange={(e) => handleChange('reactivation_block_days', parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Período em que o fornecedor não pode ser reativado após inativação automática
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview do Impacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Impacto das Regras
            </CardTitle>
            <CardDescription>
              Fornecedores afetados pelas regras atuais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPreviewLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <>
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Seriam Inativados</AlertTitle>
                  <AlertDescription>
                    <span className="text-2xl font-bold">
                      {preview?.wouldBeInactivated.length || 0}
                    </span>
                    <span className="text-sm ml-2">fornecedor(es)</span>
                  </AlertDescription>
                </Alert>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Em Risco</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    <span className="text-2xl font-bold">
                      {preview?.wouldBeAtRisk.length || 0}
                    </span>
                    <span className="text-sm ml-2">fornecedor(es)</span>
                  </AlertDescription>
                </Alert>

                {preview?.wouldBeInactivated.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Fornecedores que seriam inativados:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {preview.wouldBeInactivated.map(s => (
                        <div key={s.id} className="text-sm flex justify-between items-center p-2 bg-red-50 rounded">
                          <span className="truncate">{s.name}</span>
                          <Badge variant="destructive">{s.weightedScore.toFixed(1)} pts</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure quando e para quem enviar alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Nova Falha Registrada</p>
                <p className="text-sm text-muted-foreground">
                  Notificar quando uma falha for cadastrada
                </p>
              </div>
              <Switch
                checked={getValue('notify_on_failure') ?? true}
                onCheckedChange={(checked) => handleChange('notify_on_failure', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Fornecedor em Risco</p>
                <p className="text-sm text-muted-foreground">
                  Notificar quando atingir 66% do limite
                </p>
              </div>
              <Switch
                checked={getValue('notify_on_at_risk') ?? true}
                onCheckedChange={(checked) => handleChange('notify_on_at_risk', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Inativação Automática</p>
                <p className="text-sm text-muted-foreground">
                  Notificar quando um fornecedor for inativado
                </p>
              </div>
              <Switch
                checked={getValue('notify_on_inactivation') ?? true}
                onCheckedChange={(checked) => handleChange('notify_on_inactivation', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>E-mails para Notificação</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleAddEmail}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {(getValue('notify_emails') || []).map(email => (
                <Badge key={email} variant="secondary" className="pl-3 pr-1 py-1">
                  {email}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                    onClick={() => handleRemoveEmail(email)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {(getValue('notify_emails') || []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum e-mail configurado. As notificações serão enviadas apenas in-app.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona o cálculo</AlertTitle>
        <AlertDescription className="text-sm">
          <p className="mt-2">
            A pontuação ponderada é calculada somando os pesos de cada falha registrada no período de análise.
            Por exemplo, com os pesos padrão:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>1 falha crítica (2.0) + 1 falha média (1.0) = <strong>3.0 pontos</strong></li>
            <li>Se o limite for 3, este fornecedor seria inativado na próxima falha</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
