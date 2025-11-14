import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { costCenters, CostCenter } from '@/services/costCenters';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CentroCustos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const queryClient = useQueryClient();

  const { data: centers, isLoading } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: costCenters.getCostCenters,
  });

  const createMutation = useMutation({
    mutationFn: costCenters.createCostCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      setDialogOpen(false);
      setEditingCenter(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CostCenter> }) =>
      costCenters.updateCostCenter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      setDialogOpen(false);
      setEditingCenter(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: costCenters.deleteCostCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const centerData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string || undefined,
      department: formData.get('department') as string || undefined,
      budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
      description: formData.get('description') as string || undefined,
      status: (formData.get('status') as 'ativo' | 'inativo') || 'ativo',
    };

    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data: centerData });
    } else {
      createMutation.mutate(centerData);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centros de Custo</h1>
          <p className="text-muted-foreground">Gerenciamento de centros de custo e departamentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCenter(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Centro de Custo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCenter ? 'Editar' : 'Criar'} Centro de Custo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCenter?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={editingCenter?.code}
                />
              </div>
              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  name="department"
                  defaultValue={editingCenter?.department}
                />
              </div>
              <div>
                <Label htmlFor="budget">Orçamento</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  defaultValue={editingCenter?.budget}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingCenter?.description}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingCenter?.status || 'ativo'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingCenter ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centros de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centers?.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-mono">{center.code || '-'}</TableCell>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>{center.department || '-'}</TableCell>
                    <TableCell>
                      {center.budget 
                        ? Number(center.budget).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.status === 'ativo' ? 'default' : 'secondary'}>
                        {center.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCenter(center);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(center.id)}
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
    </div>
  );
}
