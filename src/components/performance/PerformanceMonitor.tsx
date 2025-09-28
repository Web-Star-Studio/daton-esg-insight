import { useEffect, useState } from 'react'
import { Activity, Zap, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  networkRequests: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const measurePerformance = () => {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = window.performance.getEntriesByType('paint')
      
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      const renderTime = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      const memoryUsage = (window.performance as any).memory?.usedJSHeapSize || 0
      const networkRequests = window.performance.getEntriesByType('resource').length

      setMetrics({
        loadTime,
        renderTime,
        memoryUsage: memoryUsage / 1024 / 1024, // Convert to MB
        networkRequests
      })
    }

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance()
    } else {
      window.addEventListener('load', measurePerformance)
      return () => window.removeEventListener('load', measurePerformance)
    }

    // Show monitor in development or when performance is poor
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      (metrics && (metrics.loadTime > 3000 || metrics.memoryUsage > 50))
    setIsVisible(shouldShow)
  }, [metrics])

  if (!metrics || !isVisible) return null

  const getPerformanceStatus = () => {
    if (metrics.loadTime > 3000) return { status: 'poor', color: 'destructive' }
    if (metrics.loadTime > 1500) return { status: 'fair', color: 'warning' }
    return { status: 'good', color: 'success' }
  }

  const performanceStatus = getPerformanceStatus()

  return (
    <Card className="fixed bottom-4 right-4 z-40 w-80 shadow-lg border-l-4 border-l-primary/50 animate-slide-in-right">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Monitor de Performance
          <Badge variant={performanceStatus.color as any} className="ml-auto">
            {performanceStatus.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Tempo de Carregamento
          </span>
          <span className="font-mono">{(metrics.loadTime / 1000).toFixed(2)}s</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Primeira Renderização</span>
          <span className="font-mono">{(metrics.renderTime / 1000).toFixed(2)}s</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Uso de Memória</span>
          <span className="font-mono">{metrics.memoryUsage.toFixed(1)} MB</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Requisições de Rede</span>
          <span className="font-mono">{metrics.networkRequests}</span>
        </div>

        {performanceStatus.status !== 'good' && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Performance pode ser melhorada</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}