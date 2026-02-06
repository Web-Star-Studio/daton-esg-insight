import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, ClipboardList, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getSupplierSurveys, createSupplierSurvey, updateSupplierSurvey, deleteSupplierSurvey, getSurveyResponses, SupplierSurvey } from '@/services/supplierPortalService';
import { formatDateDisplay } from '@/utils/dateUtils';
import { useCompany } from '@/contexts/CompanyContext';

export default function SupplierSurveysManagementPage() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  
  const [surveys, setSurveys] = useState<SupplierSurvey[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customForms, setCustomForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResponsesOpen, setIsResponsesOpen] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<SupplierSurvey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    custom_form_id: '',
    category_id: '',
    is_mandatory: false,
    due_days: '',
    is_active: true,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedCompany?.id]);

  async function loadData() {
    if (!selectedCompany?.id) return;
    
    try {
      const surveysData = await getSupplierSurveys(selectedCompany.id);
      
      const categoriesResult = await supabase
        .from('supplier_categories')
        .select('id, name')
        .eq('company_id', selectedCompany.id)
        .order('name');
      
      const formsResult = await supabase
        .from('custom_forms')
        .select('id, title')
        .eq('company_id', selectedCompany.id);
      
      setSurveys(surveysData);
      setCategories(categoriesResult.data || []);
      setCustomForms((formsResult.data || []).filter((f: any) => f.is_active !== false));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (survey: SupplierSurvey) => {
    setSelectedSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description || '',
      custom_form_id: survey.custom_form_id || '',
      category_id: survey.category_id || '',
      is_mandatory: survey.is_mandatory,
      due_days: survey.due_days?.toString() || '',
      is_active: survey.is_active,
      start_date: survey.start_date || '',
      end_date: survey.end_date || ''
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedSurvey(null);
    setFormData({
      title: '',
      description: '',
      custom_form_id: '',
      category_id: '',
      is_mandatory: false,
      due_days: '',
      is_active: true,
      start_date: '',
      end_date: ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCompany?.id || !formData.title.trim()) return;
    
    setIsSaving(true);
    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        custom_form_id: formData.custom_form_id === 'none' ? null : (formData.custom_form_id || null),
        category_id: formData.category_id === 'all' ? null : (formData.category_id || null),
        is_mandatory: formData.is_mandatory,
        due_days: formData.due_days ? parseInt(formData.due_days) : null,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        company_id: selectedCompany.id
      };

      if (selectedSurvey) {
        await updateSupplierSurvey(selectedSurvey.id, data);
        toast({ title: 'Sucesso', description: 'Pesquisa atualizada com sucesso' });
      } else {
        await createSupplierSurvey(data as any);
        toast({ title: 'Sucesso', description: 'Pesquisa criada com sucesso' });
      }
      
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving survey:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro ao salvar', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pesquisa?')) return;
    
    try {
      await deleteSupplierSurvey(id);
      toast({ title: 'Sucesso', description: 'Pesquisa excluída com sucesso' });
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleViewResponses = async (survey: SupplierSurvey) => {
    try {
      const data = await getSurveyResponses(survey.id);
      setResponses(data);
      setSelectedSurvey(survey);
      setIsResponsesOpen(true);
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pesquisas e Questionários</h1>
          <p className="text-muted-foreground">Gerencie pesquisas para seus fornecedores responderem</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pesquisa
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : surveys.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma pesquisa cadastrada</h3>
              <p className="text-muted-foreground mb-4">Crie pesquisas para seus fornecedores</p>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Pesquisa
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Formulário</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{survey.title}</p>
                          {survey.is_mandatory && <Badge variant="destructive">Obrigatório</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{survey.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {survey.custom_form?.title || '-'}
                    </TableCell>
                    <TableCell>
                      {survey.category?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {survey.due_days ? `${survey.due_days} dias` : survey.end_date ? formatDateDisplay(survey.end_date) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={survey.is_active ? 'default' : 'secondary'}>
                        {survey.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewResponses(survey)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(survey)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(survey.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSurvey ? 'Editar Pesquisa' : 'Nova Pesquisa'}</DialogTitle>
            <DialogDescription>
              {selectedSurvey ? 'Atualize os dados da pesquisa' : 'Crie uma nova pesquisa para fornecedores'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Avaliação de Satisfação 2024"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição da pesquisa"
                rows={2}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Formulário Customizado</Label>
                <Select value={formData.custom_form_id} onValueChange={(v) => setFormData({ ...formData, custom_form_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um formulário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {customForms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Prazo (dias)</Label>
                <Input
                  type="number"
                  value={formData.due_days}
                  onChange={(e) => setFormData({ ...formData, due_days: e.target.value })}
                  placeholder="Ex: 30"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_mandatory}
                  onCheckedChange={(v) => setFormData({ ...formData, is_mandatory: v })}
                />
                <Label>Obrigatória</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>Ativa</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.title.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedSurvey ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Responses Dialog */}
      <Dialog open={isResponsesOpen} onOpenChange={setIsResponsesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respostas da Pesquisa</DialogTitle>
            <DialogDescription>{selectedSurvey?.title}</DialogDescription>
          </DialogHeader>
          
          {responses.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma resposta registrada</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {responses.map((resp) => (
                <div key={resp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium">Fornecedor ID: {resp.supplier_id}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={resp.status === 'Concluído' ? 'default' : 'outline'}>
                        {resp.status}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {resp.completed_at ? formatDateDisplay(resp.completed_at) : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
