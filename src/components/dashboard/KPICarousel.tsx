import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface KPIItem {
  id: string;
  title: string;
  value: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  route: string;
}

interface KPICarouselProps {
  items: KPIItem[];
  onItemClick?: (item: KPIItem) => void;
  onMenuClick?: (item: KPIItem, action: string) => void;
  itemsPerPage?: number;
}

export function KPICarousel({ 
  items, 
  onItemClick, 
  onMenuClick,
  itemsPerPage = 4 
}: KPICarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerPage);
  
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < totalPages - 1;
  
  const goBack = useCallback(() => {
    if (canGoBack) setCurrentPage(p => p - 1);
  }, [canGoBack]);
  
  const goForward = useCallback(() => {
    if (canGoForward) setCurrentPage(p => p + 1);
  }, [canGoForward]);

  const getChangeDisplay = (change?: number, changeType?: string) => {
    if (change === undefined || change === null) return null;
    
    const isPositive = changeType === 'positive';
    const isNegative = changeType === 'negative';
    const trendArrow = isPositive ? '↗' : isNegative ? '↘' : '→';
    
    return (
      <span className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive && "text-success",
        isNegative && "text-destructive",
        !isPositive && !isNegative && "text-muted-foreground"
      )}>
        <span className="text-xs">{trendArrow}</span>
        {Math.abs(change)}%
      </span>
    );
  };

  return (
    <div className="relative" data-tour="metrics">
      {/* Navigation Arrow Right */}
      {canGoForward && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-border/60 bg-background/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur transition-all hover:bg-background"
            onClick={goForward}
            aria-label="Ver próximos itens"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation Arrow Left */}
      {canGoBack && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-border/60 bg-background/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur transition-all hover:bg-background"
            onClick={goBack}
            aria-label="Ver itens anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 px-1 md:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <Card
              key={kpi.id}
              className={cn(
                "group cursor-pointer rounded-3xl border border-border/65 bg-background/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition-all duration-200 hover:border-border hover:bg-background hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_24px_-20px_rgba(15,23,42,0.55)]",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onItemClick?.(kpi)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2.5 rounded-xl", kpi.bgColor)}>
                    <Icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuClick?.(kpi, 'details');
                    }}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                
                <p className="mb-1 text-sm text-muted-foreground">{kpi.title}</p>
                
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-[-0.02em] text-foreground">{kpi.value}</span>
                  {getChangeDisplay(kpi.change, kpi.changeType)}
                </div>
                
                <p className="text-xs text-muted-foreground/90">{kpi.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Navigation Bar - Clickable dots */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={cn(
                "cursor-pointer rounded-full transition-all duration-300",
                index === currentPage 
                  ? "h-2 w-8 bg-foreground/75" 
                  : "h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Ir para página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
