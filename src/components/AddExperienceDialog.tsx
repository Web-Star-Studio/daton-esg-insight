import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateEmployeeExperience, EmployeeExperience } from '@/services/employeeExperiences';

export type PendingExperience = Omit<EmployeeExperience, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'employee_id'>;

interface AddExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string; // Optional - if not provided, use onAddPending
  onAddPending?: (experience: PendingExperience) => void; // For creation mode
}

export const AddExperienceDialog = ({ open, onOpenChange, employeeId, onAddPending }: AddExperienceDialogProps) => {
  const [formData, setFormData] = useState({
    company_name: '',
    position_title: '',
    department: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    reason_for_leaving: '',
  });

  const createExperience = useCreateEmployeeExperience();

  const resetForm = () => {
    setFormData({
      company_name: '',
      position_title: '',
      department: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      reason_for_leaving: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const experienceData: PendingExperience = {
      company_name: formData.company_name,
      position_title: formData.position_title,
      department: formData.department || undefined,
      start_date: formData.start_date,
      end_date: formData.is_current ? undefined : (formData.end_date || undefined),
      is_current: formData.is_current,
      description: formData.description || undefined,
      reason_for_leaving: formData.reason_for_leaving || undefined,
    };

    // If no employeeId, add to pending list (creation mode)
    if (!employeeId && onAddPending) {
      onAddPending(experienceData);
      resetForm();
      onOpenChange(false);
      return;
    }

    // If employeeId exists, save directly to database (edit mode)
    if (employeeId) {
      try {
        await createExperience.mutateAsync({
          ...experienceData,
          employee_id: employeeId,
        } as Omit<EmployeeExperience, 'id' | 'created_at' | 'updated_at' | 'company_id'>);
        
        resetForm();
        onOpenChange(false);
      } catch (error) {
        console.error('Error creating experience:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Experiência Profissional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position_title">Cargo *</Label>
              <Input
                id="position_title"
                value={formData.position_title}
                onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={formData.is_current}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_current"
              checked={formData.is_current}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_current: checked as boolean, end_date: checked ? '' : formData.end_date })
              }
            />
            <Label htmlFor="is_current" className="cursor-pointer">
              Trabalho atual
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição das Atividades</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {!formData.is_current && (
            <div className="space-y-2">
              <Label htmlFor="reason_for_leaving">Motivo da Saída</Label>
              <Input
                id="reason_for_leaving"
                value={formData.reason_for_leaving}
                onChange={(e) => setFormData({ ...formData, reason_for_leaving: e.target.value })}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createExperience.isPending}>
              {createExperience.isPending ? 'Salvando...' : 'Adicionar Experiência'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
