import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Zap, 
  Target, 
  FileText, 
  Calendar, 
  Upload, 
  Download,
  Share2,
  Filter,
  Search,
  MoreHorizontal,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  path: string;
  category: string;
  isNew?: boolean;
  isPopular?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'new-emission',
    title: 'Registrar Emissão',
    subtitle: 'Adicionar dados GEE',
    icon: Plus,
    color: 'bg-gradient-to-r from-green-500 to-emerald-600',
    path: '/inventario-gee/novo',
    category: 'Ambiental',
    isPopular: true
  },
  {
    id: 'generate-report',
    title: 'Gerar Relatório',
    subtitle: 'Criar relatório ESG',
    icon: FileText,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    path: '/relatorios/novo',
    category: 'Relatórios',
    isPopular: true
  },
  {
    id: 'schedule-audit',
    title: 'Agendar Auditoria',
    subtitle: 'Programar auditoria',
    icon: Calendar,
    color: 'bg-gradient-to-r from-purple-500 to-pink-600',
    path: '/auditorias/nova',
    category: 'Qualidade'
  },
  {
    id: 'set-target',
    title: 'Definir Meta',
    subtitle: 'Nova meta ESG',
    icon: Target,
    color: 'bg-gradient-to-r from-orange-500 to-red-600',
    path: '/metas/nova',
    category: 'Estratégia',
    isNew: true
  },
  {
    id: 'import-data',
    title: 'Importar Dados',
    subtitle: 'Upload de planilha',
    icon: Upload,
    color: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    path: '/dados/importar',
    category: 'Dados'
  },
  {
    id: 'ai-analysis',
    title: 'Análise IA',
    subtitle: 'Insights inteligentes',
    icon: Sparkles,
    color: 'bg-gradient-to-r from-pink-500 to-violet-600',
    path: '/ia/analise',
    category: 'IA',
    isNew: true
  }
];

export function InteractiveQuickActions() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const categories = ['Todos', ...Array.from(new Set(QUICK_ACTIONS.map(action => action.category)))];
  
  const filteredActions = QUICK_ACTIONS.filter(action => {
    const matchesCategory = selectedCategory === 'Todos' || action.category === selectedCategory;
    const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleActionClick = (action: QuickAction) => {
    // Add click animation effect
    const element = document.getElementById(`action-${action.id}`);
    if (element) {
      element.style.transform = 'scale(0.95)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 150);
    }
    
    setTimeout(() => {
      navigate(action.path);
    }, 200);
  };

  return (
    <Card className="shadow-lg border-0 animate-fade-in">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ações Rápidas</h3>
              <p className="text-sm text-muted-foreground">Acesso direto às funcionalidades principais</p>
            </div>
            
            <Button variant="ghost" size="sm" className="gap-2">
              <MoreHorizontal className="w-4 h-4" />
              Personalizar
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredActions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <div
                  key={action.id}
                  id={`action-${action.id}`}
                  className="group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleActionClick(action)}
                >
                  <div className={`p-4 rounded-xl border border-border/50 hover:border-border transition-all duration-300 hover:shadow-md hover-scale bg-gradient-to-br from-white to-gray-50/30`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                            {action.title}
                          </h4>
                          
                          {action.isNew && (
                            <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 animate-pulse">
                              Novo
                            </Badge>
                          )}
                          
                          {action.isPopular && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              ⭐ Popular
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {action.subtitle}
                        </p>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredActions.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma ação encontrada</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Todos');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{filteredActions.length} ações disponíveis</span>
              <Button variant="ghost" size="sm" className="text-xs gap-1 hover-scale">
                <Plus className="w-3 h-3" />
                Adicionar ação personalizada
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}