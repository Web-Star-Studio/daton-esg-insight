import React, { useState, useCallback, useMemo } from 'react';
import { Search, Command, Star, Clock, FileText, BarChart3, Settings, Users, Leaf, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useKeyboardNavigation, useListNavigation } from '@/hooks/useKeyboardNavigation';
import { useFavorites } from '@/hooks/useFavorites';

interface SearchResult {
  id: string;
  title: string;
  path: string;
  description: string;
  category: string;
  icon: string;
  keywords: string[];
}

const searchData: SearchResult[] = [
  // Painéis e Dashboards
  { id: 'dashboard', title: 'Painel Principal', path: '/dashboard', description: 'Visão geral do sistema ESG', category: 'Painéis', icon: 'BarChart3', keywords: ['painel', 'dashboard', 'visao geral', 'overview'] },
  { id: 'esg-dashboard', title: 'Painel ESG', path: '/gestao-esg', description: 'Gestão completa de ESG', category: 'Painéis', icon: 'Leaf', keywords: ['esg', 'sustentabilidade', 'ambiental', 'social', 'governanca'] },
  { id: 'ghg-dashboard', title: 'Dashboard GHG', path: '/dashboard-ghg', description: 'Monitoramento de emissões de GEE', category: 'Ambiental', icon: 'BarChart3', keywords: ['ghg', 'emissoes', 'carbono', 'gases'] },
  
  // Ambiental
  { id: 'inventory', title: 'Inventário GEE', path: '/inventario-gee', description: 'Controle completo de emissões', category: 'Ambiental', icon: 'FileText', keywords: ['inventario', 'emissoes', 'carbono', 'gee', 'co2'] },
  { id: 'carbon-projects', title: 'Projetos de Carbono', path: '/projetos-carbono', description: 'Gestão de projetos de redução', category: 'Ambiental', icon: 'Leaf', keywords: ['carbono', 'projetos', 'reducao', 'offset'] },
  { id: 'licensing', title: 'Licenciamento', path: '/licenciamento', description: 'Controle de licenças ambientais', category: 'Ambiental', icon: 'FileText', keywords: ['licenca', 'ambiental', 'regulatorio'] },
  { id: 'waste', title: 'Gestão de Resíduos', path: '/residuos', description: 'Controle de resíduos sólidos', category: 'Ambiental', icon: 'Leaf', keywords: ['residuos', 'lixo', 'reciclagem'] },
  
  // Social
  { id: 'social-esg', title: 'Social ESG', path: '/social-esg', description: 'Gestão de aspectos sociais', category: 'Social', icon: 'Users', keywords: ['social', 'funcionarios', 'comunidade', 'diversidade'] },
  { id: 'training', title: 'Treinamentos', path: '/treinamentos', description: 'Gestão de capacitação', category: 'Social', icon: 'Users', keywords: ['treinamento', 'capacitacao', 'educacao'] },
  
  // Governança
  { id: 'governance', title: 'Governança ESG', path: '/governanca-esg', description: 'Controles de governança', category: 'Governança', icon: 'Shield', keywords: ['governanca', 'controles', 'compliance', 'etica'] },
  { id: 'audits', title: 'Auditorias', path: '/auditoria', description: 'Gestão de auditorias', category: 'Governança', icon: 'Shield', keywords: ['auditoria', 'verificacao', 'controle'] },
  { id: 'compliance', title: 'Compliance', path: '/compliance', description: 'Conformidade regulatória', category: 'Governança', icon: 'Shield', keywords: ['compliance', 'regulatorio', 'conformidade'] },
  
  // Dados e Documentos
  { id: 'data-collection', title: 'Coleta de Dados', path: '/coleta-dados', description: 'Importação e gestão de dados', category: 'Dados', icon: 'FileText', keywords: ['dados', 'coleta', 'importacao'] },
  { id: 'documents', title: 'Documentos', path: '/documentos', description: 'Biblioteca de documentos', category: 'Dados', icon: 'FileText', keywords: ['documentos', 'arquivos', 'biblioteca'] },
  { id: 'forms', title: 'Formulários', path: '/formularios-customizados', description: 'Criação de formulários', category: 'Dados', icon: 'FileText', keywords: ['formularios', 'customizados', 'forms'] },
  
  // Relatórios
  { id: 'reports', title: 'Relatórios', path: '/relatorios', description: 'Geração de relatórios', category: 'Relatórios', icon: 'FileText', keywords: ['relatorios', 'reports', 'dashboard'] },
  { id: 'sustainability-reports', title: 'Relatórios de Sustentabilidade', path: '/relatorios-sustentabilidade', description: 'Relatórios ESG completos', category: 'Relatórios', icon: 'FileText', keywords: ['sustentabilidade', 'esg', 'relatorio'] },
  
  // Configurações
  { id: 'settings', title: 'Configurações', path: '/configuracao', description: 'Configurações do sistema', category: 'Configurações', icon: 'Settings', keywords: ['configuracao', 'settings', 'sistema'] }
];

export function EnhancedGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { favorites } = useFavorites();

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      // Mostrar favoritos quando não há busca
      return favorites.map(fav => ({
        id: fav.id,
        title: fav.title,
        path: fav.path,
        description: `Favorito adicionado em ${fav.addedAt.toLocaleDateString()}`,
        category: 'Favoritos',
        icon: fav.icon,
        keywords: []
      }));
    }

    const term = searchTerm.toLowerCase();
    return searchData.filter(item => 
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.keywords.some(keyword => keyword.includes(term))
    ).slice(0, 8);
  }, [searchTerm, favorites]);

  const { selectedIndex, getItemProps, containerRef } = useListNavigation(
    filteredResults,
    (item) => item.id
  );

  const handleItemSelect = useCallback((result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setSearchTerm('');
  }, [navigate]);

  useKeyboardNavigation({
    onEnter: () => {
      if (filteredResults[selectedIndex]) {
        handleItemSelect(filteredResults[selectedIndex]);
      }
    },
    onEscape: () => {
      setIsOpen(false);
      setSearchTerm('');
    }
  });

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      BarChart3, FileText, Leaf, Users, Shield, Settings, Star, Clock
    };
    return icons[iconName] || FileText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="relative w-64 justify-start text-muted-foreground hover:bg-muted/50"
        >
          <Search className="h-4 w-4 mr-2" />
          <span>Buscar no sistema...</span>
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Busca Global
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite para buscar páginas, funcionalidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto border-t">
          {filteredResults.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum favorito adicionado'}
            </div>
          ) : (
            <div className="p-2">
              {!searchTerm && favorites.length > 0 && (
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b mb-2">
                  FAVORITOS
                </div>
              )}
              {filteredResults.map((result, index) => {
                const Icon = getIcon(result.icon);
                return (
                  <button
                    key={result.id}
                    {...getItemProps(index)}
                    onClick={() => handleItemSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-muted/50 transition-colors ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{result.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.category}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Use <kbd className="px-1.5 py-0.5 text-xs border rounded bg-background">↑↓</kbd> para navegar,{' '}
            <kbd className="px-1.5 py-0.5 text-xs border rounded bg-background">Enter</kbd> para selecionar,{' '}
            <kbd className="px-1.5 py-0.5 text-xs border rounded bg-background">Esc</kbd> para fechar
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}