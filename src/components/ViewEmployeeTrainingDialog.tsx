import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, User, Calendar, Award, AlertTriangle, CheckCircle, FileText, 
  Users, Target, Mail, Monitor, CheckSquare, XSquare, Loader2 
} from 'lucide-react';
import { getTrainingStatusColor } from '@/utils/trainingStatusCalculator';
import { getTrainingProgramParticipants, type TrainingParticipant } from '@/services/trainingProgramParticipants';
import { getEfficacyEvaluations, createEfficacyEvaluation, type TrainingEfficacyEvaluation } from '@/services/trainingEfficacyEvaluations';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

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
  const [isEffective, setIsEffective] = useState<boolean | null>(null);
  const [efficacyComments, setEfficacyComments] = useState('');
  const queryClient = useQueryClient();

  const program = training?.training_program;
  const programId = program?.id;
  const hasEfficacyDeadline = !!program?.efficacy_evaluation_deadline;

  // Fetch participants
  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ['training-participants', programId],
    queryFn: () => getTrainingProgramParticipants(programId!),
    enabled: !!programId && isOpen,
  });

  // Fetch efficacy evaluations for this program
  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ['efficacy-evaluations', programId],
    queryFn: () => getEfficacyEvaluations(programId!),
    enabled: !!programId && isOpen && hasEfficacyDeadline,
  });

  // Find evaluation for this specific employee_training
  const existingEvaluation = evaluations.find(
    (e: TrainingEfficacyEvaluation) => e.employee_training_id === training?.id
  );

  // Create efficacy evaluation mutation
  const createEvalMutation = useMutation({
    mutationFn: async () => {
      if (isEffective === null) throw new Error('Selecione se o treinamento foi eficaz ou não');
      return createEfficacyEvaluation({
        company_id: '',
        employee_training_id: training!.id,
        training_program_id: programId!,
        evaluation_date: new Date().toISOString().split('T')[0],
        is_effective: isEffective,
        comments: efficacyComments || undefined,
        status: 'Concluída',
      });
    },
    onSuccess: () => {
      toast.success('Avaliação de eficácia registrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['efficacy-evaluations', programId] });
      queryClient.invalidateQueries({ queryKey: ['employee-trainings'] });
      setIsEffective(null);
      setEfficacyComments('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registrar avaliação de eficácia');
    },
  });

  if (!training) return null;

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
      return { status: 'expired', label: 'VENCIDO', color: 'bg-destructive text-destructive-foreground' };
    }
    if (daysUntilExpiry <= 30) {
      return { status: 'warning', label: `Vence em ${daysUntilExpiry} dias`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
    return { status: 'valid', label: `Válido por ${daysUntilExpiry} dias`, color: 'bg-green-100 text-green-800 border-green-300' };
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


  const participantStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Em Andamento': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Detalhes do Treinamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              {program?.name || 'Treinamento sem nome'}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${getTrainingStatusColor(training.status)} border`}>
                {statusLabelMap[training.status] || training.status}
              </Badge>
              <Badge variant="secondary">{program?.category || 'Sem categoria'}</Badge>
              {program?.is_mandatory && (
                <Badge variant="outline" className="border-red-500 text-red-700">Obrigatório</Badge>
              )}
              {program?.modality && (
                <Badge variant="outline">{program.modality}</Badge>
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
              {program?.responsible_name && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Responsável</p>
                    <p className="font-medium">{program.responsible_name}</p>
                    {program.responsible_email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {program.responsible_email}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {program?.modality && (
                <div className="flex items-start gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Modalidade</p>
                    <p className="font-medium">{program.modality}</p>
                  </div>
                </div>
              )}
            </div>

            {program?.description && (
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Objetivo do Treinamento</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg mt-1">{program.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Informações da Participação */}
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

          {/* Participantes */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes ({participants.length})
            </h4>
            {loadingParticipants ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : participants.length > 0 ? (
              <div className="rounded-md border max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p: TrainingParticipant) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.employee_name}</TableCell>
                        <TableCell>{p.employee_code}</TableCell>
                        <TableCell>{p.department}</TableCell>
                        <TableCell>
                          <Badge className={`${participantStatusColor(p.status)} text-xs`}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum participante encontrado.</p>
            )}
          </div>

          {/* Avaliação de Eficácia */}
          {hasEfficacyDeadline && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Avaliação de Eficácia
              </h4>
              <p className="text-xs text-muted-foreground">
                Prazo: {formatDate(program.efficacy_evaluation_deadline)}
              </p>

              {loadingEvaluations ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : existingEvaluation ? (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {existingEvaluation.is_effective ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckSquare className="h-3 w-3 mr-1" /> Eficaz
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <XSquare className="h-3 w-3 mr-1" /> Não Eficaz
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Avaliado em {formatDate(existingEvaluation.evaluation_date)}
                    </span>
                  </div>
                  {existingEvaluation.score !== null && existingEvaluation.score !== undefined && (
                    <p className="text-sm"><strong>Nota:</strong> {existingEvaluation.score}</p>
                  )}
                  {existingEvaluation.comments && (
                    <p className="text-sm"><strong>Comentários:</strong> {existingEvaluation.comments}</p>
                  )}
                </div>
              ) : (
                <div className="p-4 border rounded-lg space-y-4">
                  <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada. Registre abaixo:</p>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">O treinamento foi eficaz?</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isEffective === true ? 'default' : 'outline'}
                        onClick={() => setIsEffective(true)}
                      >
                        <CheckSquare className="h-4 w-4 mr-1" /> Sim
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isEffective === false ? 'destructive' : 'outline'}
                        onClick={() => setIsEffective(false)}
                      >
                        <XSquare className="h-4 w-4 mr-1" /> Não
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Comentários / Observações</Label>
                    <Textarea
                      value={efficacyComments}
                      onChange={(e) => setEfficacyComments(e.target.value)}
                      placeholder="Descreva os resultados observados..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => createEvalMutation.mutate()}
                    disabled={isEffective === null || createEvalMutation.isPending}
                    size="sm"
                  >
                    {createEvalMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando...</>
                    ) : (
                      'Registrar Avaliação'
                    )}
                  </Button>
                </div>
              )}
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
