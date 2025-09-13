import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MarketplaceFilters as IMarketplaceFilters, PRICE_RANGES, IMPLEMENTATION_TIMES, ROI_ESTIMATES } from "@/services/marketplace";

interface MarketplaceFiltersProps {
  filters: IMarketplaceFilters;
  onFiltersChange: (filters: IMarketplaceFilters) => void;
}

export function MarketplaceFilters({ filters, onFiltersChange }: MarketplaceFiltersProps) {
  const updateFilter = (key: keyof IMarketplaceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== "");

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros Avançados</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select 
              value={filters.category || ""} 
              onValueChange={(value) => updateFilter('category', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                <SelectItem value="waste_management">Gestão de Resíduos</SelectItem>
                <SelectItem value="energy_efficiency">Eficiência Energética</SelectItem>
                <SelectItem value="carbon_credits">Créditos de Carbono</SelectItem>
                <SelectItem value="consulting">Consultoria ESG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Faixa de Preço</label>
            <Select 
              value={filters.price_range || ""} 
              onValueChange={(value) => updateFilter('price_range', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer preço</SelectItem>
                {Object.entries(PRICE_RANGES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Implementation Time Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tempo de Implementação</label>
            <Select 
              value={filters.implementation_time || ""} 
              onValueChange={(value) => updateFilter('implementation_time', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer prazo</SelectItem>
                {Object.entries(IMPLEMENTATION_TIMES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ROI Estimate Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Estimativa de ROI</label>
            <Select 
              value={filters.roi_estimate || ""} 
              onValueChange={(value) => updateFilter('roi_estimate', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer ROI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer ROI</SelectItem>
                {Object.entries(ROI_ESTIMATES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Provider Rating Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Avaliação Mínima do Fornecedor: {filters.provider_rating || 0}
          </label>
          <Slider
            value={[filters.provider_rating || 0]}
            onValueChange={(values) => updateFilter('provider_rating', values[0])}
            max={5}
            min={0}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 estrelas</span>
            <span>5 estrelas</span>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Filtros ativos:</span>
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  Categoria: {filters.category}
                  <button onClick={() => updateFilter('category', undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.price_range && (
                <Badge variant="secondary" className="gap-1">
                  Preço: {PRICE_RANGES[filters.price_range as keyof typeof PRICE_RANGES]}
                  <button onClick={() => updateFilter('price_range', undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.implementation_time && (
                <Badge variant="secondary" className="gap-1">
                  Implementação: {IMPLEMENTATION_TIMES[filters.implementation_time as keyof typeof IMPLEMENTATION_TIMES]}
                  <button onClick={() => updateFilter('implementation_time', undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.roi_estimate && (
                <Badge variant="secondary" className="gap-1">
                  ROI: {ROI_ESTIMATES[filters.roi_estimate as keyof typeof ROI_ESTIMATES]}
                  <button onClick={() => updateFilter('roi_estimate', undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.provider_rating && filters.provider_rating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Avaliação: {filters.provider_rating}+
                  <button onClick={() => updateFilter('provider_rating', undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}