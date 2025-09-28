import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
  FileText,
  Users,
  Leaf,
  Award,
  Calendar,
  Settings,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  path: string;
  icon: any;
  color: string;
  isRecent?: boolean;
  isFavorite?: boolean;
}

const SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'inventario-gee',
    title: 'Inventário GEE',
    subtitle: 'Gestão de gases de efeito estufa',
    category: 'Ambiental',
    path: '/inventario-gee',
    icon: Leaf,
    color: 'text-green-600',
    isRecent: true
  },
  {
    id: 'dashboard-ghg',
    title: 'Dashboard GHG',
    subtitle: 'Painel de emissões',
    category: 'Dashboard',
    path: '/dashboard-ghg',
    icon: TrendingUp,
    color: 'text-blue-600',
    isFavorite: true
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    subtitle: 'Gerar relatórios ESG',
    category: 'Relatórios',
    path: '/relatorios',
    icon: FileText,
    color: 'text-purple-600',
    isRecent: true
  },
  {
    id: 'gestao-pessoas',
    title: 'Gestão de Pessoas',
    subtitle: 'RH e colaboradores',
    category: 'Social',
    path: '/gestao-pessoas',
    icon: Users,
    color: 'text-orange-600'
  },
  {
    id: 'auditorias',
    title: 'Auditorias',
    subtitle: 'Sistema de qualidade',
    category: 'Qualidade',
    path: '/auditorias',
    icon: Award,
    color: 'text-indigo-600'
  },
  {
    id: 'configuracao',
    title: 'Configurações',
    subtitle: 'Configurações do sistema',
    category: 'Sistema',
    path: '/configuracao-organizacao',
    icon: Settings,
    color: 'text-gray-600'
  }
];

const RECENT_SEARCHES = [
  'inventário emissões',
  'relatório sustentabilidade',
  'auditoria qualidade',
  'metas ESG'
];

export function EnhancedSearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = SEARCH_RESULTS.filter(result => 
        result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(filtered);
    } else {
      // Show recent and favorites when no search term
      const suggested = SEARCH_RESULTS.filter(result => 
        result.isRecent || result.isFavorite
      ).slice(0, 4);
      setFilteredResults(suggested);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setSearchTerm('');
    
    // Add to recent searches (in real app, this would be stored)
    console.log(`Navigating to: ${result.title}`);
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchTerm(search);
    inputRef.current?.focus();
  };

  const categories = [...new Set(filteredResults.map(r => r.category))];

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div 
        className={`relative transition-all duration-300 ${
          isOpen ? 'shadow-lg scale-105' : 'hover:shadow-md'
        }`}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar funcionalidades... (Ctrl+K)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-20 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="w-6 h-6 p-0 hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          <Badge variant="outline" className="text-xs px-2 py-0.5 hidden sm:flex">
            ⌘K
          </Badge>
        </div>
      </div>

      {/* Search Results Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" />
          
          {/* Results Panel */}
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-2xl border-0 max-h-96 overflow-hidden animate-fade-in">
            <CardContent className="p-0">
              {/* Header */}
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {searchTerm ? `Resultados para "${searchTerm}"` : 'Sugestões'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {categories.length > 1 && (
                      <Button variant="ghost" size="sm" className="text-xs h-6 gap-1">
                        <Filter className="w-3 h-3" />
                        Filtrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredResults.length > 0 ? (
                  <div className="p-2">
                    {filteredResults.map((result, index) => {
                      const Icon = result.icon;
                      
                      return (
                        <div
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-all animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-4 h-4 ${result.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {result.title}
                              </h4>
                              
                              {result.isRecent && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Recente
                                </Badge>
                              )}
                              
                              {result.isFavorite && (
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {result.category}
                            </Badge>
                            
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : searchTerm ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum resultado encontrado</p>
                    <p className="text-xs mt-1">Tente termos diferentes</p>
                  </div>
                ) : (
                  <div className="p-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Buscas Recentes
                    </h4>
                    
                    <div className="space-y-1">
                      {RECENT_SEARCHES.map((search, index) => (
                        <div
                          key={search}
                          onClick={() => handleRecentSearchClick(search)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer group transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground group-hover:text-foreground">
                            {search}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredResults.length > 0 && (
                <div className="p-3 border-t bg-muted/30">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''}</span>
                    
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">↵</kbd>
                      <span>para navegar</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}