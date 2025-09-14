import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Filter, 
  Eye,
  AlertTriangle,
  FileText,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  documentExtractionService, 
  ExtractionItem, 
  FileRecord 
} from "@/services/documentExtraction";

const DocumentReconciliation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('file_id');
  const extractionId = searchParams.get('extraction_id');

  const [items, setItems] = useState<ExtractionItem[]>([]);
  const [fileRecord, setFileRecord] = useState<FileRecord | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    status: 'all',
    confidence: 'all',
    search: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (extractionId && fileId) {
      loadData();
    } else {
      toast.error('IDs de extração ou arquivo não encontrados');
      navigate('/licenciamento/analise');
    }
  }, [extractionId, fileId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!extractionId || !fileId) return;
      
      const [itemsData, fileData] = await Promise.all([
        documentExtractionService.getExtractionItems(extractionId),
        documentExtractionService.getFile(fileId)
      ]);
      
      setItems(itemsData);
      setFileRecord(fileData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados da extração');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setEditingItem(itemId);
      setEditValues({ [itemId]: item.extracted_value || '' });
    }
  };

  const handleSaveEdit = async (itemId: string) => {
    try {
      const newValue = editValues[itemId];
      if (newValue !== undefined) {
        await documentExtractionService.updateExtractionItem(itemId, {
          extracted_value: newValue,
          status: 'edited'
        });
        
        setItems(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, extracted_value: newValue, status: 'edited' }
            : item
        ));
        
        setEditingItem(null);
        setEditValues(prev => {
          const { [itemId]: _, ...rest } = prev;
          return rest;
        });
        
        toast.success('Item atualizado com sucesso');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const handleCancelEdit = (itemId: string) => {
    setEditingItem(null);
    setEditValues(prev => {
      const { [itemId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleApproveSelected = async () => {
    if (selectedItems.size === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    try {
      await documentExtractionService.approveItems(
        extractionId!,
        Array.from(selectedItems)
      );
      
      setItems(prev => prev.map(item =>
        selectedItems.has(item.id)
          ? { ...item, status: 'approved' }
          : item
      ));
      
      setSelectedItems(new Set());
      toast.success(`${selectedItems.size} itens aprovados`);
    } catch (error) {
      console.error('Error approving items:', error);
      toast.error('Erro ao aprovar itens');
    }
  };

  const handleRejectSelected = async () => {
    if (selectedItems.size === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    try {
      await documentExtractionService.rejectItems(
        extractionId!,
        Array.from(selectedItems)
      );
      
      setItems(prev => prev.map(item =>
        selectedItems.has(item.id)
          ? { ...item, status: 'rejected' }
          : item
      ));
      
      setSelectedItems(new Set());
      toast.success(`${selectedItems.size} itens rejeitados`);
    } catch (error) {
      console.error('Error rejecting items:', error);
      toast.error('Erro ao rejeitar itens');
    }
  };

  const handleApproveHighConfidence = async () => {
    const highConfidenceItems = items.filter(item => 
      item.confidence >= 0.7 && item.status === 'pending'
    );
    
    if (highConfidenceItems.length === 0) {
      toast.info('Nenhum item com confiança >= 70%');
      return;
    }

    try {
      await documentExtractionService.approveItems(
        extractionId!,
        highConfidenceItems.map(item => item.id)
      );
      
      setItems(prev => prev.map(item =>
        highConfidenceItems.some(hci => hci.id === item.id)
          ? { ...item, status: 'approved' }
          : item
      ));
      
      toast.success(`${highConfidenceItems.length} itens aprovados automaticamente`);
    } catch (error) {
      console.error('Error auto-approving:', error);
      toast.error('Erro na aprovação automática');
    }
  };

  const handleNext = () => {
    const approvedCount = items.filter(item => item.status === 'approved').length;
    
    if (approvedCount === 0) {
      toast.error('Aprove pelo menos um item antes de prosseguir');
      return;
    }
    
    toast.success(`${approvedCount} itens foram aprovados e importados`);
    navigate('/licenciamento');
  };

  const handleViewFile = async () => {
    if (fileRecord) {
      try {
        const url = await documentExtractionService.getFileUrl(fileRecord.storage_path);
        window.open(url, '_blank');
      } catch (error) {
        toast.error('Erro ao abrir arquivo');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'edited':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Editado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-100 text-green-800">Alta ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Média ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge variant="destructive">Baixa ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  const filteredItems = items.filter(item => {
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.confidence === 'high' && item.confidence < 0.7) return false;
    if (filters.confidence === 'low' && item.confidence >= 0.7) return false;
    if (filters.search && !item.field_name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !item.extracted_value?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: items.length,
    approved: items.filter(i => i.status === 'approved').length,
    pending: items.filter(i => i.status === 'pending').length,
    highConfidence: items.filter(i => i.confidence >= 0.7).length
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando dados de extração...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Reconciliação de Dados</h1>
          <p className="text-muted-foreground">
            Etapa 3 de 6: Revise e aprove os dados extraídos
          </p>
        </div>

        {/* File Info */}
        {fileRecord && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{fileRecord.original_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(fileRecord.size_bytes / 1024 / 1024).toFixed(1)}MB • 
                      Processado em {new Date(fileRecord.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleViewFile}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver arquivo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total de itens</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.highConfidence}</div>
              <p className="text-sm text-muted-foreground">Alta confiança</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ações em Lote</span>
              <div className="flex gap-2">
                <Button
                  onClick={handleApproveHighConfidence}
                  variant="outline"
                  size="sm"
                  disabled={stats.highConfidence === 0}
                >
                  Aprovar Tudo &gt; 70%
                </Button>
                <Button
                  onClick={handleApproveSelected}
                  disabled={selectedItems.size === 0}
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar Selecionados ({selectedItems.size})
                </Button>
                <Button
                  onClick={handleRejectSelected}
                  disabled={selectedItems.size === 0}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar Selecionados
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <Input
                  placeholder="Campo ou valor..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="edited">Editado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confiança</label>
                <Select value={filters.confidence} onValueChange={(value) => setFilters(prev => ({ ...prev, confidence: value }))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta (&ge;70%)</SelectItem>
                    <SelectItem value="low">Baixa (&lt;70%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => setFilters({ status: 'all', confidence: 'all', search: '' })}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Valor Extraído</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Confiança</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.field_name}
                      {item.row_index !== undefined && (
                        <Badge variant="outline" className="ml-2">
                          #{item.row_index + 1}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === item.id ? (
                        <Input
                          value={editValues[item.id] || ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="min-w-[200px]"
                          autoFocus
                        />
                      ) : (
                        <span className={cn(
                          "block max-w-[300px] truncate",
                          !item.extracted_value && "text-muted-foreground italic"
                        )}>
                          {item.extracted_value || 'Valor não extraído'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[200px] truncate text-sm text-muted-foreground">
                        {item.source_text || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getConfidenceBadge(item.confidence)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {editingItem === item.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(item.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelEdit(item.id)}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item.id)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum item encontrado com os filtros atuais</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleNext}
            size="lg"
            disabled={stats.approved === 0}
            className="min-w-[200px]"
          >
            Importar Aprovados
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentReconciliation;