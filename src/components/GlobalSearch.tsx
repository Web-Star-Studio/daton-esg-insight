import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  ListTodo, 
  Home,
  BarChart3,
  Leaf,
  FileCheck,
  Droplets,
  Zap,
  Trash2,
  Target,
  Users,
  Settings,
  Brain,
  Folder
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/contexts/CompanyContext';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  category: string;
  badge?: string;
}

const SYSTEM_PAGES = [
  { title: 'Dashboard', path: '/dashboard', icon: Home, keywords: ['inicio', 'home', 'painel'] },
  { title: 'Documentos', path: '/documentos', icon: FileText, keywords: ['docs', 'files', 'arquivos'] },
  { title: 'Aprovações de Extrações', path: '/documentos?tab=extracoes', icon: CheckCircle, keywords: ['aprovacao', 'extracoes', 'revisar'] },
  { title: 'Monitoramento de Água', path: '/monitoramento-agua', icon: Droplets, keywords: ['agua', 'water', 'consumo'] },
  { title: 'Monitoramento de Energia', path: '/monitoramento-energia', icon: Zap, keywords: ['energia', 'eletricidade', 'kwh'] },
  { title: 'Monitoramento de Resíduos', path: '/monitoramento-residuos', icon: Trash2, keywords: ['residuos', 'lixo', 'waste'] },
  { title: 'Inventário GEE', path: '/inventario-gee', icon: Leaf, keywords: ['emissoes', 'carbono', 'ghg', 'gee'] },
  { title: 'Licenciamento', path: '/licenciamento', icon: FileCheck, keywords: ['licenca', 'ambiental', 'orgao'] },
  { title: 'Metas', path: '/metas', icon: Target, keywords: ['objetivos', 'goals', 'kpi'] },
  { title: 'Gestão ESG', path: '/gestao-esg', icon: BarChart3, keywords: ['esg', 'sustentabilidade'] },
  { title: 'GRI', path: '/gri', icon: FileText, keywords: ['relatorio', 'gri', 'reporting'] },
  { title: 'Coleta de Dados', path: '/coleta-dados', icon: ListTodo, keywords: ['formularios', 'tasks', 'coleta'] },
  { title: 'Fornecedores', path: '/fornecedores', icon: Users, keywords: ['suppliers', 'terceiros'] },
  { title: 'IA Insights', path: '/ia-insights', icon: Brain, keywords: ['inteligencia', 'artificial', 'ai'] },
  { title: 'Configurações', path: '/configuracao', icon: Settings, keywords: ['config', 'ajustes'] },
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    try {
      // Search system pages
      const matchingPages = SYSTEM_PAGES.filter(page => 
        page.title.toLowerCase().includes(lowerQuery) ||
        page.keywords.some(kw => kw.includes(lowerQuery))
      );

      matchingPages.forEach(page => {
        searchResults.push({
          id: `page-${page.path}`,
          title: page.title,
          subtitle: 'Página do sistema',
          icon: page.icon,
          action: () => {
            navigate(page.path);
            onOpenChange(false);
          },
          category: 'Páginas',
        });
      });

      // Search documents (limit 5)
      if (selectedCompany) {
        const { data: documents } = await supabase
          .from('documents')
          .select('id, file_name, document_type')
          .eq('company_id', selectedCompany.id)
          .or(`file_name.ilike.%${query}%,document_type.ilike.%${query}%`)
          .limit(5);

        documents?.forEach(doc => {
          searchResults.push({
            id: `doc-${doc.id}`,
            title: doc.file_name,
            subtitle: doc.document_type || 'Documento',
            icon: FileText,
            action: () => {
              navigate('/documentos');
              onOpenChange(false);
            },
            category: 'Documentos',
          });
        });

        // Search pending extractions (limit 5)
        const { data: extractions } = await supabase
          .from('extracted_data_preview')
          .select(`
            id,
            target_table,
            validation_status,
            extraction_job:document_extraction_jobs(
              document:documents(file_name)
            )
          `)
          .eq('validation_status', 'Pendente')
          .limit(5);

        extractions?.forEach((ext: any) => {
          searchResults.push({
            id: `ext-${ext.id}`,
            title: ext.extraction_job?.document?.file_name || 'Extração',
            subtitle: ext.target_table,
            icon: CheckCircle,
            action: () => {
              navigate('/documentos?tab=extracoes');
              onOpenChange(false);
            },
            category: 'Aprovações Pendentes',
            badge: 'Pendente',
          });
        });

        // Search data collection tasks (limit 5)
        const { data: tasks } = await supabase
          .from('data_collection_tasks')
          .select('id, name, description, status')
          .eq('company_id', selectedCompany.id)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        tasks?.forEach(task => {
          searchResults.push({
            id: `task-${task.id}`,
            title: task.name,
            subtitle: task.description || `Status: ${task.status}`,
            icon: ListTodo,
            action: () => {
              navigate('/coleta-dados');
              onOpenChange(false);
            },
            category: 'Tasks de Coleta',
            badge: task.status,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany, navigate, onOpenChange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar documentos, extrações, tasks ou páginas..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Buscando...' : 'Nenhum resultado encontrado.'}
        </CommandEmpty>
        
        {Object.entries(groupedResults).map(([category, items], idx) => (
          <div key={category}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((result) => {
                const Icon = result.icon;
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={result.action}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {result.badge && (
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {result.badge}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}

        {/* Quick actions when no search */}
        {!searchQuery && (
          <>
            <CommandGroup heading="Ações Rápidas">
              <CommandItem
                onSelect={() => {
                  navigate('/documentos');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ver todos os documentos</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/documentos?tab=extracoes');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ver aprovações pendentes</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/coleta-dados');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ver tasks de coleta</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Dica">
              <CommandItem disabled className="text-xs text-muted-foreground">
                <Search className="h-3 w-3 mr-2" />
                Digite para buscar em documentos, extrações e páginas
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
