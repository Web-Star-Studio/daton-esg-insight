import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';

import { Separator } from './ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Briefcase,
  FileText,
  Gift,
  TrendingUp,
  Edit,
  History,
  GraduationCap,
  DollarSign,
  Building2,
  FileX,
  StickyNote,
  Award
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeBenefitsModal } from './EmployeeBenefitsModal';
import { EmployeeDocumentsTab } from './EmployeeDocumentsTab';
import { EmployeeTrainingsTab } from './EmployeeTrainingsTab';
import { EmployeeFormsTab } from './EmployeeFormsTab';
import { useEmployeeExperiences, type EmployeeExperience } from '@/services/employeeExperiences';
import { useEmployeeEducation, type EmployeeEducation } from '@/services/employeeEducation';
import { useBranches } from '@/services/branches';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  employee?: {
    id: string;
    employee_code?: string;
    cpf?: string;
    full_name: string;
    email?: string;
    phone?: string;
    department?: string;
    position?: string;
    hire_date?: string;
    birth_date?: string;
    gender?: string;
    ethnicity?: string;
    education_level?: string;
    salary?: number;
    employment_type: string;
    status: string;
    manager_id?: string;
    location?: string;
    branch_id?: string;
    termination_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  } | null;
}

export function EmployeeDetailModal({ isOpen, onClose, onEdit, employee }: EmployeeDetailModalProps) {
  const [isBenefitsModalOpen, setIsBenefitsModalOpen] = useState(false);

  // Fetch employee benefits
  const { data: benefitEnrollments = [] } = useQuery({
    queryKey: ['employee-benefits', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const { data, error } = await supabase
        .from('benefit_enrollments')
        .select(`
          *,
          benefit:employee_benefits(name, type, monthly_cost, provider)
        `)
        .eq('employee_id', employee.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!employee?.id,
  });

  // Fetch employee experiences
  const { data: experiences = [], isLoading: loadingExperiences } = useEmployeeExperiences(employee?.id || '');

  // Fetch employee education
  const { data: education = [], isLoading: loadingEducation } = useEmployeeEducation(employee?.id || '');

  // Fetch branches
  const { data: branches = [] } = useBranches();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Licença': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Férias': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isValidDate = (dateString: string | undefined | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const calculateTenure = (hireDate: string | undefined | null) => {
    if (!hireDate) return 'Não informado';
    
    const hire = new Date(hireDate);
    if (isNaN(hire.getTime())) return 'Data inválida';
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''} e ${months} mês${months !== 1 ? 'es' : ''}`;
    }
    return `${months} mês${months !== 1 ? 'es' : ''}`;
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'Não informado';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getBranchName = (branchId: string | undefined | null) => {
    if (!branchId) return 'Não informado';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Não informado';
  };

  if (!employee) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(employee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{employee.full_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{employee.employee_code}</span>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </div>
                  </div>
                </DialogTitle>
              </div>
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-8 shrink-0">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="experiences">Experiências</TabsTrigger>
              <TabsTrigger value="education">Formação</TabsTrigger>
              <TabsTrigger value="benefits">Benefícios</TabsTrigger>
              <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
              <TabsTrigger value="forms">Formulários</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-4 overflow-y-auto pr-4">
              <TabsContent value="overview" className="space-y-6 mt-0">
                  {/* All Information in One Card */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações do Funcionário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Personal and Professional Info Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Personal Information */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Dados Pessoais
                          </h4>
                          <Separator />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">E-mail</p>
                                <p className="text-sm text-muted-foreground">{employee.email || 'Não informado'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Telefone</p>
                                <p className="text-sm text-muted-foreground">{employee.phone || 'Não informado'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Data de Nascimento</p>
                                <p className="text-sm text-muted-foreground">
                                  {employee.birth_date 
                                    ? `${new Date(employee.birth_date).toLocaleDateString('pt-BR')}${calculateAge(employee.birth_date) ? ` (${calculateAge(employee.birth_date)} anos)` : ''}`
                                    : 'Não informado'
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Localização</p>
                                <p className="text-sm text-muted-foreground">{employee.location || 'Não informado'}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Diversity Badges */}
                          <div className="pt-2">
                            <p className="text-sm font-medium mb-2">Informações de Diversidade</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                Gênero: {employee.gender || 'Não informado'}
                              </Badge>
                              <Badge variant="secondary">
                                Etnia: {employee.ethnicity || 'Não informado'}
                              </Badge>
                              <Badge variant="secondary">
                                Escolaridade: {employee.education_level || 'Não informado'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Professional Information */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Dados Profissionais
                          </h4>
                          <Separator />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Departamento</p>
                                <p className="text-sm text-muted-foreground">{employee.department || 'Não informado'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Cargo</p>
                                <p className="text-sm text-muted-foreground">{employee.position || 'Não informado'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Filial</p>
                                <p className="text-sm text-muted-foreground">{getBranchName(employee.branch_id)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Salário</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(employee.salary)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Data de Contratação</p>
                                <p className="text-sm text-muted-foreground">
                                  {isValidDate(employee.hire_date) 
                                    ? new Date(employee.hire_date!).toLocaleDateString('pt-BR')
                                    : 'Não informado'
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Tempo na Empresa</p>
                                <p className="text-sm text-muted-foreground">{calculateTenure(employee.hire_date)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Tipo de Contrato</p>
                                <Badge variant="outline" className="mt-1">{employee.employment_type}</Badge>
                              </div>
                            </div>
                            
                            {employee.status === 'Inativo' && (
                              <div className="flex items-start gap-3">
                                <FileX className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Data de Rescisão</p>
                                  <p className="text-sm text-muted-foreground">{formatDate(employee.termination_date)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div className="space-y-4 pt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <StickyNote className="h-4 w-4" />
                          Observações
                        </h4>
                        <Separator />
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {employee.notes || 'Nenhuma observação cadastrada'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Experiences Tab */}
                <TabsContent value="experiences" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Experiências Profissionais
                      </CardTitle>
                      <CardDescription>
                        Histórico de experiências anteriores do funcionário
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingExperiences ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Carregando experiências...
                        </div>
                      ) : experiences.length > 0 ? (
                        <div className="space-y-4">
                          {experiences.map((exp: EmployeeExperience) => (
                            <div key={exp.id} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-lg">{exp.position_title}</h4>
                                  <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                                </div>
                                <Badge variant={exp.is_current ? "default" : "secondary"}>
                                  {exp.is_current ? "Atual" : "Anterior"}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {formatDate(exp.start_date)} - {exp.is_current ? 'Atual' : formatDate(exp.end_date)}
                                  </span>
                                </div>
                                {exp.department && (
                                  <div className="flex items-center gap-1">
                                    <Building className="h-4 w-4" />
                                    <span>{exp.department}</span>
                                  </div>
                                )}
                              </div>

                              {exp.description && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Atividades:</p>
                                  <p className="text-sm text-muted-foreground">{exp.description}</p>
                                </div>
                              )}

                              {exp.reason_for_leaving && !exp.is_current && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Motivo da saída:</p>
                                  <p className="text-sm text-muted-foreground">{exp.reason_for_leaving}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Nenhuma experiência registrada</h3>
                          <p className="text-muted-foreground">
                            As experiências profissionais anteriores podem ser adicionadas na edição do funcionário.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Formação Acadêmica e Certificações
                      </CardTitle>
                      <CardDescription>
                        Cursos, graduações e certificações do funcionário
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingEducation ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Carregando formações...
                        </div>
                      ) : education.length > 0 ? (
                        <div className="space-y-4">
                          {education.map((edu: EmployeeEducation) => (
                            <div key={edu.id} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-lg">{edu.course_name}</h4>
                                  <p className="text-sm text-muted-foreground">{edu.institution_name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{edu.education_type}</Badge>
                                  <Badge variant={edu.is_completed ? "default" : "secondary"}>
                                    {edu.is_completed ? "Concluído" : "Em andamento"}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                {(edu.start_date || edu.end_date) && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {edu.start_date ? formatDate(edu.start_date) : 'N/A'} - {edu.is_completed && edu.end_date ? formatDate(edu.end_date) : 'Em andamento'}
                                    </span>
                                  </div>
                                )}
                                {edu.field_of_study && (
                                  <div className="flex items-center gap-1">
                                    <GraduationCap className="h-4 w-4" />
                                    <span>{edu.field_of_study}</span>
                                  </div>
                                )}
                              </div>

                              {edu.certificate_number && (
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">Certificado: {edu.certificate_number}</span>
                                </div>
                              )}

                              {edu.description && (
                                <div>
                                  <p className="text-sm text-muted-foreground">{edu.description}</p>
                                </div>
                              )}

                              {edu.expiration_date && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-amber-500" />
                                  <span className="text-amber-600">Validade: {formatDate(edu.expiration_date)}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Nenhuma formação registrada</h3>
                          <p className="text-muted-foreground">
                            As formações e certificações podem ser adicionadas na edição do funcionário.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="benefits" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Benefícios Ativos
                          </CardTitle>
                          <CardDescription>
                            Benefícios associados a este funcionário
                          </CardDescription>
                        </div>
                        <Button onClick={() => setIsBenefitsModalOpen(true)}>
                          Gerenciar Benefícios
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {benefitEnrollments.length > 0 ? (
                        <div className="space-y-4">
                          {benefitEnrollments.map((enrollment: any) => (
                            <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <h4 className="font-medium">{enrollment.benefit?.name}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {enrollment.benefit?.type}
                                  </Badge>
                                  <span>R$ {enrollment.benefit?.monthly_cost?.toLocaleString('pt-BR')}/mês</span>
                                  {enrollment.benefit?.provider && (
                                    <span>• {enrollment.benefit.provider}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  Desde {new Date(enrollment.enrollment_date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="pt-4 border-t">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Custo Total Mensal: R$ {benefitEnrollments.reduce((total: number, enrollment: any) => 
                                  total + (enrollment.benefit?.monthly_cost || 0), 0
                                ).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Nenhum benefício ativo</h3>
                          <p className="text-muted-foreground mb-4">
                            Este funcionário não possui benefícios associados
                          </p>
                          <Button onClick={() => setIsBenefitsModalOpen(true)}>
                            Adicionar Benefícios
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trainings" className="space-y-6 mt-0">
                  <EmployeeTrainingsTab 
                    employeeId={employee.id}
                    employeeName={employee.full_name}
                  />
                </TabsContent>

                <TabsContent value="forms" className="space-y-6 mt-0">
                  <EmployeeFormsTab 
                    employeeId={employee.id}
                    employeeName={employee.full_name}
                  />
                </TabsContent>

                <TabsContent value="documents" className="space-y-6 mt-0">
                  <EmployeeDocumentsTab 
                    employeeId={employee.id}
                    employeeName={employee.full_name}
                  />
                </TabsContent>

                <TabsContent value="history" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico de Alterações
                      </CardTitle>
                      <CardDescription>
                        Registro de mudanças nos dados do funcionário
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 border-l-2 border-primary bg-primary/5">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium">Funcionário criado</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(employee.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        {employee.updated_at !== employee.created_at && (
                          <div className="flex items-start gap-3 p-3 border-l-2 border-muted">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium">Última atualização</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(employee.updated_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
            </div>
          </Tabs>

          <Separator className="my-4" />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EmployeeBenefitsModal
        isOpen={isBenefitsModalOpen}
        onClose={() => setIsBenefitsModalOpen(false)}
        employee={employee}
      />
    </>
  );
}
