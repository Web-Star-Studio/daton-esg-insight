import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Gift, Users, Calendar, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { enrollEmployeeInBenefit, unenrollEmployeeFromBenefit } from '@/services/benefits';

interface EmployeeBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: {
    id: string;
    full_name: string;
    employee_code: string;
    department?: string;
    position?: string;
  } | null;
}

interface Benefit {
  id: string;
  name: string;
  type: string;
  description?: string;
  monthly_cost: number;
  is_active: boolean;
  provider?: string;
}

interface BenefitEnrollment {
  id: string;
  benefit_id: string;
  employee_id: string;
  enrollment_date: string;
  is_active: boolean;
}

export function EmployeeBenefitsModal({ isOpen, onClose, employee }: EmployeeBenefitsModalProps) {
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch available benefits
  const { data: benefits = [], isLoading: isLoadingBenefits } = useQuery({
    queryKey: ['employee-benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_benefits')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!employee,
  });

  // Fetch current enrollments for this employee
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['employee-benefit-enrollments', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const { data, error } = await supabase
        .from('benefit_enrollments')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!employee?.id,
  });

  // Update selected benefits when enrollments load
  React.useEffect(() => {
    if (enrollments) {
      setSelectedBenefits(enrollments.map((enrollment: BenefitEnrollment) => enrollment.benefit_id));
    }
  }, [enrollments]);

  const enrollMutation = useMutation({
    mutationFn: async ({ benefitId, shouldEnroll }: { benefitId: string; shouldEnroll: boolean }) => {
      if (!employee?.id) throw new Error('Employee not found');
      
      if (shouldEnroll) {
        await enrollEmployeeInBenefit(benefitId, employee.id);
      } else {
        await unenrollEmployeeFromBenefit(benefitId, employee.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-benefit-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      toast.success('Benefícios atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating benefits:', error);
      toast.error('Erro ao atualizar benefícios');
    },
  });

  const handleBenefitToggle = async (benefitId: string, checked: boolean) => {
    if (checked) {
      setSelectedBenefits(prev => [...prev, benefitId]);
    } else {
      setSelectedBenefits(prev => prev.filter(id => id !== benefitId));
    }

    await enrollMutation.mutateAsync({ benefitId, shouldEnroll: checked });
  };

  const calculateTotalMonthlyCost = () => {
    return benefits
      .filter((benefit: Benefit) => selectedBenefits.includes(benefit.id))
      .reduce((total, benefit) => total + (benefit.monthly_cost || 0), 0);
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Benefícios - {employee.full_name}
          </DialogTitle>
          <DialogDescription>
            Gerencie os benefícios do funcionário {employee.employee_code} • {employee.department} • {employee.position}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Benefícios Ativos</p>
                    <p className="text-2xl font-bold">{selectedBenefits.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Custo Mensal</p>
                    <p className="text-2xl font-bold">
                      R$ {calculateTotalMonthlyCost().toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Última Atualização</p>
                    <p className="text-sm text-muted-foreground">
                      {enrollments.length > 0 
                        ? new Date(Math.max(...enrollments.map((e: BenefitEnrollment) => new Date(e.enrollment_date).getTime()))).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits List */}
          <Card>
            <CardHeader>
              <CardTitle>Benefícios Disponíveis</CardTitle>
              <CardDescription>
                Selecione os benefícios para este funcionário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBenefits || isLoadingEnrollments ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {benefits.map((benefit: Benefit) => (
                    <div
                      key={benefit.id}
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={benefit.id}
                        checked={selectedBenefits.includes(benefit.id)}
                        onCheckedChange={(checked) => 
                          handleBenefitToggle(benefit.id, checked as boolean)
                        }
                        disabled={enrollMutation.isPending}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor={benefit.id}
                            className="font-medium cursor-pointer"
                          >
                            {benefit.name}
                          </label>
                          <Badge variant="secondary" className="text-xs">
                            {benefit.type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {benefit.description || 'Sem descrição'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {benefit.monthly_cost?.toLocaleString('pt-BR')}/mês
                          </span>
                          {benefit.provider && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {benefit.provider}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {benefits.length === 0 && (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum benefício disponível</h3>
                      <p className="text-muted-foreground">
                        Configure benefícios na seção de Benefícios e Remuneração
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}