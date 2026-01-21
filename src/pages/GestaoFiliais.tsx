import { useState, useRef } from "react";
import { Building2, Plus, MapPin, User, Map, List, GitBranch, FileUp, Loader2 } from "lucide-react";
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
import { BranchFormModal, BranchImportData } from "@/components/branches/BranchFormModal";
import { BranchStatsCards } from "@/components/branches/BranchStatsCards";
import { BranchesMap } from "@/components/branches/BranchesMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { unifiedToast } from "@/utils/unifiedToast";
import { formatCep } from "@/utils/viaCep";
import { parseSupabaseFunctionError } from "@/utils/supabaseFunctionError";

export default function GestaoFiliais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchWithManager | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchWithManager | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [importedData, setImportedData] = useState<BranchImportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: branches, isLoading } = useBranchesWithManager();
  const deleteMutation = useDeleteBranch();

  const handleImportPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - accept PDF and images
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      unifiedToast.error("Arquivo inválido", {
        description: "Aceitos: PDF, PNG, JPG ou WEBP"
      });
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      unifiedToast.error("Arquivo muito grande", {
        description: "O arquivo deve ter no máximo 10MB"
      });
      event.target.value = '';
      return;
    }

    setIsImportingPdf(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Determine if it's an image or PDF
      const isImage = file.type.startsWith('image/');

      // Call Edge Function with appropriate data
      const { data, error } = await supabase.functions.invoke('cnpj-pdf-extractor', {
        body: isImage 
          ? { imageBase64: base64, fileName: file.name, fileType: file.type }
          : { pdfBase64: base64, fileName: file.name, fileType: file.type }
      });

      if (error) {
        console.error('CNPJ extractor error:', error);
        const parsed = parseSupabaseFunctionError(error);
        unifiedToast.error(
          parsed.hint === "image_required" ? "PDF escaneado" : "Erro ao processar arquivo",
          {
            description:
              parsed.message ||
              "Não foi possível processar o documento. Tente novamente.",
          },
        );
        return;
      }

      if (!data?.success) {
        unifiedToast.error("Erro na extração", {
          description:
            (data as any)?.error ||
            "Não foi possível extrair dados do documento. Se o PDF for escaneado, envie um print/foto (PNG/JPG/WEBP).",
        });
        return;
      }

      const extractedData = data.data;

      // Store imported data and open form
      setImportedData({
        cnpj: extractedData.cnpj || '',
        name: extractedData.tradeName || extractedData.name || '',
        address: extractedData.address || '',
        street_number: extractedData.streetNumber || '',
        neighborhood: extractedData.neighborhood || '',
        city: extractedData.city || '',
        state: extractedData.state || '',
        cep: extractedData.cep ? formatCep(extractedData.cep) : '',
        phone: extractedData.phone || '',
      });

      unifiedToast.success("Dados do PDF extraídos!", {
        description: `${extractedData.name} - ${extractedData.city}/${extractedData.state}`
      });

      setIsFormOpen(true);

    } catch (error) {
      console.error('PDF import error:', error);
      unifiedToast.error("Erro ao importar PDF", {
        description: "Tente novamente com um arquivo válido"
      });
    } finally {
      setIsImportingPdf(false);
      event.target.value = '';
    }
  };

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
    setImportedData(null);
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
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleImportPdf}
            disabled={isImportingPdf}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImportingPdf}
            className="gap-2"
          >
            {isImportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            Importar Filial
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Filial
          </Button>
        </div>
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
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Localização</TableHead>
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
                              {branch.parent_branch && (
                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                              )}
                              {branch.name}
                              {branch.is_headquarters && (
                                <Badge variant="secondary" className="text-xs">
                                  Matriz
                                </Badge>
                              )}
                              {branch.parent_branch && (
                                <span className="text-xs text-muted-foreground">
                                  → {branch.parent_branch.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{branch.code || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {branch.cnpj || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {branch.city && branch.state
                                ? `${branch.city}/${branch.state}`
                                : branch.city || "-"}
                            </div>
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
        initialData={importedData}
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
