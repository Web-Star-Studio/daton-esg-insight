import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Plus, Briefcase, Edit, Trash2, DollarSign, Building2, Users } from 'lucide-react';
import { 
  getPositions, 
  createPosition, 
  updatePosition, 
  deletePosition,
  getDepartments,
  type Position,
  type Department 
} from '@/services/organizationalStructure';

interface PositionManagerProps {
  onRefresh?: () => void;
}

export function PositionManager({ onRefresh }: PositionManagerProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    level: '',
    salary_range_min: '',
    salary_range_max: '',
    requirements: [] as string[],
    responsibilities: [] as string[],
    reports_to_position_id: ''
  });
  const [requirementInput, setRequirementInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [positionList, departmentList] = await Promise.all([
        getPositions(),
        getDepartments()
      ]);
      
      setPositions(positionList);
      setDepartments(departmentList);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Erro ao carregar cargos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const positionData = {
        ...formData,
        salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
        department_id: formData.department_id || null,
        reports_to_position_id: formData.reports_to_position_id || null
      };

      if (editingPosition) {
        await updatePosition(editingPosition.id, positionData);
        toast.success('Cargo atualizado com sucesso');
      } else {
        await createPosition({
          ...positionData,
          company_id: '' // Will be set by RLS
        });
        toast.success('Cargo criado com sucesso');
      }
      
      setIsModalOpen(false);
      setEditingPosition(null);
      resetForm();
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error('Erro ao salvar cargo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cargo?')) return;
    
    try {
      await deletePosition(id);
      toast.success('Cargo excluído com sucesso');
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Erro ao excluir cargo');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department_id: '',
      level: '',
      salary_range_min: '',
      salary_range_max: '',
      requirements: [],
      responsibilities: [],
      reports_to_position_id: ''
    });
    setRequirementInput('');
    setResponsibilityInput('');
  };

  const openEditModal = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      description: position.description || '',
      department_id: position.department_id || '',
      level: position.level || '',
      salary_range_min: position.salary_range_min?.toString() || '',
      salary_range_max: position.salary_range_max?.toString() || '',
      requirements: position.requirements || [],
      responsibilities: position.responsibilities || [],
      reports_to_position_id: position.reports_to_position_id || ''
    });
    setIsModalOpen(true);
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, requirementInput.trim()]
      });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      setFormData({
        ...formData,
        responsibilities: [...formData.responsibilities, responsibilityInput.trim()]
      });
      setResponsibilityInput('');
    }
  };

  const removeResponsibility = (index: number) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.filter((_, i) => i !== index)
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'trainee':
        return 'bg-blue-100 text-blue-800';
      case 'junior':
        return 'bg-green-100 text-green-800';
      case 'pleno':
        return 'bg-yellow-100 text-yellow-800';
      case 'senior':
        return 'bg-orange-100 text-orange-800';
      case 'gerente':
        return 'bg-purple-100 text-purple-800';
      case 'diretor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Cargos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-muted-foreground">Carregando cargos...</p>
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
              <Briefcase className="w-5 h-5" />
              <span>Gestão de Cargos</span>
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingPosition(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cargo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPosition ? 'Editar Cargo' : 'Novo Cargo'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Título do cargo"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="level">Nível</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => setFormData({ ...formData, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Trainee">Trainee</SelectItem>
                          <SelectItem value="Junior">Junior</SelectItem>
                          <SelectItem value="Pleno">Pleno</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                          <SelectItem value="Gerente">Gerente</SelectItem>
                          <SelectItem value="Diretor">Diretor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do cargo"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department_id">Departamento</Label>
                      <Select
                        value={formData.department_id}
                        onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o departamento" />
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
                      <Label htmlFor="reports_to_position_id">Reporta para</Label>
                      <Select
                        value={formData.reports_to_position_id}
                        onValueChange={(value) => setFormData({ ...formData, reports_to_position_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo superior" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions
                            .filter(pos => pos.id !== editingPosition?.id)
                            .map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.title} - {position.department?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary_range_min">Salário Mínimo</Label>
                      <Input
                        id="salary_range_min"
                        type="number"
                        step="0.01"
                        value={formData.salary_range_min}
                        onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="salary_range_max">Salário Máximo</Label>
                      <Input
                        id="salary_range_max"
                        type="number"
                        step="0.01"
                        value={formData.salary_range_max}
                        onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Requisitos</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={requirementInput}
                        onChange={(e) => setRequirementInput(e.target.value)}
                        placeholder="Adicionar requisito"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                      />
                      <Button type="button" onClick={addRequirement}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((req, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {req}
                          <button
                            type="button"
                            onClick={() => removeRequirement(index)}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Responsabilidades</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={responsibilityInput}
                        onChange={(e) => setResponsibilityInput(e.target.value)}
                        placeholder="Adicionar responsabilidade"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
                      />
                      <Button type="button" onClick={addResponsibility}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.responsibilities.map((resp, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {resp}
                          <button
                            type="button"
                            onClick={() => removeResponsibility(index)}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingPosition ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {positions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => (
            <Card key={position.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span>{position.title}</span>
                    </CardTitle>
                    {position.level && (
                      <Badge className={`mt-2 ${getLevelColor(position.level)}`}>
                        {position.level}
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(position)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(position.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {position.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {position.description}
                  </p>
                )}

                <div className="space-y-2">
                  {position.department && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{position.department.name}</span>
                    </div>
                  )}

                  {(position.salary_range_min || position.salary_range_max) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {position.salary_range_min && formatCurrency(position.salary_range_min)}
                        {position.salary_range_min && position.salary_range_max && ' - '}
                        {position.salary_range_max && formatCurrency(position.salary_range_max)}
                      </span>
                    </div>
                  )}

                  {position.reports_to_position && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Reporta para: {position.reports_to_position.title}</span>
                    </div>
                  )}
                </div>

                {position.requirements && position.requirements.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Requisitos:</p>
                    <div className="flex flex-wrap gap-1">
                      {position.requirements.slice(0, 3).map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                      {position.requirements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{position.requirements.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum cargo cadastrado
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Cargo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}