import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Trash2, Edit } from "lucide-react";
import { AddCustomFactorModal } from "@/components/AddCustomFactorModal";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
                         factor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || factor.category === selectedCategory;
    const matchesType = selectedType === "all" || factor.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeLabel = (type: string) => {
    return type === "system" ? "Sistema" : "Customizado";
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === "system" ? "secondary" : "default";
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca de Fatores de Emissão</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie fatores de emissão do sistema e customizados
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Fator Customizado
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar fatores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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
                <SelectTrigger className="w-48">
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

        {/* Factors Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {filteredFactors.length} {filteredFactors.length === 1 ? 'fator encontrado' : 'fatores encontrados'}
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">Carregando fatores de emissão...</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFactors.map((factor) => (
                <Card key={factor.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{factor.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getTypeBadgeVariant(factor.type)}>
                          {getTypeLabel(factor.type)}
                        </Badge>
                        {factor.type === 'custom' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFactor(factor.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {factor.category} • {factor.activity_unit}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CO₂:</span>
                        <span className="font-mono">{factor.co2_factor || 0} kg CO₂/{factor.activity_unit}</span>
                      </div>
                      {factor.ch4_factor && (
                        <div className="flex justify-between text-sm">
                          <span>CH₄:</span>
                          <span className="font-mono">{factor.ch4_factor} kg CH₄/{factor.activity_unit}</span>
                        </div>
                      )}
                      {factor.n2o_factor && (
                        <div className="flex justify-between text-sm">
                          <span>N₂O:</span>
                          <span className="font-mono">{factor.n2o_factor} kg N₂O/{factor.activity_unit}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Fonte: {factor.source}
                          {factor.year_of_validity && ` (${factor.year_of_validity})`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AddCustomFactorModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
        />
      </div>
    </MainLayout>
  );
}