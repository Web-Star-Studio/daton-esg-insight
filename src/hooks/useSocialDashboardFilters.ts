import { useState, useMemo } from 'react';
import type { SocialFilters } from '@ws/shared';

export function useSocialDashboardFilters() {
  const [filters, setFilters] = useState<SocialFilters>({
    location: undefined,
    department: undefined,
    position: undefined,
    minHours: 0,
    maxHours: 100,
  });

  const updateFilter = <K extends keyof SocialFilters>(
    key: K,
    value: SocialFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      location: undefined,
      department: undefined,
      position: undefined,
      minHours: 0,
      maxHours: 100,
    });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(filters.location || filters.department || filters.position || 
              filters.minHours !== 0 || filters.maxHours !== 100);
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}
