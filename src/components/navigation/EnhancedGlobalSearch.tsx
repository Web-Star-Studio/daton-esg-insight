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
  // INÍCIO
  { id: 'dashboard', title: 'Painel Principal', path: '/dashboard', description: 'Visão geral do sistema ESG', category: 'Início', icon: 'BarChart3', keywords: ['painel', 'dashboard', 'visao geral', 'overview', 'inicio'] },
  { id: 'performance', title: 'Análise de Desempenho', path: '/desempenho', description: 'Monitoramento de KPIs ESG', category: 'Início', icon: 'BarChart3', keywords: ['desempenho', 'performance', 'kpi', 'metricas', 'analise'] },

  // ESTRATÉGIA ESG
  { id: 'esg-management', title: 'Painel de Gestão ESG', path: '/gestao-esg', description: 'Central de gestão ESG', category: 'Estratégia ESG', icon: 'Leaf', keywords: ['esg', 'gestao', 'sustentabilidade', 'estrategia'] },
  { id: 'materiality-analysis', title: 'Análise de Materialidade', path: '/analise-materialidade', description: 'Identificação de temas ESG relevantes', category: 'Estratégia ESG', icon: 'Search', keywords: ['materialidade', 'analise', 'temas', 'relevantes', 'prioridades'] },
  { id: 'stakeholder-management', title: 'Gestão de Stakeholders', path: '/gestao-stakeholders', description: 'Gestão de partes interessadas', category: 'Estratégia ESG', icon: 'Users', keywords: ['stakeholders', 'partes', 'interessadas', 'relacionamento'] },
  { id: 'sustainability-targets', title: 'Metas de Sustentabilidade', path: '/metas-sustentabilidade', description: 'Definição e acompanhamento de metas', category: 'Estratégia ESG', icon: 'Target', keywords: ['metas', 'objetivos', 'sustentabilidade', 'targets'] },

  // AMBIENTAL (E)
  { id: 'ghg-dashboard', title: 'Dashboard GHG', path: '/dashboard-ghg', description: 'Painel de monitoramento de emissões', category: 'Ambiental', icon: 'BarChart3', keywords: ['ghg', 'emissoes', 'carbono', 'gases', 'dashboard'] },
  { id: 'ghg-inventory', title: 'Inventário de Emissões', path: '/inventario-gee', description: 'Controle completo do inventário GEE', category: 'Ambiental', icon: 'FileText', keywords: ['inventario', 'emissoes', 'carbono', 'gee', 'co2'] },
  { id: 'carbon-projects', title: 'Projetos de Carbono', path: '/projetos-carbono', description: 'Gestão de projetos de redução', category: 'Ambiental', icon: 'Leaf', keywords: ['carbono', 'projetos', 'reducao', 'offset', 'neutralizacao'] },
  { id: 'waste-management', title: 'Gestão de Resíduos', path: '/residuos', description: 'Controle e destinação de resíduos', category: 'Ambiental', icon: 'Leaf', keywords: ['residuos', 'lixo', 'reciclagem', 'destinacao'] },
  { id: 'environmental-licensing', title: 'Licenciamento Ambiental', path: '/licenciamento', description: 'Gestão de licenças ambientais', category: 'Ambiental', icon: 'FileText', keywords: ['licenca', 'ambiental', 'regulatorio', 'permissoes'] },

  // SOCIAL (S)
  { id: 'social-panel', title: 'Painel Social', path: '/painel-social', description: 'Visão geral dos aspectos sociais', category: 'Social', icon: 'Users', keywords: ['social', 'painel', 'aspectos', 'dashboard'] },
  { id: 'employee-management', title: 'Gestão de Funcionários', path: '/gestao-funcionarios', description: 'Gestão de recursos humanos', category: 'Social', icon: 'Users', keywords: ['funcionarios', 'rh', 'recursos', 'humanos', 'colaboradores'] },
  { id: 'health-safety', title: 'Saúde e Segurança do Trabalho', path: '/saude-seguranca', description: 'SST e bem-estar dos colaboradores', category: 'Social', icon: 'Shield', keywords: ['saude', 'seguranca', 'sst', 'trabalho', 'bem-estar'] },
  { id: 'training-development', title: 'Treinamentos e Desenvolvimento', path: '/treinamentos', description: 'Capacitação e desenvolvimento profissional', category: 'Social', icon: 'Users', keywords: ['treinamento', 'capacitacao', 'educacao', 'desenvolvimento'] },

  // GOVERNANÇA (G)
  { id: 'governance-panel', title: 'Painel de Governança', path: '/painel-governanca', description: 'Visão geral da governança corporativa', category: 'Governança', icon: 'Shield', keywords: ['governanca', 'painel', 'corporativa', 'dashboard'] },
  { id: 'risk-management', title: 'Gestão de Riscos', path: '/gestao-riscos', description: 'Identificação e mitigação de riscos', category: 'Governança', icon: 'Shield', keywords: ['riscos', 'gestao', 'mitigacao', 'identificacao'] },
  { id: 'compliance-policies', title: 'Compliance e Políticas', path: '/compliance', description: 'Conformidade regulatória e políticas', category: 'Governança', icon: 'Shield', keywords: ['compliance', 'politicas', 'regulatorio', 'conformidade'] },
  { id: 'audits', title: 'Auditorias', path: '/auditorias', description: 'Gestão de auditorias internas e externas', category: 'Governança', icon: 'Shield', keywords: ['auditoria', 'verificacao', 'controle', 'internas', 'externas'] },

  // GESTÃO DA QUALIDADE (SGQ)
  { id: 'sgq-dashboard', title: 'Dashboard SGQ', path: '/sgq-dashboard', description: 'Painel de gestão da qualidade', category: 'SGQ', icon: 'BarChart3', keywords: ['sgq', 'qualidade', 'dashboard', 'painel'] },
  { id: 'strategic-planning', title: 'Planejamento Estratégico', path: '/planejamento-estrategico', description: 'Definição de estratégias organizacionais', category: 'SGQ', icon: 'Target', keywords: ['planejamento', 'estrategico', 'estrategias', 'organizacional'] },
  { id: 'process-mapping', title: 'Mapeamento de Processos', path: '/mapeamento-processos', description: 'Documentação e otimização de processos', category: 'SGQ', icon: 'FileText', keywords: ['mapeamento', 'processos', 'documentacao', 'otimizacao'] },
  { id: 'non-conformities', title: 'Não Conformidades', path: '/nao-conformidades', description: 'Gestão de não conformidades e ações corretivas', category: 'SGQ', icon: 'FileText', keywords: ['nao conformidades', 'acoes', 'corretivas', 'gestao'] },
  { id: 'internal-audits', title: 'Auditorias Internas', path: '/auditorias-internas', description: 'Auditorias do sistema de qualidade', category: 'SGQ', icon: 'Search', keywords: ['auditorias', 'internas', 'qualidade', 'sistema'] },
  { id: 'corrective-actions', title: 'Ações Corretivas', path: '/acoes-corretivas', description: 'Planos de ação e melhorias', category: 'SGQ', icon: 'FileText', keywords: ['acoes', 'corretivas', 'planos', 'melhorias'] },
  { id: 'document-control', title: 'Controle de Documentos', path: '/controle-documentos', description: 'Versionamento e controle documental', category: 'SGQ', icon: 'FileText', keywords: ['controle', 'documentos', 'versionamento', 'documental'] },
  { id: 'supplier-evaluation', title: 'Avaliação de Fornecedores', path: '/avaliacao-fornecedores', description: 'Qualificação e monitoramento de fornecedores', category: 'SGQ', icon: 'Users', keywords: ['fornecedores', 'avaliacao', 'qualificacao', 'monitoramento'] },

  // CENTRAL DE DADOS
  { id: 'data-collection', title: 'Coleta de Dados', path: '/coleta-dados', description: 'Importação e gestão de dados ESG', category: 'Central de Dados', icon: 'FileText', keywords: ['dados', 'coleta', 'importacao', 'gestao'] },
  { id: 'documents', title: 'Documentos', path: '/documentos', description: 'Biblioteca de documentos e arquivos', category: 'Central de Dados', icon: 'FileText', keywords: ['documentos', 'arquivos', 'biblioteca', 'central'] },
  { id: 'assets', title: 'Ativos', path: '/ativos', description: 'Gestão de ativos da organização', category: 'Central de Dados', icon: 'FileText', keywords: ['ativos', 'gestao', 'organizacao', 'patrimonio'] },
  { id: 'ai-reconciliation', title: 'Reconciliação IA', path: '/reconciliacao-ia', description: 'Reconciliação inteligente de dados', category: 'Central de Dados', icon: 'FileText', keywords: ['reconciliacao', 'ia', 'inteligente', 'dados'] },

  // RELATÓRIOS E DIVULGAÇÃO
  { id: 'report-generator', title: 'Gerador de Relatórios', path: '/gerador-relatorios', description: 'Criação personalizada de relatórios', category: 'Relatórios', icon: 'FileText', keywords: ['gerador', 'relatorios', 'criacao', 'personalizada'] },
  { id: 'integrated-reports', title: 'Relatórios Integrados', path: '/relatorios-integrados', description: 'Relatórios ESG completos e integrados', category: 'Relatórios', icon: 'FileText', keywords: ['relatorios', 'integrados', 'esg', 'completos'] },
  { id: 'esg-marketplace', title: 'Marketplace ESG', path: '/marketplace-esg', description: 'Plataforma de soluções ESG', category: 'Relatórios', icon: 'FileText', keywords: ['marketplace', 'esg', 'plataforma', 'solucoes'] },

  // CONFIGURAÇÕES
  { id: 'organization-config', title: 'Configuração da Organização', path: '/configuracao-organizacao', description: 'Dados e estrutura organizacional', category: 'Configurações', icon: 'Settings', keywords: ['configuracao', 'organizacao', 'estrutura', 'dados'] },
  { id: 'factor-library', title: 'Biblioteca de Fatores', path: '/biblioteca-fatores', description: 'Fatores de emissão e conversão', category: 'Configurações', icon: 'Settings', keywords: ['biblioteca', 'fatores', 'emissao', 'conversao'] },
  { id: 'custom-forms', title: 'Formulários Customizados', path: '/formularios-customizados', description: 'Criação de formulários personalizados', category: 'Configurações', icon: 'Settings', keywords: ['formularios', 'customizados', 'personalizados', 'criacao'] },
  { id: 'user-management', title: 'Gestão de Usuários', path: '/gestao-usuarios', description: 'Controle de usuários e permissões', category: 'Configurações', icon: 'Settings', keywords: ['usuarios', 'gestao', 'permissoes', 'controle'] }
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