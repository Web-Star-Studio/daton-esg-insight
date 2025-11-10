import { useState } from "react";
import { SDGIntroductionCard } from "./SDGIntroductionCard";
import { SDGCard } from "./SDGCard";
import { SDG_DATA, SDGInfo } from "@/constants/sdgData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Grid3x3, List, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SDGSelectorModuleProps {
  reportId?: string;
  onUpdate?: (selectedSDGs: number[]) => void;
}

export function SDGSelectorModule({ reportId, onUpdate }: SDGSelectorModuleProps) {
  const [selectedSDGs, setSelectedSDGs] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterTheme, setFilterTheme] = useState<'all' | 'social' | 'economic' | 'environmental'>('all');

  const toggleSDG = (sdgNumber: number) => {
    const newSelected = new Set(selectedSDGs);
    if (newSelected.has(sdgNumber)) {
      newSelected.delete(sdgNumber);
    } else {
      newSelected.add(sdgNumber);
    }
    setSelectedSDGs(newSelected);
    onUpdate?.(Array.from(newSelected));
  };

  const handleSelectAll = () => {
    const allSDGs = new Set(SDG_DATA.map(sdg => sdg.number));
    setSelectedSDGs(allSDGs);
    onUpdate?.(Array.from(allSDGs));
  };

  const handleClearAll = () => {
    setSelectedSDGs(new Set());
    onUpdate?.([]);
  };

  const filteredSDGs = SDG_DATA.filter(sdg => {
    if (filterTheme === 'all') return true;
    
    const themeMap = {
      social: [1, 2, 3, 4, 5, 10, 16],
      economic: [8, 9, 12, 17],
      environmental: [6, 7, 11, 13, 14, 15]
    };
    
    return themeMap[filterTheme].includes(sdg.number);
  });

  return (
    <div className="space-y-6">
      {/* Card de Introdução */}
      <SDGIntroductionCard />

      {/* Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Selecione os ODS Prioritários
                {selectedSDGs.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedSDGs.size} selecionado{selectedSDGs.size !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Escolha os Objetivos de Desenvolvimento Sustentável que sua organização prioriza
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Filtro por tema */}
              <Select value={filterTheme} onValueChange={(value: any) => setFilterTheme(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os temas</SelectItem>
                  <SelectItem value="social">🤝 Social (7 ODS)</SelectItem>
                  <SelectItem value="economic">💼 Econômico (4 ODS)</SelectItem>
                  <SelectItem value="environmental">🌱 Ambiental (6 ODS)</SelectItem>
                </SelectContent>
              </Select>

              {/* Toggle de visualização */}
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none border-l"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Ações rápidas */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedSDGs.size === filteredSDGs.length}
              >
                Selecionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedSDGs.size === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Grid de ODS */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredSDGs.map(sdg => (
                <SDGCard
                  key={sdg.number}
                  sdg={sdg}
                  selected={selectedSDGs.has(sdg.number)}
                  onToggle={() => toggleSDG(sdg.number)}
                  onClick={() => {
                    // Aqui você pode abrir o modal de detalhes
                    console.log('Open details for ODS', sdg.number);
                  }}
                />
              ))}
            </div>
          ) : (
            /* Lista de ODS */
            <div className="space-y-2">
              {filteredSDGs.map(sdg => (
                <div
                  key={sdg.number}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleSDG(sdg.number)}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl text-white shadow-md flex-shrink-0"
                    style={{ backgroundColor: sdg.color }}
                  >
                    {sdg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">ODS {sdg.number}</h4>
                      <span className="text-sm text-muted-foreground">•</span>
                      <h4 className="font-semibold truncate">{sdg.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {sdg.description}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedSDGs.has(sdg.number)
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    {selectedSDGs.has(sdg.number) && (
                      <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo dos ODS Selecionados */}
      {selectedSDGs.size > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✨ Resumo da Seleção
            </CardTitle>
            <CardDescription>
              Você selecionou {selectedSDGs.size} ODS prioritário{selectedSDGs.size !== 1 ? 's' : ''} para sua organização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Social */}
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🤝</span>
                  <h4 className="font-semibold">Social</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedSDGs)
                    .filter(n => [1, 2, 3, 4, 5, 10, 16].includes(n))
                    .map(n => {
                      const sdg = SDG_DATA.find(s => s.number === n);
                      return (
                        <Badge 
                          key={n} 
                          style={{ backgroundColor: `${sdg?.color}20`, color: sdg?.color }}
                        >
                          {n}
                        </Badge>
                      );
                    })}
                </div>
              </div>

              {/* Econômico */}
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💼</span>
                  <h4 className="font-semibold">Econômico</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedSDGs)
                    .filter(n => [8, 9, 12, 17].includes(n))
                    .map(n => {
                      const sdg = SDG_DATA.find(s => s.number === n);
                      return (
                        <Badge 
                          key={n}
                          style={{ backgroundColor: `${sdg?.color}20`, color: sdg?.color }}
                        >
                          {n}
                        </Badge>
                      );
                    })}
                </div>
              </div>

              {/* Ambiental */}
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🌱</span>
                  <h4 className="font-semibold">Ambiental</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedSDGs)
                    .filter(n => [6, 7, 11, 13, 14, 15].includes(n))
                    .map(n => {
                      const sdg = SDG_DATA.find(s => s.number === n);
                      return (
                        <Badge 
                          key={n}
                          style={{ backgroundColor: `${sdg?.color}20`, color: sdg?.color }}
                        >
                          {n}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Próximos passos:</strong> Clique em cada ODS para selecionar as metas específicas, 
                documentar ações realizadas e adicionar indicadores de progresso.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
