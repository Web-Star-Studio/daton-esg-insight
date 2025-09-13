import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown, RotateCcw } from "lucide-react";
import type { GoalsFilters } from "@/hooks/useGoalsFilters";

interface GoalsFiltersBarProps {
  filters: GoalsFilters;
  updateFilter: <K extends keyof GoalsFilters>(key: K, value: GoalsFilters[K]) => void;
  resetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export function GoalsFiltersBar({ 
  filters, 
  updateFilter, 
  resetFilters, 
  totalCount, 
  filteredCount 
}: GoalsFiltersBarProps) {
  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'No Caminho Certo', label: 'No Caminho Certo' },
    { value: 'Atenção Necessária', label: 'Atenção Necessária' },
    { value: 'Atingida', label: 'Atingida' },
    { value: 'Atrasada', label: 'Atrasada' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Nome' },
    { value: 'deadline', label: 'Prazo' },
    { value: 'progress', label: 'Progresso' },
    { value: 'target', label: 'Meta' },
  ];

  const hasActiveFilters = filters.search || filters.status !== 'all';

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome da meta ou métrica..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-48">
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="min-w-40">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value as GoalsFilters['sortBy'])}
          >
            <SelectTrigger>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          title={filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
        >
          <ArrowUpDown className={`h-4 w-4 ${filters.sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
        </Button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            title="Limpar filtros"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Mostrando {filteredCount} de {totalCount} metas
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Filtros aplicados
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}