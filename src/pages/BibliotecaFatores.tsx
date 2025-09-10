import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Info } from "lucide-react";
import { AddCustomFactorModal } from "@/components/AddCustomFactorModal";
import { EditCustomFactorModal } from "@/components/EditCustomFactorModal";
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
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Statistics for better overview
  const stats = {
    total: factors.length,
    system: factors.filter(f => f.type === 'system').length,
    custom: factors.filter(f => f.type === 'custom').length,
    categories: categories.length,
    filtered: filteredFactors.length
  };

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowMethodology(!showMethodology)}>
              <Info className="mr-2 h-4 w-4" />
              {showMethodology ? 'Ocultar' : 'Ver'} Metodologia
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
          </h2>
          
          {searchTerm && (
            <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
              Limpar busca
            </Button>
          )}
        </div>

        {/* Factors Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando fatores de emissão...</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredFactors.map((factor) => (
              <EmissionFactorCard
                key={factor.id}
                factor={factor}
                onDelete={factor.type === 'custom' ? handleDeleteFactor : undefined}
                onEdit={factor.type === 'custom' ? handleEditFactor : undefined}
              />
            ))}
          </div>
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
      </div>
    </MainLayout>
  );
}