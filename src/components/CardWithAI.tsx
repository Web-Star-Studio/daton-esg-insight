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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          
          {/* AI Insight Badge */}
          {contextualMessage && !insightsLoading && (
            <AIInsightBadge
              type={primaryInsight?.insight_type || 'contextual'}
              message={contextualMessage}
              severity={severity}
              trend={trend}
              onClick={() => setInsightModalOpen(true)}
            />
          )}
          
          {insightsLoading && (
            <Skeleton className="h-5 w-20" />
          )}
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              {subtitle && <Skeleton className="h-4 w-32" />}
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              {subtitle && (
                <div className="text-xs text-muted-foreground">
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