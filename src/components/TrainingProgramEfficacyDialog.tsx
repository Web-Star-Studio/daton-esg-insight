import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, Users } from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getTrainingProgramParticipants } from "@/services/trainingProgramParticipants";
import {
  getEfficacyEvaluations,
  type TrainingEfficacyEvaluation,
} from "@/services/trainingEfficacyEvaluations";
import {
  getEfficacyCategory,
  EFFICACY_CATEGORY_LABEL,
  EFFICACY_CATEGORY_BADGE,
} from "@/utils/trainingEfficacyCategory";

interface TrainingProgramEfficacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingProgramId: string | null;
  trainingProgramName: string;
}

// Modal read-only disparado pela tela /avaliacao-eficacia (botão "Ver" do
// programa Avaliado). Lista todos os participantes com a classificação e o
// comentário registrados. O fluxo de avaliar pendentes vive no
// TrainingProgramEvaluationFlow (botão "Avaliar" na lista de programas).
export function TrainingProgramEfficacyDialog({
  open,
  onOpenChange,
  trainingProgramId,
  trainingProgramName,
}: TrainingProgramEfficacyDialogProps) {
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
            <TooltipProvider delayDuration={200}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Comentário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => {
                    const evaluation = evalByEmployeeTraining.get(p.id);
                    const category = getEfficacyCategory(evaluation);
                    const comment = evaluation?.comments?.trim();
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.employee_name}</TableCell>
                        <TableCell>{p.department || "—"}</TableCell>
                        <TableCell>
                          {category ? (
                            <Badge className={EFFICACY_CATEGORY_BADGE[category]}>
                              {EFFICACY_CATEGORY_LABEL[category]}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {comment ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                                  {comment}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md whitespace-pre-wrap">
                                {comment}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
