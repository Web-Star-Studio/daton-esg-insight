import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  Search, 
  ArrowLeft, 
  BarChart3, 
  FileText, 
  Settings, 
  Leaf,
  HelpCircle
} from 'lucide-react';

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to a search page or home with query
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popularPages = [
    {
      title: 'Dashboard',
      description: 'Visão geral do sistema',
      icon: BarChart3,
      path: '/dashboard',
      color: 'text-primary'
    },
    {
      title: 'Inventário GEE',
      description: 'Gestão de emissões de GEE',
      icon: Leaf,
      path: '/inventario-gee',
      color: 'text-green-600'
    },
    {
      title: 'Relatórios',
      description: 'Relatórios e análises',
      icon: FileText,
      path: '/relatorios',
      color: 'text-blue-600'
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: Settings,
      path: '/configuracao',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center">
        
        {/* Clean 404 Section */}
        <div className="space-y-12 animate-fade-in">
          
          {/* Icon and Number - Separated */}
          <div className="space-y-8">
            <div className="flex justify-center mb-6">
              <HelpCircle className="w-16 h-16 text-primary/60" />
            </div>
            
            <h1 className="text-8xl font-light text-foreground/80 tracking-wider">
              404
            </h1>
          </div>
          
          {/* Clean Typography */}
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-medium text-foreground">
              Página não encontrada
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          {/* Minimalist Search */}
          <div className="max-w-sm mx-auto">
            <form onSubmit={handleSearch}>
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background hover:border-primary/40 transition-colors">
                <Search className="w-4 h-4 text-muted-foreground ml-3" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="m-1 h-8 rounded-md"
                  disabled={!searchQuery.trim()}
                >
                  Ir
                </Button>
              </div>
            </form>
          </div>

          {/* Clean Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
            <Button 
              onClick={() => navigate(-1)} 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            
            <Button asChild variant="default" size="sm">
              <Link to="/dashboard">
                <Home className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
            </Button>
            
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/configuracao">
                <Settings className="w-4 h-4 mr-1" />
                Configurações
              </Link>
            </Button>
          </div>

          {/* Simplified Popular Pages */}
          <div className="pt-12 border-t border-border/40">
            <h3 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wide">
              Páginas mais acessadas
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {popularPages.map((page) => (
                <Link 
                  key={page.path}
                  to={page.path}
                  className="group flex flex-col items-center p-4 rounded-lg hover:bg-muted/30 transition-all duration-200"
                >
                  <page.icon className={`w-6 h-6 ${page.color} mb-2 group-hover:scale-105 transition-transform`} />
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {page.title}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 text-center">
                    {page.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
