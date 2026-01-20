import { useState } from "react";
import { Building2, Plus, MapPin, Phone, User, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranchesWithManager, useDeleteBranch, BranchWithManager } from "@/services/branches";
import { BranchFormModal } from "@/components/branches/BranchFormModal";
import { BranchStatsCards } from "@/components/branches/BranchStatsCards";
import { BranchesMap } from "@/components/branches/BranchesMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Search } from "lucide-react";

export default function GestaoFiliais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchWithManager | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchWithManager | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: branches, isLoading } = useBranchesWithManager();
  const deleteMutation = useDeleteBranch();

  const filteredBranches = branches?.filter((branch) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (branch: BranchWithManager) => {
    setSelectedBranch(branch);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (branchToDelete) {
      deleteMutation.mutate(branchToDelete.id, {
        onSuccess: () => setBranchToDelete(null),
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBranch(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Gestão de Filiais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as filiais e unidades da sua empresa
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Filial
        </Button>
      </div>

      {/* Stats Cards */}
      <BranchStatsCards branches={branches || []} isLoading={isLoading} />

      {/* Branch List with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Lista de Filiais</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as filiais cadastradas
              </CardDescription>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "map")}>
              <TabsList>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="h-4 w-4" />
                  Mapa
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <>
              {/* Search */}
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, código ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma filial encontrada</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {searchTerm ? "Tente ajustar sua busca" : "Comece cadastrando sua primeira filial"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Gerente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBranches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {branch.name}
                              {branch.is_headquarters && (
                                <Badge variant="secondary" className="text-xs">
                                  Matriz
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{branch.code || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {branch.city && branch.state
                                ? `${branch.city}, ${branch.state}`
                                : branch.city || branch.state || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {branch.phone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {branch.phone}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {branch.manager ? (
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {branch.manager.full_name}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={branch.status === "Ativa" ? "default" : "secondary"}
                              className={
                                branch.status === "Ativa"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : ""
                              }
                            >
                              {branch.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(branch)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setBranchToDelete(branch)}
                                disabled={branch.is_headquarters}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : (
            <BranchesMap branches={branches || []} />
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <BranchFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        branch={selectedBranch}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!branchToDelete} onOpenChange={() => setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a filial "{branchToDelete?.name}"? Esta ação não pode ser desfeita.
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
    </div>
  );
}
