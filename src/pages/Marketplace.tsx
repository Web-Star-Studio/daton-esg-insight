import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketplaceModal } from "@/components/MarketplaceModal";
import { SolutionCard } from "@/components/SolutionCard";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import { getSolutions, getCompanyLeads, SOLUTION_CATEGORIES, MarketplaceFilters as IMarketplaceFilters } from "@/services/marketplace";
import { ShoppingCart, Users, TrendingUp, Star, ExternalLink, ArrowRight, Loader2, Search, Filter } from "lucide-react";

export default function Marketplace() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [filters, setFilters] = useState<IMarketplaceFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all solutions with filters
  const { data: solutions = [], isLoading: loadingSolutions } = useQuery({
    queryKey: ["marketplace-solutions", filters],
    queryFn: () => getSolutions(filters),
  });

  // Filter and sort solutions based on search and sort criteria  
  const filteredSolutions = solutions
    .filter(solution => 
      searchTerm === "" || 
      solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.esg_solution_providers.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.esg_solution_providers.rating || 0) - (a.esg_solution_providers.rating || 0);
        case "price_low":
          return (a.price_range || "").localeCompare(b.price_range || "");
        case "price_high":
          return (b.price_range || "").localeCompare(a.price_range || "");
        default: // featured
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
    });

  const featuredSolutions = solutions.filter(s => s.is_featured);

  // Fetch company leads
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["company-leads"],
    queryFn: getCompanyLeads,
  });

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'quoted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'negotiating': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed_won': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'closed_lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatLeadStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'new': 'Novo',
      'contacted': 'Contatado',
      'quoted': 'Orçamento',
      'negotiating': 'Negociando',
      'closed_won': 'Fechado',
      'closed_lost': 'Perdido'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Marketplace ESG
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Descubra soluções ESG inovadoras para transformar sua empresa. 
              Conecte-se com fornecedores especializados e impulsione sua sustentabilidade.
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            Explorar Soluções
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{solutions.length}</p>
                  <p className="text-sm text-muted-foreground">Soluções Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">150+</p>
                  <p className="text-sm text-muted-foreground">Fornecedores Verificados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{leads.length}</p>
                  <p className="text-sm text-muted-foreground">Seus Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">4.8</p>
                  <p className="text-sm text-muted-foreground">Avaliação Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar soluções, fornecedores ou categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Em Destaque</SelectItem>
                <SelectItem value="rating">Melhor Avaliação</SelectItem>
                <SelectItem value="price_low">Menor Preço</SelectItem>
                <SelectItem value="price_high">Maior Preço</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="px-3"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Tabs */}
        <Tabs defaultValue="solutions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="solutions">Todas as Soluções</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="featured">Em Destaque</TabsTrigger>
            <TabsTrigger value="leads">Meus Leads</TabsTrigger>
          </TabsList>

          {/* All Solutions Tab */}
          <TabsContent value="solutions" className="space-y-6">
            {loadingSolutions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
                      <div className="h-20 bg-muted rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-16"></div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSolutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    onInterest={() => {
                      setSelectedCategory(solution.category);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
            
            {!loadingSolutions && filteredSolutions.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma solução encontrada</h3>
                <p className="text-muted-foreground">
                  Tente ajustar seus filtros ou termos de busca.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(SOLUTION_CATEGORIES).map(([key, category]) => (
                <Card 
                  key={key} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 group hover:bg-accent"
                  onClick={() => handleCategoryClick(key)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                      {category.label}
                    </h3>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <span>Ver soluções</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured" className="space-y-6">
            {loadingSolutions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
                      <div className="h-20 bg-muted rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-16"></div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredSolutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    onInterest={() => {
                      setSelectedCategory(solution.category);
                      setIsModalOpen(true);
                    }}
                    featured
                  />
                ))}
              </div>
            )}
            
            {!loadingSolutions && featuredSolutions.length === 0 && (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma solução em destaque</h3>
                <p className="text-muted-foreground">
                  As soluções em destaque aparecerão aqui em breve.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            {loadingLeads ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4 w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : leads.length > 0 ? (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <Card key={lead.id} className="hover:bg-accent transition-colors duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {(lead as any).esg_solutions?.title || 'Solução não encontrada'}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={getLeadStatusColor(lead.status)}
                            >
                              {formatLeadStatus(lead.status)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {lead.priority === 'high' ? 'Alta' : 
                               lead.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            Fornecedor: {(lead as any).esg_solutions?.esg_solution_providers?.company_name || 'N/A'}
                          </p>
                          
                          {lead.specific_requirements && (
                            <p className="text-sm text-muted-foreground mb-3">
                              <strong>Requisitos:</strong> {lead.specific_requirements}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Criado: {new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                            {lead.budget_range && <span>Orçamento: {lead.budget_range}</span>}
                            {lead.timeline && <span>Prazo: {lead.timeline}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não demonstrou interesse em nenhuma solução.
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  Explorar Soluções
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Marketplace Modal */}
        <MarketplaceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCategory(null);
          }}
          identifiedProblems={selectedCategory ? [selectedCategory] : []}
        />
      </div>
  );
}