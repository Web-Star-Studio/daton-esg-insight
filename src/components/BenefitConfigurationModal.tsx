import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Users, 
  UserCheck, 
  UserMinus,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "@/services/employees";
import { enrollEmployeeInBenefit, unenrollEmployeeFromBenefit } from "@/services/benefits";
import { supabase } from "@/integrations/supabase/client";

interface BenefitConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  status: string;
}

interface BenefitEnrollment {
  id: string;
  employee_id: string;
  is_active: boolean;
}

export function BenefitConfigurationModal({
  open,
  onOpenChange,
  benefit,
}: BenefitConfigurationModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();

  // Fetch current enrollments for this benefit
  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery({
    queryKey: ['benefit-enrollments', benefit?.id],
    queryFn: async () => {
      if (!benefit?.id) return [];
      
      const { data, error } = await supabase
        .from('benefit_enrollments')
        .select('id, employee_id, is_active')
        .eq('benefit_id', benefit.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching enrollments:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!benefit?.id && open,
  });

  const filteredEmployees = employees.filter((employee: Employee) =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enrolledEmployeeIds = enrollments.map((enrollment: BenefitEnrollment) => enrollment.employee_id);

  const handleEnrollEmployee = async (employeeId: string) => {
    if (!benefit?.id) return;

    setIsLoading(true);
    try {
      await enrollEmployeeInBenefit(benefit.id, employeeId);
      toast.success("Funcionário inscrito no benefício com sucesso!");
      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
    } catch (error) {
      console.error('Error enrolling employee:', error);
      toast.error("Erro ao inscrever funcionário no benefício");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenrollEmployee = async (employeeId: string) => {
    if (!benefit?.id) return;

    setIsLoading(true);
    try {
      await unenrollEmployeeFromBenefit(benefit.id, employeeId);
      toast.success("Funcionário removido do benefício com sucesso!");
      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
    } catch (error) {
      console.error('Error unenrolling employee:', error);
      toast.error("Erro ao remover funcionário do benefício");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (!benefit?.id || selectedEmployees.length === 0) return;

    setIsLoading(true);
    try {
      await Promise.all(
        selectedEmployees.map(employeeId => 
          enrollEmployeeInBenefit(benefit.id, employeeId)
        )
      );
      toast.success(`${selectedEmployees.length} funcionários inscritos no benefício!`);
      setSelectedEmployees([]);
      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
    } catch (error) {
      console.error('Error bulk enrolling employees:', error);
      toast.error("Erro ao inscrever funcionários em lote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const enrolledEmployees = filteredEmployees.filter((employee: Employee) => 
    enrolledEmployeeIds.includes(employee.id)
  );

  const availableEmployees = filteredEmployees.filter((employee: Employee) => 
    !enrolledEmployeeIds.includes(employee.id)
  );

  if (!benefit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Configurar Benefício: {benefit.name}</DialogTitle>
          <DialogDescription>
            Gerencie quais funcionários têm acesso a este benefício
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="enrolled" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enrolled">
              Inscritos ({enrolledEmployees.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Disponíveis ({availableEmployees.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedEmployees.length > 0 && (
              <Button onClick={handleBulkEnroll} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Inscrever Selecionados ({selectedEmployees.length})
              </Button>
            )}
          </div>

          <TabsContent value="enrolled" className="flex-1 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Funcionários Inscritos
                </CardTitle>
                <CardDescription>
                  Funcionários que atualmente têm acesso a este benefício
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {enrolledEmployees.length > 0 ? (
                      enrolledEmployees.map((employee: Employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium">{employee.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.position} • {employee.department}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Inscrito</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnenrollEmployee(employee.id)}
                              disabled={isLoading}
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum funcionário inscrito neste benefício</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="flex-1 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Funcionários Disponíveis
                </CardTitle>
                <CardDescription>
                  Funcionários que podem ser inscritos neste benefício
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {availableEmployees.length > 0 ? (
                      availableEmployees.map((employee: Employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedEmployees.includes(employee.id)}
                              onCheckedChange={(checked) => 
                                handleEmployeeSelection(employee.id, checked as boolean)
                              }
                            />
                            <div>
                              <p className="font-medium">{employee.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.position} • {employee.department}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEnrollEmployee(employee.id)}
                            disabled={isLoading}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Inscrever
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Todos os funcionários já estão inscritos neste benefício</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}