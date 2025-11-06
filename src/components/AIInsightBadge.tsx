import { AlertCircle, TrendingUp, TrendingDown, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AIInsightBadgeProps {
  type: 'contextual' | 'comparative' | 'predictive' | 'recommendation'
  message: string
  severity?: 'low' | 'medium' | 'high'
  trend?: 'up' | 'down' | 'neutral'
  onClick?: () => void
  className?: string
}

export function AIInsightBadge({
  type,
  message,
  severity = 'medium',
  trend,
  onClick,
  className
}: AIInsightBadgeProps) {
  const getIcon = () => {
    switch (type) {
      case 'contextual':
        return <Info className="h-3 w-3" />
      case 'comparative':
        return trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
               trend === 'down' ? <TrendingDown className="h-3 w-3" /> : 
               <Info className="h-3 w-3" />
      case 'predictive':
        return <AlertCircle className="h-3 w-3" />
      case 'recommendation':
        return <TrendingUp className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const getVariant = () => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getColorClass = () => {
    switch (severity) {
      case 'high':
        return 'border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10'
      case 'low':
        return 'border-muted-foreground/20 bg-muted/50 text-muted-foreground hover:bg-muted'
      default:
        return 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer transition-colors text-xs font-medium flex items-center gap-1 px-2 py-1 flex-shrink-0",
        getColorClass(),
        onClick && "hover:scale-105 transition-transform",
        className
      )}
      onClick={onClick}
    >
      {getIcon()}
      <span className="truncate max-w-20">{message}</span>
    </Badge>
  )
}