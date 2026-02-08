import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, UserCircle, Clock, X } from "lucide-react";
import type { SocialFilters } from "@ws/shared";
import { getFilterOptions } from "@/services/socialGateway";

interface SocialDashboardFiltersProps {
  filters: SocialFilters;
  onUpdateFilter: <K extends keyof SocialFilters>(key: K, value: SocialFilters[K]) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function SocialDashboardFilters({ 
  filters, 
  onUpdateFilter, 
  onResetFilters,
  hasActiveFilters 
}: SocialDashboardFiltersProps) {
  const { data: options, isLoading } = useQuery({
    queryKey: ['social-filter-options'],
    queryFn: getFilterOptions,
  });

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Filtros</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtros ativos
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filial */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            Filial
          </Label>
          <Select
            value={filters.location || "all"}
            onValueChange={(value) => 
              onUpdateFilter('location', value === "all" ? undefined : value)
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as filiais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as filiais</SelectItem>
              {options?.locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Setor */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4" />
            Setor
          </Label>
          <Select
            value={filters.department || "all"}
            onValueChange={(value) => 
              onUpdateFilter('department', value === "all" ? undefined : value)
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os setores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {options?.departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Função */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <UserCircle className="h-4 w-4" />
            Função
          </Label>
          <Select
            value={filters.position || "all"}
            onValueChange={(value) => 
              onUpdateFilter('position', value === "all" ? undefined : value)
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as funções" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              {options?.positions.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Horas de Treinamento */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Horas ({filters.minHours}h - {filters.maxHours}h)
          </Label>
          <div className="pt-2">
            <Slider
              min={0}
              max={200}
              step={5}
              value={[filters.minHours || 0, filters.maxHours || 100]}
              onValueChange={([min, max]) => {
                onUpdateFilter('minHours', min);
                onUpdateFilter('maxHours', max);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
