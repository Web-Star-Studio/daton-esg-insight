import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Users, 
  UserCheck, 
  UserX, 
  HelpCircle,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TrainingParticipant, 
  TrainingProgramStats,
  markAttendance,
  markAllAttendance 
} from '@/services/trainingProgramParticipants';

interface TrainingAttendanceTabProps {
  programId: string;
  participants: TrainingParticipant[];
  stats: TrainingProgramStats | undefined;
  isLoading: boolean;
}

export function TrainingAttendanceTab({
  programId,
  participants,
  stats,
  isLoading,
}: TrainingAttendanceTabProps) {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-program-participants', programId] });
      queryClient.invalidateQueries({ queryKey: ['training-program-stats', programId] });
      toast.success('Presença marcada para todos os participantes!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao marcar presença em lote');
    },
  });

  const handleAttendanceChange = (participantId: string, currentAttended: boolean | null) => {
    // Cycle: null -> true -> false -> null
    let newAttended: boolean | null;
    if (currentAttended === null) {
      newAttended = true;
    } else if (currentAttended === true) {
      newAttended = false;
    } else {
      newAttended = null;
    }
    markAttendanceMutation.mutate({ participantId, attended: newAttended });
  };

  const getAttendanceIcon = (attended: boolean | null) => {
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
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => markAllMutation.mutate({ attended: true })}
          disabled={markAllMutation.isPending || participants.length === 0}
        >
          <CheckCheck className="w-4 h-4 mr-2" />
          Marcar Todos Presentes
        </Button>
        <Button 
          variant="outline" 
          onClick={() => markAllMutation.mutate({ attended: null })}
          disabled={markAllMutation.isPending || participants.length === 0}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar Marcações
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
                    "flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                    participant.attended === true && "bg-green-50/50",
                    participant.attended === false && "bg-red-50/50"
                  )}
                  onClick={() => handleAttendanceChange(participant.id, participant.attended)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      {getAttendanceIcon(participant.attended)}
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
                    <Checkbox
                      checked={participant.attended === true}
                      onCheckedChange={(checked) => {
                        markAttendanceMutation.mutate({ 
                          participantId: participant.id, 
                          attended: checked ? true : null 
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
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
        <span className="ml-auto italic">Clique em um participante para alternar o status</span>
      </div>
    </div>
  );
}