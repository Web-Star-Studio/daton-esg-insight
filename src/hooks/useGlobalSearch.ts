import { useState, useMemo } from 'react';
import { DatabaseSection } from './useAllDatabaseData';

export const useGlobalSearch = (sections: DatabaseSection[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return sections;

    const term = searchTerm.toLowerCase();
    
    return sections.map(section => {
      const filteredData = section.data.filter(item => {
        // Search across all string fields of the item
        const searchableValues = Object.values(item).filter(value => 
          typeof value === 'string' || typeof value === 'number'
        );
        
        return searchableValues.some(value => 
          value?.toString().toLowerCase().includes(term)
        );
      });

      return {
        ...section,
        data: filteredData,
        count: filteredData.length,
        status: (filteredData.length > 0 ? 'active' : 'empty') as 'active' | 'empty' | 'error'
      };
    });
  }, [sections, searchTerm]);

  const filteredResults = useMemo(() => {
    if (activeFilters.length === 0) return searchResults;

    return searchResults.filter(section => 
      activeFilters.includes(section.category) || activeFilters.includes(section.status)
    );
  }, [searchResults, activeFilters]);

  const searchStats = useMemo(() => {
    const totalResults = filteredResults.reduce((acc, section) => acc + section.count, 0);
    const sectionsWithResults = filteredResults.filter(section => section.count > 0).length;
    
    return {
      totalResults,
      sectionsWithResults,
      totalSections: filteredResults.length
    };
  }, [filteredResults]);

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearAll = () => {
    setSearchTerm('');
    setActiveFilters([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    clearSearch,
    clearAll,
    results: filteredResults,
    stats: searchStats
  };
};