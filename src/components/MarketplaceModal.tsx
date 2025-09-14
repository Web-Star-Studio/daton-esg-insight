import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Star, ExternalLink, Filter, Search, ShoppingCart, TrendingUp, Clock, DollarSign, Award } from 'lucide-react';
import { toast } from 'sonner';
import { 
  findMatchingSolutions, 
  getSolutions, 
  createLead,
  ESGSolution,
  MarketplaceFilters,
  SOLUTION_CATEGORIES,
  PRICE_RANGES,
  IMPLEMENTATION_TIMES,
  ROI_ESTIMATES
} from '@/services/marketplace';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  identifiedProblems?: string[];
  insightReference?: string;
  companyContext?: any;
}

export function MarketplaceModal({ 
  isOpen, 
  onClose, 
  identifiedProblems = [],
  insightReference,
  companyContext 
}: MarketplaceModalProps) {
  const [solutions, setSolutions] = useState<ESGSolution[]>([]);
  const [filteredSolutions, setFilteredSolutions] = useState<ESGSolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Buscar soluções quando modal abre
  useEffect(() => {
    if (isOpen) {
      loadSolutions();
    }
  }, [isOpen]);

  // Filtrar soluções baseado em busca e filtros
  useEffect(() => {
    let filtered = Array.isArray(solutions) ? solutions : [];

    // Filtro por texto
    if (searchTerm && filtered.length > 0) {
      filtered = filtered.filter(solution => 
        solution.title?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        solution.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        solution.esg_solution_providers?.company_name?.toLowerCase()?.includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria na tab ativa
    if (activeTab !== 'all' && filtered.length > 0) {
      filtered = filtered.filter(solution => solution.category === activeTab);
    }

    setFilteredSolutions(filtered);
  }, [solutions, searchTerm, activeTab]);

  const loadSolutions = async () => {
    setLoading(true);
    try {
      let result;
      
      // Se há problemas identificados, usar matching inteligente
      if (identifiedProblems && Array.isArray(identifiedProblems) && identifiedProblems.length > 0) {
        result = await findMatchingSolutions(identifiedProblems, companyContext, filters);
        setSolutions(result.solutions || []);
        
        if (result.ai_powered) {
          toast.success(`${result.total_matches} soluções encontradas com IA para seus problemas específicos`);
        }
      } else {
        // Senão, buscar todas as soluções
        const allSolutions = await getSolutions(filters);
        setSolutions(Array.isArray(allSolutions) ? allSolutions : []);
      }
    } catch (error) {
      console.error('Error loading solutions:', error);
      toast.error('Erro ao carregar soluções');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (solution: ESGSolution) => {
    try {
      await createLead({
        solution_id: solution.id,
        insight_reference: insightReference,
        priority: 'medium'
      });
      
      toast.success(`Interesse registrado! ${solution.esg_solution_providers.company_name} será contatada.`);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao registrar interesse');
    }
  };

  const getPriceRangeColor = (range: string) => {
    switch (range) {
      case 'budget_friendly': return 'bg-emerald-100 text-emerald-800';
      case 'mid_range': return 'bg-yellow-100 text-yellow-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getROIColor = (roi: string) => {
    switch (roi) {
      case '6-12_months': return 'text-emerald-600';
      case '1-2_years': return 'text-yellow-600';
      case '2_years_plus': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Marketplace de Soluções ESG
            {identifiedProblems && Array.isArray(identifiedProblems) && identifiedProblems.length > 0 && (
              <Badge variant="secondary">
                {identifiedProblems.length} problema(s) identificado(s)
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Barra de busca e filtros */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar soluções..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="grid grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
              <Select value={filters.price_range} onValueChange={(value) => setFilters({...filters, price_range: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Faixa de Preço" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRICE_RANGES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.implementation_time} onValueChange={(value) => setFilters({...filters, implementation_time: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Tempo de Implementação" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(IMPLEMENTATION_TIMES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.roi_estimate} onValueChange={(value) => setFilters({...filters, roi_estimate: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Retorno do Investimento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROI_ESTIMATES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => setFilters({})}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          )}

          {/* Tabs por categoria */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">Todas</TabsTrigger>
              {Object.entries(SOLUTION_CATEGORIES).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                  <span>{category.icon}</span>
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 overflow-y-auto mt-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Buscando soluções...</p>
                  </div>
                </div>
              ) : filteredSolutions.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma solução encontrada</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou termos de busca.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSolutions.map((solution) => (
                    <Card key={solution.id} className="border border-border bg-card">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">{solution.title}</CardTitle>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              {solution.esg_solution_providers.verified && (
                                <Award className="h-3 w-3 text-blue-500" />
                              )}
                              {solution.esg_solution_providers.company_name}
                            </p>
                          </div>
                          {solution.is_featured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Destaque
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className={getPriceRangeColor(solution.price_range)}>
                            {PRICE_RANGES[solution.price_range as keyof typeof PRICE_RANGES]}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {IMPLEMENTATION_TIMES[solution.implementation_time as keyof typeof IMPLEMENTATION_TIMES]}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {solution.description}
                        </p>

        {/* Problemas que resolve */}
        {solution.matching_problems && Array.isArray(solution.matching_problems) && solution.matching_problems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-emerald-600 mb-1">
              Resolve seus problemas:
            </p>
            <div className="flex flex-wrap gap-1">
              {solution.matching_problems.map((problem, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                  {problem}
                </Badge>
              ))}
            </div>
          </div>
        )}

                        {/* Métricas */}
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className={`text-xs ${getROIColor(solution.roi_estimate)}`}>
                              ROI: {ROI_ESTIMATES[solution.roi_estimate as keyof typeof ROI_ESTIMATES]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">
                              {solution.esg_solution_providers.rating?.toFixed(1) || 'N/A'} 
                              ({solution.esg_solution_providers.total_reviews} reviews)
                            </span>
                          </div>
                        </div>

                        <Separator />

                        {/* Ações */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleCreateLead(solution)}
                            className="flex-1"
                          >
                            Tenho Interesse
                          </Button>
                          {solution.esg_solution_providers.website_url && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              asChild
                            >
                              <a 
                                href={solution.esg_solution_providers.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Site
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}