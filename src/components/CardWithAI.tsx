import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AIInsightBadge } from "@/components/AIInsightBadge"
import { AIInsightModal } from "@/components/AIInsightModal"
import { useAIInsights } from "@/hooks/useAIInsights"
import { getContextualMessage, getInsightSeverity, getInsightTrend } from "@/services/aiInsights"

interface CardWithAIProps {
  cardType: string
  cardData: any
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  className?: string
  children?: React.ReactNode
  isLoading?: boolean
}

export function CardWithAI({
  cardType,
  cardData,
  title,
  value,
  subtitle,
  icon,
  className,
  children,
  isLoading = false
}: CardWithAIProps) {
  const [insightModalOpen, setInsightModalOpen] = useState(false)
  
  const { data: insights, isLoading: insightsLoading } = useAIInsights(cardType, cardData)
  
  const contextualMessage = getContextualMessage(insights || [])
  const severity = getInsightSeverity(insights || [])
  const trend = getInsightTrend(insights || [])
  
  const primaryInsight = insights?.[0] || null

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 overflow-hidden min-w-0 gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0 flex-1">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="truncate">{title}</span>
          </CardTitle>
          
          {/* AI Insight Badge */}
          {contextualMessage && !insightsLoading && (
            <div className="flex-shrink-0">
              <AIInsightBadge
                type={primaryInsight?.insight_type || 'contextual'}
                message={contextualMessage}
                severity={severity}
                trend={trend}
                onClick={() => setInsightModalOpen(true)}
              />
            </div>
          )}
          
          {insightsLoading && (
            <Skeleton className="h-5 w-20 flex-shrink-0" />
          )}
        </CardHeader>
        
        <CardContent className="overflow-hidden">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              {subtitle && <Skeleton className="h-4 w-32" />}
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground truncate">{value}</div>
              {subtitle && (
                <div className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </div>
              )}
              {children}
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Insights Modal */}
      <AIInsightModal
        open={insightModalOpen}
        onOpenChange={setInsightModalOpen}
        insight={primaryInsight}
      />
    </>
  )
}