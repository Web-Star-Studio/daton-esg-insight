import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  MoreVertical,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MinusCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getGRIContentIndex, 
  deleteGRIContentIndexItem,
  exportGRIContentIndex,
  GRIContentIndexItem 
} from '@/services/griContentIndex';
import { GRIContentIndexItemModal } from './GRIContentIndexItemModal';

interface GRIContentIndexTableProps {
  reportId: string;
  refreshTrigger?: number;
}

export function GRIContentIndexTable({ reportId, refreshTrigger }: GRIContentIndexTableProps) {
  const [items, setItems] = useState<GRIContentIndexItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GRIContentIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<GRIContentIndexItem | null>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadItems();
  }, [reportId, refreshTrigger]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getGRIContentIndex(reportId);
      setItems(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar índice',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.indicator_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.indicator_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.disclosure_status === statusFilter);
    }

    setFilteredItems(filtered);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Deseja remover este item do índice?')) return;

    try {
      await deleteGRIContentIndexItem(itemId);
      toast({ title: 'Item removido com sucesso' });
      loadItems();
    } catch (error) {
      toast({
        title: 'Erro ao remover item',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setExporting(true);
      const blob = await exportGRIContentIndex(reportId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `indice-gri-${reportId}.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      
      toast({ title: `Índice exportado em ${format.toUpperCase()}` });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fully_reported': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partially_reported': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'omitted': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not_applicable': return <MinusCircle className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'fully_reported': return 'Atendido';
      case 'partially_reported': return 'Parcial';
      case 'omitted': return 'Omitido';
      case 'not_applicable': return 'N/A';
      default: return status;
    }
  };

  const stats = {
    total: items.length,
    reported: items.filter(i => i.disclosure_status === 'fully_reported').length,
    partial: items.filter(i => i.disclosure_status === 'partially_reported').length,
    omitted: items.filter(i => i.disclosure_status === 'omitted').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando índice GRI...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Índice de Conteúdo GRI</CardTitle>
          <CardDescription>
            Nenhum indicador foi identificado ainda. Use o gerador automático acima.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Índice de Conteúdo GRI
              </CardTitle>
              <CardDescription>
                Mapeamento completo de indicadores GRI para localização no relatório
              </CardDescription>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exporting}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <p className="text-sm text-green-700 dark:text-green-300">Atendidos</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">{stats.reported}</p>
            </div>
            <div className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Parciais</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{stats.partial}</p>
            </div>
            <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
              <p className="text-sm text-red-700 dark:text-red-300">Omitidos</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">{stats.omitted}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="fully_reported">Atendido</option>
              <option value="partially_reported">Parcial</option>
              <option value="omitted">Omitido</option>
              <option value="not_applicable">N/A</option>
            </select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Indicador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[180px]">Localização</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px]">Confiança</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-medium">
                      {item.indicator_code}
                    </TableCell>
                    <TableCell>{item.indicator_title}</TableCell>
                    <TableCell>
                      {item.section_reference || `p.${item.page_number || '-'}`}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          item.disclosure_status === 'fully_reported' ? 'default' :
                          item.disclosure_status === 'partially_reported' ? 'secondary' :
                          'outline'
                        }
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(item.disclosure_status)}
                        {getStatusLabel(item.disclosure_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.ai_confidence_score ? (
                        <Badge variant="outline">
                          {(item.ai_confidence_score * 100).toFixed(0)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingItem(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Mostrando {filteredItems.length} de {items.length} indicadores
          </p>
        </CardContent>
      </Card>

      {editingItem && (
        <GRIContentIndexItemModal
          item={editingItem}
          reportId={reportId}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            loadItems();
          }}
        />
      )}
    </>
  );
}
