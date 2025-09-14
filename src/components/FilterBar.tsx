import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  X, 
  Building2, 
  Package, 
  Gavel, 
  Leaf, 
  FileText, 
  ClipboardList, 
  ShieldCheck, 
  BarChart,
  Trash2,
  SlidersHorizontal
} from "lucide-react";

const categoryFilters = [
  { value: "core", label: "Core Business", icon: Building2, color: "hsl(var(--primary))" },
  { value: "assets", label: "Ativos", icon: Package, color: "hsl(220, 71%, 60%)" },
  { value: "licensing", label: "Licenciamento", icon: Gavel, color: "hsl(38, 92%, 50%)" },
  { value: "waste", label: "Resíduos", icon: Trash2, color: "hsl(16, 100%, 60%)" },
  { value: "esg", label: "ESG", icon: Leaf, color: "hsl(151, 100%, 37%)" },
  { value: "carbon", label: "Carbono", icon: Leaf, color: "hsl(120, 60%, 50%)" },
  { value: "documents", label: "Documentos", icon: FileText, color: "hsl(262, 83%, 70%)" },
  { value: "forms", label: "Formulários", icon: ClipboardList, color: "hsl(200, 100%, 50%)" },
  { value: "compliance", label: "Compliance", icon: ShieldCheck, color: "hsl(0, 84%, 60%)" },
  { value: "reports", label: "Relatórios", icon: BarChart, color: "hsl(280, 100%, 70%)" }
];

const statusFilters = [
  { value: "active", label: "Ativo", color: "hsl(var(--success))" },
  { value: "empty", label: "Vazio", color: "hsl(var(--muted-foreground))" },
  { value: "error", label: "Erro", color: "hsl(var(--destructive))" }
];

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: string[];
  addFilter: (filter: string) => void;
  removeFilter: (filter: string) => void;
  clearFilters: () => void;
  clearAll: () => void;
  stats: {
    totalResults: number;
    sectionsWithResults: number;
    totalSections: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  activeFilters,
  addFilter,
  removeFilter,
  clearFilters,
  clearAll,
  stats
}) => {
  const activeCategoryFilters = activeFilters.filter(f => 
    categoryFilters.some(cf => cf.value === f)
  );
  
  const activeStatusFilters = activeFilters.filter(f => 
    statusFilters.some(sf => sf.value === f)
  );

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      {/* Search and Quick Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar em todos os dados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearAll}>
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>
      </div>

      {/* Filter Categories */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Category Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
          <Select onValueChange={addFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              {categoryFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <SelectItem key={filter.value} value={filter.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: filter.color }} />
                      {filter.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <Select onValueChange={addFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: filter.color }}
                    />
                    {filter.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>
          {activeCategoryFilters.map((filter) => {
            const categoryFilter = categoryFilters.find(cf => cf.value === filter);
            if (!categoryFilter) return null;
            const Icon = categoryFilter.icon;
            
            return (
              <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {categoryFilter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
          
          {activeStatusFilters.map((filter) => {
            const statusFilter = statusFilters.find(sf => sf.value === filter);
            if (!statusFilter) return null;
            
            return (
              <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusFilter.color }}
                />
                {statusFilter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
          
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Results Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
        <div>
          Mostrando <span className="font-medium text-foreground">{stats.totalResults}</span> registros 
          em <span className="font-medium text-foreground">{stats.sectionsWithResults}</span> seções
        </div>
        <div>
          Total: <span className="font-medium text-foreground">{stats.totalSections}</span> seções disponíveis
        </div>
      </div>
    </div>
  );
};