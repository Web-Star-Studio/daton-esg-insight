import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Clock, User, Calendar, Award, AlertTriangle, CheckCircle, FileText,
  Users, Target, Mail, Monitor, CheckSquare, XSquare, Loader2, Pencil, ClipboardCheck
} from 'lucide-react';
import { getTrainingStatusColor } from '@/utils/trainingStatusCalculator';
import { getTrainingProgramParticipants, type TrainingParticipant } from '@/services/trainingProgramParticipants';
import { getEfficacyEvaluations, type TrainingEfficacyEvaluation } from '@/services/trainingEfficacyEvaluations';
import {
  getEfficacyCategory,
  EFFICACY_CATEGORY_LABEL,
  EFFICACY_CATEGORY_BADGE,
} from '@/utils/trainingEfficacyCategory';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { EmployeeEfficacyEvaluationDialog } from './EmployeeEfficacyEvaluationDialog';

interface ViewEmployeeTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  training: any;
  employeeName?: string;
}

export function ViewEmployeeTrainingDialog({
  isOpen,
  onClose,
  training,
  employeeName,
}: ViewEmployeeTrainingDialogProps) {
  const program = training?.training_program;
  const programId = program?.id;
  const hasEfficacyDeadline = !!program?.efficacy_evaluation_deadline;
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);

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
                (() => {
                  const category = getEfficacyCategory(existingEvaluation);
                  return (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {category && (
                            <Badge className={EFFICACY_CATEGORY_BADGE[category]}>
                              {category === 'not_effective' ? (
                                <XSquare className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckSquare className="h-3 w-3 mr-1" />
                              )}
                              {EFFICACY_CATEGORY_LABEL[category]}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEvaluationDialogOpen(true)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                      {existingEvaluation.evaluator_name && (
                        <p className="text-sm"><strong>Avaliador:</strong> {existingEvaluation.evaluator_name}</p>
                      )}
                      {existingEvaluation.comments && (
                        <p className="text-sm"><strong>Comentários:</strong> {existingEvaluation.comments}</p>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Avaliação ainda não registrada</p>
                    <p className="text-muted-foreground text-xs">Registre a avaliação de eficácia deste colaborador.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsEvaluationDialogOpen(true)}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    Avaliar
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

      {hasEfficacyDeadline && programId && training?.id && (
        <EmployeeEfficacyEvaluationDialog
          open={isEvaluationDialogOpen}
          onOpenChange={setIsEvaluationDialogOpen}
          employeeName={employeeName || training?.employee_name || 'Colaborador'}
          employeeId={training?.employee_id}
          employeeTrainingId={training.id}
          trainingProgramId={programId}
          trainingProgramName={program?.name}
          existingEvaluation={existingEvaluation || null}
        />
      )}
    </Dialog>
  );
}
