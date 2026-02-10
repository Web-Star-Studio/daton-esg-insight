import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Building2, Loader2, Pencil, Trash2 } from 'lucide-react';
import { SupplierManagementModal } from '@/components/suppliers/SupplierManagementModal';
import {
  deleteEmissionSupplier,
  getEmissionSuppliers,
  type EmissionSupplier,
} from '@/services/emissionSuppliersGateway';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Fornecedores() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Array<EmissionSupplier>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<EmissionSupplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await getEmissionSuppliers();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os fornecedores.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      await deleteEmissionSupplier(id);

      toast({
        title: 'Fornecedor excluído',
        description: 'O fornecedor foi removido com sucesso.',
      });
      
      await loadSuppliers();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o fornecedor.',
        variant: 'destructive',
      });
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      goods: 'Bens Adquiridos',
      services: 'Serviços',
      transport: 'Transporte',
      waste: 'Resíduos',
      business_travel: 'Viagens',
      other: 'Outros'
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando fornecedores...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie fornecedores para cálculo de Escopo 3</p>
        </div>
        <Button onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <div className="text-sm text-muted-foreground">Total de Fornecedores</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Fornecedores Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca.' : 'Comece adicionando fornecedores para mapear suas emissões de Escopo 3.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Escopo 3</TableHead>
                  <TableHead className="text-right">Emissões (tCO₂e/ano)</TableHead>
                  <TableHead className="text-center">Inventário Próprio</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getCategoryLabel(supplier.category)}</Badge>
                    </TableCell>
                    <TableCell>Cat. {supplier.scope_3_category}</TableCell>
                    <TableCell className="text-right font-mono">
                      {supplier.annual_emissions_estimate 
                        ? supplier.annual_emissions_estimate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {supplier.has_inventory ? (
                        <Badge className="bg-success/10 text-success border-success/20">Sim</Badge>
                      ) : (
                        <Badge variant="secondary">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent"
                          onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal */}
      <SupplierManagementModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSupplier(null); }}
        onSuccess={loadSuppliers}
        editingSupplier={editingSupplier}
      />
    </div>
  );
}
