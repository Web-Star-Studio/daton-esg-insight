import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Plus, Building2, Edit, Trash2, Users, DollarSign, Hash } from 'lucide-react';
import { 
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentHierarchy,
  type Department 
} from '@/services/organizationalStructure';
import { getEmployees, type Employee } from '@/services/employees';

interface DepartmentManagerProps {
  onRefresh?: () => void;
}

export function DepartmentManager({ onRefresh }: DepartmentManagerProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_department_id: '',
    manager_employee_id: '',
    budget: '',
    cost_center: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [departmentList, employeeList] = await Promise.all([
        getDepartmentHierarchy(),
        getEmployees()
      ]);
      
      setDepartments(departmentList);
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const departmentData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        parent_department_id: formData.parent_department_id || null,
        manager_employee_id: formData.manager_employee_id || null
      };

      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, departmentData);
        toast.success('Departamento atualizado com sucesso');
      } else {
        await createDepartment({
          ...departmentData,
          company_id: '' // Will be set by RLS
        });
        toast.success('Departamento criado com sucesso');
      }
      
      setIsModalOpen(false);
      setEditingDepartment(null);
      resetForm();
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error('Erro ao salvar departamento');
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

  const openDeleteDialog = (id: string) => {
    setDepartmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    
    try {
      await deleteDepartment(departmentToDelete);
      toast.success('Departamento excluído com sucesso');
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Erro ao excluir departamento');
    } finally {
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_department_id: '',
      manager_employee_id: '',
      budget: '',
      cost_center: ''
    });
  };

  const openEditModal = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      parent_department_id: department.parent_department_id || '',
      manager_employee_id: department.manager_employee_id || '',
      budget: department.budget?.toString() || '',
      cost_center: department.cost_center || ''
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderDepartmentCard = (department: Department, level: number = 0) => (
    <div key={department.id} className={`ml-${level * 6}`}>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>{department.name}</span>
                {level > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Subdepartamento
                  </Badge>
                )}
              </CardTitle>
              {department.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {department.description}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditModal(department)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDeleteDialog(department.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{department.employee_count || 0}</p>
                <p className="text-xs text-muted-foreground">Funcionários</p>
              </div>
            </div>
            
            {department.manager && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{department.manager.full_name}</p>
                  <p className="text-xs text-muted-foreground">Gerente</p>
                </div>
              </div>
            )}
            
            {department.budget && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{formatCurrency(department.budget)}</p>
                  <p className="text-xs text-muted-foreground">Orçamento</p>
                </div>
              </div>
            )}
            
            {department.cost_center && (
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{department.cost_center}</p>
                  <p className="text-xs text-muted-foreground">Centro de Custo</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {department.sub_departments && department.sub_departments.length > 0 && (
        <div className="ml-6 border-l-2 border-border pl-4">
          {department.sub_departments.map(subDept => 
            renderDepartmentCard(subDept, level + 1)
          )}
        </div>
      )}
    </div>
  );

  const flattenDepartments = (departments: Department[]): Department[] => {
    const result: Department[] = [];
    
    const flatten = (depts: Department[]) => {
      depts.forEach(dept => {
        result.push(dept);
        if (dept.sub_departments) {
          flatten(dept.sub_departments);
        }
      });
    };
    
    flatten(departments);
    return result;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Departamentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-muted-foreground">Carregando departamentos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Gestão de Departamentos</span>
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingDepartment(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Departamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do departamento"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do departamento"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="parent_department_id">Departamento Pai</Label>
                    <Select
                      value={formData.parent_department_id}
                      onValueChange={(value) => setFormData({ ...formData, parent_department_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento pai" />
                      </SelectTrigger>
                      <SelectContent>
                        {flattenDepartments(departments)
                          .filter(dept => dept.id !== editingDepartment?.id)
                          .map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="manager_employee_id">Gerente</Label>
                    <Select
                      value={formData.manager_employee_id}
                      onValueChange={(value) => setFormData({ ...formData, manager_employee_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gerente" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name} - {employee.position || employee.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="budget">Orçamento</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cost_center">Centro de Custo</Label>
                    <Input
                      id="cost_center"
                      value={formData.cost_center}
                      onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                      placeholder="Código do centro de custo"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingDepartment ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {departments.length > 0 ? (
        <div className="space-y-4">
          {departments.map(department => renderDepartmentCard(department))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum departamento cadastrado
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Departamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}