import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { lmsService, type TrainingCourse } from "@/services/lmsService";
import { X, Plus } from "lucide-react";

interface CourseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: TrainingCourse;
}

export function CourseCreationModal({ isOpen, onClose, course }: CourseCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!course;

  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    category: course?.category || "",
    difficulty_level: course?.difficulty_level || "Iniciante",
    estimated_duration_hours: course?.estimated_duration_hours || 0,
    thumbnail_url: course?.thumbnail_url || "",
    is_mandatory: course?.is_mandatory || false,
    prerequisites: course?.prerequisites || [],
    learning_objectives: course?.learning_objectives || [],
    status: course?.status || "Rascunho"
  });

  const [newPrerequisite, setNewPrerequisite] = useState("");
  const [newObjective, setNewObjective] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: Partial<TrainingCourse>) => 
      isEditing ? lmsService.updateCourse(course.id, data) : lmsService.createCourse(data),
    onSuccess: (data) => {
      toast({
        title: isEditing ? "Curso atualizado com sucesso" : "Curso criado com sucesso",
        description: `O curso "${data.title}" foi ${isEditing ? 'atualizado' : 'criado'} com sucesso.`
      });
      queryClient.invalidateQueries({ queryKey: ['lms-courses'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} curso`,
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      difficulty_level: "Iniciante",
      estimated_duration_hours: 0,
      thumbnail_url: "",
      is_mandatory: false,
      prerequisites: [],
      learning_objectives: [],
      status: "Rascunho"
    });
    setNewPrerequisite("");
    setNewObjective("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O título do curso é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim() && !formData.prerequisites.includes(newPrerequisite.trim())) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()]
      }));
      setNewPrerequisite("");
    }
  };

  const removePrerequisite = (prerequisite: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(p => p !== prerequisite)
    }));
  };

  const addObjective = () => {
    if (newObjective.trim() && !formData.learning_objectives.includes(newObjective.trim())) {
      setFormData(prev => ({
        ...prev,
        learning_objectives: [...prev.learning_objectives, newObjective.trim()]
      }));
      setNewObjective("");
    }
  };

  const removeObjective = (objective: string) => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter(o => o !== objective)
    }));
  };

  const handleClose = () => {
    onClose();
    if (!isEditing) resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Curso' : 'Criar Novo Curso'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do curso.' : 'Crie um novo curso de treinamento para sua empresa.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Curso *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Segurança no Trabalho"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Meio Ambiente">Meio Ambiente</SelectItem>
                  <SelectItem value="Técnico">Técnico</SelectItem>
                  <SelectItem value="Comportamental">Comportamental</SelectItem>
                  <SelectItem value="Liderança">Liderança</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o conteúdo e objetivos do curso..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Nível de Dificuldade</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração Estimada (horas)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_hours: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">URL da Imagem (Thumbnail)</Label>
            <Input
              id="thumbnail"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="mandatory"
              checked={formData.is_mandatory}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_mandatory: checked }))}
            />
            <Label htmlFor="mandatory">Curso obrigatório</Label>
          </div>

          {/* Prerequisites */}
          <div className="space-y-2">
            <Label>Pré-requisitos</Label>
            <div className="flex gap-2">
              <Input
                value={newPrerequisite}
                onChange={(e) => setNewPrerequisite(e.target.value)}
                placeholder="Adicionar pré-requisito..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
              />
              <Button type="button" onClick={addPrerequisite} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.prerequisites.map((prerequisite, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {prerequisite}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removePrerequisite(prerequisite)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label>Objetivos de Aprendizagem</Label>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Adicionar objetivo..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
              />
              <Button type="button" onClick={addObjective} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.learning_objectives.map((objective, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {objective}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeObjective(objective)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending 
                ? (isEditing ? "Atualizando..." : "Criando...") 
                : (isEditing ? "Atualizar Curso" : "Criar Curso")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}