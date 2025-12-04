import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
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
  GraduationCap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeBenefitsModal } from './EmployeeBenefitsModal';
import { EmployeeDocumentsTab } from './EmployeeDocumentsTab';
import { EmployeeTrainingsTab } from './EmployeeTrainingsTab';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  employee?: {
    id: string;
    employee_code: string;
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

  if (!employee) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="benefits">Benefícios</TabsTrigger>
              <TabsTrigger value="trainings">
                <GraduationCap className="h-4 w-4 mr-2" />
                Treinamentos
              </TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {employee.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">E-mail</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {employee.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Telefone</p>
                            <p className="text-sm text-muted-foreground">{employee.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {employee.birth_date && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Data de Nascimento</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(employee.birth_date).toLocaleDateString('pt-BR')}
                              {calculateAge(employee.birth_date) && (
                                <span className="ml-2">({calculateAge(employee.birth_date)} anos)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {employee.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Localização</p>
                            <p className="text-sm text-muted-foreground">{employee.location}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {employee.gender && (
                          <Badge variant="secondary" className="mr-2">
                            {employee.gender}
                          </Badge>
                        )}
                        {employee.ethnicity && (
                          <Badge variant="secondary" className="mr-2">
                            {employee.ethnicity}
                          </Badge>
                        )}
                        {employee.education_level && (
                          <Badge variant="secondary" className="mr-2">
                            {employee.education_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Informações Profissionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {employee.department && (
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Departamento</p>
                            <p className="text-sm text-muted-foreground">{employee.department}</p>
                          </div>
                        </div>
                      )}
                      
                      {employee.position && (
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Cargo</p>
                            <p className="text-sm text-muted-foreground">{employee.position}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
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
                      
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Tempo na Empresa</p>
                          <p className="text-sm text-muted-foreground">
                            {calculateTenure(employee.hire_date)}
                          </p>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="w-fit">
                        {employee.employment_type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="benefits" className="space-y-6">
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

            <TabsContent value="trainings" className="space-y-6">
              <EmployeeTrainingsTab 
                employeeId={employee.id}
                employeeName={employee.full_name}
              />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <EmployeeDocumentsTab 
                employeeId={employee.id}
                employeeName={employee.full_name}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
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
          </Tabs>

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