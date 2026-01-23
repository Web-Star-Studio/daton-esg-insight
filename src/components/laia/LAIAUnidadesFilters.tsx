import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, AlertCircle, FileX } from "lucide-react";

interface LAIAUnidadesFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  cityFilter: string;
  setCityFilter: (city: string) => void;
  typeFilter: "all" | "headquarters" | "branch";
  setTypeFilter: (type: "all" | "headquarters" | "branch") => void;
  sortBy: "name" | "total" | "criticos" | "significativos";
  setSortBy: (sort: "name" | "total" | "criticos" | "significativos") => void;
  cities: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  stats: { total: number; filtered: number };
  onQuickFilter: (filter: "criticos" | "sem_aspectos" | null) => void;
  activeQuickFilter: "criticos" | "sem_aspectos" | null;
}

export function LAIAUnidadesFilters({
  searchTerm,
  setSearchTerm,
  cityFilter,
  setCityFilter,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy,
  cities,
  onClearFilters,
  hasActiveFilters,
  stats,
  onQuickFilter,
  activeQuickFilter,
}: LAIAUnidadesFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* City Filter */}
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as cidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="headquarters">Matriz</SelectItem>
            <SelectItem value="branch">Filiais</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
            <SelectItem value="total">Total de aspectos</SelectItem>
            <SelectItem value="criticos">Mais críticos</SelectItem>
            <SelectItem value="significativos">Mais significativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Filters and Stats Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Buttons */}
          <Button
            variant={activeQuickFilter === "criticos" ? "default" : "outline"}
            size="sm"
            onClick={() => onQuickFilter(activeQuickFilter === "criticos" ? null : "criticos")}
            className={activeQuickFilter === "criticos" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Com críticos
          </Button>
          
          <Button
            variant={activeQuickFilter === "sem_aspectos" ? "default" : "outline"}
            size="sm"
            onClick={() => onQuickFilter(activeQuickFilter === "sem_aspectos" ? null : "sem_aspectos")}
          >
            <FileX className="h-4 w-4 mr-1" />
            Sem aspectos
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {stats.filtered !== stats.total ? (
            <>
              <Badge variant="secondary">
                {stats.filtered} de {stats.total}
              </Badge>
              <span>unidades</span>
            </>
          ) : (
            <span>{stats.total} unidades</span>
          )}
        </div>
      </div>
    </div>
  );
}
