import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, LayoutGrid, List } from "lucide-react";
import { ExtendedQualityIndicator, IndicatorGroup } from "@/services/indicatorManagement";
import { IndicatorCard } from "./IndicatorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface IndicatorListProps {
  indicators: ExtendedQualityIndicator[];
  groups: IndicatorGroup[];
  isLoading?: boolean;
  onSelectIndicator?: (indicator: ExtendedQualityIndicator) => void;
}

type StatusFilter = 'all' | 'on_target' | 'warning' | 'critical' | 'pending';
type ViewMode = 'grid' | 'list';

export function IndicatorList({ indicators, groups, isLoading, onSelectIndicator }: IndicatorListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const currentMonth = new Date().getMonth() + 1;

  // Get current status for an indicator
  const getIndicatorStatus = (indicator: ExtendedQualityIndicator): string => {
    const currentData = indicator.period_data?.find(pd => pd.period_month === currentMonth);
    return currentData?.status || 'pending';
  };

  // Filter indicators
  const filteredIndicators = useMemo(() => {
    return indicators.filter(indicator => {
      // Search filter
      const matchesSearch = 
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.location?.toLowerCase().includes(searchTerm.toLowerCase());

      // Group filter
      const matchesGroup = groupFilter === 'all' || indicator.group_id === groupFilter;

      // Status filter
      const indicatorStatus = getIndicatorStatus(indicator);
      const matchesStatus = statusFilter === 'all' || indicatorStatus === statusFilter;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [indicators, searchTerm, groupFilter, statusFilter, currentMonth]);

  // Group indicators by group
  const groupedIndicators = useMemo(() => {
    const grouped: Record<string, ExtendedQualityIndicator[]> = {};
    
    filteredIndicators.forEach(indicator => {
      const groupName = indicator.indicator_group?.name || 'Sem Grupo';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(indicator);
    });

    return grouped;
  }, [filteredIndicators]);

  const hasActiveFilters = searchTerm || groupFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm("");
    setGroupFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar indicador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os grupos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.icon && <span className="mr-2">{group.icon}</span>}
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="on_target">No Alvo</SelectItem>
            <SelectItem value="warning">Atenção</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredIndicators.length} indicador(es) encontrado(s)
        </p>
      </div>

      {/* Indicators */}
      {filteredIndicators.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum indicador encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou adicione novos indicadores.
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-6">
          {Object.entries(groupedIndicators).map(([groupName, groupIndicators]) => (
            <div key={groupName}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                {groupName}
                <Badge variant="secondary" className="text-xs">
                  {groupIndicators.length}
                </Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupIndicators.map(indicator => (
                  <IndicatorCard 
                    key={indicator.id} 
                    indicator={indicator}
                    onSelect={onSelectIndicator}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIndicators.map(indicator => (
            <IndicatorCard 
              key={indicator.id} 
              indicator={indicator}
              onSelect={onSelectIndicator}
            />
          ))}
        </div>
      )}
    </div>
  );
}
