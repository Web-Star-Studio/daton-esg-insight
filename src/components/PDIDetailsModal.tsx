import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Target, 
  User, 
  Calendar, 
  Award, 
  BookOpen, 
  Edit, 
  MessageSquare,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CareerDevelopmentPlan } from "@/services/careerDevelopment";

interface PDIDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CareerDevelopmentPlan | null;
  onEdit?: (plan: CareerDevelopmentPlan) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Em Andamento":
      return "default";
    case "Concluído":
      return "default";
    case "Pausado":
      return "secondary";
    case "Cancelado":
      return "destructive";
    default:
      return "outline";
  }
};

export function PDIDetailsModal({ isOpen, onClose, plan, onEdit }: PDIDetailsModalProps) {
  if (!plan) return null;

  const progressColor = plan.progress_percentage >= 80 ? "bg-green-500" : 
                       plan.progress_percentage >= 50 ? "bg-yellow-500" : "bg-blue-500";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              PDI - {plan.employee?.full_name}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(plan.status)}>{plan.status}</Badge>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(plan)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Progresso Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso atual</span>
                  <span className="text-2xl font-bold">{plan.progress_percentage}%</span>
                </div>
                <Progress value={plan.progress_percentage} className="h-3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cargo Atual:</span>
                    <p className="font-medium">{plan.current_position}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cargo Meta:</span>
                    <p className="font-medium">{plan.target_position}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Início:</span>
                    <p className="font-medium">
                      {format(new Date(plan.start_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Meta:</span>
                    <p className="font-medium">
                      {format(new Date(plan.target_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee & Mentor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{plan.employee?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Código: {plan.employee?.employee_code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Departamento: {plan.employee?.department || "Não informado"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {plan.mentor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Mentor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{plan.mentor.full_name}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="w-4 h-4 mr-1" />
                      Agendar Reunião 1:1
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Goals */}
          {plan.goals && plan.goals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Metas de Desenvolvimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.goals.map((goal: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{goal.description || goal.title || goal}</p>
                        {goal.deadline && (
                          <p className="text-sm text-muted-foreground">
                            Prazo: {format(new Date(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      <Badge variant={goal.status === "Concluído" ? "default" : "outline"}>
                        {goal.status || "Em Andamento"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills to Develop */}
          {plan.skills_to_develop && plan.skills_to_develop.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Competências a Desenvolver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.skills_to_develop.map((skill: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{skill.name || skill}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {skill.currentLevel && skill.targetLevel && (
                          <>
                            <Badge variant="outline">Atual: {skill.currentLevel}</Badge>
                            <Badge variant="default">Meta: {skill.targetLevel}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Development Activities */}
          {plan.development_activities && plan.development_activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Atividades de Desenvolvimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.development_activities.map((activity: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{activity.title || activity}</p>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {activity.type || "Não especificado"}
                        </p>
                      </div>
                      {activity.deadline && (
                        <Badge variant="outline">
                          {format(new Date(activity.deadline), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {plan.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{plan.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">PDI Criado</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(plan.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-muted"></div>
                  <div>
                    <p className="font-medium text-muted-foreground">Meta Final</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(plan.target_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}