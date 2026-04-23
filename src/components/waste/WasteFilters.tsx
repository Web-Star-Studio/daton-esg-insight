import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useBranches } from "@/services/branches";
import { getWasteFilterOptions, WASTE_CLASS_OPTIONS } from "@/services/waste";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";

export interface WasteFilterState {
  search: string;
  branchId: string;
  wasteDescription: string;
  wasteClass: string;
  startDate: string;
  endDate: string;
  destinationName: string;
  transporterName: string;
  storageType: string;
}

export const INITIAL_WASTE_FILTERS: WasteFilterState = {
  search: "",
  branchId: "",
  wasteDescription: "",
  wasteClass: "",
  startDate: "",
  endDate: "",
  destinationName: "",
  transporterName: "",
  storageType: "",
};

interface WasteFiltersProps {
  filters: WasteFilterState;
  onFiltersChange: (filters: WasteFilterState) => void;
  onClearFilters: () => void;
  lockedBranchId?: string;
}

const ADVANCED_KEYS: (keyof WasteFilterState)[] = [
  'destinationName',
  'transporterName',
  'storageType',
];

export const WasteFilters: React.FC<WasteFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  lockedBranchId,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { data: branches = [] } = useBranches();
  const { data: options } = useQuery({
    queryKey: ['waste-filter-options'],
    queryFn: getWasteFilterOptions,
    staleTime: 1000 * 60 * 5,
  });

  const hasActiveFilters = Object.entries(filters).some(([, v]) => v !== '' && v !== undefined);
  const advancedActiveCount = ADVANCED_KEYS.reduce((acc, key) => {
    const v = filters[key];
    return v ? acc + 1 : acc;
  }, 0);

  return (
    <div className="space-y-3">
      {/* Linha principal: essenciais */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Buscar */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-sm">
          <Label className="text-xs text-muted-foreground">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="MTR, motorista, placa, NF..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filial — escondido se lockedBranchId (página por filial) */}
        {!lockedBranchId && (
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
                    {getBranchDisplayLabel(branch)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tipo de resíduo */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Tipo de resíduo</Label>
          <Select
            value={filters.wasteDescription || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, wasteDescription: value === "all" ? "" : value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {options?.wasteDescriptions.map((desc) => (
                <SelectItem key={desc} value={desc}>
                  {desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Classe */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Classe</Label>
          <Select
            value={filters.wasteClass || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, wasteClass: value === "all" ? "" : value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {WASTE_CLASS_OPTIONS.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data coleta: De */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Coleta (de)</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className="w-[150px]"
          />
        </div>

        {/* Data coleta: Até */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Coleta (até)</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className="w-[150px]"
          />
        </div>

        {/* Trigger avançado */}
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

        {/* Limpar */}
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
            {/* Destinador */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Destinador</Label>
              <Select
                value={filters.destinationName || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, destinationName: value === "all" ? "" : value })}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {options?.destinations.map((dest) => (
                    <SelectItem key={dest} value={dest}>
                      {dest}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transportador */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Transportador</Label>
              <Select
                value={filters.transporterName || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, transporterName: value === "all" ? "" : value })}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {options?.transporters.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Armazenamento */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Armazenamento</Label>
              <Select
                value={filters.storageType || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, storageType: value === "all" ? "" : value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {options?.storageTypes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
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
