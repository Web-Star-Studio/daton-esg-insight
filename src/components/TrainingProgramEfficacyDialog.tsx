import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, ClipboardCheck, Loader2, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getTrainingProgramParticipants } from "@/services/trainingProgramParticipants";
import {
  getEfficacyEvaluations,
  type TrainingEfficacyEvaluation,
} from "@/services/trainingEfficacyEvaluations";
import { TrainingEfficacyEvaluationDialog } from "./TrainingEfficacyEvaluationDialog";

interface TrainingProgramEfficacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingProgramId: string | null;
  trainingProgramName: string;
}

// Modal disparado pela tela /avaliacao-eficacia. Lista os participantes do
// programa e abre o TrainingEfficacyEvaluationDialog (avaliação individual)
// pra cada um. A avaliação é granular por participante (employee_training_id).
export function TrainingProgramEfficacyDialog({
  open,
  onOpenChange,
  trainingProgramId,
  trainingProgramName,
}: TrainingProgramEfficacyDialogProps) {
  const [evaluatingTraining, setEvaluatingTraining] = useState<{
    employeeTrainingId: string;
    employeeName: string;
  } | null>(null);

  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ["program-efficacy-participants", trainingProgramId],
    queryFn: () => getTrainingProgramParticipants(trainingProgramId!),
    enabled: !!trainingProgramId && open,
  });

  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ["program-efficacy-evaluations", trainingProgramId],
    queryFn: () => getEfficacyEvaluations(trainingProgramId!),
    enabled: !!trainingProgramId && open,
  });

  const evalByEmployeeTraining = new Map<string, TrainingEfficacyEvaluation>();
  for (const ev of evaluations) {
    if (ev.employee_training_id && ev.status === "Concluída") {
      evalByEmployeeTraining.set(ev.employee_training_id, ev);
    }
  }

  const isLoading = loadingParticipants || loadingEvaluations;
  const evaluatedCount = participants.filter(p => evalByEmployeeTraining.has(p.id)).length;
  const totalCount = participants.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Avaliação de Eficácia
            </DialogTitle>
            <DialogDescription>
              {trainingProgramName}
              {totalCount > 0 && (
                <>
                  <br />
                  <span className="text-xs">
                    Progresso:{" "}
                    <span className="font-medium text-foreground">
                      {evaluatedCount} de {totalCount} colaboradores avaliados
                    </span>
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum participante encontrado neste treinamento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Conclusão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => {
                  const evaluation = evalByEmployeeTraining.get(p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.employee_name}</TableCell>
                      <TableCell>{p.department || "—"}</TableCell>
                      <TableCell>
                        {p.completion_date
                          ? format(new Date(p.completion_date), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {evaluation ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Avaliado
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={evaluation ? "ghost" : "default"}
                          disabled={!!evaluation}
                          onClick={() =>
                            setEvaluatingTraining({
                              employeeTrainingId: p.id,
                              employeeName: p.employee_name,
                            })
                          }
                        >
                          {evaluation ? "Avaliado" : "Avaliar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {trainingProgramId && evaluatingTraining && (
        <TrainingEfficacyEvaluationDialog
          open={!!evaluatingTraining}
          onOpenChange={(open) => {
            if (!open) setEvaluatingTraining(null);
          }}
          trainingProgramId={trainingProgramId}
          employeeTrainingId={evaluatingTraining.employeeTrainingId}
          trainingName={trainingProgramName}
          employeeName={evaluatingTraining.employeeName}
        />
      )}
    </>
  );
}
