import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { lmsService, type Assessment, type AssessmentQuestion } from "@/services/lmsService";
import { Plus, X, Trash2 } from "lucide-react";

interface AssessmentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  moduleId?: string;
  assessment?: Assessment;
}

export function AssessmentCreationModal({ 
  isOpen, 
  onClose, 
  courseId, 
  moduleId,
  assessment 
}: AssessmentCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!assessment;

  const [formData, setFormData] = useState({
    title: assessment?.title || "",
    description: assessment?.description || "",
    assessment_type: assessment?.assessment_type || "quiz" as const,
    time_limit_minutes: assessment?.time_limit_minutes || undefined,
    max_attempts: assessment?.max_attempts || 1,
    passing_score: assessment?.passing_score || 70,
    randomize_questions: assessment?.randomize_questions ?? false,
    show_correct_answers: assessment?.show_correct_answers ?? true,
    allow_review: assessment?.allow_review ?? true
  });

  const [questions, setQuestions] = useState<Partial<AssessmentQuestion>[]>(
    assessment?.questions || []
  );

  const [currentQuestion, setCurrentQuestion] = useState<Partial<AssessmentQuestion>>({
    question_text: "",
    question_type: "multiple_choice",
    points: 1,
    order_index: questions.length + 1,
    explanation: "",
    options: ["", "", "", ""],
    correct_answer: null
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Assessment>) => {
      const assessmentData = {
        ...data,
        course_id: courseId,
        module_id: moduleId
      };
      
      const createdAssessment = isEditing 
        ? await lmsService.createAssessment(assessmentData) // For now, create new
        : await lmsService.createAssessment(assessmentData);

      // Create questions
      for (const question of questions) {
        if (question.question_text?.trim()) {
          await lmsService.createAssessmentQuestion({
            ...question,
            assessment_id: createdAssessment.id
          });
        }
      }

      return createdAssessment;
    },
    onSuccess: (data) => {
      toast({
        title: "Avaliação criada com sucesso",
        description: `A avaliação "${data.title}" foi criada com ${questions.length} questões.`
      });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar avaliação",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assessment_type: "quiz" as const,
      time_limit_minutes: undefined,
      max_attempts: 1,
      passing_score: 70,
      randomize_questions: false,
      show_correct_answers: true,
      allow_review: true
    });
    setQuestions([]);
    setCurrentQuestion({
      question_text: "",
      question_type: "multiple_choice",
      points: 1,
      order_index: 1,
      explanation: "",
      options: ["", "", "", ""],
      correct_answer: null
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O título da avaliação é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Questões necessárias",
        description: "Adicione pelo menos uma questão à avaliação.",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text?.trim()) {
      toast({
        title: "Questão inválida",
        description: "Digite o texto da questão.",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion.question_type === 'multiple_choice' && 
        !currentQuestion.correct_answer) {
      toast({
        title: "Resposta necessária",
        description: "Selecione a resposta correta.",
        variant: "destructive"
      });
      return;
    }

    setQuestions(prev => [...prev, { ...currentQuestion, order_index: prev.length + 1 }]);
    setCurrentQuestion({
      question_text: "",
      question_type: "multiple_choice",
      points: 1,
      order_index: questions.length + 2,
      explanation: "",
      options: ["", "", "", ""],
      correct_answer: null
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestionOption = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => i === index ? value : option) || []
    }));
  };

  const handleClose = () => {
    onClose();
    if (!isEditing) resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Avaliação' : 'Criar Nova Avaliação'}
          </DialogTitle>
          <DialogDescription>
            Crie testes e questionários para avaliar o aprendizado dos alunos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assessment Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Avaliação *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Quiz - Módulo 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Avaliação</Label>
              <Select
                value={formData.assessment_type}
                onValueChange={(value: "quiz" | "exam" | "assignment" | "survey") => 
                  setFormData(prev => ({ ...prev, assessment_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="exam">Prova</SelectItem>
                  <SelectItem value="assignment">Atividade</SelectItem>
                  <SelectItem value="survey">Pesquisa</SelectItem>
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
              placeholder="Instruções para a avaliação..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="time_limit">Tempo Limite (min)</Label>
              <Input
                id="time_limit"
                type="number"
                min="1"
                value={formData.time_limit_minutes || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  time_limit_minutes: parseInt(e.target.value) || undefined 
                }))}
                placeholder="Sem limite"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attempts">Máx. Tentativas</Label>
              <Input
                id="attempts"
                type="number"
                min="1"
                value={formData.max_attempts}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_attempts: parseInt(e.target.value) || 1 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passing">Nota Mínima (%)</Label>
              <Input
                id="passing"
                type="number"
                min="0"
                max="100"
                value={formData.passing_score}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  passing_score: parseInt(e.target.value) || 70 
                }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="randomize"
                checked={formData.randomize_questions}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, randomize_questions: checked }))}
              />
              <Label htmlFor="randomize">Embaralhar questões</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show_answers"
                checked={formData.show_correct_answers}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_correct_answers: checked }))}
              />
              <Label htmlFor="show_answers">Mostrar respostas corretas</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allow_review"
                checked={formData.allow_review}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_review: checked }))}
              />
              <Label htmlFor="allow_review">Permitir revisão</Label>
            </div>
          </div>

          {/* Questions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Questões ({questions.length})
                <Badge variant="outline">
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)} pontos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Question */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Questão</Label>
                    <Select
                      value={currentQuestion.question_type}
                      onValueChange={(value: "multiple_choice" | "true_false" | "essay" | "fill_blank") => 
                        setCurrentQuestion(prev => ({ ...prev, question_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                        <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                        <SelectItem value="essay">Dissertativa</SelectItem>
                        <SelectItem value="fill_blank">Completar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pontos</Label>
                    <Input
                      type="number"
                      min="1"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion(prev => ({ 
                        ...prev, 
                        points: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Textarea
                    value={currentQuestion.question_text}
                    onChange={(e) => setCurrentQuestion(prev => ({ 
                      ...prev, 
                      question_text: e.target.value 
                    }))}
                    placeholder="Digite a pergunta..."
                    rows={2}
                  />
                </div>

                {currentQuestion.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <Label>Alternativas</Label>
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateQuestionOption(index, e.target.value)}
                          placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                        />
                        <Switch
                          checked={currentQuestion.correct_answer === index}
                          onCheckedChange={(checked) => 
                            setCurrentQuestion(prev => ({ 
                              ...prev, 
                              correct_answer: checked ? index : null 
                            }))
                          }
                        />
                        <Label className="text-sm">Correta</Label>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <div className="space-y-2">
                    <Label>Resposta Correta</Label>
                    <Select
                      value={currentQuestion.correct_answer?.toString()}
                      onValueChange={(value) => setCurrentQuestion(prev => ({ 
                        ...prev, 
                        correct_answer: value === 'true' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Verdadeiro</SelectItem>
                        <SelectItem value="false">Falso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Explicação (opcional)</Label>
                  <Textarea
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion(prev => ({ 
                      ...prev, 
                      explanation: e.target.value 
                    }))}
                    placeholder="Explicação da resposta..."
                    rows={2}
                  />
                </div>

                <Button type="button" onClick={addQuestion} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Questão
                </Button>
              </div>

              {/* Existing Questions */}
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <Badge variant="secondary">{question.question_type}</Badge>
                        <Badge>{question.points} pts</Badge>
                      </div>
                      <p className="font-medium">{question.question_text}</p>
                      {question.question_type === 'multiple_choice' && (
                        <div className="mt-2 space-y-1">
                          {question.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 text-sm">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                                ${question.correct_answer === optIndex 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Explicação:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Avaliação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
