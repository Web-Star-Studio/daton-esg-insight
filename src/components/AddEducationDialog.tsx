import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateEmployeeEducation, EmployeeEducation, EDUCATION_TYPES } from '@/services/employeeEducation';

interface AddEducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

export const AddEducationDialog = ({ open, onOpenChange, employeeId }: AddEducationDialogProps) => {
  const [formData, setFormData] = useState({
    education_type: '',
    institution_name: '',
    course_name: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_completed: false,
    grade: '',
    certificate_number: '',
    description: '',
  });

  const createEducation = useCreateEmployeeEducation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createEducation.mutateAsync({
        employee_id: employeeId,
        education_type: formData.education_type,
        institution_name: formData.institution_name,
        course_name: formData.course_name,
        field_of_study: formData.field_of_study || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_completed: formData.is_completed,
        grade: formData.grade || undefined,
        certificate_number: formData.certificate_number || undefined,
        description: formData.description || undefined,
      } as Omit<EmployeeEducation, 'id' | 'created_at' | 'updated_at' | 'company_id'>);
      
      setFormData({
        education_type: '',
        institution_name: '',
        course_name: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        is_completed: false,
        grade: '',
        certificate_number: '',
        description: '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating education:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Educação / Certificação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="education_type">Tipo *</Label>
            <Select
              value={formData.education_type}
              onValueChange={(value) => setFormData({ ...formData, education_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution_name">Instituição *</Label>
              <Input
                id="institution_name"
                value={formData.institution_name}
                onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course_name">Curso *</Label>
              <Input
                id="course_name"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_of_study">Área de Estudo</Label>
            <Input
              id="field_of_study"
              value={formData.field_of_study}
              onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Conclusão</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_completed"
              checked={formData.is_completed}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_completed: checked as boolean })
              }
            />
            <Label htmlFor="is_completed" className="cursor-pointer">
              Concluído
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Nota / Conceito</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate_number">Número do Certificado</Label>
              <Input
                id="certificate_number"
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEducation.isPending}>
              {createEducation.isPending ? 'Salvando...' : 'Salvar Educação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
