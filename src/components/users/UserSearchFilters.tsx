import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import type { UserFilters } from '@/hooks/data/useUserManagement';

interface UserSearchFiltersProps {
  filters: UserFilters;
  onFilterChange: (filters: Partial<UserFilters>) => void;
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'Todos os Papéis' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'analyst', label: 'Analista' },
  { value: 'operator', label: 'Operador' },
  { value: 'viewer', label: 'Visualizador' },
  { value: 'auditor', label: 'Auditor' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

export function UserSearchFilters({ filters, onFilterChange }: UserSearchFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search, onFilterChange]);

  const handleClearFilters = () => {
    setSearchValue('');
    onFilterChange({
      search: undefined,
      role: undefined,
      status: 'active',
    });
  };

  const hasActiveFilters = 
    !!filters.search || 
    (filters.role && filters.role !== 'all') || 
    (filters.status && filters.status !== 'active');

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou username..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => setSearchValue('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Role Filter */}
      <Select
        value={filters.role || 'all'}
        onValueChange={(value) => onFilterChange({ role: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Papel" />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status || 'active'}
        onValueChange={(value) => onFilterChange({ status: value as UserFilters['status'] })}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
