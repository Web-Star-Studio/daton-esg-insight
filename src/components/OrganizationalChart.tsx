import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Plus, Users, Edit, Trash2, Building2, UserCheck } from 'lucide-react';
import { 
  getOrganizationalChart, 
  buildOrganizationalHierarchy, 
  createOrganizationalChartNode,
  updateOrganizationalChartNode,
  deleteOrganizationalChartNode,
  type OrganizationalChartNode 
} from '@/services/organizationalStructure';
import { getEmployees, type Employee } from '@/services/employees';
import { getPositions, type Position } from '@/services/organizationalStructure';
import { getDepartments, type Department } from '@/services/organizationalStructure';

interface OrganizationalChartProps {
  onRefresh?: () => void;
}

export function OrganizationalChart({ onRefresh }: OrganizationalChartProps) {
  const [chartData, setChartData] = useState<OrganizationalChartNode[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrganizationalChartNode | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    position_id: '',
    department_id: '',
    reports_to_employee_id: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chartNodes, employeeList, positionList, departmentList] = await Promise.all([
        getOrganizationalChart(),
        getEmployees(),
        getPositions(),
        getDepartments()
      ]);
      
      const hierarchy = buildOrganizationalHierarchy(chartNodes);
      setChartData(hierarchy);
      setEmployees(employeeList);
      setPositions(positionList);
      setDepartments(departmentList);
    } catch (error) {
      console.error('Error loading organizational chart:', error);
      toast.error('Erro ao carregar organograma');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNode) {
        await updateOrganizationalChartNode(editingNode.id, formData);
        toast.success('Posição atualizada com sucesso');
      } else {
        await createOrganizationalChartNode({
          ...formData,
          company_id: '', // Will be set by RLS
          hierarchy_level: 0,
          is_active: true
        });
        toast.success('Posição criada com sucesso');
      }
      
      setIsModalOpen(false);
      setEditingNode(null);
      resetForm();
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Error saving organizational chart node:', error);
      toast.error('Erro ao salvar posição');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta posição do organograma?')) return;
    
    try {
      await deleteOrganizationalChartNode(id);
      toast.success('Posição removida com sucesso');
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting organizational chart node:', error);
      toast.error('Erro ao remover posição');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      position_id: '',
      department_id: '',
      reports_to_employee_id: '',
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditModal = (node: OrganizationalChartNode) => {
    setEditingNode(node);
    setFormData({
      employee_id: node.employee_id,
      position_id: node.position_id || '',
      department_id: node.department_id || '',
      reports_to_employee_id: node.reports_to_employee_id || '',
      start_date: node.start_date
    });
    setIsModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderOrgNode = (node: OrganizationalChartNode, level: number = 0) => (
    <div key={node.id} className="flex flex-col items-center">
      <Card className="w-64 mb-4 relative group">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(node.employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{node.employee.full_name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {node.position?.title || node.employee.position || 'Sem cargo definido'}
              </p>
              {node.department && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {node.department.name}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditModal(node)}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(node.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {node.subordinates && node.subordinates.length > 0 && (
        <div className="flex space-x-8">
          {node.subordinates.map(subordinate => 
            renderOrgNode(subordinate, level + 1)
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Organograma</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-muted-foreground">Carregando organograma...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Organograma</span>
          </CardTitle>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingNode(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Posição
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingNode ? 'Editar Posição' : 'Nova Posição'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employee_id">Funcionário</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.department || 'Sem departamento'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="position_id">Cargo</Label>
                  <Select
                    value={formData.position_id}
                    onValueChange={(value) => setFormData({ ...formData, position_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.title} - {position.department?.name || 'Sem departamento'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department_id">Departamento</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reports_to_employee_id">Reporta para</Label>
                  <Select
                    value={formData.reports_to_employee_id}
                    onValueChange={(value) => setFormData({ ...formData, reports_to_employee_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o superior direto" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(emp => emp.id !== formData.employee_id)
                        .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.position || employee.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingNode ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex flex-col items-center space-y-8 min-w-fit">
              {chartData.map(node => renderOrgNode(node))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma estrutura organizacional definida
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Posição
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}