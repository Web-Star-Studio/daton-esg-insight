import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Calendar, Award, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { getTrainingStatusColor } from '@/utils/trainingStatusCalculator';

interface ViewEmployeeTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  training: any;
}

export function ViewEmployeeTrainingDialog({
  isOpen,
  onClose,
  training,
}: ViewEmployeeTrainingDialogProps) {
  if (!training) return null;

  const program = training.training_program;
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const getExpiryInfo = () => {
    if (!training.expiration_date) return null;
    
    const daysUntilExpiry = differenceInDays(parseISO(training.expiration_date), new Date());
    
    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        label: 'VENCIDO',
        color: 'bg-destructive text-destructive-foreground'
      };
    }
    
    if (daysUntilExpiry <= 30) {
      return {
        status: 'warning',
        label: `Vence em ${daysUntilExpiry} dias`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    }
    
    return {
      status: 'valid',
      label: `Válido por ${daysUntilExpiry} dias`,
      color: 'bg-green-100 text-green-800 border-green-300'
    };
  };

  const expiryInfo = getExpiryInfo();

  const statusLabelMap: Record<string, string> = {
    'Planejado': '🔵 Planejado',
    'Em Andamento': '🟡 Em Andamento',
    'Pendente Avaliação': '🟣 Pendente Avaliação',
    'Concluído': '🟢 Concluído',
    'Cancelado': '🔴 Cancelado',
    'Pendente': '⚪ Pendente',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Detalhes do Treinamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header com nome e status */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              {program?.name || 'Treinamento sem nome'}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${getTrainingStatusColor(training.status)} border`}>
                {statusLabelMap[training.status] || training.status}
              </Badge>
              <Badge variant="secondary">
                {program?.category || 'Sem categoria'}
              </Badge>
              {program?.is_mandatory && (
                <Badge variant="outline" className="border-red-500 text-red-700">
                  Obrigatório
                </Badge>
              )}
              {expiryInfo && (
                <Badge className={expiryInfo.color}>
                  {expiryInfo.status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {expiryInfo.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Informações do Programa */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informações do Programa
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {program?.duration_hours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Carga Horária</p>
                    <p className="font-medium">{program.duration_hours} horas</p>
                  </div>
                </div>
              )}
              
              {program?.valid_for_months && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="font-medium">{program.valid_for_months} meses</p>
                  </div>
                </div>
              )}

              {program?.start_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Início</p>
                    <p className="font-medium">{formatDate(program.start_date)}</p>
                  </div>
                </div>
              )}

              {program?.end_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Término</p>
                    <p className="font-medium">{formatDate(program.end_date)}</p>
                  </div>
                </div>
              )}
            </div>

            {program?.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{program.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Informações do Participante */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informações da Participação
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {training.completion_date && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Conclusão</p>
                    <p className="font-medium">{formatDate(training.completion_date)}</p>
                  </div>
                </div>
              )}

              {training.expiration_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Validade</p>
                    <p className="font-medium">{formatDate(training.expiration_date)}</p>
                  </div>
                </div>
              )}

              {training.score !== null && training.score !== undefined && (
                <div className="flex items-start gap-3">
                  <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nota Obtida</p>
                    <p className="font-medium text-lg">{training.score}</p>
                  </div>
                </div>
              )}

              {training.trainer && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Instrutor/Treinador</p>
                    <p className="font-medium">{training.trainer}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {training.notes && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Observações
              </h4>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{training.notes}</p>
            </div>
          )}

          {/* Metadados */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Registrado em: {formatDate(training.created_at)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
