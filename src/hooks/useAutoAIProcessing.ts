import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAutoAIProcessing() {
  return useQuery({
    queryKey: ['auto-ai-processing'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { enabled: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.company_id) return { enabled: false };

      const { data: company } = await supabase
        .from('companies')
        .select('auto_ai_processing')
        .eq('id', profile.company_id)
        .maybeSingle();

      return {
        enabled: company?.auto_ai_processing || false,
        companyId: profile.company_id
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
