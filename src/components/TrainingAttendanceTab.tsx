import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Users, 
  UserCheck, 
  UserX, 
  HelpCircle,
  CheckCheck,
  XCircle,
  RotateCcw,
  FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TrainingParticipant, 
  TrainingProgramStats,
  markAttendance,
  markAllAttendance 
} from '@/services/trainingProgramParticipants';
import { generateAttendanceListPDF } from '@/utils/generateAttendanceListPDF';

interface TrainingAttendanceTabProps {
  programId: string;
  programName: string;
  programDate?: string;
  instructor?: string;
  participants: TrainingParticipant[];
  stats: TrainingProgramStats | undefined;
  isLoading: boolean;
}

export function TrainingAttendanceTab({
  programId,
  programName,
  programDate,
  instructor,
  participants,
  stats,
  isLoading,
}: TrainingAttendanceTabProps) {
  const queryClient = useQueryClient();

  const handleGeneratePDF = () => {
    try {
      if (participants.length === 0) {
        toast.error('Não há participantes para gerar a lista de presença.');
        return;
      }
      
      generateAttendanceListPDF({
        programName,
        programDate,
        instructor,
        participants,
      });
      toast.success('Lista de presença gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar a lista de presença. Tente novamente.');
    }
  };

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ participantId, attended }: { participantId: string; attended: boolean | null }) => {
      await markAttendance(participantId, attended);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-program-participants', programId] });
      queryClient.invalidateQueries({ queryKey: ['training-program-stats', programId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao marcar presença');
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async ({ attended }: { attended: boolean | null }) => {
      const ids = participants.map(p => p.id);
      await markAllAttendance(ids, attended);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training-program-participants', programId] });
      queryClient.invalidateQueries({ queryKey: ['training-program-stats', programId] });
      if (variables.attended === true) {
        toast.success('Todos marcados como presentes!');
      } else if (variables.attended === false) {
        toast.success('Todos marcados como ausentes!');
      } else {
        toast.success('Marcações limpas!');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao marcar presença em lote');
    },
  });

  const handleMarkPresent = (participantId: string, currentAttended: boolean | null) => {
    // Se já está presente, limpa. Se não, marca presente.
    const newValue = currentAttended === true ? null : true;
    markAttendanceMutation.mutate({ participantId, attended: newValue });
  };

  const handleMarkAbsent = (participantId: string, currentAttended: boolean | null) => {
    // Se já está ausente, limpa. Se não, marca ausente.
    const newValue = currentAttended === false ? null : false;
    markAttendanceMutation.mutate({ participantId, attended: newValue });
  };

  const getStatusIcon = (attended: boolean | null) => {
    if (attended === true) return <UserCheck className="w-5 h-5 text-green-600" />;
    if (attended === false) return <UserX className="w-5 h-5 text-red-600" />;
    return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
  };

  const getAttendanceBadge = (attended: boolean | null) => {
    if (attended === true) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Presente</Badge>;
    }
    if (attended === false) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ausente</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">Não marcado</Badge>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Presentes</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.present || 0}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ausentes</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.absent || 0}</p>
                </div>
                <UserX className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Não Marcados</p>
                  <p className="text-2xl font-bold text-muted-foreground">{stats?.notMarked || 0}</p>
                </div>
                <HelpCircle className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={() => markAllMutation.mutate({ attended: true })}
            disabled={markAllMutation.isPending || participants.length === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2 text-green-600" />
            Marcar Todos Presentes
          </Button>
          <Button 
            variant="outline" 
            className="border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => markAllMutation.mutate({ attended: false })}
            disabled={markAllMutation.isPending || participants.length === 0}
          >
            <XCircle className="w-4 h-4 mr-2 text-red-600" />
            Marcar Todos Ausentes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => markAllMutation.mutate({ attended: null })}
            disabled={markAllMutation.isPending || participants.length === 0}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar Marcações
          </Button>
          <Button 
            variant="default"
            onClick={handleGeneratePDF}
            disabled={participants.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Gerar Lista de Presença (PDF)
          </Button>
        </div>

        {/* Participants List */}
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum participante registrado</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Lista de Presença</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={cn(
                      "flex items-center justify-between p-4 transition-colors",
                      participant.attended === true && "bg-green-50/50",
                      participant.attended === false && "bg-red-50/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        {getStatusIcon(participant.attended)}
                      </div>
                      <div>
                        <p className="font-medium">{participant.employee_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {participant.employee_code} • {participant.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getAttendanceBadge(participant.attended)}
                      
                      {/* Botões explícitos de Presente/Ausente */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={participant.attended === true ? "default" : "ghost"}
                              size="icon"
                              className={cn(
                                "h-9 w-9 transition-all",
                                participant.attended === true 
                                  ? "bg-green-600 hover:bg-green-700 text-white" 
                                  : "hover:bg-green-100 hover:text-green-700"
                              )}
                              onClick={() => handleMarkPresent(participant.id, participant.attended)}
                              disabled={markAttendanceMutation.isPending}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{participant.attended === true ? 'Remover presença' : 'Marcar como presente'}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={participant.attended === false ? "default" : "ghost"}
                              size="icon"
                              className={cn(
                                "h-9 w-9 transition-all",
                                participant.attended === false 
                                  ? "bg-red-600 hover:bg-red-700 text-white" 
                                  : "hover:bg-red-100 hover:text-red-700"
                              )}
                              onClick={() => handleMarkAbsent(participant.id, participant.attended)}
                              disabled={markAttendanceMutation.isPending}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{participant.attended === false ? 'Remover ausência' : 'Marcar como ausente'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Presente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Ausente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span>Não marcado</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
