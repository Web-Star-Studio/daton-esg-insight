import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
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
    <div className="flex flex-wrap items-end gap-3">
      {/* Buscar */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-sm">
        <Label className="text-xs text-muted-foreground">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar legislação..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      {/* Jurisdição */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Jurisdição</Label>
        <Select
          value={filters.jurisdiction || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, jurisdiction: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todas" />
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
      </div>

      {/* Macrotema */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Macrotema</Label>
        <Select
          value={filters.themeId || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, themeId: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos" />
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
      </div>

      {/* Aplicabilidade */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Aplicabilidade</Label>
        <Select
          value={filters.applicability || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, applicability: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todas" />
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
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos" />
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
      </div>

      {/* Responsável */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Responsável</Label>
        <Select
          value={filters.responsibleUserId || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, responsibleUserId: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos" />
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
      </div>

      {/* Botão Limpar */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-10">
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
};
