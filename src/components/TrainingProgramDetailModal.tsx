import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BookOpen,
  Clock,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ClipboardList,
  Building2,
  Mail,
  Bell,
  Edit,
  UserPlus,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrainingProgram } from '@/services/trainingPrograms';
import { 
  getTrainingProgramParticipants, 
  getTrainingProgramStats,
  TrainingParticipant 
} from '@/services/trainingProgramParticipants';

interface TrainingProgramDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: TrainingProgram | null;
  onEdit: () => void;
  onAddParticipant: () => void;
}

export function TrainingProgramDetailModal({
  open,
  onOpenChange,
  program,
  onEdit,
  onAddParticipant,
}: TrainingProgramDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch participants
  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['training-program-participants', program?.id],
    queryFn: () => getTrainingProgramParticipants(program!.id),
    enabled: !!program?.id && open,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['training-program-stats', program?.id],
    queryFn: () => getTrainingProgramStats(program!.id),
    enabled: !!program?.id && open,
  });

  if (!program) return null;

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.employee_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-800';
      case 'Inativo': return 'bg-gray-100 text-gray-800';
      case 'Planejado': return 'bg-blue-100 text-blue-800';
      case 'Suspenso': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Segurança': return 'bg-red-100 text-red-800';
      case 'Desenvolvimento': return 'bg-purple-100 text-purple-800';
      case 'Técnico': return 'bg-blue-100 text-blue-800';
      case 'Compliance': return 'bg-yellow-100 text-yellow-800';
      case 'Liderança': return 'bg-green-100 text-green-800';
      case 'Qualidade': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800';
      case 'Inscrito': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado': return 'bg-gray-100 text-gray-800';
      case 'Reprovado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const participantColumns = [
    {
      accessorKey: 'employee_name',
      header: 'Nome',
      cell: ({ row }: { row: { original: TrainingParticipant } }) => (
        <div>
          <p className="font-medium">{row.original.employee_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.employee_code}</p>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Departamento',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: TrainingParticipant } }) => (
        <Badge className={getParticipantStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'completion_date',
      header: 'Conclusão',
      cell: ({ row }: { row: { original: TrainingParticipant } }) => (
        <span>
          {row.original.completion_date
            ? format(new Date(row.original.completion_date), 'dd/MM/yyyy', { locale: ptBR })
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Nota',
      cell: ({ row }: { row: { original: TrainingParticipant } }) => (
        <span className={cn(
          "font-medium",
          row.original.score && row.original.score >= 7 ? "text-green-600" : 
          row.original.score ? "text-red-600" : "text-muted-foreground"
        )}>
          {row.original.score !== null ? row.original.score.toFixed(1) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'trainer',
      header: 'Instrutor',
      cell: ({ row }: { row: { original: TrainingParticipant } }) => (
        <span>{row.original.trainer || '-'}</span>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Detalhes do Programa de Treinamento
          </DialogTitle>
        </DialogHeader>

        {/* Header Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">{program.name}</h2>
              {program.description && (
                <p className="text-muted-foreground mt-1">{program.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(program.status || 'Ativo')}>
              {program.status || 'Ativo'}
            </Badge>
            {program.is_mandatory && (
              <Badge variant="destructive">Obrigatório</Badge>
            )}
            {program.category && (
              <Badge className={getCategoryColor(program.category)}>
                {program.category}
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="participants">Participantes ({stats?.total || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-medium">{program.duration_hours || 0} horas</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Validade</p>
                  <p className="font-medium">
                    {program.valid_for_months ? `${program.valid_for_months} meses` : 'Sem validade'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data de Início</p>
                  <p className="font-medium">
                    {program.start_date 
                      ? format(new Date(program.start_date), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Não definida'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data de Término</p>
                  <p className="font-medium">
                    {program.end_date 
                      ? format(new Date(program.end_date), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Não definida'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Agendada</p>
                  <p className="font-medium">
                    {program.scheduled_date 
                      ? format(new Date(program.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Não agendado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avaliação de Eficácia</p>
                  <p className="font-medium">
                    {program.efficacy_evaluation_deadline 
                      ? format(new Date(program.efficacy_evaluation_deadline), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Não definida'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Responsible */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{program.responsible_name || 'Não definido'}</p>
                    {program.responsible_email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {program.responsible_email}
                      </div>
                    )}
                  </div>
                </div>
                {program.notify_responsible_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="w-4 h-4 text-green-600" />
                    <span>Notificação por e-mail ativada</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {format(new Date(program.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última atualização</p>
                  <p className="font-medium">
                    {format(new Date(program.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 mt-4">
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
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                      <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Em Andamento</p>
                      <p className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</p>
                    </div>
                    <PlayCircle className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Inscritos</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats?.enrolled || 0}</p>
                    </div>
                    <ClipboardList className="w-8 h-8 text-yellow-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Taxa de Conclusão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-secondary rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${stats?.completionRate || 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{stats?.completionRate || 0}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Média de Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-secondary rounded-full h-3">
                        <div 
                          className={cn(
                            "h-3 rounded-full transition-all",
                            (stats?.averageScore || 0) >= 7 ? "bg-green-500" : "bg-red-500"
                          )}
                          style={{ width: `${((stats?.averageScore || 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn(
                      "text-2xl font-bold",
                      (stats?.averageScore || 0) >= 7 ? "text-green-600" : "text-red-600"
                    )}>
                      {stats?.averageScore || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Concluídos</p>
                    <p className="text-lg font-bold text-green-600">{stats?.completed || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Em Andamento</p>
                    <p className="text-lg font-bold text-blue-600">{stats?.inProgress || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Inscritos</p>
                    <p className="text-lg font-bold text-yellow-600">{stats?.enrolled || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Reprovados</p>
                    <p className="text-lg font-bold text-red-600">{stats?.failed || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Cancelados</p>
                    <p className="text-lg font-bold text-gray-600">{stats?.cancelled || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar participante..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Inscrito">Inscrito</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onAddParticipant}>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Participants Table */}
            {isLoadingParticipants ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando participantes...</p>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum participante encontrado com os filtros aplicados'
                    : 'Nenhum participante registrado neste programa'}
                </p>
                <Button variant="outline" className="mt-4" onClick={onAddParticipant}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Participante
                </Button>
              </div>
            ) : (
              <DataTable columns={participantColumns} data={filteredParticipants} />
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Programa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
