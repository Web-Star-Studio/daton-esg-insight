import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterListService } from '@/services/gedDocuments';
import { ListChecks, Download, Plus, Search, FileText, Calendar, Building, Users } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface DocumentMasterListModalProps {
  documentId?: string;
  documentName?: string;
}

export const DocumentMasterListModal: React.FC<DocumentMasterListModalProps> = ({
  documentId,
  documentName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingToMasterList, setIsAddingToMasterList] = useState(false);
  const [newMasterListItem, setNewMasterListItem] = useState({
    code: '',
    title: '',
    version: '1.0',
    effective_date: '',
    review_date: '',
    responsible_department: '',
    distribution_list: [] as string[]
  });
  const queryClient = useQueryClient();

  const { data: masterListItems, isLoading } = useQuery({
    queryKey: ['master-list'],
    queryFn: () => masterListService.getMasterList(),
  });

  const addToMasterListMutation = useMutation({
    mutationFn: (data: any) => masterListService.addToMasterList(data),
    onSuccess: () => {
      toast.success('Documento adicionado à Lista Mestra');
      queryClient.invalidateQueries({ queryKey: ['master-list'] });
      setIsAddingToMasterList(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao adicionar documento à Lista Mestra');
    }
  });

  const removeFromMasterListMutation = useMutation({
    mutationFn: (id: string) => masterListService.removeFromMasterList(id),
    onSuccess: () => {
      toast.success('Documento removido da Lista Mestra');
      queryClient.invalidateQueries({ queryKey: ['master-list'] });
    },
    onError: () => {
      toast.error('Erro ao remover documento da Lista Mestra');
    }
  });

  const resetForm = () => {
    setNewMasterListItem({
      code: '',
      title: documentName || '',
      version: '1.0',
      effective_date: '',
      review_date: '',
      responsible_department: '',
      distribution_list: []
    });
  };

  const handleAddToMasterList = () => {
    if (!documentId) {
      toast.error('ID do documento não fornecido');
      return;
    }

    if (!newMasterListItem.code.trim() || !newMasterListItem.title.trim()) {
      toast.error('Código e título são obrigatórios');
      return;
    }

    addToMasterListMutation.mutate({
      ...newMasterListItem,
      document_id: documentId,
      company_id: 'current-company', // TODO: Get current company ID
    });
  };

  const generatePDFReport = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.text('Lista Mestra de Documentos', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 45, { align: 'center' });
      
      let yPosition = 70;
      const lineHeight = 8;
      
      // Table header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Código', 20, yPosition);
      doc.text('Título', 50, yPosition);
      doc.text('Versão', 120, yPosition);
      doc.text('Vigência', 140, yPosition);
      doc.text('Revisão', 170, yPosition);
      
      yPosition += lineHeight;
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 5;
      
      // Table content
      doc.setFont('helvetica', 'normal');
      masterListItems?.forEach((item) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.text(item.code, 20, yPosition);
        doc.text(item.title.substring(0, 30), 50, yPosition);
        doc.text(item.version, 120, yPosition);
        doc.text(item.effective_date ? new Date(item.effective_date).toLocaleDateString('pt-BR') : '-', 140, yPosition);
        doc.text(item.review_date ? new Date(item.review_date).toLocaleDateString('pt-BR') : '-', 170, yPosition);
        
        yPosition += lineHeight;
      });
      
      doc.save('lista-mestra-documentos.pdf');
      toast.success('Relatório PDF gerado com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar relatório PDF');
    }
  };

  const generateExcelReport = async () => {
    try {
      const data = masterListItems?.map(item => ({
        'Código': item.code,
        'Título': item.title,
        'Versão': item.version,
        'Data de Vigência': item.effective_date ? new Date(item.effective_date).toLocaleDateString('pt-BR') : '',
        'Data de Revisão': item.review_date ? new Date(item.review_date).toLocaleDateString('pt-BR') : '',
        'Departamento Responsável': item.responsible_department || '',
        'Status': item.is_active ? 'Ativo' : 'Inativo',
        'Data de Criação': new Date(item.created_at).toLocaleDateString('pt-BR')
      })) || [];
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lista Mestra');
      
      XLSX.writeFile(wb, 'lista-mestra-documentos.xlsx');
      toast.success('Relatório Excel gerado com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar relatório Excel');
    }
  };

  const filteredItems = masterListItems?.filter(item =>
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.responsible_department && item.responsible_department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (item: any) => {
    if (!item.is_active) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    
    const reviewDate = item.review_date ? new Date(item.review_date) : null;
    const today = new Date();
    
    if (reviewDate && reviewDate < today) {
      return <Badge variant="destructive">Revisão Vencida</Badge>;
    }
    
    if (reviewDate && reviewDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Revisão Próxima</Badge>;
    }
    
    return <Badge variant="default">Ativo</Badge>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ListChecks className="h-4 w-4" />
          Lista Mestra
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Lista Mestra de Documentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, título ou departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex gap-2">
              {documentId && (
                <Button
                  variant="outline"
                  onClick={() => setIsAddingToMasterList(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar à Lista
                </Button>
              )}
              <Button
                variant="outline"
                onClick={generatePDFReport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={generateExcelReport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>

          {/* Add to Master List Form */}
          {isAddingToMasterList && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Adicionar à Lista Mestra</CardTitle>
                <CardDescription>
                  Configure as informações do documento para a Lista Mestra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Código do Documento*</Label>
                    <Input
                      id="code"
                      value={newMasterListItem.code}
                      onChange={(e) => setNewMasterListItem(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Ex: DOC-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Título*</Label>
                    <Input
                      id="title"
                      value={newMasterListItem.title}
                      onChange={(e) => setNewMasterListItem(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do documento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Versão</Label>
                    <Input
                      id="version"
                      value={newMasterListItem.version}
                      onChange={(e) => setNewMasterListItem(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="responsible_department">Departamento Responsável</Label>
                    <Input
                      id="responsible_department"
                      value={newMasterListItem.responsible_department}
                      onChange={(e) => setNewMasterListItem(prev => ({ ...prev, responsible_department: e.target.value }))}
                      placeholder="Nome do departamento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="effective_date">Data de Vigência</Label>
                    <Input
                      id="effective_date"
                      type="date"
                      value={newMasterListItem.effective_date}
                      onChange={(e) => setNewMasterListItem(prev => ({ ...prev, effective_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="review_date">Data de Revisão</Label>
                    <Input
                      id="review_date"
                      type="date"
                      value={newMasterListItem.review_date}
                      onChange={(e) => setNewMasterListItem(prev => ({ ...prev, review_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAddToMasterList}
                    disabled={addToMasterListMutation.isPending}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar à Lista Mestra
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingToMasterList(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Master List Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Documentos na Lista Mestra</span>
                <Badge variant="outline">{filteredItems?.length || 0} documentos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[50vh] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Carregando lista mestra...</div>
                  </div>
                ) : !filteredItems?.length ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Nenhum documento encontrado' : 'Lista mestra vazia'}
                    </p>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchTerm('')}
                        className="mt-2"
                      >
                        Limpar filtro
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item) => (
                      <Card key={item.id} className="transition-all hover:shadow-sm">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="font-mono">
                                  {item.code}
                                </Badge>
                                {getStatusBadge(item)}
                              </div>
                              
                              <h4 className="font-medium text-sm mb-2">{item.title}</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Versão: {item.version}
                                </div>
                                {item.responsible_department && (
                                  <div className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {item.responsible_department}
                                  </div>
                                )}
                                {item.effective_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Vigência: {new Date(item.effective_date).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>

                              {item.review_date && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Revisão: {new Date(item.review_date).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              )}

                              {item.distribution_list && item.distribution_list.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Distribuição: {item.distribution_list.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromMasterListMutation.mutate(item.id)}
                                disabled={removeFromMasterListMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};