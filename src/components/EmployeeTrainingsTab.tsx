import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  GraduationCap, 
  Plus, 
  Clock, 
  Award, 
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AddEmployeeTrainingDialog } from './AddEmployeeTrainingDialog';
import { EditEmployeeTrainingDialog } from './EditEmployeeTrainingDialog';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeTrainingsTabProps {
  employeeId: string;
  employeeName: string;
}

export function EmployeeTrainingsTab({ employeeId, employeeName }: EmployeeTrainingsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch employee trainings
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['employee-trainings', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_trainings')
        .select(`
          *,
          training_program:training_programs(
            id,
            name,
            category,
            duration_hours,
            is_mandatory,
            valid_for_months
          )
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Delete training mutation
  const deleteTrainingMutation = useMutation({
    mutationFn: async (trainingId: string) => {
      const { error } = await supabase
        .from('employee_trainings')
        .delete()
        .eq('id', trainingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-trainings', employeeId] });
      toast.success('Treinamento excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedTraining(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir treinamento');
    },
  });

  // Helper functions
  const handleEdit = (training: any) => {
    setSelectedTraining(training);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = (training: any) => {
    setSelectedTraining(training);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTraining) {
      deleteTrainingMutation.mutate(selectedTraining.id);
    }
  };

  // Calculate metrics
  const totalHours = trainings.reduce((sum, t: any) => 
    sum + (t.training_program?.duration_hours || 0), 0
  );
  
  const completedCount = trainings.filter((t: any) => 
    t.status === 'Concluído'
  ).length;

  const averageScore = trainings.filter((t: any) => 
    t.status === 'Concluído' && t.score
  ).reduce((sum, t: any, _, arr) => {
    return sum + (t.score || 0) / arr.length;
  }, 0);

  const expiringCertificates = trainings.filter((t: any) => {
    if (!t.expiration_date) return false;
    const daysUntilExpiry = differenceInDays(parseISO(t.expiration_date), new Date());
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }).length;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      'Concluído': { variant: 'default', label: '🟢 Concluído' },
      'Em Andamento': { variant: 'secondary', label: '🟡 Em Andamento' },
      'Pendente': { variant: 'outline', label: '⚪ Pendente' },
      'Cancelado': { variant: 'destructive', label: '🔴 Cancelado' },
    };
    const config = statusMap[status] || statusMap['Pendente'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getExpiryStatus = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    
    const daysUntilExpiry = differenceInDays(parseISO(expirationDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCIDO
        </Badge>
      );
    }
    
    if (daysUntilExpiry <= 30) {
      return (
        <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Vence em {daysUntilExpiry} dias
        </Badge>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalHours}h</p>
                  <p className="text-sm text-muted-foreground">Total de Horas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {averageScore > 0 ? averageScore.toFixed(1) : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Nota Média</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{expiringCertificates}</p>
                  <p className="text-sm text-muted-foreground">A Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trainings List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Treinamentos
              </CardTitle>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Treinamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {trainings.length > 0 ? (
              <div className="space-y-4">
                {trainings.map((training: any) => (
                  <div
                    key={training.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center">
                          {training.training_program?.name || 'Treinamento sem nome'}
                          {getExpiryStatus(training.expiration_date)}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                          <Badge variant="secondary">
                            {training.training_program?.category || 'Sem categoria'}
                          </Badge>
                          {training.training_program?.duration_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {training.training_program.duration_hours}h
                            </span>
                          )}
                          {training.training_program?.is_mandatory && (
                            <Badge variant="outline" className="border-red-500 text-red-700">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(training.status)}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(training)}
                          title="Editar treinamento"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteConfirm(training)}
                          title="Excluir treinamento"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t text-sm">
                      {training.completion_date && (
                        <div>
                          <p className="text-muted-foreground">Concluído em</p>
                          <p className="font-medium">
                            {format(parseISO(training.completion_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                      {training.score && (
                        <div>
                          <p className="text-muted-foreground">Nota</p>
                          <p className="font-medium">{training.score}</p>
                        </div>
                      )}
                      {training.instructor && (
                        <div>
                          <p className="text-muted-foreground">Instrutor</p>
                          <p className="font-medium">{training.instructor}</p>
                        </div>
                      )}
                      {training.expiration_date && (
                        <div>
                          <p className="text-muted-foreground">Validade</p>
                          <p className="font-medium">
                            {format(parseISO(training.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>

                    {training.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Observações:</strong> {training.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum treinamento registrado</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione os treinamentos de {employeeName}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Treinamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddEmployeeTrainingDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
      />

      <EditEmployeeTrainingDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedTraining(null);
        }}
        employeeId={employeeId}
        employeeName={employeeName}
        training={selectedTraining}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o treinamento "{selectedTraining?.training_program?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTrainingMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
