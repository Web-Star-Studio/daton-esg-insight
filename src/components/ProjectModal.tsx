import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { createProject, Project } from '@/services/projectManagement';
import { toast } from 'sonner';

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  project?: Partial<Project>;
}

export function ProjectModal({ open, onOpenChange, onSuccess, project }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    project_type: project?.project_type || 'Estratégico',
    priority: project?.priority || 'Média',
    methodology: project?.methodology || 'Tradicional',
    scope_description: project?.scope_description || '',
    budget: project?.budget || 0,
    manager_user_id: project?.manager_user_id || '',
    sponsor_user_id: project?.sponsor_user_id || ''
  });

  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.planned_start_date ? new Date(project.planned_start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.planned_end_date ? new Date(project.planned_end_date) : undefined
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      // This would fetch employees from the employees table
      // For now, return empty array until we integrate with existing employee system
      return [];
    }
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }
    
    if (trimmedName.length > 255) {
      toast.error('Nome do projeto deve ter no máximo 255 caracteres');
      return;
    }
    
    if (startDate && endDate && endDate < startDate) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }
    
    if (formData.budget < 0) {
      toast.error('Orçamento não pode ser negativo');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitizar dados
      const sanitizedData = {
        name: trimmedName,
        description: formData.description.trim() || null,
        project_type: formData.project_type,
        priority: formData.priority,
        methodology: formData.methodology,
        scope_description: formData.scope_description.trim() || null,
        budget: formData.budget,
        manager_user_id: formData.manager_user_id || null,
        sponsor_user_id: formData.sponsor_user_id || null,
        planned_start_date: startDate?.toISOString().split('T')[0],
        planned_end_date: endDate?.toISOString().split('T')[0],
        status: 'Planejamento',
        phase: 'Planejamento',
        progress_percentage: 0,
        spent_budget: 0
      };
      
      await createProject(sanitizedData);

      toast.success('Projeto criado com sucesso!');
      onSuccess();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        project_type: 'Estratégico',
        priority: 'Média',
        methodology: 'Tradicional',
        scope_description: '',
        budget: 0,
        manager_user_id: '',
        sponsor_user_id: ''
      });
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error: any) {
      console.error('Error creating project:', error);
      const errorMessage = error.message?.includes('duplicate')
        ? 'Já existe um projeto com este nome'
        : 'Erro ao criar projeto. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? 'Edite as informações do projeto'
              : 'Crie um novo projeto estratégico ou operacional'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do projeto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">Tipo de Projeto</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => handleInputChange('project_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estratégico">Estratégico</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Melhoria">Melhoria</SelectItem>
                  <SelectItem value="Inovação">Inovação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o objetivo e escopo do projeto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodology">Metodologia</Label>
              <Select
                value={formData.methodology}
                onValueChange={(value) => handleInputChange('methodology', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a metodologia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tradicional">Tradicional</SelectItem>
                  <SelectItem value="Ágil">Ágil</SelectItem>
                  <SelectItem value="Híbrida">Híbrida</SelectItem>
                  <SelectItem value="Lean">Lean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início Planejada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim Planejada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Orçamento (R$)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope_description">Descrição do Escopo</Label>
            <Textarea
              id="scope_description"
              value={formData.scope_description}
              onChange={(e) => handleInputChange('scope_description', e.target.value)}
              placeholder="Defina o escopo detalhado do projeto"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : project ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}