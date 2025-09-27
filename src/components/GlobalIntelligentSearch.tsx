import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, FileText, Users, Zap, Filter, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'document' | 'data' | 'action' | 'insight';
  category: string;
  url?: string;
  relevance: number;
  lastModified?: Date;
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
}

interface SearchFilters {
  type: string[];
  category: string[];
  dateRange: string;
  tags: string[];
}

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Search },
  { id: 'pages', label: 'Páginas', icon: FileText },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'data', label: 'Dados', icon: TrendingUp },
  { id: 'actions', label: 'Ações', icon: Zap },
  { id: 'insights', label: 'Insights', icon: Users },
];

const RECENT_SEARCHES = [
  'emissões escopo 1',
  'licenças vencimento',
  'metas carbono',
  'relatório sustentabilidade',
  'auditoria iso 14001'
];

const QUICK_ACTIONS = [
  { label: 'Nova Meta', url: '/metas/nova', icon: Zap },
  { label: 'Inventário GEE', url: '/inventario-gee', icon: TrendingUp },
  { label: 'Licenças', url: '/licenciamento', icon: FileText },
  { label: 'Relatórios', url: '/relatorios', icon: FileText },
  { label: 'Dashboard', url: '/dashboard', icon: TrendingUp },
];

// Mock search data - in real app, this would come from API
const MOCK_SEARCH_DATA: SearchResult[] = [
  {
    id: '1',
    title: 'Dashboard Principal',
    description: 'Centro de comando ESG com métricas em tempo real',
    type: 'page',
    category: 'navigation',
    url: '/dashboard',
    relevance: 0.95,
    tags: ['dashboard', 'esg', 'métricas']
  },
  {
    id: '2',
    title: 'Inventário de Emissões GEE',
    description: 'Gestão completa do inventário de gases de efeito estufa',
    type: 'page',
    category: 'environmental',
    url: '/inventario-gee',
    relevance: 0.9,
    tags: ['emissões', 'ghg', 'carbono']
  },
  {
    id: '3',
    title: 'Licenças Ambientais',
    description: 'Controle e monitoramento de licenças e autorizações',
    type: 'page',
    category: 'compliance',
    url: '/licenciamento',
    relevance: 0.85,
    tags: ['licenças', 'compliance', 'legal']
  },
  {
    id: '4',
    title: 'Relatório de Emissões Q4 2024',
    description: 'Documento com dados consolidados do último trimestre',
    type: 'document',
    category: 'reports',
    relevance: 0.8,
    lastModified: new Date('2024-01-15'),
    tags: ['relatório', 'emissões', 'trimestral']
  },
  {
    id: '5',
    title: 'Meta de Redução CO2 2025',
    description: 'Objetivo de reduzir 15% das emissões até dezembro',
    type: 'data',
    category: 'targets',
    relevance: 0.75,
    tags: ['meta', 'co2', 'redução']
  }
];

