import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, Search, Filter, Info, Upload, Download } from "lucide-react";
import { AddCustomFactorModal } from "@/components/AddCustomFactorModal";
import { EditCustomFactorModal } from "@/components/EditCustomFactorModal";
import { ImportFactorsModal } from "@/components/ImportFactorsModal";
import { ExportFactorsModal } from "@/components/ExportFactorsModal";
import { ImportBrazilianFactorsButton } from "@/components/ImportBrazilianFactorsButton";
import { ImportGHGProtocol2025Button } from "@/components/ImportGHGProtocol2025Button";
import { EmissionFactorCard } from "@/components/EmissionFactorCard";
import { MethodologyInfo } from "@/components/MethodologyInfo";
import { useToast } from "@/hooks/use-toast";
import { 
  getEmissionFactors, 
  getEmissionCategories,
  deleteCustomEmissionFactor,
  type EmissionFactor 
} from "@/services/emissionFactors";

export default function BibliotecaFatores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedScope, setSelectedScope] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [factorsData, categoriesData] = await Promise.all([
        getEmissionFactors(),
        getEmissionCategories()
      ]);
      
      setFactors(factorsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar fatores de emissão",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter factors based on search and filters
  const filteredFactors = factors.filter(factor => {
    const matchesSearch = factor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         factor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         factor.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || factor.category === selectedCategory;
    const matchesType = selectedType === "all" || factor.type === selectedType;
    
    // Basic scope mapping for better filtering
    const matchesScope = selectedScope === "all" || 
      (selectedScope === "1" && (factor.category.includes("Combustão") || factor.category.includes("Processos"))) ||
      (selectedScope === "2" && factor.category.includes("Energia Adquirida")) ||
      (selectedScope === "3" && (factor.category.includes("Resíduos") || factor.category.includes("Efluentes")));
    
    return matchesSearch && matchesCategory && matchesType && matchesScope;
  });

  // Statistics and pagination
  const stats = {
    total: factors.length,
    system: factors.filter(f => f.type === 'system').length,
    custom: factors.filter(f => f.type === 'custom').length,
    categories: categories.length,
    filtered: filteredFactors.length
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredFactors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFactors = filteredFactors.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedType, selectedScope]);

  const handleDeleteFactor = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este fator de emissão?")) {
      return;
    }

    try {
      await deleteCustomEmissionFactor(id);
      toast({
        title: "Sucesso",
        description: "Fator de emissão deletado com sucesso",
      });
      await loadData(); // Reload data
    } catch (error) {
      console.error('Erro ao deletar fator:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar fator de emissão",
        variant: "destructive",
      });
    }
  };

  const handleEditFactor = (factor: EmissionFactor) => {
    setEditingFactor(factor);
    setIsEditModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Biblioteca de Fatores de Emissão</h1>
            <p className="text-muted-foreground">
              Base de dados profissional com {stats.total} fatores validados para inventários de GEE
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{stats.system} fatores oficiais</span>
              <span>•</span>
              <span>{stats.custom} fatores customizados</span>
              <span>•</span>
              <span>{stats.categories} categorias</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowMethodology(!showMethodology)}>
              <Info className="mr-2 h-4 w-4" />
              {showMethodology ? 'Ocultar' : 'Ver'} Metodologia
            </Button>
            <ImportBrazilianFactorsButton onImportComplete={() => loadData()} />
            <ImportGHGProtocol2025Button onImportComplete={() => loadData()} />
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV/Excel
            </Button>
            <Button variant="outline" onClick={() => setIsExportModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Biblioteca
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Fator Customizado
            </Button>
          </div>
        </div>

        {/* Methodology Section */}
        {showMethodology && (
          <MethodologyInfo />
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, categoria ou fonte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Escopos</SelectItem>
                  <SelectItem value="1">Escopo 1</SelectItem>
                  <SelectItem value="2">Escopo 2</SelectItem>
                  <SelectItem value="3">Escopo 3</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="custom">Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {stats.filtered} {stats.filtered === 1 ? 'fator encontrado' : 'fatores encontrados'}
            {stats.filtered !== stats.total && (
              <span className="text-muted-foreground font-normal"> de {stats.total} total</span>
            )}
            {totalPages > 1 && (
              <span className="text-muted-foreground font-normal text-base">
                {" "}• Página {currentPage} de {totalPages}
              </span>
            )}
          </h2>
          
          <div className="flex gap-2">
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
                Limpar busca
              </Button>
            )}
          </div>
        </div>

        {/* Factors Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando fatores de emissão...</div>
          </div>
        ) : paginatedFactors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-muted-foreground">Nenhum fator encontrado com os filtros aplicados.</p>
            {(searchTerm || selectedCategory !== "all" || selectedType !== "all" || selectedScope !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedType("all");
                setSelectedScope("all");
              }} className="mt-2">
                Limpar todos os filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paginatedFactors.map((factor) => (
                <EmissionFactorCard
                  key={factor.id}
                  factor={factor}
                  onDelete={factor.type === 'custom' ? handleDeleteFactor : undefined}
                  onEdit={factor.type === 'custom' ? handleEditFactor : undefined}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className="cursor-pointer"
                        />
                      </PaginationItem>
                    )}
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className="cursor-pointer"
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        <AddCustomFactorModal
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) {
              // Reload data when modal closes
              loadData();
            }
          }}
        />

        <EditCustomFactorModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            setEditingFactor(null);
            if (!open) {
              // Reload data when modal closes
              loadData();
            }
          }}
          factor={editingFactor}
        />

        <ImportFactorsModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImportComplete={() => {
            loadData();
            setIsImportModalOpen(false);
          }}
        />

        <ExportFactorsModal
          open={isExportModalOpen}
          onOpenChange={setIsExportModalOpen}
          factors={factors}
          filteredFactors={filteredFactors}
        />
      </div>
    </MainLayout>
  );
}