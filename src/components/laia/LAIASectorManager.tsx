import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useLAIASectors, 
  useCreateLAIASector, 
  useUpdateLAIASector, 
  useDeleteLAIASector,
  useLAIAAssessments,
  useBulkDeleteLAIASectors,
} from "@/hooks/useLAIA";
import { Plus, Pencil, Trash2, Building2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LAIASector } from "@/types/laia";

interface LAIASectorManagerProps {
  branchId?: string;
}

export function LAIASectorManager({ branchId }: LAIASectorManagerProps) {
  const navigate = useNavigate();
  const { data: sectors, isLoading } = useLAIASectors(branchId);
  const { data: assessments } = useLAIAAssessments({ branch_id: branchId });
  const createMutation = useCreateLAIASector(branchId);
  const updateMutation = useUpdateLAIASector();
  const deleteMutation = useDeleteLAIASector();
  const bulkDeleteMutation = useBulkDeleteLAIASectors();

  const sortedSectors = useMemo(() => {
    if (!sectors) return [];
    return [...sectors].sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    );
  }, [sectors]);

  const activitiesBySector = useMemo(() => {
    const map = new Map<string, string[]>();
    assessments?.forEach((a) => {
      if (a.sector_id && a.activity_operation) {
        const existing = map.get(a.sector_id) || [];
        if (!existing.includes(a.activity_operation)) {
          existing.push(a.activity_operation);
        }
        map.set(a.sector_id, existing);
      }
    });
    return map;
  }, [assessments]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<LAIASector | null>(null);
  const [deletingSector, setDeletingSector] = useState<LAIASector | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleOpenCreate = () => {
    setEditingSector(null);
    setFormData({ code: "", name: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sector: LAIASector) => {
    setEditingSector(sector);
    setFormData({
      code: sector.code,
      name: sector.name,
      description: sector.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingSector) {
      await updateMutation.mutateAsync({ id: editingSector.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingSector) {
      await deleteMutation.mutateAsync(deletingSector.id);
      setIsDeleteDialogOpen(false);
      setDeletingSector(null);
    }
  };

  const handleToggleActive = async (sector: LAIASector) => {
    await updateMutation.mutateAsync({ 
      id: sector.id, 
      data: { is_active: !sector.is_active } 
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedSectors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedSectors.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gerenciar Setores
          </CardTitle>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Setor
          </Button>
        </CardHeader>
        <CardContent>
          {sortedSectors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={sortedSectors.length > 0 && selectedIds.size === sortedSectors.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSectors.map((sector) => (
                  <TableRow 
                    key={sector.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => branchId && navigate(`/laia/unidade/${branchId}/setor/${sector.id}`)}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(sector.id)}
                        onCheckedChange={() => toggleSelect(sector.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-medium">{sector.code}</TableCell>
                    <TableCell className="text-primary hover:underline">
                      {(() => {
                        const activities = activitiesBySector.get(sector.id);
                        if (!activities || activities.length === 0) return "-";
                        const shown = activities.slice(0, 3);
                        const remaining = activities.length - 3;
                        return (
                          <span>
                            {shown.join(", ")}
                            {remaining > 0 && (
                              <span className="text-muted-foreground ml-1">+{remaining} mais</span>
                            )}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sector.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div onClick={e => e.stopPropagation()}>
                        <Switch
                          checked={sector.is_active}
                          onCheckedChange={() => handleToggleActive(sector)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(sector); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSector(sector);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum setor cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre setores para organizar suas avaliações LAIA
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Setor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {selectedIds.size} selecionado(s)
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Selecionados
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSector ? "Editar Setor" : "Novo Setor"}
            </DialogTitle>
            <DialogDescription>
              {editingSector 
                ? "Atualize as informações do setor." 
                : "Cadastre um novo setor para organizar as avaliações LAIA."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: PROD, ADM, LOG"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Código único do setor (máximo 10 caracteres)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Atividade *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Fabricação de produtos químicos, Manutenção de equipamentos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional do setor..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.code || !formData.name || createMutation.isPending || updateMutation.isPending}
            >
              {editingSector ? "Salvar Alterações" : "Criar Setor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o setor "{deletingSector?.name}"? 
              Esta ação não pode ser desfeita e pode afetar avaliações vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Setores em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} setor(es)? 
              Esta ação não pode ser desfeita e pode afetar avaliações vinculadas aos setores selecionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
