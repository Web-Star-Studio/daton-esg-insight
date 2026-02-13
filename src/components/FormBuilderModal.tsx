import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { customFormsService, type CustomForm, type FormField, type FormStructure } from "@/services/customForms";
import { FormFieldEditor } from "@/components/FormFieldEditor";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, GripVertical, Trash2, Type, AlignLeft, Hash, Calendar, CheckSquare, ThumbsUp, Star, Upload, ImageIcon, X, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  { type: 'select', label: 'Seleção Única', icon: CheckSquare },
  { type: 'multiselect', label: 'Múltipla Escolha', icon: CheckSquare },
  { type: 'nps', label: 'NPS (0-10)', icon: ThumbsUp },
  { type: 'rating', label: 'Avaliação (Estrelas)', icon: Star },
  { type: 'file', label: 'Upload de Arquivo', icon: Upload },
  { type: 'message', label: 'Texto/Mensagem', icon: MessageSquare },
] as const;

export function FormBuilderModal({ open, onClose, editingForm, onFormSaved }: FormBuilderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('center');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [footerImageUrl, setFooterImageUrl] = useState<string | null>(null);
  const [footerImagePosition, setFooterImagePosition] = useState<'left' | 'center' | 'right'>('center');
  const [uploadingFooterImage, setUploadingFooterImage] = useState(false);
  const { toast } = useToast();

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione uma imagem", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileName = `logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('form-logos')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: publicUrl } = supabase.storage
        .from('form-logos')
        .getPublicUrl(data.path);
      
      setLogoUrl(publicUrl.publicUrl);
      toast({ title: "Sucesso", description: "Logo enviada com sucesso" });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFooterImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione uma imagem", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setUploadingFooterImage(true);
    try {
      const fileName = `footer-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('form-logos')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: publicUrl } = supabase.storage
        .from('form-logos')
        .getPublicUrl(data.path);
      
      setFooterImageUrl(publicUrl.publicUrl);
      toast({ title: "Sucesso", description: "Imagem de rodapé enviada com sucesso" });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem", variant: "destructive" });
    } finally {
      setUploadingFooterImage(false);
    }
  };

  useEffect(() => {
    if (editingForm) {
      setTitle(editingForm.title);
      setDescription(editingForm.description || "");
      setIsPublished(editingForm.is_published);
      setIsPublic((editingForm as any).is_public || false);
      setFields(editingForm.structure_json?.fields || []);
      setLogoUrl(editingForm.structure_json?.theme?.logoUrl || null);
      setLogoPosition(editingForm.structure_json?.theme?.logoPosition || 'center');
      setFooterImageUrl(editingForm.structure_json?.theme?.footerImageUrl || null);
      setFooterImagePosition(editingForm.structure_json?.theme?.footerImagePosition || 'center');
    } else {
      setTitle("");
      setDescription("");
      setIsPublished(false);
      setIsPublic(false);
      setFields([]);
      setLogoUrl(null);
      setLogoPosition('center');
      setFooterImageUrl(null);
      setFooterImagePosition('center');
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
      label: type === 'message' ? 'Mensagem Informativa' : `Campo ${fields.length + 1}`,
      required: type === 'message' ? false : false, // message fields are never required
      placeholder: '',
      content: type === 'message' ? 'Digite aqui o texto da mensagem...' : undefined,
      options: ['select', 'multiselect'].includes(type) 
        ? ['Opção 1', 'Opção 2'] 
        : undefined,
      validation: type === 'rating' 
        ? { max: 5 } 
        : type === 'file' 
          ? { pattern: '.pdf,.jpg,.png,.doc,.docx' }
          : undefined,
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
          logoUrl: logoUrl || undefined,
          logoPosition: logoPosition,
          footerImageUrl: footerImageUrl || undefined,
          footerImagePosition: footerImagePosition,
        }
      };

      const formData = {
        title: title.trim(),
        description: description.trim() || undefined,
        structure_json: structure,
        is_published: isPublished,
        is_public: isPublic,
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingForm ? "Editar Formulário" : "Criar Novo Formulário"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[calc(90vh-120px)]">
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={!isPublished}
                  />
                  <Label htmlFor="public" className={!isPublished ? "text-muted-foreground" : ""}>
                    Permitir acesso público (sem login)
                  </Label>
                </div>
                {isPublished && !isPublic && (
                  <p className="text-xs text-muted-foreground">
                    Formulário interno: apenas usuários autenticados podem responder
                  </p>
                )}

                {/* Logo Upload Section */}
                <div className="space-y-3 pt-4 border-t">
                  <Label>Logo/Imagem do Formulário</Label>
                  
                  {logoUrl ? (
                    <div className="relative border rounded-lg p-2">
                      <img 
                        src={logoUrl} 
                        alt="Logo do formulário" 
                        className="max-h-24 mx-auto object-contain"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setLogoUrl(null)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                        className="hidden"
                        id="logo-upload"
                        disabled={uploadingLogo}
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">
                          {uploadingLogo ? 'Enviando...' : 'Clique para adicionar logo'}
                        </p>
                        <p className="text-xs text-muted-foreground">Máx 5MB</p>
                      </label>
                    </div>
                  )}
                  
                  {logoUrl && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Posição:</Label>
                      <Select value={logoPosition} onValueChange={(v: 'left' | 'center' | 'right') => setLogoPosition(v)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Footer Image Upload Section */}
                <div className="space-y-3 pt-4 border-t">
                  <Label>Imagem de Rodapé (Final do Formulário)</Label>
                  
                  {footerImageUrl ? (
                    <div className="relative border rounded-lg p-2">
                      <img 
                        src={footerImageUrl} 
                        alt="Imagem de rodapé" 
                        className="max-h-24 mx-auto object-contain"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setFooterImageUrl(null)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFooterImageUpload(e.target.files[0])}
                        className="hidden"
                        id="footer-image-upload"
                        disabled={uploadingFooterImage}
                      />
                      <label htmlFor="footer-image-upload" className="cursor-pointer">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">
                          {uploadingFooterImage ? 'Enviando...' : 'Clique para adicionar imagem'}
                        </p>
                        <p className="text-xs text-muted-foreground">Máx 5MB</p>
                      </label>
                    </div>
                  )}
                  
                  {footerImageUrl && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Posição:</Label>
                      <Select value={footerImagePosition} onValueChange={(v: 'left' | 'center' | 'right') => setFooterImagePosition(v)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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