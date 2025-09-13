import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, TrendingUp, Users, Star, Award, ExternalLink, Search } from 'lucide-react';
import { MarketplaceModal } from '@/components/MarketplaceModal';
import { getSolutions, getCompanyLeads, ESGSolution, MarketplaceLead, SOLUTION_CATEGORIES } from '@/services/marketplace';
import { useQuery } from '@tanstack/react-query';

export default function Marketplace() {
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Buscar soluções em destaque
  const { data: featuredSolutions = [], isLoading: loadingSolutions } = useQuery({
    queryKey: ['featured-solutions'],
    queryFn: async () => {
      const solutions = await getSolutions();
      return solutions.filter(s => s.is_featured).slice(0, 4);
    }
  });

  // Buscar leads da empresa
  const { data: companyLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['company-leads'],
    queryFn: getCompanyLeads
  });

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setShowMarketplace(true);
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-purple-100 text-purple-800';
      case 'negotiating': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-emerald-100 text-emerald-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Marketplace ESG
          </h1>
          <p className="text-muted-foreground mt-1">
            Encontre soluções validadas para seus desafios de sustentabilidade
          </p>
        </div>
        <Button onClick={() => setShowMarketplace(true)} size="lg">
          <Search className="h-4 w-4 mr-2" />
          Explorar Soluções
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Soluções Disponíveis</p>
                <p className="text-2xl font-bold">50+</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fornecedores Verificados</p>
                <p className="text-2xl font-bold">25+</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seus Leads</p>
                <p className="text-2xl font-bold">{companyLeads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="featured">Destaques</TabsTrigger>
          <TabsTrigger value="leads">Meus Leads</TabsTrigger>
        </TabsList>

        {/* Categorias de Soluções */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(SOLUTION_CATEGORIES).map(([key, category]) => (
              <Card 
                key={key} 
                className="cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.02]"
                onClick={() => handleCategoryClick(key)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold mb-2">{category.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore soluções especializadas
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    Ver Soluções
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Soluções em Destaque */}
        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingSolutions ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredSolutions.map((solution) => (
                <Card key={solution.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{solution.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {solution.esg_solution_providers.verified && (
                            <Award className="h-3 w-3 text-blue-500" />
                          )}
                          {solution.esg_solution_providers.company_name}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Destaque
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {solution.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">
                          {solution.esg_solution_providers.rating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {SOLUTION_CATEGORIES[solution.category as keyof typeof SOLUTION_CATEGORIES]?.label}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Ver Detalhes
                      </Button>
                      {solution.esg_solution_providers.website_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a 
                            href={solution.esg_solution_providers.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Meus Leads */}
        <TabsContent value="leads" className="space-y-4">
          {loadingLeads ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando seus leads...</p>
            </div>
          ) : companyLeads.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum lead ainda</h3>
              <p className="text-muted-foreground mb-4">
                Explore o marketplace e demonstre interesse em soluções relevantes.
              </p>
              <Button onClick={() => setShowMarketplace(true)}>
                Explorar Soluções
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {companyLeads.map((lead: any) => (
                <Card key={lead.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{lead.esg_solutions?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {lead.esg_solutions?.esg_solution_providers?.company_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getLeadStatusColor(lead.status)}>
                          {formatLeadStatus(lead.status)}
                        </Badge>
                        {lead.priority && (
                          <Badge variant="outline" className="ml-2">
                            {lead.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {lead.specific_requirements && (
                      <p className="text-sm mt-2 p-2 bg-gray-50 rounded">
                        {lead.specific_requirements}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal do Marketplace */}
      <MarketplaceModal
        isOpen={showMarketplace}
        onClose={() => setShowMarketplace(false)}
        identifiedProblems={selectedCategory ? [] : []}
      />
    </div>
  );
}