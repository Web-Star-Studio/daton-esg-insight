import { cn } from "@/lib/utils"
import { Loader2, Activity, Sparkles } from "lucide-react"

interface EnhancedLoadingProps {
  variant?: 'default' | 'dots' | 'pulse' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function EnhancedLoading({ 
  variant = 'default', 
  size = 'md', 
  text = 'Carregando...',
  className 
}: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  if (variant === 'dots') {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
        <div className="flex space-x-1">
          <div className={cn("rounded-full bg-primary animate-bounce", sizeClasses[size])} style={{ animationDelay: '0ms' }} />
          <div className={cn("rounded-full bg-primary animate-bounce", sizeClasses[size])} style={{ animationDelay: '150ms' }} />
          <div className={cn("rounded-full bg-primary animate-bounce", sizeClasses[size])} style={{ animationDelay: '300ms' }} />
        </div>
        {text && <p className={cn("text-muted-foreground animate-fade-in", textSizeClasses[size])}>{text}</p>}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
        <div className={cn("rounded-full bg-gradient-to-r from-primary to-primary/60 animate-pulse", sizeClasses[size])} />
        {text && <p className={cn("text-muted-foreground animate-fade-in", textSizeClasses[size])}>{text}</p>}
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
        <div className="relative">
          <div className={cn("rounded-full border-4 border-muted", sizeClasses[size])} />
          <div className={cn("absolute top-0 rounded-full border-4 border-transparent border-t-primary animate-spin", sizeClasses[size])} />
          <Sparkles className={cn("absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary", size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3')} />
        </div>
        {text && <p className={cn("text-muted-foreground animate-fade-in", textSizeClasses[size])}>{text}</p>}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <p className={cn("text-muted-foreground animate-fade-in", textSizeClasses[size])}>{text}</p>}
    </div>
  )
}