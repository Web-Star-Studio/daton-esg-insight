import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, Search, Filter, Info, Upload, Download, Calendar, Building, Zap } from "lucide-react";
import { AddCustomFactorModal } from "@/components/AddCustomFactorModal";
import { EditCustomFactorModal } from "@/components/EditCustomFactorModal";
import { ExportFactorsModal } from "@/components/ExportFactorsModal";
import { UnifiedFactorImportModal } from "@/components/UnifiedFactorImportModal";
import { EmissionFactorCard } from "@/components/EmissionFactorCard";
import { MethodologyInfo } from "@/components/MethodologyInfo";
import { useToast } from "@/hooks/use-toast";
import { 
  getEmissionFactors, 
  getEmissionCategories,
  deleteCustomEmissionFactor,
  type EmissionFactor 
} from "@/services/emissionFactors";
import { ghg2025FactorsService } from "@/services/ghgProtocol2025Factors";

export default function BibliotecaFatores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedScope, setSelectedScope] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingGHG2025, setIsUpdatingGHG2025] = useState(false);
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
      
      // Extract unique sources and years
      const uniqueSources = [...new Set(factorsData.map(f => f.source))].sort();
      const uniqueYears = [...new Set(factorsData.map(f => f.year_of_validity).filter(Boolean))].sort((a, b) => (b as number) - (a as number));
      
      setSources(uniqueSources);
      setYears(uniqueYears as number[]);
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

  // Enhanced filter logic with multiple criteria
  const filteredFactors = factors.filter(factor => {
    // Smart search across multiple fields
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || [
      factor.name,
      factor.category,
      factor.source,
      factor.activity_unit
    ].some(field => field?.toLowerCase().includes(searchLower));

    const matchesCategory = selectedCategory === "all" || factor.category === selectedCategory;
    const matchesType = selectedType === "all" || factor.type === selectedType;
    const matchesSource = selectedSource === "all" || factor.source === selectedSource;
    const matchesYear = selectedYear === "all" || 
      (selectedYear === "recent" && factor.year_of_validity && factor.year_of_validity >= 2022) ||
      (selectedYear === "older" && (!factor.year_of_validity || factor.year_of_validity < 2022)) ||
      factor.year_of_validity?.toString() === selectedYear;
    
    // Enhanced scope mapping
    const matchesScope = selectedScope === "all" || getScopeFromCategory(factor.category) === parseInt(selectedScope);
    
    return matchesSearch && matchesCategory && matchesType && matchesScope && matchesSource && matchesYear;
  });

  // Helper function for scope detection
  const getScopeFromCategory = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('combustão') || categoryLower.includes('processos industriais') || 
        categoryLower.includes('fugitivas') || categoryLower.includes('tratamento de efluentes')) {
      return 1;
    }
    
    if (categoryLower.includes('energia adquirida') || categoryLower.includes('eletricidade')) {
      return 2;
    }
    
    if (categoryLower.includes('resíduos') || categoryLower.includes('transporte') || 
        categoryLower.includes('distribuição')) {
      return 3;
    }
    
    return 1; // Default to scope 1
  };

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
  }, [searchTerm, selectedCategory, selectedType, selectedScope, selectedSource, selectedYear]);

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

  const handleUpdateGHG2025 = async () => {
    if (!confirm("Isso irá atualizar/adicionar os fatores de emissão do GHG Protocol Brasil 2025. Continuar?")) {
      return;
    }

    try {
      setIsUpdatingGHG2025(true);
      
      toast({
        title: "Atualizando base de dados...",
        description: "Importando fatores GHG Protocol Brasil 2025",
      });

      const result = await ghg2025FactorsService.importAllFactors();
      
      toast({
        title: "✅ Atualização concluída!",
        description: `${result.success} fatores processados. ${result.errors > 0 ? `${result.errors} erros encontrados.` : ''}`,
        variant: result.errors > 0 ? "destructive" : "default"
      });

      // Recarregar dados
      await loadData();
      
    } catch (error) {
      console.error('Erro ao atualizar GHG 2025:', error);
      toast({
        title: "❌ Erro na atualização",
        description: error.message || "Erro ao importar fatores GHG Protocol Brasil 2025",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingGHG2025(false);
    }
  };

  return (
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
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => setShowMethodology(!showMethodology)}>
              <Info className="mr-2 h-4 w-4" />
              {showMethodology ? 'Ocultar' : 'Ver'} Metodologia
            </Button>

            <Button 
              onClick={handleUpdateGHG2025} 
              disabled={isUpdatingGHG2025}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              {isUpdatingGHG2025 ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Atualizando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Atualizar GHG 2025
                </>
              )}
            </Button>
            
            <Button onClick={() => setIsImportModalOpen(true)} className="bg-primary text-primary-foreground">
              <Upload className="mr-2 h-4 w-4" />
              Central de Importação
            </Button>
            
            <Button variant="outline" onClick={() => setIsExportModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Biblioteca
            </Button>
            
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Fator Manual
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
            <div className="space-y-4">
              {/* Main search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Busca inteligente: nome, categoria, fonte, unidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filter row */}
              <div className="flex gap-3 flex-wrap">
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
                  <SelectTrigger className="w-52">
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
                
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-52">
                    <Zap className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Fontes</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.length > 30 ? `${source.substring(0, 30)}...` : source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-44">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Anos</SelectItem>
                    <SelectItem value="recent">Recentes (2022+)</SelectItem>
                    <SelectItem value="older">Anteriores (2021-)</SelectItem>
                    {years.slice(0, 10).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-44">
                    <Building className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="system">Oficiais</SelectItem>
                    <SelectItem value="custom">Customizados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active filters display */}
              {(searchTerm || selectedCategory !== "all" || selectedType !== "all" || 
                selectedScope !== "all" || selectedSource !== "all" || selectedYear !== "all") && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {searchTerm && <Badge variant="secondary">Busca: "{searchTerm}"</Badge>}
                  {selectedScope !== "all" && <Badge variant="secondary">Escopo {selectedScope}</Badge>}
                  {selectedCategory !== "all" && <Badge variant="secondary">{selectedCategory}</Badge>}
                  {selectedSource !== "all" && <Badge variant="secondary">{selectedSource.substring(0, 20)}...</Badge>}
                  {selectedYear !== "all" && <Badge variant="secondary">
                    {selectedYear === "recent" ? "2022+" : selectedYear === "older" ? "Antes 2022" : selectedYear}
                  </Badge>}
                  {selectedType !== "all" && <Badge variant="secondary">
                    {selectedType === "system" ? "Oficiais" : "Customizados"}
                  </Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setSelectedType("all");
                      setSelectedScope("all");
                      setSelectedSource("all");
                      setSelectedYear("all");
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Limpar filtros
                  </Button>
                </div>
              )}
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
                setSelectedSource("all");
                setSelectedYear("all");
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

        {/* Unified Import Modal */}
        <UnifiedFactorImportModal
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
  );
}