import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { customFormsService, type CustomForm, type FormField, type FormStructure } from "@/services/customForms";
import { FormFieldEditor } from "@/components/FormFieldEditor";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, GripVertical, Trash2, Type, AlignLeft, Hash, Calendar, CheckSquare } from "lucide-react";

interface FormBuilderModalProps {
  open: boolean;
  onClose: () => void;
  editingForm?: CustomForm | null;
  onFormSaved: () => void;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Texto Curto', icon: Type },
  { type: 'textarea', label: 'Texto Longo', icon: AlignLeft },
  { type: 'number', label: 'Número', icon: Hash },
  { type: 'date', label: 'Data', icon: Calendar },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'select', label: 'Seleção Única', icon: CheckSquare },
  { type: 'multiselect', label: 'Múltipla Escolha', icon: CheckSquare },
] as const;

export function FormBuilderModal({ open, onClose, editingForm, onFormSaved }: FormBuilderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingForm) {
      setTitle(editingForm.title);
      setDescription(editingForm.description || "");
      setIsPublished(editingForm.is_published);
      setFields(editingForm.structure_json.fields || []);
    } else {
      setTitle("");
      setDescription("");
      setIsPublished(false);
      setFields([]);
    }
    setSelectedFieldId(null);
  }, [editingForm, open]);

  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: generateFieldId(),
      type,
      label: `Campo ${fields.length + 1}`,
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'multiselect' ? ['Opção 1', 'Opção 2'] : undefined,
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFields(items);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "O título do formulário é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um campo ao formulário",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const structure: FormStructure = {
        fields,
        theme: {
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--background))',
        }
      };

      const formData = {
        title: title.trim(),
        description: description.trim() || undefined,
        structure_json: structure,
        is_published: isPublished,
      };

      if (editingForm) {
        await customFormsService.updateForm(editingForm.id, formData);
        toast({
          title: "Sucesso",
          description: "Formulário atualizado com sucesso",
        });
      } else {
        await customFormsService.createForm(formData);
        toast({
          title: "Sucesso",
          description: "Formulário criado com sucesso",
        });
      }

      onFormSaved();
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o formulário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedField = selectedFieldId ? fields.find(f => f.id === selectedFieldId) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {editingForm ? "Editar Formulário" : "Criar Novo Formulário"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(90vh-120px)]">
          {/* Left Panel - Form Settings */}
          <div className="space-y-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome do formulário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição opcional do formulário"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="published">Publicar formulário</Label>
                </div>
              </CardContent>
            </Card>

            {/* Field Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipos de Campo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => addField(type)}
                      className="justify-start h-auto p-3"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Form Builder */}
          <div className="space-y-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Construtor de Formulário</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Adicione campos usando o painel à esquerda</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="form-fields">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                    selectedFieldId === field.id 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-border hover:border-primary/50'
                                  } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                  onClick={() => setSelectedFieldId(field.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <div className="font-medium">{field.label}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {FIELD_TYPES.find(t => t.type === field.type)?.label}
                                          {field.required && (
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                              Obrigatório
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteField(field.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Field Editor */}
          <div className="overflow-y-auto">
            {selectedField ? (
              <FormFieldEditor
                field={selectedField}
                onUpdate={(updates) => updateField(selectedField.id, updates)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Editor de Campo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione um campo no centro para editá-lo</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Formulário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}