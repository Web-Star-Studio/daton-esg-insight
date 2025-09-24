import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Settings, Bell, Mail, Smartphone, Volume2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export interface NotificationPreferences {
  // General settings
  enabled: boolean;
  soundEnabled: boolean;
  priority: 'all' | 'high' | 'critical';
  
  // Email notifications
  emailEnabled: boolean;
  emailAddress: string;
  emailFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  
  // Push notifications
  pushEnabled: boolean;
  
  // Category preferences
  categories: {
    emissions: boolean;
    goals: boolean;
    compliance: boolean;
    audit: boolean;
    documents: boolean;
    quality: boolean;
    gri: boolean;
    risk: boolean;
    predictive: boolean;
  };
  
  // Timing preferences
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  
  // Frequency limits
  maxNotificationsPerHour: number;
}

interface NotificationPreferencesModalProps {
  preferences: NotificationPreferences;
  onPreferencesChange: (preferences: NotificationPreferences) => void;
  trigger?: React.ReactNode;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  preferences,
  onPreferencesChange,
  trigger
}) => {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [isOpen, setIsOpen] = useState(false);

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
  };

  const updateCategoryPreference = (category: keyof NotificationPreferences['categories'], enabled: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled
      }
    }));
  };

  const updateQuietHours = (field: keyof NotificationPreferences['quietHours'], value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onPreferencesChange(localPreferences);
    setIsOpen(false);
    toast.success('Preferências de notificação salvas');
  };

  const handleCancel = () => {
    setLocalPreferences(preferences);
    setIsOpen(false);
  };

  const categoryLabels = {
    emissions: 'Emissões',
    goals: 'Metas',
    compliance: 'Compliance',
    audit: 'Auditoria',
    documents: 'Documentos',
    quality: 'Qualidade',
    gri: 'Indicadores GRI',
    risk: 'Gestão de Riscos',
    predictive: 'Alertas Preditivos'
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferências de Notificação
          </DialogTitle>
          <DialogDescription>
            Configure como e quando você deseja receber notificações do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações ativas</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilitar todas as notificações do sistema
                  </p>
                </div>
                <Switch
                  checked={localPreferences.enabled}
                  onCheckedChange={(checked) => updatePreference('enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sons de notificação</Label>
                  <p className="text-xs text-muted-foreground">
                    Reproduzir sons para notificações importantes
                  </p>
                </div>
                <Switch
                  checked={localPreferences.soundEnabled}
                  onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
                  disabled={!localPreferences.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Nível de prioridade</Label>
                <Select
                  value={localPreferences.priority}
                  onValueChange={(value: any) => updatePreference('priority', value)}
                  disabled={!localPreferences.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as notificações</SelectItem>
                    <SelectItem value="high">Apenas alta prioridade</SelectItem>
                    <SelectItem value="critical">Apenas críticas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notificações por Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enviar por email</Label>
                <Switch
                  checked={localPreferences.emailEnabled}
                  onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
                  disabled={!localPreferences.enabled}
                />
              </div>

              {localPreferences.emailEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Endereço de email</Label>
                    <Input
                      type="email"
                      value={localPreferences.emailAddress}
                      onChange={(e) => updatePreference('emailAddress', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequência de envio</Label>
                    <Select
                      value={localPreferences.emailFrequency}
                      onValueChange={(value: any) => updatePreference('emailFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Imediato</SelectItem>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Notificações Push
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações push</Label>
                  <p className="text-xs text-muted-foreground">
                    Receber notificações no navegador
                  </p>
                </div>
                <Switch
                  checked={localPreferences.pushEnabled}
                  onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
                  disabled={!localPreferences.enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categorias de Notificação</CardTitle>
              <CardDescription>
                Escolha quais tipos de notificações você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(categoryLabels).map(([category, label]) => (
                  <div key={category} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <Switch
                      checked={localPreferences.categories[category as keyof typeof categoryLabels]}
                      onCheckedChange={(checked) => 
                        updateCategoryPreference(category as keyof NotificationPreferences['categories'], checked)
                      }
                      disabled={!localPreferences.enabled}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário Silencioso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar horário silencioso</Label>
                  <p className="text-xs text-muted-foreground">
                    Silenciar notificações em horários específicos
                  </p>
                </div>
                <Switch
                  checked={localPreferences.quietHours.enabled}
                  onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
                  disabled={!localPreferences.enabled}
                />
              </div>

              {localPreferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={localPreferences.quietHours.startTime}
                      onChange={(e) => updateQuietHours('startTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={localPreferences.quietHours.endTime}
                      onChange={(e) => updateQuietHours('endTime', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rate Limiting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Controle de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Máximo de notificações por hora</Label>
                <Select
                  value={localPreferences.maxNotificationsPerHour.toString()}
                  onValueChange={(value) => updatePreference('maxNotificationsPerHour', parseInt(value))}
                  disabled={!localPreferences.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 notificações</SelectItem>
                    <SelectItem value="10">10 notificações</SelectItem>
                    <SelectItem value="20">20 notificações</SelectItem>
                    <SelectItem value="50">50 notificações</SelectItem>
                    <SelectItem value="999">Ilimitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Preferências
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};