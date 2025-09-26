import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { lmsService, type CourseModule } from "@/services/lmsService";

interface CourseModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  module?: CourseModule;
}

export function CourseModuleModal({ isOpen, onClose, courseId, module }: CourseModuleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!module;

  const [formData, setFormData] = useState({
    title: module?.title || "",
    description: module?.description || "",
    order_index: module?.order_index || 1,
    module_type: module?.module_type || "lesson" as const,
    content_type: module?.content_type || "document",
    content_url: module?.content_url || "",
    content_text: module?.content_text || "",
    duration_minutes: module?.duration_minutes || 0,
    is_required: module?.is_required ?? true,
    passing_score: module?.passing_score || undefined
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CourseModule>) => 
      isEditing 
        ? lmsService.updateModule(module.id, data) 
        : lmsService.createModule({ ...data, course_id: courseId }),
    onSuccess: (data) => {
      toast({
        title: isEditing ? "Módulo atualizado com sucesso" : "Módulo criado com sucesso",
        description: `O módulo "${data.title}" foi ${isEditing ? 'atualizado' : 'criado'} com sucesso.`
      });
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} módulo`,
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      order_index: 1,
      module_type: "lesson" as const,
      content_type: "document",
      content_url: "",
      content_text: "",
      duration_minutes: 0,
      is_required: true,
      passing_score: undefined
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O título do módulo é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleClose = () => {
    onClose();
    if (!isEditing) resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Módulo' : 'Criar Novo Módulo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do módulo.' : 'Adicione um novo módulo ao curso.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Módulo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Introdução à Segurança"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Ordem</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o conteúdo do módulo..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="module_type">Tipo de Módulo</Label>
              <Select
                value={formData.module_type}
                onValueChange={(value: "lesson" | "assessment" | "assignment") => 
                  setFormData(prev => ({ ...prev, module_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">Aula</SelectItem>
                  <SelectItem value="assessment">Avaliação</SelectItem>
                  <SelectItem value="assignment">Atividade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_type">Tipo de Conteúdo</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="presentation">Apresentação</SelectItem>
                  <SelectItem value="interactive">Interativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_url">URL do Conteúdo</Label>
            <Input
              id="content_url"
              value={formData.content_url}
              onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
              placeholder="https://exemplo.com/video.mp4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_text">Conteúdo Textual</Label>
            <Textarea
              id="content_text"
              value={formData.content_text}
              onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
              placeholder="Conteúdo em texto do módulo..."
              rows={5}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {formData.module_type === 'assessment' && (
              <div className="space-y-2">
                <Label htmlFor="passing_score">Nota Mínima (%)</Label>
                <Input
                  id="passing_score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passing_score || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    passing_score: parseInt(e.target.value) || undefined 
                  }))}
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
            />
            <Label htmlFor="required">Módulo obrigatório</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending 
                ? (isEditing ? "Atualizando..." : "Criando...") 
                : (isEditing ? "Atualizar Módulo" : "Criar Módulo")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}