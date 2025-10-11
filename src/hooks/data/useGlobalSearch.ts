import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'document' | 'data' | 'action' | 'insight';
  category: string;
  url?: string;
  relevance: number;
  lastModified?: Date;
  tags?: string[];
}

export const useGlobalSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) {
        throw new Error('Company not found');
      }

      const { data, error } = await supabase.rpc('search_across_tables', {
        search_query: query,
        user_company_id: userAndCompany.company_id,
        result_limit: 20
      });

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type as SearchResult['type'],
        category: item.category,
        url: item.url,
        relevance: parseFloat(item.relevance || 0),
        lastModified: item.last_modified ? new Date(item.last_modified) : undefined,
        tags: item.tags || []
      })) as SearchResult[];
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for recent searches (stored in localStorage)
export const useRecentSearches = () => {
  const getRecentSearches = (): string[] => {
    try {
      const stored = localStorage.getItem('recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addRecentSearch = (search: string) => {
    const current = getRecentSearches();
    const updated = [search, ...current.filter(s => s !== search)].slice(0, 10);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recent-searches');
  };

  return {
    recentSearches: getRecentSearches(),
    addRecentSearch,
    clearRecentSearches
  };
};
