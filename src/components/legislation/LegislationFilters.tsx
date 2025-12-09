import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useLegislationThemes } from "@/hooks/data/useLegislations";

interface LegislationFiltersProps {
  filters: {
    search: string;
    jurisdiction: string;
    themeId: string;
    applicability: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const LegislationFilters: React.FC<LegislationFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const { themes } = useLegislationThemes();

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 'all');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar legislação..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.jurisdiction || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, jurisdiction: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Jurisdição" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="federal">Federal</SelectItem>
          <SelectItem value="estadual">Estadual</SelectItem>
          <SelectItem value="municipal">Municipal</SelectItem>
          <SelectItem value="nbr">NBR</SelectItem>
          <SelectItem value="internacional">Internacional</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.themeId || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, themeId: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Macrotema" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              {theme.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.applicability || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, applicability: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Aplicabilidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="real">Real</SelectItem>
          <SelectItem value="potential">Potencial</SelectItem>
          <SelectItem value="revoked">Revogada</SelectItem>
          <SelectItem value="na">N/A</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="conforme">Conforme</SelectItem>
          <SelectItem value="para_conhecimento">Para Conhecimento</SelectItem>
          <SelectItem value="adequacao">Adequação</SelectItem>
          <SelectItem value="plano_acao">Plano de Ação</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
};
