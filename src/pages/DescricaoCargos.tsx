import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Filter, 
  GraduationCap, 
  Clock, 
  Building2, 
  DollarSign,
  Users,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getPositions, 
  getDepartments,
  type Position,
  type Department 
} from '@/services/organizationalStructure';
import { PositionDetailModal } from '@/components/PositionDetailModal';
import { PositionManager } from '@/components/PositionManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const EDUCATION_LEVELS = [
  'Ensino Fundamental',
  'Ensino Médio',
  'Ensino Técnico',
  'Ensino Superior Incompleto',
  'Ensino Superior Completo',
  'Pós-Graduação',
  'Mestrado',
  'Doutorado'
];

const POSITION_LEVELS = ['Trainee', 'Junior', 'Pleno', 'Senior', 'Gerente', 'Diretor'];

export default function DescricaoCargos() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [educationFilter, setEducationFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewPositionModalOpen, setIsNewPositionModalOpen] = useState(false);

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
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPositions = useMemo(() => {
    return positions.filter(position => {
      const matchesSearch = !searchTerm || 
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || 
        position.department_id === departmentFilter;
      
      const matchesEducation = educationFilter === 'all' || 
        position.required_education_level === educationFilter;
      
      const matchesLevel = levelFilter === 'all' || 
        position.level === levelFilter;
      
      return matchesSearch && matchesDepartment && matchesEducation && matchesLevel;
    });
  }, [positions, searchTerm, departmentFilter, educationFilter, levelFilter]);

  const stats = useMemo(() => {
    return {
      total: positions.length,
      byDepartment: departments.map(dept => ({
        name: dept.name,
        count: positions.filter(p => p.department_id === dept.id).length
      })).filter(d => d.count > 0),
      byLevel: POSITION_LEVELS.map(level => ({
        name: level,
        count: positions.filter(p => p.level === level).length
      })).filter(l => l.count > 0)
    };
  }, [positions, departments]);

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

  const handleViewDetails = (position: Position) => {
    setSelectedPosition(position);
    setIsDetailModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('all');
    setEducationFilter('all');
    setLevelFilter('all');
  };

  const hasActiveFilters = searchTerm || departmentFilter !== 'all' || educationFilter !== 'all' || levelFilter !== 'all';

  return (
    <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              Gestão de Cargos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os cargos e funções da organização
            </p>
          </div>
          <Dialog open={isNewPositionModalOpen} onOpenChange={setIsNewPositionModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Cargo</DialogTitle>
              </DialogHeader>
              <PositionManager onRefresh={() => { loadData(); setIsNewPositionModalOpen(false); }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total de Cargos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departments.length}</p>
                  <p className="text-sm text-muted-foreground">Departamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredPositions.length}</p>
                  <p className="text-sm text-muted-foreground">Resultados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={educationFilter} onValueChange={setEducationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas escolaridades</SelectItem>
                  {EDUCATION_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  {POSITION_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredPositions.length} resultado(s) encontrado(s)
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Position Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Carregando cargos...</p>
          </div>
        ) : filteredPositions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum cargo encontrado</h3>
              <p className="text-muted-foreground mt-1">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Comece criando o primeiro cargo'}
              </p>
              {!hasActiveFilters && (
                <Button className="mt-4" onClick={() => setIsNewPositionModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Cargo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPositions.map((position) => (
              <Card 
                key={position.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleViewDetails(position)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {position.title}
                      </h3>
                      {position.department?.name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {position.department.name}
                        </p>
                      )}
                    </div>
                    {position.level && (
                      <Badge className={getLevelColor(position.level)}>
                        {position.level}
                      </Badge>
                    )}
                  </div>

                  {position.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {position.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {position.required_education_level && (
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{position.required_education_level}</span>
                      </div>
                    )}
                    
                    {position.required_experience_years !== null && position.required_experience_years !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {position.required_experience_years} {position.required_experience_years === 1 ? 'ano' : 'anos'} de experiência
                        </span>
                      </div>
                    )}

                    {(position.salary_range_min || position.salary_range_max) && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {position.salary_range_min && position.salary_range_max
                            ? `${formatCurrency(position.salary_range_min)} - ${formatCurrency(position.salary_range_max)}`
                            : position.salary_range_min
                              ? `A partir de ${formatCurrency(position.salary_range_min)}`
                              : `Até ${formatCurrency(position.salary_range_max!)}`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick info badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {position.responsibilities && position.responsibilities.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {position.responsibilities.length} atividades
                      </Badge>
                    )}
                    {position.requirements && position.requirements.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {position.requirements.length} requisitos
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-end text-sm text-primary group-hover:translate-x-1 transition-transform">
                    Ver detalhes
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Detail Modal */}
      <PositionDetailModal
        position={selectedPosition}
        positions={positions}
        departments={departments}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPosition(null);
        }}
        onRefresh={loadData}
      />
    </div>
  );
}
