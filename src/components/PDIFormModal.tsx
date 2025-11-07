import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Target, Award } from "lucide-react";
import { useEmployeesAsOptions } from "@/services/employees";
import { useCreateCareerPlan, type CareerDevelopmentPlan } from "@/services/careerDevelopment";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logFormSubmission, createPerformanceLogger } from '@/utils/formLogging';
import { sanitizeUUID } from '@/utils/formValidation';

interface PDIFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Goal {
  id: string;
  description: string;
  deadline: string;
  status: string;
}

interface Skill {
  name: string;
  currentLevel: number;
  targetLevel: number;
}

interface Activity {
  title: string;
  type: string;
  deadline: string;
}

export function PDIFormModal({ isOpen, onClose, onSuccess }: PDIFormModalProps) {
  const [formData, setFormData] = useState({
    employee_id: "",
    current_position: "",
    target_position: "",
    start_date: "",
    target_date: "",
    mentor_id: "",
    notes: "",
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [newGoal, setNewGoal] = useState("");
  const [newSkill, setNewSkill] = useState({ name: "", currentLevel: 1, targetLevel: 3 });
  const [newActivity, setNewActivity] = useState({ title: "", type: "Treinamento", deadline: "" });

  const { data: employeeOptions } = useEmployeesAsOptions();
  const createCareerPlan = useCreateCareerPlan();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const perfLogger = createPerformanceLogger('PDIFormSubmission');
    
    if (!user?.company?.id) {
      toast.error("Erro: informações da empresa não encontradas.");
      logFormSubmission('PDIFormModal', formData, false, new Error('Company ID not found'));
      perfLogger.end(false, new Error('Company ID not found'));
      return;
    }
    
    if (!formData.employee_id) {
      toast.error("Por favor, selecione um funcionário.");
      logFormSubmission('PDIFormModal', formData, false, new Error('Employee ID not provided'));
      perfLogger.end(false, new Error('Employee ID not provided'));
      return;
    }
    
    // Validar campos obrigatórios
    if (!formData.current_position.trim() || !formData.target_position.trim()) {
      toast.error("Por favor, preencha o cargo atual e o cargo alvo.");
      perfLogger.end(false, new Error('Required fields missing'));
      return;
    }
    
    if (!formData.start_date || !formData.target_date) {
      toast.error("Por favor, preencha as datas de início e meta.");
      perfLogger.end(false, new Error('Dates missing'));
      return;
    }
    
    // Validar que target_date > start_date
    if (new Date(formData.target_date) <= new Date(formData.start_date)) {
      toast.error("A data meta deve ser posterior à data de início.");
      perfLogger.end(false, new Error('Invalid date range'));
      return;
    }
    
    // Validar sessão do usuário
    if (!user?.id) {
      toast.error("Sessão inválida. Faça login novamente.");
      perfLogger.end(false, new Error('User ID not found'));
      return;
    }
    
    // Validar e normalizar employee_id
    const employeeId = sanitizeUUID(formData.employee_id);
    if (!employeeId) {
      toast.error("Funcionário inválido. Selecione novamente.");
      perfLogger.end(false, new Error('Invalid employee_id'));
      return;
    }
    
    // Validar e normalizar company_id e mentor_id
    const companyId = sanitizeUUID(user.company.id);
    if (!companyId) {
      toast.error("Empresa inválida. Faça login novamente.");
      perfLogger.end(false, new Error('Invalid company_id'));
      return;
    }
    const mentorId = sanitizeUUID(formData.mentor_id) || null;
    
    try {
      console.log('📝 Criando PDI com dados (UUIDs):', {
        employee_id: employeeId,
        mentor_id: mentorId,
        company_id: companyId,
        created_by_user_id: user.id,
        goalsCount: goals.length,
        skillsCount: skills.length,
        activitiesCount: activities.length
      });
      
      const pdiData = {
        company_id: companyId,
        employee_id: employeeId,
        current_position: formData.current_position.trim(),
        target_position: formData.target_position.trim(),
        start_date: formData.start_date,
        target_date: formData.target_date,
        status: "Em Andamento",
        progress_percentage: 0,
        mentor_id: mentorId,
        goals: goals.length ? goals : [],
        skills_to_develop: skills.length ? skills : [],
        development_activities: activities.length ? activities : [],
        notes: formData.notes?.trim() ? formData.notes.trim() : null,
        created_by_user_id: user.id,
      } satisfies Omit<CareerDevelopmentPlan, 'id' | 'created_at' | 'updated_at'>;

      console.log('🧾 PDI payload final:', pdiData);
      await createCareerPlan.mutateAsync(pdiData);
      
      logFormSubmission('PDIFormModal', pdiData, true, undefined, { 
        goalsCount: goals.length,
        skillsCount: skills.length,
        activitiesCount: activities.length 
      });
      perfLogger.end(true);
      
      toast.success("PDI criado com sucesso!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Erro ao criar PDI:", error);
      
      let errorMessage = "Erro ao criar PDI. ";
      
      if (error.message?.includes('foreign key')) {
        errorMessage += "O funcionário ou mentor selecionado não existe.";
      } else if (error.message?.includes('violates row-level security')) {
        errorMessage += "Você não tem permissão para criar PDIs.";
      } else if (error.message?.includes('company_id')) {
        errorMessage += "Erro ao identificar sua empresa. Faça login novamente.";
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Verifique os dados e tente novamente.";
      }
      
      logFormSubmission('PDIFormModal', formData, false, error);
      perfLogger.end(false, error);
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      current_position: "",
      target_position: "",
      start_date: "",
      target_date: "",
      mentor_id: "",
      notes: "",
    });
    setGoals([]);
    setSkills([]);
    setActivities([]);
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, {
        id: Math.random().toString(),
        description: newGoal,
        deadline: "",
        status: "Em Andamento"
      }]);
      setNewGoal("");
    }
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, newSkill]);
      setNewSkill({ name: "", currentLevel: 1, targetLevel: 3 });
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    if (newActivity.title.trim()) {
      setActivities([...activities, newActivity]);
      setNewActivity({ title: "", type: "Treinamento", deadline: "" });
    }
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Criar Novo PDI
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee_id">Funcionário</Label>
                <Select value={formData.employee_id} onValueChange={(value) => 
                  setFormData({ ...formData, employee_id: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions?.map((employee) => (
                      <SelectItem key={employee.value} value={employee.value}>
                        {employee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="current_position">Cargo Atual</Label>
                <Input
                  id="current_position"
                  value={formData.current_position}
                  onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="target_position">Cargo Alvo</Label>
                <Input
                  id="target_position"
                  value={formData.target_position}
                  onChange={(e) => setFormData({ ...formData, target_position: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mentor_id">Mentor (Opcional)</Label>
                <Select value={formData.mentor_id} onValueChange={(value) => 
                  setFormData({ ...formData, mentor_id: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions?.map((employee) => (
                      <SelectItem key={employee.value} value={employee.value}>
                        {employee.label}
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

              <div>
                <Label htmlFor="target_date">Data Meta</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Metas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Metas de Desenvolvimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Descrever meta..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                />
                <Button type="button" onClick={addGoal} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between bg-muted p-3 rounded">
                    <span>{goal.description}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Competências a Desenvolver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  placeholder="Nome da competência"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                />
                <Select 
                  value={newSkill.currentLevel.toString()} 
                  onValueChange={(value) => setNewSkill({ ...newSkill, currentLevel: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nível atual" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(level => (
                      <SelectItem key={level} value={level.toString()}>Nível {level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newSkill.targetLevel.toString()} 
                  onValueChange={(value) => setNewSkill({ ...newSkill, targetLevel: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nível meta" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(level => (
                      <SelectItem key={level} value={level.toString()}>Nível {level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                    <div className="flex items-center gap-2">
                      <span>{skill.name}</span>
                      <Badge variant="outline">Atual: {skill.currentLevel}</Badge>
                      <Badge variant="default">Meta: {skill.targetLevel}</Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCareerPlan.isPending}>
              {createCareerPlan.isPending ? "Criando..." : "Criar PDI"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}