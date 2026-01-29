import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, AlertCircle, Briefcase, GraduationCap, Trash2, CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { parseDateSafe, formatDateForDB } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { z } from 'zod';
import { createEmployee, updateEmployee, useDeleteEmployee, type Employee } from '@/services/employees';
import { getDepartments, getPositions, createDepartment, createPosition, deleteDepartment, deletePosition, type Department, type Position } from '@/services/organizationalStructure';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { formErrorHandler } from '@/utils/formErrorHandler';
import { formatPhone, formatCPF, validateCPF } from '@/utils/formValidation';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { BranchSelect } from './BranchSelect';
import { AddExperienceDialog, type PendingExperience } from './AddExperienceDialog';
import { AddEducationDialog, type PendingEducation } from './AddEducationDialog';
import { useEmployeeExperiences, useDeleteEmployeeExperience, useCreateEmployeeExperience } from '@/services/employeeExperiences';
import { useEmployeeEducation, useDeleteEmployeeEducation, useCreateEmployeeEducation } from '@/services/employeeEducation';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateInputWithCalendar } from './DateInputWithCalendar';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

// Validation schema
const employeeSchema = z.object({
  full_name: z.string().trim().min(1, 'Nome completo é obrigatório').max(255, 'Nome muito longo'),
  email: z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
  hire_date: z.string().min(1, 'Data de contratação é obrigatória'),
});

