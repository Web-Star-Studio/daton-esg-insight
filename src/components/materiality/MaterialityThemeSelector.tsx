import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import { ThemeCard } from './ThemeCard';
import { 
  MATERIALITY_THEMES_LIBRARY, 
  MATERIALITY_CATEGORIES,
  getThemeById,
  getTotalMetrics
} from '@/constants/materialityThemesLibrary';

interface MaterialityThemeSelectorProps {
  onThemesSelected: (themes: string[]) => void;
  preSelectedThemes?: string[];
}

export function MaterialityThemeSelector({ 
  onThemesSelected, 
  preSelectedThemes = [] 
}: MaterialityThemeSelectorProps) {
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set(preSelectedThemes));
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const filteredThemes = MATERIALITY_THEMES_LIBRARY.filter(theme => {
    if (categoryFilter && theme.category !== categoryFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        theme.name.toLowerCase().includes(search) ||
        theme.description.toLowerCase().includes(search) ||
        theme.subcategory.toLowerCase().includes(search) ||
        theme.metrics.some(m => m.name.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const toggleTheme = (themeId: string) => {
    const newSelected = new Set(selectedThemes);
    if (newSelected.has(themeId)) {
      newSelected.delete(themeId);
    } else {
      newSelected.add(themeId);
    }
    setSelectedThemes(newSelected);
  };

  const handleContinue = () => {
    onThemesSelected(Array.from(selectedThemes));
  };

  const categoryStats = {
    environmental: MATERIALITY_THEMES_LIBRARY.filter(t => t.category === 'environmental').length,
    social: MATERIALITY_THEMES_LIBRARY.filter(t => t.category === 'social').length,
    governance: MATERIALITY_THEMES_LIBRARY.filter(t => t.category === 'governance').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{MATERIALITY_THEMES_LIBRARY.length}</div>
            <p className="text-xs text-muted-foreground">Temas ESG disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{getTotalMetrics()}</div>
            <p className="text-xs text-muted-foreground">Métricas totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{selectedThemes.size}</div>
            <p className="text-xs text-muted-foreground">Temas selecionados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {Array.from(selectedThemes).reduce((sum, id) => {
                const theme = getThemeById(id);
                return sum + (theme?.metrics.length || 0);
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Métricas selecionadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Selector Card */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione os Temas Materiais</CardTitle>
          <CardDescription>
            Escolha os temas ESG relevantes para sua organização baseados no setor, operações e stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tema, métrica ou palavra-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs 
              value={categoryFilter || 'all'} 
              onValueChange={(v) => setCategoryFilter(v === 'all' ? null : v)}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  Todos ({MATERIALITY_THEMES_LIBRARY.length})
                </TabsTrigger>
                <TabsTrigger value="environmental">
                  {MATERIALITY_CATEGORIES.environmental.icon} E ({categoryStats.environmental})
                </TabsTrigger>
                <TabsTrigger value="social">
                  {MATERIALITY_CATEGORIES.social.icon} S ({categoryStats.social})
                </TabsTrigger>
                <TabsTrigger value="governance">
                  {MATERIALITY_CATEGORIES.governance.icon} G ({categoryStats.governance})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredThemes.length} de {MATERIALITY_THEMES_LIBRARY.length} temas
            {searchTerm && ` · Busca: "${searchTerm}"`}
            {categoryFilter && ` · Categoria: ${MATERIALITY_CATEGORIES[categoryFilter as keyof typeof MATERIALITY_CATEGORIES].label}`}
          </div>

          {/* Grid de Temas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={selectedThemes.has(theme.id)}
                expanded={expandedTheme === theme.id}
                onToggle={() => toggleTheme(theme.id)}
                onExpand={() => setExpandedTheme(theme.id === expandedTheme ? null : theme.id)}
              />
            ))}
          </div>

          {filteredThemes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum tema encontrado com os filtros aplicados
              </p>
            </div>
          )}

          {/* Resumo da seleção */}
          {selectedThemes.size > 0 && (
            <div className="mt-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Temas Selecionados ({selectedThemes.size})</h4>
                <Button onClick={handleContinue} size="sm">
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedThemes).map(themeId => {
                  const theme = getThemeById(themeId);
                  return theme ? (
                    <Badge 
                      key={themeId} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10"
                      onClick={() => toggleTheme(themeId)}
                    >
                      {theme.icon} {theme.name} ✕
                    </Badge>
                  ) : null;
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Ambientais:</span>
                  <span className="ml-2 font-semibold">
                    {Array.from(selectedThemes).filter(id => {
                      const theme = getThemeById(id);
                      return theme?.category === 'environmental';
                    }).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sociais:</span>
                  <span className="ml-2 font-semibold">
                    {Array.from(selectedThemes).filter(id => {
                      const theme = getThemeById(id);
                      return theme?.category === 'social';
                    }).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Governança:</span>
                  <span className="ml-2 font-semibold">
                    {Array.from(selectedThemes).filter(id => {
                      const theme = getThemeById(id);
                      return theme?.category === 'governance';
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
