import { useState, useRef, useMemo, lazy, Suspense } from "react";
import { Building2, Plus, MapPin, User, Map, List, GitBranch, FileUp, Loader2, Crown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
// Lazy load do mapa para evitar problemas com react-leaflet
const BranchesMap = lazy(() => 
  import("@/components/branches/BranchesMap").then(module => ({
    default: module.BranchesMap
  }))
);
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { unifiedToast } from "@/utils/unifiedToast";
import { formatCep } from "@/utils/viaCep";
import { parseSupabaseFunctionError } from "@/utils/supabaseFunctionError";

interface GroupedBranches {
  headquarters: BranchWithManager;
  children: BranchWithManager[];
}

function groupBranchesByHeadquarters(branches: BranchWithManager[]) {
  const hqs = branches.filter(b => b.is_headquarters);
  const others = branches.filter(b => !b.is_headquarters);
  
  const groups: GroupedBranches[] = hqs.map(hq => ({
    headquarters: hq,
    children: others.filter(b => b.parent_branch_id === hq.id)
  }));
  
  // Filiais independentes (sem parent_branch_id e não são matriz)
  const independent = others.filter(b => !b.parent_branch_id);
  
  return { groups, independent };
}

export default function GestaoFiliais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [parentBranchFilter, setParentBranchFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchWithManager | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchWithManager | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [importedData, setImportedData] = useState<BranchImportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: branches, isLoading } = useBranchesWithManager();
  const deleteMutation = useDeleteBranch();

  // Lista de matrizes para o filtro
  const headquarters = useMemo(() => 
    (branches || []).filter(b => b.is_headquarters), 
    [branches]
  );

  // Verificar se há filtros ativos
  const hasActiveFilters = 
    searchTerm || 
    statusFilter !== "all" || 
    typeFilter !== "all" || 
    parentBranchFilter !== "all";

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setParentBranchFilter("all");
  };

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

  const filteredBranches = useMemo(() => {
    return (branches || []).filter((branch) => {
      // Filtro de busca por texto
      const matchesSearch = 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de status
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && (branch.status === "Ativo" || branch.status === "Ativa")) ||
        (statusFilter === "inactive" && branch.status === "Inativa");
      
      // Filtro de tipo
      const matchesType = 
        typeFilter === "all" ||
        (typeFilter === "headquarters" && branch.is_headquarters) ||
        (typeFilter === "branch" && !branch.is_headquarters);
      
      // Filtro de matriz vinculada
      const matchesParent = 
        parentBranchFilter === "all" ||
        (parentBranchFilter === "independent" && !branch.parent_branch_id && !branch.is_headquarters) ||
        branch.parent_branch_id === parentBranchFilter;
      
      return matchesSearch && matchesStatus && matchesType && matchesParent;
    });
  }, [branches, searchTerm, statusFilter, typeFilter, parentBranchFilter]);

  const { groups, independent } = useMemo(() => 
    groupBranchesByHeadquarters(filteredBranches), 
    [filteredBranches]
  );

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

  const renderBranchRow = (branch: BranchWithManager, isChild = false) => (
    <TableRow 
      key={branch.id} 
      className={branch.is_headquarters ? "bg-amber-50/50" : isChild ? "bg-muted/30" : ""}
    >
      <TableCell className="font-medium">
        <div className={`flex items-center gap-2 ${isChild ? "pl-6" : ""}`}>
          {branch.is_headquarters ? (
            <Crown className="h-4 w-4 text-amber-600" />
          ) : isChild ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs">└</span>
              <GitBranch className="h-3 w-3" />
            </div>
          ) : (
            <Building2 className="h-4 w-4 text-muted-foreground" />
          )}
          {branch.name}
          {branch.is_headquarters && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
              Matriz
            </Badge>
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
          variant={branch.status === "Ativo" || branch.status === "Ativa" ? "default" : "secondary"}
          className={
            branch.status === "Ativo" || branch.status === "Ativa"
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
  );

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
              {/* Search and Filters */}
              <div className="mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Busca por texto */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, código ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filtro de Status */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro de Tipo */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Tipos</SelectItem>
                      <SelectItem value="headquarters">Matrizes</SelectItem>
                      <SelectItem value="branch">Filiais</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro de Matriz Vinculada */}
                  <Select value={parentBranchFilter} onValueChange={setParentBranchFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Matriz Vinculada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Matrizes</SelectItem>
                      <SelectItem value="independent">Independentes</SelectItem>
                      {headquarters.map((hq) => (
                        <SelectItem key={hq.id} value={hq.id}>
                          {hq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Botão Limpar Filtros */}
                  {hasActiveFilters && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Indicadores de filtros ativos */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Mostrando {filteredBranches.length} de {branches?.length || 0} unidades</span>
                    <Badge variant="secondary">Filtros aplicados</Badge>
                  </div>
                )}
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
                      {/* Render grouped branches by headquarters */}
                      {groups.map((group) => (
                        <>
                          {renderBranchRow(group.headquarters)}
                          {group.children.map((child) => renderBranchRow(child, true))}
                        </>
                      ))}
                      
                      {/* Independent branches section */}
                      {independent.length > 0 && groups.length > 0 && (
                        <TableRow className="bg-muted/20 border-t-2">
                          <TableCell colSpan={7} className="py-2 text-xs font-medium text-muted-foreground">
                            Filiais Independentes
                          </TableCell>
                        </TableRow>
                      )}
                      {independent.map((branch) => renderBranchRow(branch))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : (
            <Suspense fallback={
              <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg border">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }>
              <BranchesMap branches={branches || []} />
            </Suspense>
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
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Esta ação não pode ser desfeita. Ao excluir a filial <strong>"{branchToDelete?.name}"</strong>,
                  os seguintes dados vinculados também serão removidos:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Programas de treinamento e registros de participantes</li>
                  <li>Avaliações LAIA</li>
                  <li>Perfis de compliance de legislações</li>
                </ul>
                <p className="font-medium text-foreground">
                  Colaboradores vinculados serão mantidos, porém sem filial associada.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Filial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