export function GlobalIntelligentSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    category: [],
    dateRange: 'all',
    tags: []
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { getFromCache, setInCache } = useIntelligentCache();

  // Intelligent search with caching and ML-like scoring
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Check cache first
    const cacheKey = `search:${searchQuery}:${JSON.stringify(filters)}`;
    const cachedResults = getFromCache(cacheKey);
    
    if (cachedResults) {
      setResults(cachedResults);
      setIsLoading(false);
      return;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Advanced search algorithm with multiple scoring factors
    const searchResults = MOCK_SEARCH_DATA
      .map(item => {
        let score = 0;
        const queryLower = searchQuery.toLowerCase();
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase();
        const tagsLower = item.tags?.map(tag => tag.toLowerCase()) || [];

        // Exact title match (highest priority)
        if (titleLower === queryLower) score += 1.0;
        else if (titleLower.includes(queryLower)) score += 0.8;
        
        // Description match
        if (descLower.includes(queryLower)) score += 0.6;
        
        // Tags match
        const tagMatches = tagsLower.filter(tag => 
          tag.includes(queryLower) || queryLower.includes(tag)
        ).length;
        score += tagMatches * 0.4;
        
        // Fuzzy matching for typos
        const titleWords = titleLower.split(' ');
        const queryWords = queryLower.split(' ');
        let fuzzyScore = 0;
        
        queryWords.forEach(qWord => {
          titleWords.forEach(tWord => {
            if (tWord.includes(qWord) || qWord.includes(tWord)) {
              fuzzyScore += 0.3;
            }
          });
        });
        score += fuzzyScore;

        // Boost by base relevance and recency
        score *= item.relevance;
        if (item.lastModified) {
          const daysSinceModified = (Date.now() - item.lastModified.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceModified < 7) score *= 1.2; // Recent boost
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0.1) // Minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Limit results

    // Apply filters
    let filteredResults = searchResults;
    
    if (selectedCategory !== 'all') {
      filteredResults = filteredResults.filter(item => 
        item.category === selectedCategory || item.type === selectedCategory
      );
    }

    if (filters.type.length > 0) {
      filteredResults = filteredResults.filter(item => 
        filters.type.includes(item.type)
      );
    }

    // Cache results
    setInCache(cacheKey, filteredResults, 'medium');
    
    setResults(filteredResults);
    setIsLoading(false);
  }, [filters, selectedCategory, getFromCache, setInCache]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Global keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(s => s !== query)].slice(0, 5);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
      return updated;
    });

    if (result.url) {
      navigate(result.url);
    }
    
    setIsOpen(false);
    setQuery('');
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    navigate(action.url);
    setIsOpen(false);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'page': return FileText;
      case 'document': return FileText;
      case 'data': return TrendingUp;
      case 'action': return Zap;
      case 'insight': return Users;
      default: return Search;
    }
  };

  const formatResultType = (type: SearchResult['type']) => {
    const types = {
      page: 'Página',
      document: 'Documento',
      data: 'Dados',
      action: 'Ação',
      insight: 'Insight'
    };
    return types[type] || type;
  };

  return (
    <>
      {/* Search trigger button */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full max-w-sm justify-start text-left font-normal bg-muted/20 hover:bg-muted/40"
        >
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground">Buscar...</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            ⌘K
          </Badge>
        </Button>
      </div>

      {/* Search Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="p-6 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite sua busca... (páginas, documentos, dados, ações)"
                  className="pl-10 pr-4 text-base h-12 border-0 focus-visible:ring-0 bg-transparent"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar with categories and filters */}
              <div className="w-48 border-r bg-muted/20 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Categorias</h4>
                    <div className="space-y-1">
                      {SEARCH_CATEGORIES.map(category => {
                        const IconComponent = category.icon;
                        return (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.id)}
                            className="w-full justify-start text-xs h-8"
                          >
                            <IconComponent className="h-3 w-3 mr-2" />
                            {category.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div className="flex-1 flex flex-col min-w-0">
                {!query ? (
                  // Empty state with recent searches and quick actions
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Buscas Recentes
                      </h3>
                      <div className="space-y-2">
                        {recentSearches.map((search, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuery(search)}
                            className="w-full justify-start text-xs h-8"
                          >
                            <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                            {search}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Ações Rápidas
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map((action, index) => {
                          const IconComponent = action.icon;
                          return (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAction(action)}
                              className="justify-start text-xs h-10"
                            >
                              <IconComponent className="h-3 w-3 mr-2" />
                              {action.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Search results
                  <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-6">
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="p-4 space-y-2">
                        {results.map((result) => {
                          const IconComponent = getResultIcon(result.type);
                          return (
                            <Card
                              key={result.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleResultClick(result)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm truncate">{result.title}</h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {formatResultType(result.type)}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                      {result.description}
                                    </p>
                                    {result.tags && result.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {result.tags.slice(0, 3).map((tag, tagIndex) => (
                                          <Badge key={tagIndex} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-sm font-medium mb-1">Nenhum resultado encontrado</h3>
                        <p className="text-xs text-muted-foreground">
                          Tente usar palavras-chave diferentes ou verificar a ortografia
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-3 bg-muted/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Use ↑↓ para navegar • Enter para selecionar • Esc para fechar</span>
                <div className="flex items-center gap-4">
                  <span>{results.length} resultados</span>
                  {selectedCategory !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Filtrado por: {SEARCH_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}