export function EmployeeModal({ isOpen, onClose, onSuccess, employee }: EmployeeModalProps) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cpf: '',
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    position_id: '', // Add position_id to maintain link with organizational structure
    hire_date: '',
    birth_date: '',
    gender: '',
    employment_type: 'CLT',
    status: 'Ativo',
    location: '',
    branch_id: '',
    education_level: '',
    termination_date: '',
    notes: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  
  // New department/position creation states
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newPositionTitle, setNewPositionTitle] = useState('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [creatingPosition, setCreatingPosition] = useState(false);

  // Delete confirmation states
  const [confirmDeleteDepartment, setConfirmDeleteDepartment] = useState<Department | null>(null);
  const [confirmDeletePosition, setConfirmDeletePosition] = useState<Position | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState(false);
  const [deletingPosition, setDeletingPosition] = useState(false);

  // Experience and Education dialogs
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [confirmDeleteEmployee, setConfirmDeleteEmployee] = useState(false);

  // Pending experiences and education (for creation mode)
  const [pendingExperiences, setPendingExperiences] = useState<PendingExperience[]>([]);
  const [pendingEducation, setPendingEducation] = useState<PendingEducation[]>([]);

  // Load experiences and education if editing
  const { data: experiences } = useEmployeeExperiences(employee?.id || '');
  const { data: education } = useEmployeeEducation(employee?.id || '');
  const deleteExperience = useDeleteEmployeeExperience();
  const deleteEducation = useDeleteEmployeeEducation();
  const deleteEmployeeMutation = useDeleteEmployee();
  const createExperienceMutation = useCreateEmployeeExperience();
  const createEducationMutation = useCreateEmployeeEducation();

  // Email validation state
  const [emailValidation, setEmailValidation] = useState<{
    checking: boolean;
    exists: boolean;
    message?: string;
  }>({ checking: false, exists: false });
  
  // Debounce email for validation
  const debouncedEmail = useDebounce(formData.email, 500);

  // Fetch company_id on mount
  useEffect(() => {
    const fetchCompanyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        if (profile?.company_id) {
          setCompanyId(profile.company_id);
        }
      }
    };
    fetchCompanyId();
  }, []);


  // Check if email exists
  useEffect(() => {
    const checkEmailExists = async () => {
      const emailValue = debouncedEmail.trim().toLowerCase();
      
      // Don't check if empty or invalid email
      if (!emailValue || !emailValue.includes('@')) {
        setEmailValidation({ checking: false, exists: false });
        return;
      }
      
      // If editing and email hasn't changed, don't check
      if (employee && employee.email?.toLowerCase() === emailValue) {
        setEmailValidation({ checking: false, exists: false });
        return;
      }

      setEmailValidation({ checking: true, exists: false });

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, email')
          .eq('email', emailValue)
          .limit(1);

        if (error) {
          console.error('Error checking email:', error);
          setEmailValidation({ checking: false, exists: false });
          return;
        }

        // If exists and not the same employee being edited
        if (data && data.length > 0 && (!employee || data[0].id !== employee.id)) {
          setEmailValidation({
            checking: false,
            exists: true,
            message: 'Este e-mail já está em uso'
          });
        } else {
          setEmailValidation({ checking: false, exists: false });
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailValidation({ checking: false, exists: false });
      }
    };

    checkEmailExists();
  }, [debouncedEmail, employee]);

  useEffect(() => {
    if (isOpen) {
      loadDepartmentsAndPositions();
      setEmailValidation({ checking: false, exists: false });
      if (employee) {
        setFormData({
          cpf: employee.cpf || '',
          full_name: employee.full_name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          department: employee.department || '',
          position: employee.position || '',
          position_id: employee.position_id || '',
          hire_date: employee.hire_date || '',
          birth_date: employee.birth_date || '',
          gender: employee.gender || '',
          employment_type: employee.employment_type || 'CLT',
          status: employee.status || 'Ativo',
          location: employee.location || '',
          branch_id: employee.branch_id || '',
          education_level: employee.education_level || '',
          termination_date: employee.termination_date || '',
          notes: employee.notes || '',
        });
      } else {
        // Clear form and pending items for creation mode
        // Pre-fill hire_date with current date for new employees
        const today = formatDateForDB(new Date()) || '';
        setFormData({
          cpf: '',
          full_name: '',
          email: '',
          phone: '',
          department: '',
          position: '',
          position_id: '',
          hire_date: today,
          birth_date: '',
          gender: '',
          employment_type: 'CLT',
          status: 'Ativo',
          location: '',
          branch_id: '',
          education_level: '',
          termination_date: '',
          notes: '',
        });
        setPendingExperiences([]);
        setPendingEducation([]);
      }
    }
  }, [isOpen, employee]);

  const loadDepartmentsAndPositions = async () => {
    try {
      const [deptData, posData] = await Promise.all([
        getDepartments(),
        getPositions()
      ]);
      setDepartments(deptData);
      setPositions(posData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar departamentos e cargos');
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error('Nome do departamento é obrigatório');
      return;
    }

    // Check for duplicates (case-insensitive)
    const existingDept = departments.find(d => 
      d.name.toLowerCase() === newDepartmentName.trim().toLowerCase()
    );
    
    if (existingDept) {
      setFormData(prev => ({ ...prev, department: existingDept.name }));
      setNewDepartmentName('');
      setShowNewDepartment(false);
      toast.info('Departamento já existe - selecionado automaticamente');
      return;
    }

    setCreatingDepartment(true);
    try {
      const newDept = await createDepartment({
        name: newDepartmentName.trim(),
        description: `Departamento criado durante cadastro de funcionário`,
        company_id: '' // Will be set by the service
      });
      
      setDepartments(prev => [...prev, newDept]);
      setFormData(prev => ({ ...prev, department: newDept.name }));
      setNewDepartmentName('');
      setShowNewDepartment(false);
      toast.success('Departamento criado com sucesso!');
    } catch (error) {
      console.error('Error creating department:', error);
      formErrorHandler.handleError(error, { formType: 'Departamento', operation: 'create' });
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleCreatePosition = async () => {
    if (!newPositionTitle.trim()) {
      toast.error('Título do cargo é obrigatório');
      return;
    }

    // Check for duplicates (case-insensitive)
    const existingPos = positions.find(p => 
      p.title.toLowerCase() === newPositionTitle.trim().toLowerCase()
    );
    
    if (existingPos) {
      setFormData(prev => ({ ...prev, position: existingPos.title, position_id: existingPos.id }));
      setNewPositionTitle('');
      setShowNewPosition(false);
      toast.info('Cargo já existe - selecionado automaticamente');
      return;
    }

    setCreatingPosition(true);
    try {
      const newPos = await createPosition({
        title: newPositionTitle.trim(),
        description: `Cargo criado durante cadastro de funcionário`,
        company_id: '' // Will be set by the service
      });
      
      setPositions(prev => [...prev, newPos]);
      setFormData(prev => ({ ...prev, position: newPos.title, position_id: newPos.id }));
      setNewPositionTitle('');
      setShowNewPosition(false);
      toast.success('Cargo criado com sucesso!');
    } catch (error) {
      console.error('Error creating position:', error);
      formErrorHandler.handleError(error, { formType: 'Cargo', operation: 'create' });
    } finally {
      setCreatingPosition(false);
    }
  };

  // Delete department with validation
  const handleDeleteDepartment = async (dept: Department) => {
    // Check if department is in use
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('department', dept.name);
    
    if (count && count > 0) {
      toast.error(`Não é possível excluir: ${count} funcionário(s) estão vinculados a este departamento`);
      return;
    }
    setConfirmDeleteDepartment(dept);
  };

  const confirmDepartmentDelete = async () => {
    if (!confirmDeleteDepartment) return;
    setDeletingDepartment(true);
    try {
      await deleteDepartment(confirmDeleteDepartment.id);
      setDepartments(prev => prev.filter(d => d.id !== confirmDeleteDepartment.id));
      if (formData.department === confirmDeleteDepartment.name) {
        setFormData(prev => ({ ...prev, department: '' }));
      }
      toast.success('Departamento excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Erro ao excluir departamento');
    } finally {
      setDeletingDepartment(false);
      setConfirmDeleteDepartment(null);
    }
  };

  // Delete position with validation
  const handleDeletePosition = async (pos: Position) => {
    // Check if position is in use
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('position', pos.title);
    
    if (count && count > 0) {
      toast.error(`Não é possível excluir: ${count} funcionário(s) estão vinculados a este cargo`);
      return;
    }
    setConfirmDeletePosition(pos);
  };

  const confirmPositionDelete = async () => {
    if (!confirmDeletePosition) return;
    setDeletingPosition(true);
    try {
      await deletePosition(confirmDeletePosition.id);
      setPositions(prev => prev.filter(p => p.id !== confirmDeletePosition.id));
      if (formData.position === confirmDeletePosition.title) {
        setFormData(prev => ({ ...prev, position: '', position_id: '' }));
      }
      toast.success('Cargo excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Erro ao excluir cargo');
    } finally {
      setDeletingPosition(false);
      setConfirmDeletePosition(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir duplo clique
    if (isSubmitting || loading) return;
    
    // 1. PRIMEIRO: Validar com dados originais do formulário (strings)
    try {
      employeeSchema.parse({
        full_name: formData.full_name,
        email: formData.email,
        hire_date: formData.hire_date,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }
    
    // 2. DEPOIS: Sanitizar para enviar ao banco (converter "" para null)
    const sanitizedData = {
      ...formData,
      employee_code: null, // Campo não mais utilizado - CPF é o identificador
      cpf: formData.cpf.trim() || null,
      full_name: formData.full_name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      department: formData.department.trim() || null,
      position: formData.position.trim() || null,
      location: formData.location.trim() || null,
      notes: formData.notes.trim() || null,
      gender: formData.gender || null,
      education_level: formData.education_level || null,
      // Converter strings vazias para null em campos DATE
      hire_date: formData.hire_date || null,
      birth_date: formData.birth_date || null,
      termination_date: formData.termination_date || null,
      // Converter strings vazias para null em campos UUID
      branch_id: formData.branch_id || null,
      position_id: formData.position_id || null,
    };

    // Validações adicionais
    if (sanitizedData.full_name.length > 255) {
      toast.error('Nome muito longo (máximo 255 caracteres)');
      return;
    }

    if (sanitizedData.email && !sanitizedData.email.includes('@')) {
      toast.error('E-mail inválido');
      return;
    }

    // Check for duplicate email before submission
    if (emailValidation.exists) {
      toast.error('E-mail já está em uso. Use um e-mail diferente.');
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    try {
      if (employee) {
        await updateEmployee(employee.id, sanitizedData);
      } else {
        // Remove position_id from employee creation for now
        const { position_id, ...employeeData } = sanitizedData;
        const newEmployee = await createEmployee(employeeData);
        
        // Save pending experiences
        for (const exp of pendingExperiences) {
          await createExperienceMutation.mutateAsync({
            ...exp,
            employee_id: newEmployee.id,
          });
        }
        
        // Save pending education
        for (const edu of pendingEducation) {
          await createEducationMutation.mutateAsync({
            ...edu,
            employee_id: newEmployee.id,
          });
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      formErrorHandler.handleError(error, { 
        formType: 'Funcionário', 
        operation: employee ? 'update' : 'create' 
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
          <DialogDescription>
            {employee 
              ? 'Atualize as informações do funcionário' 
              : 'Preencha os dados para cadastrar um novo funcionário'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {formData.cpf && !validateCPF(formData.cpf) && formData.cpf.replace(/\D/g, '').length === 11 && (
                <p className="text-xs text-destructive mt-1">CPF inválido</p>
              )}
            </div>

            <div>
              <Label htmlFor="full_name">Nome Completo*</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nome completo do funcionário"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                  className={emailValidation.exists ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {emailValidation.checking && (
                  <p className="text-xs text-muted-foreground mt-1">Verificando disponibilidade...</p>
                )}
                {emailValidation.exists && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>{emailValidation.message}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                placeholder="(11) 99999-9999"
                maxLength={16}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Departamento</Label>
              <div className="flex gap-2">
                <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <div key={dept.id} className="flex items-center justify-between group pr-2">
                        <SelectItem value={dept.name} className="flex-1">
                          {dept.name}
                        </SelectItem>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteDepartment(dept);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                
                <Popover open={showNewDepartment} onOpenChange={setShowNewDepartment}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      className="shrink-0"
                      title="Criar novo departamento"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-medium">Novo Departamento</h4>
                      <div className="space-y-2">
                        <Label htmlFor="new-dept-name">Nome do Departamento</Label>
                        <Input
                          id="new-dept-name"
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                          placeholder="Ex: Recursos Humanos"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateDepartment();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowNewDepartment(false);
                            setNewDepartmentName('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleCreateDepartment}
                          disabled={creatingDepartment}
                        >
                          {creatingDepartment ? 'Criando...' : 'Criar'}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="position">Cargo</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.position} 
                  onValueChange={(value) => {
                    const selectedPosition = positions.find(p => p.title === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      position: value,
                      position_id: selectedPosition?.id || ''
                    }));
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <div key={pos.id} className="flex items-center justify-between group pr-2">
                        <SelectItem value={pos.title} className="flex-1">
                          {pos.title}
                        </SelectItem>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeletePosition(pos);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                
                <Popover open={showNewPosition} onOpenChange={setShowNewPosition}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      className="shrink-0"
                      title="Criar novo cargo"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-medium">Novo Cargo</h4>
                      <div className="space-y-2">
                        <Label htmlFor="new-pos-title">Título do Cargo</Label>
                        <Input
                          id="new-pos-title"
                          value={newPositionTitle}
                          onChange={(e) => setNewPositionTitle(e.target.value)}
                          placeholder="Ex: Analista de Sistemas"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreatePosition();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowNewPosition(false);
                            setNewPositionTitle('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleCreatePosition}
                          disabled={creatingPosition}
                        >
                          {creatingPosition ? 'Criando...' : 'Criar'}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Contratação *</Label>
              <DateInputWithCalendar
                value={formData.hire_date}
                onChange={(value) => setFormData(prev => ({ ...prev, hire_date: value }))}
                placeholder="DD/MM/AAAA"
              />
            </div>

            <div>
              <Label>Data de Demissão</Label>
              <DateInputWithCalendar
                value={formData.termination_date}
                onChange={(value) => setFormData(prev => ({ ...prev, termination_date: value }))}
                placeholder="DD/MM/AAAA"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Nascimento</Label>
              <DateInputWithCalendar
                value={formData.birth_date}
                onChange={(value) => setFormData(prev => ({ ...prev, birth_date: value }))}
                placeholder="DD/MM/AAAA"
              />
            </div>

            <div>
              <Label htmlFor="education_level">Escolaridade</Label>
              <Select value={formData.education_level} onValueChange={(value) => setFormData(prev => ({ ...prev, education_level: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                  <SelectItem value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</SelectItem>
                  <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                  <SelectItem value="Ensino Médio Incompleto">Ensino Médio Incompleto</SelectItem>
                  <SelectItem value="Técnico">Técnico</SelectItem>
                  <SelectItem value="Superior">Superior</SelectItem>
                  <SelectItem value="Superior Incompleto">Superior Incompleto</SelectItem>
                  <SelectItem value="Pós-Graduação">Pós-Graduação</SelectItem>
                  <SelectItem value="Mestrado">Mestrado</SelectItem>
                  <SelectItem value="Doutorado">Doutorado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gender">Gênero</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Não binário">Não binário</SelectItem>
                  <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employment_type">Tipo de Contrato</Label>
              <Select value={formData.employment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Estagiário">Estagiário</SelectItem>
                  <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status do funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                  <SelectItem value="Licença">Licença</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="branch_id">Filial</Label>
              <BranchSelect
                value={formData.branch_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}
              />
            </div>

            <div>
              <Label htmlFor="location">Localização Adicional</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Sala 201, Andar 3"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Informações Adicionais</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações ou informações adicionais sobre o funcionário..."
              rows={3}
            />
          </div>

          {/* Experiências Profissionais */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Experiências Profissionais</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowExperienceDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {/* Edit mode: show database experiences */}
              {employee && experiences && experiences.length > 0 && (
                experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-start justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{exp.company_name}</h4>
                          <p className="text-sm text-muted-foreground">{exp.position_title}</p>
                          {exp.department && (
                            <p className="text-xs text-muted-foreground">{exp.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(exp.start_date), 'MMM yyyy', { locale: ptBR })} -{' '}
                            {exp.is_current
                              ? 'Atual'
                              : exp.end_date
                              ? format(new Date(exp.end_date), 'MMM yyyy', { locale: ptBR })
                              : 'N/A'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover esta experiência?')) {
                              deleteExperience.mutate(exp.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {/* Creation mode: show pending experiences */}
              {!employee && pendingExperiences.length > 0 && (
                pendingExperiences.map((exp, index) => (
                  <div
                    key={`pending-exp-${index}`}
                    className="flex items-start justify-between p-3 border rounded-lg bg-muted/30 border-dashed"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{exp.company_name}</h4>
                            <Badge variant="outline" className="text-xs">Pendente</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{exp.position_title}</p>
                          {exp.department && (
                            <p className="text-xs text-muted-foreground">{exp.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(exp.start_date), 'MMM yyyy', { locale: ptBR })} -{' '}
                            {exp.is_current ? 'Atual' : exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy', { locale: ptBR }) : 'N/A'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingExperiences(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Empty state */}
              {((employee && (!experiences || experiences.length === 0)) || (!employee && pendingExperiences.length === 0)) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma experiência cadastrada
                </p>
              )}
            </div>
          </div>

          {/* Educação e Certificações */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Educação e Certificações</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEducationDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {/* Edit mode: show database education */}
              {employee && education && education.length > 0 && (
                education.map((edu) => (
                  <div
                    key={edu.id}
                    className="flex items-start justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{edu.course_name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {edu.education_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{edu.institution_name}</p>
                          {edu.field_of_study && (
                            <p className="text-xs text-muted-foreground">{edu.field_of_study}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {edu.start_date && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(edu.start_date), 'yyyy')} -{' '}
                                {edu.end_date
                                  ? format(new Date(edu.end_date), 'yyyy')
                                  : 'Em andamento'}
                              </p>
                            )}
                            {edu.is_completed && (
                              <Badge variant="outline" className="text-xs">
                                Concluído
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover esta formação?')) {
                              deleteEducation.mutate(edu.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Creation mode: show pending education */}
              {!employee && pendingEducation.length > 0 && (
                pendingEducation.map((edu, index) => (
                  <div
                    key={`pending-edu-${index}`}
                    className="flex items-start justify-between p-3 border rounded-lg bg-muted/30 border-dashed"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{edu.course_name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {edu.education_type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">Pendente</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{edu.institution_name}</p>
                          {edu.field_of_study && (
                            <p className="text-xs text-muted-foreground">{edu.field_of_study}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {edu.start_date && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(edu.start_date), 'yyyy')} -{' '}
                                {edu.end_date ? format(new Date(edu.end_date), 'yyyy') : 'Em andamento'}
                              </p>
                            )}
                            {edu.is_completed && (
                              <Badge variant="outline" className="text-xs">
                                Concluído
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingEducation(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Empty state */}
              {((employee && (!education || education.length === 0)) || (!employee && pendingEducation.length === 0)) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma formação cadastrada
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            {employee ? (
              <Button 
                type="button" 
                variant="destructive"
                onClick={() => setConfirmDeleteEmployee(true)}
                disabled={loading || deleteEmployeeMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            ) : (
              <div /> 
            )}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Salvando...' : (employee ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Dialogs for adding experiences and education */}
      <AddExperienceDialog
        open={showExperienceDialog}
        onOpenChange={setShowExperienceDialog}
        employeeId={employee?.id}
        onAddPending={!employee ? (exp) => setPendingExperiences(prev => [...prev, exp]) : undefined}
      />
      <AddEducationDialog
        open={showEducationDialog}
        onOpenChange={setShowEducationDialog}
        employeeId={employee?.id}
        onAddPending={!employee ? (edu) => setPendingEducation(prev => [...prev, edu]) : undefined}
      />

      {/* Delete Department Confirmation Dialog */}
      <AlertDialog open={!!confirmDeleteDepartment} onOpenChange={(open) => !open && setConfirmDeleteDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Departamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o departamento "{confirmDeleteDepartment?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingDepartment}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDepartmentDelete}
              disabled={deletingDepartment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingDepartment ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Position Confirmation Dialog */}
      <AlertDialog open={!!confirmDeletePosition} onOpenChange={(open) => !open && setConfirmDeletePosition(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cargo "{confirmDeletePosition?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPosition}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPositionDelete}
              disabled={deletingPosition}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPosition ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Employee Confirmation Dialog */}
      <AlertDialog open={confirmDeleteEmployee} onOpenChange={setConfirmDeleteEmployee}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o funcionário "{employee?.full_name}"?
              Esta ação não pode ser desfeita e removerá todos os dados associados (experiências, formações, documentos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEmployeeMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (employee) {
                  try {
                    await deleteEmployeeMutation.mutateAsync(employee.id);
                    toast.success('Funcionário excluído com sucesso!');
                    setConfirmDeleteEmployee(false);
                    onSuccess();
                    onClose();
                  } catch (error: any) {
                    console.error('Erro ao excluir funcionário:', error);
                    const errorMessage = error?.message || 'Erro desconhecido ao excluir funcionário';
                    toast.error('Erro ao excluir funcionário', {
                      description: errorMessage,
                    });
                  }
                }
              }}
              disabled={deleteEmployeeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmployeeMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}