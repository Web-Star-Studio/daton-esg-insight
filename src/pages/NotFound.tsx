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
  Users, 
  Leaf,
  AlertTriangle
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Main 404 Section */}
        <div className="space-y-6 animate-fade-in">
          <div className="relative">
            <h1 className="text-9xl font-bold text-primary/20 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="w-24 h-24 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Página não encontrada
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ops! A página que você está procurando não existe ou foi movida. 
              Não se preocupe, vamos te ajudar a encontrar o que precisa.
            </p>
          </div>
        </div>

        {/* Search Section */}
        <Card className="max-w-md mx-auto animate-fade-in">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Buscar no sistema</span>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="O que você está procurando?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  Buscar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center animate-fade-in">
          <Button onClick={() => navigate(-1)} variant="outline" className="hover-scale">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button asChild className="hover-scale">
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Ir ao Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="hover-scale">
            <Link to="/configuracao">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Link>
          </Button>
        </div>

        {/* Popular Pages */}
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-2xl font-semibold text-foreground">
            Páginas mais acessadas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularPages.map((page, index) => (
              <Card 
                key={page.path} 
                className="hover:shadow-lg transition-all duration-300 hover-scale cursor-pointer group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <Link to={page.path} className="block space-y-3">
                    <div className="flex justify-center">
                      <page.icon className={`w-8 h-8 ${page.color} group-hover:scale-110 transition-transform duration-200`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {page.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {page.description}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <Card className="max-w-2xl mx-auto animate-fade-in bg-muted/50">
          <CardContent className="p-6 text-center space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              Ainda não encontrou o que procura?
            </h4>
            <p className="text-muted-foreground">
              Nossa equipe de suporte está sempre pronta para ajudar. 
              Entre em contato conosco para assistência personalizada.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="outline" size="sm" className="hover-scale">
                📧 suporte@empresa.com
              </Button>
              <Button variant="outline" size="sm" className="hover-scale">
                📞 (11) 1234-5678
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-sm text-muted-foreground animate-fade-in">
          <p>
            © 2024 Sistema ESG. Desenvolvido com ❤️ para sustentabilidade.
          </p>
        </div>
      </div>
    </div>
  );
}
