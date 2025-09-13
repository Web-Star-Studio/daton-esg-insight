import { useQuery } from "@tanstack/react-query"
import { getAIInsights, AIInsight } from "@/services/aiInsights"

interface UseAIInsightsOptions {
  enabled?: boolean
  staleTime?: number
}

export function useAIInsights(
  cardType: string, 
  cardData: any, 
  options: UseAIInsightsOptions = {}
) {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options // 5 minutes default

  return useQuery({
    queryKey: ['ai-insights', cardType, cardData],
    queryFn: () => getAIInsights(cardType, cardData),
    enabled: enabled && !!cardData,
    staleTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}