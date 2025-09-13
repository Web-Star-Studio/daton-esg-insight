import { useState, useMemo } from 'react';
import type { GoalListItem } from '@/services/goals';

export interface GoalsFilters {
  search: string;
  status: string;
  sortBy: 'name' | 'deadline' | 'progress' | 'target';
  sortOrder: 'asc' | 'desc';
}

export function useGoalsFilters(goals: GoalListItem[] = []) {
  const [filters, setFilters] = useState<GoalsFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = [...goals];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(goal => 
        goal.name.toLowerCase().includes(searchLower) ||
        goal.metric_key.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(goal => goal.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'deadline':
          aValue = new Date(a.deadline_date).getTime();
          bValue = new Date(b.deadline_date).getTime();
          break;
        case 'progress':
          aValue = a.current_progress_percent;
          bValue = b.current_progress_percent;
          break;
        case 'target':
          aValue = a.target_value;
          bValue = b.target_value;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return filters.sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [goals, filters]);

  const updateFilter = <K extends keyof GoalsFilters>(
    key: K, 
    value: GoalsFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  return {
    filters,
    filteredAndSortedGoals,
    updateFilter,
    resetFilters,
    totalCount: goals.length,
    filteredCount: filteredAndSortedGoals.length,
  };
}