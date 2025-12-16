import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, Pencil, Trash2, ArrowLeft, FileText, Link as LinkIcon, 
  ClipboardList, BookOpen, ExternalLink 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getTrainingMaterials,
  getSupplierCategories,
  createTrainingMaterial,
  updateTrainingMaterial,
  deleteTrainingMaterial,
  SupplierTrainingMaterial,
  SupplierCategory,
  materialTypeLabels,
} from "@/services/supplierManagementService";
import { customFormsService, CustomForm } from "@/services/customForms";

const materialTypeIcons = {
  arquivo: FileText,
  link: LinkIcon,
  questionario: ClipboardList,
};

export default function SupplierTrainingMaterialsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<SupplierTrainingMaterial | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    material_type: "arquivo" as 'arquivo' | 'link' | 'questionario',
    external_url: "",
    custom_form_id: "",
    is_mandatory: false,
    due_days: 0,
    category_ids: [] as string[],
  });

  const { data: materials, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-training-materials'],
    queryFn: getTrainingMaterials,
  });

  const { data: categories } = useQuery({
    queryKey: ['supplier-categories'],
    queryFn: getSupplierCategories,
  });

  const { data: customForms } = useQuery({
    queryKey: ['custom-forms'],
    queryFn: () => customFormsService.getForms(),
  });

  const createMutation = useMutation({
    mutationFn: createTrainingMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-training-materials'] });
      toast({ title: "Material criado com sucesso!" });
      closeModal();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar material", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTrainingMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-training-materials'] });
      toast({ title: "Material atualizado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar material", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrainingMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-training-materials'] });
      toast({ title: "Material excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir material", variant: "destructive" });
    },
  });

  const openModal = (material?: SupplierTrainingMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        title: material.title,
        description: material.description || "",
        material_type: material.material_type,
        external_url: material.external_url || "",
        custom_form_id: material.custom_form_id || "",
        is_mandatory: material.is_mandatory,
        due_days: material.due_days || 0,
        category_ids: material.categories?.map(c => c.id) || [],
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        title: "",
        description: "",
        material_type: "arquivo",
        external_url: "",
        custom_form_id: "",
        is_mandatory: false,
        due_days: 0,
        category_ids: [],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }

    if (formData.material_type === 'link' && !formData.external_url.trim()) {
      toast({ title: "URL é obrigatória para links", variant: "destructive" });
      return;
    }

    if (formData.material_type === 'questionario' && !formData.custom_form_id) {
      toast({ title: "Selecione um formulário", variant: "destructive" });
      return;
    }

    const submitData = {
      title: formData.title,
      description: formData.description || undefined,
      material_type: formData.material_type,
      external_url: formData.material_type === 'link' ? formData.external_url : undefined,
      custom_form_id: formData.material_type === 'questionario' ? formData.custom_form_id : undefined,
      is_mandatory: formData.is_mandatory,
      due_days: formData.is_mandatory ? formData.due_days : undefined,
      category_ids: formData.category_ids,
    };

    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const toggleActive = (material: SupplierTrainingMaterial) => {
    updateMutation.mutate({ 
      id: material.id, 
      data: { is_active: !material.is_active } 
    });
  };

  const TypeIcon = materialTypeIcons[formData.material_type];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedores/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Treinamentos e Informativos</h1>
              <p className="text-muted-foreground mt-1">
                Materiais educacionais, links e questionários para fornecedores
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Cadastre <strong>arquivos</strong>, <strong>links</strong> ou <strong>questionários</strong> (formulários customizados) 
              e vincule-os às <strong>Categorias de Fornecedor</strong> para segmentar o conteúdo.
            </p>
          </CardContent>
        </Card>

        {/* Materials Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Materiais Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              error={error?.message}
              retry={refetch}
              empty={!materials?.length}
              emptyMessage="Nenhum material cadastrado"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="w-28">Tipo</TableHead>
                    <TableHead>Categorias</TableHead>
                    <TableHead className="w-24 text-center">Obrigatório</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials?.map((material) => {
                    const Icon = materialTypeIcons[material.material_type];
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{material.title}</span>
                              {material.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                  {material.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {materialTypeLabels[material.material_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {material.categories?.map(cat => (
                              <Badge key={cat.id} variant="secondary" className="text-xs">
                                {cat.name}
                              </Badge>
                            ))}
                            {(!material.categories || material.categories.length === 0) && (
                              <span className="text-xs text-muted-foreground">Todas</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {material.is_mandatory ? (
                            <Badge variant="default">Sim</Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={material.is_active}
                              onCheckedChange={() => toggleActive(material)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {material.material_type === 'link' && material.external_url && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => window.open(material.external_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => openModal(material)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Deseja excluir este material?")) {
                                  deleteMutation.mutate(material.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "Editar Material" : "Novo Material de Treinamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Manual de Segurança Ambiental"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do material..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Material *</Label>
                <Select
                  value={formData.material_type}
                  onValueChange={(value: 'arquivo' | 'link' | 'questionario') =>
                    setFormData({ ...formData, material_type: value, external_url: "", custom_form_id: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arquivo">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Arquivo
                      </div>
                    </SelectItem>
                    <SelectItem value="link">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" /> Link
                      </div>
                    </SelectItem>
                    <SelectItem value="questionario">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> Questionário
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.material_type === 'arquivo' && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    📁 O upload de arquivos será implementado em breve. Por enquanto, use links para compartilhar arquivos.
                  </p>
                </div>
              )}

              {formData.material_type === 'link' && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {formData.material_type === 'questionario' && (
                <div className="space-y-2">
                  <Label>Formulário Customizado *</Label>
                  <Select
                    value={formData.custom_form_id}
                    onValueChange={(value) => setFormData({ ...formData, custom_form_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um formulário" />
                    </SelectTrigger>
                    <SelectContent>
                      {customForms?.filter(f => f.is_published).map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!customForms || customForms.filter(f => f.is_published).length === 0) && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum formulário publicado. Crie um formulário primeiro.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Categorias (opcional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecione as categorias de fornecedor que terão acesso a este material
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories?.filter(c => c.is_active).map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                        formData.category_ids.includes(category.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted'
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <Checkbox 
                        checked={formData.category_ids.includes(category.id)} 
                        className="pointer-events-none"
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                  ))}
                </div>
                {(!categories || categories.filter(c => c.is_active).length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma categoria cadastrada. O material ficará disponível para todos.
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Obrigatório</Label>
                    <p className="text-xs text-muted-foreground">
                      Fornecedores devem completar este material
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_mandatory}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                  />
                </div>

                {formData.is_mandatory && (
                  <div className="space-y-2">
                    <Label htmlFor="due_days">Prazo (dias)</Label>
                    <Input
                      id="due_days"
                      type="number"
                      min="1"
                      value={formData.due_days || ""}
                      onChange={(e) => setFormData({ ...formData, due_days: parseInt(e.target.value) || 0 })}
                      placeholder="Dias para completar"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingMaterial ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
