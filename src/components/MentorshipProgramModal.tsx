import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users, Calendar } from "lucide-react";
import { useEmployeesAsOptions } from "@/services/employees";
import { useCreateMentoringRelationship, useMentoringRelationships } from "@/services/careerDevelopment";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MentorshipProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MentorshipProgramModal({ isOpen, onClose }: MentorshipProgramModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [formData, setFormData] = useState({
    mentor_id: "",
    mentee_id: "",
    program_name: "",
    start_date: "",
    end_date: "",
    meeting_frequency: "Quinzenal",
    progress_notes: "",
  });

  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");

  const { user } = useAuth();
  const { data: employeeOptions } = useEmployeesAsOptions();
  const { data: existingRelationships } = useMentoringRelationships();
  const createRelationship = useCreateMentoringRelationship();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.company_id) {
      toast.error("Erro de autenticação: empresa não identificada");
      return;
    }

    if (!formData.mentor_id || !formData.mentee_id) {
      toast.error("Por favor, selecione mentor e mentorado");
      return;
    }
    
    if (formData.mentor_id === formData.mentee_id) {
      toast.error("Mentor e mentorado não podem ser a mesma pessoa");
      return;
    }
    
    try {
      await createRelationship.mutateAsync({
        ...formData,
        company_id: user.company_id,
        status: "Ativo",
        objectives,
        created_by_user_id: user.id,
      });
      
      toast.success("Relacionamento de mentoria criado com sucesso!");
      onClose();
      resetForm();
    } catch (error) {
      toast.error("Erro ao criar relacionamento de mentoria");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      mentor_id: "",
      mentee_id: "",
      program_name: "",
      start_date: "",
      end_date: "",
      meeting_frequency: "Quinzenal",
      progress_notes: "",
    });
    setObjectives([]);
    setNewObjective("");
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "default";
      case "Concluído":
        return "secondary";
      case "Pausado":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Programa de Mentoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Buttons */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('create')}
              className="flex-1"
            >
              Criar Relacionamento
            </Button>
            <Button
              variant={activeTab === 'manage' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('manage')}
              className="flex-1"
            >
              Gerenciar Existentes
            </Button>
          </div>

          {/* Create Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="program_name">Nome do Programa</Label>
                    <Input
                      id="program_name"
                      placeholder="Ex: Programa de Liderança 2024"
                      value={formData.program_name}
                      onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mentor_id">Mentor</Label>
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
                    <Label htmlFor="mentee_id">Mentorado</Label>
                    <Select value={formData.mentee_id} onValueChange={(value) => 
                      setFormData({ ...formData, mentee_id: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar mentorado" />
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
                </div>

                <div className="space-y-4">
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
                    <Label htmlFor="end_date">Data de Término (Opcional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="meeting_frequency">Frequência de Reuniões</Label>
                    <Select value={formData.meeting_frequency} onValueChange={(value) => 
                      setFormData({ ...formData, meeting_frequency: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Bimestral">Bimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <Card>
                <CardHeader>
                  <CardTitle>Objetivos da Mentoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar objetivo..."
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                    />
                    <Button type="button" onClick={addObjective} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {objectives.map((objective, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                        <span>{objective}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeObjective(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="progress_notes">Observações Iniciais</Label>
                <Textarea
                  id="progress_notes"
                  value={formData.progress_notes}
                  onChange={(e) => setFormData({ ...formData, progress_notes: e.target.value })}
                  rows={3}
                  placeholder="Observações sobre o programa de mentoria..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createRelationship.isPending}>
                  {createRelationship.isPending ? "Criando..." : "Criar Relacionamento"}
                </Button>
              </div>
            </form>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Relacionamentos Ativos</h3>
                <Badge variant="outline">
                  {existingRelationships?.filter(r => r.status === 'Ativo').length || 0} ativos
                </Badge>
              </div>

              <div className="space-y-4">
                {existingRelationships?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum relacionamento de mentoria encontrado.</p>
                    <p className="text-sm">Crie o primeiro relacionamento na aba "Criar Relacionamento".</p>
                  </div>
                ) : (
                  existingRelationships?.map((relationship) => (
                    <Card key={relationship.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{relationship.program_name}</h4>
                              <Badge variant={getStatusColor(relationship.status)}>
                                {relationship.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p><strong>Mentor:</strong> {relationship.mentor?.full_name}</p>
                              <p><strong>Mentorado:</strong> {relationship.mentee?.full_name}</p>
                              <p><strong>Frequência:</strong> {relationship.meeting_frequency}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              Agendar
                            </Button>
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}