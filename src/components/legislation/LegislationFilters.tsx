import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import {
  useLegislationThemes,
  useLegislationSubthemes,
  useLegislationNormTypes,
} from "@/hooks/data/useLegislations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useBranches } from "@/services/branches";

interface LegislationFiltersProps {
  filters: {
    search: string;
    jurisdiction: string;
    themeId: string;
    subthemeId?: string;
    normType?: string;
    branchId?: string;
    publicationDateFrom?: string;
    publicationDateTo?: string;
    applicability: string;
    status: string;
    responsibleUserId?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

// Keys que aparecem no painel "Mais filtros" — usadas pra contar o badge
const ADVANCED_KEYS: (keyof LegislationFiltersProps['filters'])[] = [
  'subthemeId',
  'branchId',
  'publicationDateFrom',
  'publicationDateTo',
  'applicability',
  'status',
  'responsibleUserId',
];

export const LegislationFilters: React.FC<LegislationFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { themes } = useLegislationThemes();
  const { subthemes } = useLegislationSubthemes(filters.themeId || undefined);
  const { normTypes } = useLegislationNormTypes();
  const { data: branches = [] } = useBranches();
  const { selectedCompany } = useCompany();

  const { data: responsibleUsers } = useQuery({
    queryKey: ['legislation-responsible-users', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];

      const { data, error } = await supabase
        .from('legislations')
        .select('responsible_user_id, responsible_user:profiles!legislations_responsible_user_id_fkey(id, full_name)')
        .eq('company_id', selectedCompany.id)
        .eq('is_active', true)
        .not('responsible_user_id', 'is', null);

      if (error) return [];

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
  const advancedActiveCount = ADVANCED_KEYS.reduce((acc, key) => {
    const v = filters[key];
    return v && v !== 'all' ? acc + 1 : acc;
  }, 0);

  return (
    <div className="space-y-3">
      {/* Linha principal: filtros essenciais */}
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

        {/* Instância */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Instância</Label>
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
            onValueChange={(value) => {
              const nextThemeId = value === "all" ? "" : value;
              onFiltersChange({ ...filters, themeId: nextThemeId, subthemeId: "" });
            }}
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

        {/* Tipo */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select
            value={filters.normType || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, normType: value === "all" ? "" : value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {normTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trigger do painel avançado */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground opacity-0 hidden sm:block">.</Label>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="h-10 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Mais filtros
              {advancedActiveCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                  {advancedActiveCount}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* Botão Limpar */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-10">
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Painel avançado */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleContent>
          <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3">
            {/* Subtema */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Subtema</Label>
              <Select
                value={filters.subthemeId || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, subthemeId: value === "all" ? "" : value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {subthemes.map((subtheme) => (
                    <SelectItem key={subtheme.id} value={subtheme.id}>
                      {subtheme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filial */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Filial</Label>
              <Select
                value={filters.branchId || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, branchId: value === "all" ? "" : value })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.code ? `${branch.code} — ${branch.name}` : branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data publicação: De */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Publicação (de)</Label>
              <Input
                type="date"
                value={filters.publicationDateFrom || ""}
                onChange={(e) => onFiltersChange({ ...filters, publicationDateFrom: e.target.value })}
                className="w-[150px]"
              />
            </div>

            {/* Data publicação: Até */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Publicação (até)</Label>
              <Input
                type="date"
                value={filters.publicationDateTo || ""}
                onChange={(e) => onFiltersChange({ ...filters, publicationDateTo: e.target.value })}
                className="w-[150px]"
              />
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
