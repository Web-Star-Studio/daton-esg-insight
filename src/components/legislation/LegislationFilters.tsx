import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, User } from "lucide-react";
import { useLegislationThemes } from "@/hooks/data/useLegislations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

interface LegislationFiltersProps {
  filters: {
    search: string;
    jurisdiction: string;
    themeId: string;
    applicability: string;
    status: string;
    responsibleUserId?: string;
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
  const { selectedCompany } = useCompany();

  // Fetch users who are responsible for legislations
  const { data: responsibleUsers } = useQuery({
    queryKey: ['legislation-responsible-users', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      
      // Get distinct responsible users from legislations
      const { data, error } = await supabase
        .from('legislations')
        .select('responsible_user_id, responsible_user:profiles!legislations_responsible_user_id_fkey(id, full_name)')
        .eq('company_id', selectedCompany.id)
        .eq('is_active', true)
        .not('responsible_user_id', 'is', null);
      
      if (error) return [];
      
      // Remove duplicates
      const uniqueUsers = new Map();
      data?.forEach(item => {
        if (item.responsible_user && !uniqueUsers.has(item.responsible_user_id)) {
          uniqueUsers.set(item.responsible_user_id, item.responsible_user);
        }
      });
      
      return Array.from(uniqueUsers.values());
    },
    enabled: !!selectedCompany?.id,
  });

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 'all' && v !== undefined);

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

      <Select
        value={filters.responsibleUserId || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, responsibleUserId: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Responsável" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {responsibleUsers?.map((user: any) => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name}
            </SelectItem>
          ))}
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
