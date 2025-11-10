import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SDGIntroductionCard } from "./SDGIntroductionCard";
import { SDGCard } from "./SDGCard";
import { SDGDetailModal } from "./SDGDetailModal";
import { SelectedSDGsTable } from "./SelectedSDGsTable";
import { GeneratedTextPreview } from "./GeneratedTextPreview";
import { SDG_DATA } from "@/constants/sdgData";
import { Grid3x3, List, RefreshCw, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KPI {
  id: string;
  indicator: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
}

interface SDGDetails {
  sdg_number: number;
  selected_targets: string[];
  impact_level: 'Alto' | 'Médio' | 'Baixo';
  actions_taken?: string;
  results_achieved?: string;
  future_commitments?: string;
  evidence_documents?: string[];
  kpis?: KPI[];
}

interface SDGSelectorModuleProps {
  reportId: string;
  onUpdate?: (selectedSDGs: number[]) => void;
}

export function SDGSelectorModule({ reportId, onUpdate }: SDGSelectorModuleProps) {
  const [selectedSDGs, setSelectedSDGs] = useState<Set<number>>(new Set());
  const [sdgDetails, setSdgDetails] = useState<Map<number, SDGDetails>>(new Map());
  const [activeSDG, setActiveSDG] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterTheme, setFilterTheme] = useState<'all' | 'social' | 'economic' | 'environmental'>('all');

  useEffect(() => {
    if (reportId) {
      loadSavedSDGs();
    }
  }, [reportId]);

  const loadSavedSDGs = async () => {
    try {
      const { data, error } = await supabase
        .from('sdg_alignment')
        .select('*')
        .eq('report_id', reportId);

      if (error) throw error;

      if (data && data.length > 0) {
        const selected = new Set(data.map(d => d.sdg_number));
        const details = new Map<number, SDGDetails>();

        data.forEach(item => {
          details.set(item.sdg_number, {
            sdg_number: item.sdg_number,
            selected_targets: (item.selected_targets as string[]) || [],
            impact_level: (item.impact_level as 'Alto' | 'Médio' | 'Baixo') || 'Médio',
            actions_taken: item.actions_taken || undefined,
            results_achieved: item.results_achieved || undefined,
            future_commitments: item.future_commitments || undefined,
            evidence_documents: (item.evidence_documents as string[]) || [],
            kpis: ((item.kpis as unknown) as KPI[]) || []
          });
        });

        setSelectedSDGs(selected);
        setSdgDetails(details);
      }
    } catch (error) {
      console.error('Error loading SDGs:', error);
      toast.error('Erro ao carregar ODS salvos');
    }
  };

  const toggleSDG = async (sdgNumber: number) => {
    const newSelected = new Set(selectedSDGs);
    
    if (newSelected.has(sdgNumber)) {
      newSelected.delete(sdgNumber);
      
      const { error } = await supabase
        .from('sdg_alignment')
        .delete()
        .eq('report_id', reportId)
        .eq('sdg_number', sdgNumber);

      if (error) {
        console.error('Error removing SDG:', error);
        toast.error('Erro ao remover ODS');
        return;
      }

      const newDetails = new Map(sdgDetails);
      newDetails.delete(sdgNumber);
      setSdgDetails(newDetails);
      
      toast.success(`ODS ${sdgNumber} removido`);
    } else {
      newSelected.add(sdgNumber);
      
      const { error } = await supabase
        .from('sdg_alignment')
        .insert({
          report_id: reportId,
          sdg_number: sdgNumber,
          impact_level: 'Médio',
          selected_targets: []
        });

      if (error) {
        console.error('Error adding SDG:', error);
        toast.error('Erro ao adicionar ODS');
        return;
      }
      
      toast.success(`ODS ${sdgNumber} adicionado`);
    }
    
    setSelectedSDGs(newSelected);
    onUpdate?.(Array.from(newSelected));
  };

  const openSDGDetails = (sdgNumber: number) => {
    setActiveSDG(sdgNumber);
    setIsModalOpen(true);
  };

  const saveSDGDetails = async (details: SDGDetails) => {
    try {
      const { error } = await supabase
        .from('sdg_alignment')
        .update({
          selected_targets: details.selected_targets,
          impact_level: details.impact_level,
          actions_taken: details.actions_taken,
          results_achieved: details.results_achieved,
          future_commitments: details.future_commitments,
          evidence_documents: details.evidence_documents,
          kpis: details.kpis as any
        })
        .eq('report_id', reportId)
        .eq('sdg_number', details.sdg_number);

      if (error) throw error;

      const newDetails = new Map(sdgDetails);
      newDetails.set(details.sdg_number, details);
      setSdgDetails(newDetails);

      toast.success('Detalhes salvos com sucesso!');
    } catch (error) {
      console.error('Error saving SDG details:', error);
      toast.error('Erro ao salvar detalhes');
    }
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
      <SDGIntroductionCard />

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
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredSDGs.map(sdg => (
                <SDGCard
                  key={sdg.number}
                  sdg={sdg}
                  selected={selectedSDGs.has(sdg.number)}
                  impactLevel={sdgDetails.get(sdg.number)?.impact_level}
                  selectedTargetsCount={sdgDetails.get(sdg.number)?.selected_targets.length}
                  onToggle={() => toggleSDG(sdg.number)}
                  onClick={() => openSDGDetails(sdg.number)}
                />
              ))}
            </div>
          ) : (
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSDGs.size > 0 && (
        <SelectedSDGsTable
          selectedSDGs={Array.from(selectedSDGs)}
          sdgDetails={sdgDetails}
          onEdit={openSDGDetails}
          onRemove={toggleSDG}
        />
      )}

      {selectedSDGs.size > 0 && (
        <GeneratedTextPreview
          selectedSDGs={Array.from(selectedSDGs)}
          sdgDetails={sdgDetails}
        />
      )}

      <SDGDetailModal
        sdg={activeSDG ? SDG_DATA.find(s => s.number === activeSDG) || null : null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveSDGDetails}
        initialData={activeSDG ? sdgDetails.get(activeSDG) : undefined}
      />
    </div>
  );
}
