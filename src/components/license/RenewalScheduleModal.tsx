import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle2, Clock, Users, Bell } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateRenewalSuggestion, scheduleRenewal } from '@/services/licenseRenewal';
import { RenewalTimeline } from './RenewalTimeline';
import type { LicenseDetail } from '@/services/licenses';
import type { RenewalFormData, RenewalSuggestion } from '@/types/licenseRenewal';

interface RenewalScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: LicenseDetail;
  onSuccess: () => void;
}

export const RenewalScheduleModal: React.FC<RenewalScheduleModalProps> = ({
  isOpen,
  onClose,
  license,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [suggestion, setSuggestion] = useState<RenewalSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<RenewalFormData>({
    scheduled_start_date: new Date(),
    protocol_deadline: addDays(new Date(), 30),
    expected_completion_date: undefined,
    assigned_to_user_id: undefined,
    notification_days: [7, 15, 30],
    notification_channels: ['in_app'],
    create_tasks: true,
  });

  useEffect(() => {
    if (isOpen && license) {
      calculateRenewalSuggestion(license.expiration_date).then(setSuggestion);
    }
  }, [isOpen, license]);

  useEffect(() => {
    if (suggestion) {
      setFormData({
        ...formData,
        scheduled_start_date: suggestion.ideal_start_date,
        protocol_deadline: suggestion.protocol_deadline,
        expected_completion_date: suggestion.estimated_completion,
      });
    }
  }, [suggestion]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await scheduleRenewal(license.id, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling renewal:', error);
    } finally {
      setLoading(false);
    }
  };

  const urgencyConfig = {
    critical: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      icon: AlertTriangle,
      message: 'Atenção! Prazo crítico para renovação',
    },
    high: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      icon: Clock,
      message: 'Recomendado iniciar processo imediatamente',
    },
    medium: {
      color: 'text-accent',
      bg: 'bg-accent/10',
      icon: Clock,
      message: 'Prazo adequado para planejamento',
    },
    low: {
      color: 'text-success',
      bg: 'bg-success/10',
      icon: CheckCircle2,
      message: 'Tempo suficiente para renovação',
    },
  };

  const urgency = suggestion ? urgencyConfig[suggestion.urgency_level] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agendar Renovação da Licença
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Urgency Alert */}
          {suggestion && urgency && (
            <div className={cn('flex items-center gap-3 p-4 rounded-lg', urgency.bg)}>
              <urgency.icon className={cn('h-5 w-5', urgency.color)} />
              <div className="flex-1">
                <p className={cn('font-medium', urgency.color)}>{urgency.message}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {suggestion.days_until_expiration} dias até o vencimento
                </p>
              </div>
              <Badge variant={suggestion.urgency_level === 'critical' ? 'destructive' : 'secondary'}>
                {suggestion.urgency_level === 'critical' ? 'Crítico' : 
                 suggestion.urgency_level === 'high' ? 'Alto' :
                 suggestion.urgency_level === 'medium' ? 'Médio' : 'Baixo'}
              </Badge>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    step >= s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      'w-16 h-0.5',
                      step > s ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Step 1: Review */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Passo 1: Revisão de Dados</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Licença</Label>
                  <p className="font-medium">{license.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{license.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vencimento</Label>
                  <p className="font-medium">
                    {format(new Date(license.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Órgão Emissor</Label>
                  <p className="font-medium">{license.issuing_body}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Passo 2: Configuração de Prazos</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Data de Início do Processo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.scheduled_start_date, 'dd/MM/yyyy', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={formData.scheduled_start_date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, scheduled_start_date: date })
                        }
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Prazo Limite de Protocolo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.protocol_deadline, 'dd/MM/yyyy', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={formData.protocol_deadline}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, protocol_deadline: date })
                        }
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <RenewalTimeline
                  startDate={formData.scheduled_start_date}
                  protocolDeadline={formData.protocol_deadline}
                  expirationDate={new Date(license.expiration_date)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Tasks & Assignments */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Passo 3: Tarefas e Responsáveis</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-tasks"
                  checked={formData.create_tasks}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, create_tasks: checked as boolean })
                  }
                />
                <Label htmlFor="create-tasks" className="cursor-pointer">
                  Criar tarefas automaticamente
                </Label>
              </div>

              {formData.create_tasks && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Tarefas que serão criadas:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Separar documentação para renovação</li>
                    <li>• Protocolar pedido de renovação</li>
                    <li>• Acompanhar processo de renovação</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Notifications */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Passo 4: Notificações</h3>
              
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Lembretes (dias antes do prazo)
                </Label>
                <div className="flex gap-2">
                  {[7, 15, 30, 60].map((days) => (
                    <Badge
                      key={days}
                      variant={formData.notification_days.includes(days) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = formData.notification_days;
                        setFormData({
                          ...formData,
                          notification_days: current.includes(days)
                            ? current.filter((d) => d !== days)
                            : [...current, days].sort((a, b) => a - b),
                        });
                      }}
                    >
                      {days} dias
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-success/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success mb-2" />
                <p className="text-sm font-medium">Configuração Completa!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Revise as informações e confirme o agendamento
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)}>Próximo</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Agendando...' : 'Agendar Renovação'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
