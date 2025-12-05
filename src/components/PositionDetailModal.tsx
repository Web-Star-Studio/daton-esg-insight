import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Briefcase,
  Building2,
  GraduationCap,
  Clock,
  DollarSign,
  Users,
  Edit,
  Trash2,
  CheckCircle2,
  ChevronUp,
  ListChecks
} from 'lucide-react';
import { 
  deletePosition,
  type Position, 
  type Department 
} from '@/services/organizationalStructure';
import { PositionManager } from '@/components/PositionManager';

interface PositionDetailModalProps {
  position: Position | null;
  positions: Position[];
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function PositionDetailModal({
  position,
  positions,
  departments,
  isOpen,
  onClose,
  onRefresh
}: PositionDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset edit mode when modal opens or position changes
  useEffect(() => {
    if (isOpen) {
      setIsEditMode(false);
    }
  }, [isOpen, position?.id]);

  if (!position) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'trainee': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'junior': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pleno': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'senior': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'gerente': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'diretor': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este cargo? Esta ação não pode ser desfeita.')) return;
    
    try {
      setIsDeleting(true);
      await deletePosition(position.id);
      toast.success('Cargo excluído com sucesso');
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Erro ao excluir cargo');
    } finally {
      setIsDeleting(false);
    }
  };

  const reportsToPosition = position.reports_to_position_id 
    ? positions.find(p => p.id === position.reports_to_position_id)
    : null;

  const subordinatePositions = positions.filter(p => p.reports_to_position_id === position.id);

  if (isEditMode) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cargo</DialogTitle>
          </DialogHeader>
          <PositionManager 
            initialEditPosition={position}
            onRefresh={() => {
              onRefresh();
              setIsEditMode(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{position.title}</DialogTitle>
                {position.department?.name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3" />
                    {position.department.name}
                  </p>
                )}
              </div>
            </div>
            {position.level && (
              <Badge className={getLevelColor(position.level)}>
                {position.level}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Descrição */}
          {position.description && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição do Cargo</h4>
              <p className="text-sm">{position.description}</p>
            </div>
          )}

          <Separator />

          {/* Requisitos do Cargo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {position.required_education_level && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <GraduationCap className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Escolaridade Exigida</p>
                  <p className="text-sm text-muted-foreground">{position.required_education_level}</p>
                </div>
              </div>
            )}

            {position.required_experience_years !== null && position.required_experience_years !== undefined && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tempo de Experiência</p>
                  <p className="text-sm text-muted-foreground">
                    {position.required_experience_years} {position.required_experience_years === 1 ? 'ano' : 'anos'}
                  </p>
                </div>
              </div>
            )}

            {(position.salary_range_min || position.salary_range_max) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Faixa Salarial</p>
                  <p className="text-sm text-muted-foreground">
                    {position.salary_range_min && position.salary_range_max
                      ? `${formatCurrency(position.salary_range_min)} - ${formatCurrency(position.salary_range_max)}`
                      : position.salary_range_min
                        ? `A partir de ${formatCurrency(position.salary_range_min)}`
                        : `Até ${formatCurrency(position.salary_range_max!)}`
                    }
                  </p>
                </div>
              </div>
            )}

            {reportsToPosition && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <ChevronUp className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Reporta para</p>
                  <p className="text-sm text-muted-foreground">{reportsToPosition.title}</p>
                </div>
              </div>
            )}
          </div>

          {/* Requisitos Técnicos */}
          {position.requirements && position.requirements.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Requisitos / Conhecimentos Técnicos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {position.requirements.map((req, index) => (
                    <Badge key={index} variant="secondary">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Responsabilidades / Atividades */}
          {position.responsibilities && position.responsibilities.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Atividades / Responsabilidades do Cargo
                </h4>
                <ul className="space-y-2">
                  {position.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Subordinados */}
          {subordinatePositions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Cargos Subordinados ({subordinatePositions.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {subordinatePositions.map((pos) => (
                    <Badge key={pos.id} variant="outline">
                      {pos.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsEditMode(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
