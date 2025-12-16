import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, FileText, Users, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getMandatoryReadings, createMandatoryReading, updateMandatoryReading, deleteMandatoryReading, getReadingConfirmations, MandatoryReading } from '@/services/supplierPortalService';
import { useCompany } from '@/contexts/CompanyContext';

export default function SupplierMandatoryReadingsPage() {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [readings, setReadings] = useState<MandatoryReading[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationsOpen, setIsConfirmationsOpen] = useState(false);
  const [confirmations, setConfirmations] = useState<any[]>([]);
  const [selectedReading, setSelectedReading] = useState<MandatoryReading | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    file_path: '',
    category_id: '',
    is_active: true,
    requires_confirmation: true
  });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user?.companyId) return;
    
    try {
      const [readingsData, categoriesData] = await Promise.all([
        getMandatoryReadings(user.companyId),
        supabase.from('supplier_categories').select('id, name').eq('company_id', user.companyId).order('name')
      ]);
      
      setReadings(readingsData);
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (reading: MandatoryReading) => {
    setSelectedReading(reading);
    setFormData({
      title: reading.title,
      description: reading.description || '',
      content: reading.content || '',
      file_path: reading.file_path || '',
      category_id: reading.category_id || '',
      is_active: reading.is_active,
      requires_confirmation: reading.requires_confirmation
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedReading(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      file_path: '',
      category_id: '',
      is_active: true,
      requires_confirmation: true
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.companyId || !formData.title.trim()) return;
    
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        company_id: user.companyId,
        category_id: formData.category_id || null
      };

      if (selectedReading) {
        await updateMandatoryReading(selectedReading.id, data);
        toast({ title: 'Sucesso', description: 'Leitura atualizada com sucesso' });
      } else {
        await createMandatoryReading(data as any);
        toast({ title: 'Sucesso', description: 'Leitura criada com sucesso' });
      }
      
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta leitura?')) return;
    
    try {
      await deleteMandatoryReading(id);
      toast({ title: 'Sucesso', description: 'Leitura excluída com sucesso' });
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleViewConfirmations = async (reading: MandatoryReading) => {
    try {
      const data = await getReadingConfirmations(reading.id);
      setConfirmations(data);
      setSelectedReading(reading);
      setIsConfirmationsOpen(true);
    } catch (error) {
      console.error('Error loading confirmations:', error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leituras Obrigatórias</h1>
            <p className="text-muted-foreground">Gerencie os documentos de leitura obrigatória para fornecedores</p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Leitura
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : readings.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhuma leitura cadastrada</h3>
                <p className="text-muted-foreground mb-4">Crie leituras obrigatórias para seus fornecedores</p>
                <Button onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Leitura
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Confirmação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reading.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{reading.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {reading.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {reading.requires_confirmation ? (
                          <Badge variant="outline">Requer confirmação</Badge>
                        ) : (
                          <Badge variant="secondary">Livre</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reading.is_active ? 'default' : 'secondary'}>
                          {reading.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewConfirmations(reading)}>
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(reading)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(reading.id)}>
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
              <DialogTitle>{selectedReading ? 'Editar Leitura' : 'Nova Leitura Obrigatória'}</DialogTitle>
              <DialogDescription>
                {selectedReading ? 'Atualize os dados da leitura' : 'Crie uma nova leitura obrigatória para fornecedores'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Política de Segurança 2024"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição do documento"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Conteúdo (HTML)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Conteúdo do documento em HTML..."
                  rows={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label>URL do Arquivo (alternativo)</Label>
                <Input
                  value={formData.file_path}
                  onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.requires_confirmation}
                    onCheckedChange={(v) => setFormData({ ...formData, requires_confirmation: v })}
                  />
                  <Label>Requer confirmação de leitura</Label>
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
                {selectedReading ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmations Dialog */}
        <Dialog open={isConfirmationsOpen} onOpenChange={setIsConfirmationsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmações de Leitura</DialogTitle>
              <DialogDescription>{selectedReading?.title}</DialogDescription>
            </DialogHeader>
            
            {confirmations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhuma confirmação registrada</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {confirmations.map((conf) => (
                  <div key={conf.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Fornecedor ID: {conf.supplier_id}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(conf.confirmed_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
