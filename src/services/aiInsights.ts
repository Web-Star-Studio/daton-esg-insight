import { supabase } from "@/integrations/supabase/client"

export interface BenchmarkData {
  current_value: string
  sector_average: string
  best_practice: string
  percentile: string
}

export interface AIRecommendation {
  id: string
  title: string
  description: string
  action_type: 'quick_win' | 'strategic' | 'urgent'
  estimated_impact: string
  implementation_effort: 'low' | 'medium' | 'high'
  target_module?: string
}

export interface AIInsight {
  id: string
  card_type: 'esg_score' | 'emissions' | 'waste' | 'license' | 'performance'
  insight_type: 'contextual' | 'comparative' | 'predictive' | 'recommendation'
  message: string
  detailed_analysis?: string
  recommendations: AIRecommendation[]
  confidence: number
  benchmark_data?: BenchmarkData
  trigger_condition: string
  created_at: Date
}

export interface AIInsightRequest {
  card_type: string
  card_data: any
  context?: {
    company_sector?: string
    company_size?: string
    time_period?: { start: string; end: string }
  }
}

// Get AI insights for a specific dashboard card using real GPT-4o analysis
export const getAIInsights = async (cardType: string, cardData: any): Promise<AIInsight[]> => {
  try {
    console.log(`Requesting AI insights for ${cardType}:`, cardData)
    
    const { data, error } = await supabase.functions.invoke('ai-insights-engine', {
      body: {
        card_type: cardType,
        card_data: cardData,
        context: {
          timestamp: new Date().toISOString(),
          request_id: crypto.randomUUID()
        }
      }
    })

    if (error) {
      console.error('Error fetching AI insights:', error)
      throw error
    }

    console.log(`Received ${data?.insights?.length || 0} insights for ${cardType}`)
    return data?.insights || []
  } catch (error) {
    console.error('Failed to get AI insights:', error)
    // Return empty array instead of throwing to prevent UI breaks
    return []
  }
}

// Get contextual message for card display
export const getContextualMessage = (insights: AIInsight[]): string | null => {
  if (!insights.length) return null
  
  // Prioritize by type: urgent recommendations > predictive > comparative > contextual
  const prioritized = insights.sort((a, b) => {
    const priorities = {
      'recommendation': 4,
      'predictive': 3,
      'comparative': 2,
      'contextual': 1
    }
    
    const aPriority = priorities[a.insight_type] || 0
    const bPriority = priorities[b.insight_type] || 0
    
    if (aPriority !== bPriority) return bPriority - aPriority
    
    // Secondary sort by confidence
    return b.confidence - a.confidence
  })

  return prioritized[0]?.message || null
}

// Get insight severity for badge styling
export const getInsightSeverity = (insights: AIInsight[]): 'low' | 'medium' | 'high' => {
  if (!insights.length) return 'medium'
  
  // Check for urgent recommendations or high-confidence predictive insights
  const hasUrgent = insights.some(i => 
    i.insight_type === 'recommendation' && 
    i.recommendations.some(r => r.action_type === 'urgent')
  )
  
  const hasHighConfidencePredictive = insights.some(i => 
    i.insight_type === 'predictive' && i.confidence > 0.8
  )
  
  if (hasUrgent || hasHighConfidencePredictive) return 'high'
  
  const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
  
  if (avgConfidence > 0.7) return 'medium'
  return 'low'
}

// Get trend direction from insights
export const getInsightTrend = (insights: AIInsight[]): 'up' | 'down' | 'neutral' => {
  const comparativeInsights = insights.filter(i => i.insight_type === 'comparative')
  
  if (!comparativeInsights.length) return 'neutral'
  
  // Check benchmark data to determine trend
  for (const insight of comparativeInsights) {
    if (insight.benchmark_data) {
      const current = parseFloat(insight.benchmark_data.current_value.replace(/[^\d.-]/g, ''))
      const average = parseFloat(insight.benchmark_data.sector_average.replace(/[^\d.-]/g, ''))
      
      if (!isNaN(current) && !isNaN(average)) {
        if (current > average) return 'up'
        if (current < average) return 'down'
      }
    }
  }
  
  return 'neutral'
}