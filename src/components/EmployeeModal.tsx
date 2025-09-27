import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { createEmployee, updateEmployee, type Employee } from '@/services/employees';
import { getDepartments, getPositions, createDepartment, createPosition, type Department, type Position } from '@/services/organizationalStructure';
import { formErrorHandler } from '@/utils/formErrorHandler';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

// Validation schema
const employeeSchema = z.object({
  employee_code: z.string().trim().min(1, 'Código do funcionário é obrigatório').max(50, 'Código muito longo'),
  full_name: z.string().trim().min(1, 'Nome completo é obrigatório').max(255, 'Nome muito longo'),
  email: z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
});

export function EmployeeModal({ isOpen, onClose, onSuccess, employee }: EmployeeModalProps) {
  const [formData, setFormData] = useState({
    employee_code: '',
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
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New department/position creation states
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newPositionTitle, setNewPositionTitle] = useState('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [creatingPosition, setCreatingPosition] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDepartmentsAndPositions();
      if (employee) {
        setFormData({
          employee_code: employee.employee_code || '',
          full_name: employee.full_name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          department: employee.department || '',
          position: employee.position || '',
          position_id: employee.position_id || '', // Include position_id
          hire_date: employee.hire_date || '',
          birth_date: employee.birth_date || '',
          gender: employee.gender || '',
          employment_type: employee.employment_type || 'CLT',
          status: employee.status || 'Ativo',
          location: employee.location || '',
        });
      } else {
        setFormData({
          employee_code: '',
          full_name: '',
          email: '',
          phone: '',
          department: '',
          position: '',
          position_id: '', // Include position_id
          hire_date: '',
          birth_date: '',
          gender: '',
          employment_type: 'CLT',
          status: 'Ativo',
          location: '',
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    try {
      employeeSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      if (employee) {
        await updateEmployee(employee.id, formData);
      } else {
        // Remove company_id from formData - let the service handle it
        const { position_id, ...employeeData } = formData; // Also remove position_id from employee creation for now
        await createEmployee(employeeData);
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
              <Label htmlFor="employee_code">Código do Funcionário*</Label>
              <Input
                id="employee_code"
                value={formData.employee_code}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
                placeholder="Ex: EMP001"
                required
              />
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
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
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
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
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
                      <SelectItem key={pos.id} value={pos.title}>
                        {pos.title}
                      </SelectItem>
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
              <Label htmlFor="hire_date">Data de Contratação</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              />
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

          <div>
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Ex: Sede SP, Filial RJ"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (employee ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}