import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Plus, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrainingComplianceMatrixProps {
  onRegisterTraining: (employeeId: string, programId: string) => void;
}

export function TrainingComplianceMatrix({ onRegisterTraining }: TrainingComplianceMatrixProps) {
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, employee_code, department")
        .eq("status", "Ativo")
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: mandatoryPrograms = [] } = useQuery({
    queryKey: ["mandatory-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_programs")
        .select("id, name, category, valid_for_months")
        .eq("is_mandatory", true)
        .eq("status", "Ativo")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: employeeTrainings = [] } = useQuery({
    queryKey: ["employee-trainings-compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_trainings")
        .select("employee_id, training_program_id, status, completion_date, expiration_date")
        .in("status", ["Concluído", "Em Andamento"]);
      
      if (error) throw error;
      return data;
    },
  });

  const departments = useMemo(() => {
    const uniqueDepts = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(uniqueDepts);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      departmentFilter === "all" || emp.department === departmentFilter
    );
  }, [employees, departmentFilter]);

  const hasTraining = (employeeId: string, programId: string) => {
    return employeeTrainings.find(
      t => t.employee_id === employeeId && t.training_program_id === programId
    );
  };

  const isExpiringSoon = (training: any, program: any) => {
    if (!training?.completion_date || !program.valid_for_months) return false;
    
    const completionDate = new Date(training.completion_date);
    const expirationDate = new Date(completionDate);
    expirationDate.setMonth(expirationDate.getMonth() + program.valid_for_months);
    
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration <= 60 && daysUntilExpiration > 0;
  };

  const isExpired = (training: any, program: any) => {
    if (!training?.completion_date || !program.valid_for_months) return false;
    
    const completionDate = new Date(training.completion_date);
    const expirationDate = new Date(completionDate);
    expirationDate.setMonth(expirationDate.getMonth() + program.valid_for_months);
    
    return expirationDate < new Date();
  };

  const getComplianceRate = () => {
    const total = filteredEmployees.length * mandatoryPrograms.length;
    if (total === 0) return 0;
    
    let compliant = 0;
    filteredEmployees.forEach(emp => {
      mandatoryPrograms.forEach(prog => {
        const training = hasTraining(emp.id, prog.id);
        if (training?.status === "Concluído" && !isExpired(training, prog)) {
          compliant++;
        }
      });
    });
    
    return Math.round((compliant / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Matriz de Compliance de Treinamentos</CardTitle>
            <CardDescription>
              Status de treinamentos obrigatórios por funcionário
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold">{getComplianceRate()}%</p>
              <p className="text-xs text-muted-foreground">Taxa de Compliance</p>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex gap-4 text-sm pb-4 border-b">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Completo</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span>Expira em 60 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span>Pendente/Expirado</span>
              </div>
            </div>

            {/* Matrix Header */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `250px repeat(${mandatoryPrograms.length}, 120px)` }}>
              <div className="font-semibold text-sm">Funcionário</div>
              {mandatoryPrograms.map(prog => (
                <div key={prog.id} className="font-semibold text-xs text-center">
                  <div className="truncate" title={prog.name}>
                    {prog.name}
                  </div>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {prog.category}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {filteredEmployees.map(employee => (
              <div 
                key={employee.id} 
                className="grid gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                style={{ gridTemplateColumns: `250px repeat(${mandatoryPrograms.length}, 120px)` }}
              >
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-sm truncate" title={employee.full_name}>
                    {employee.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {employee.employee_code} • {employee.department || "N/A"}
                  </p>
                </div>
                {mandatoryPrograms.map(program => {
                  const training = hasTraining(employee.id, program.id);
                  const expired = training && isExpired(training, program);
                  const expiring = training && isExpiringSoon(training, program);
                  const completed = training?.status === "Concluído" && !expired;
                  
                  return (
                    <div key={program.id} className="flex items-center justify-center">
                      {completed ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className={`w-6 h-6 ${expiring ? 'text-yellow-600' : 'text-green-600'}`} />
                          {expiring && (
                            <span className="text-[10px] text-yellow-600 mt-1">Expira</span>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onRegisterTraining(employee.id, program.id)}
                          title="Registrar treinamento"
                        >
                          <XCircle className="w-6 h-6 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum funcionário encontrado
              </div>
            )}

            {mandatoryPrograms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum treinamento obrigatório cadastrado
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
