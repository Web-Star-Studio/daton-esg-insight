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
    
    return (
      <span className={cn(
        "text-sm font-medium flex items-center gap-1",
        isPositive && "text-success",
        isNegative && "text-destructive",
        !isPositive && !isNegative && "text-muted-foreground"
      )}>
        <span className="text-xs">↗</span>
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
            className="h-8 w-8 rounded-full bg-background shadow-md border-border/50 transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
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
            className="h-8 w-8 rounded-full bg-background shadow-md border-border/50 transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
            onClick={goBack}
            aria-label="Ver itens anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {visibleItems.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <Card
              key={kpi.id}
              className={cn(
                "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                "animate-fade-in bg-card border-border/50"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onItemClick?.(kpi)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2.5 rounded-xl", kpi.bgColor)}>
                    <Icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuClick?.(kpi, 'details');
                    }}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                  {getChangeDisplay(kpi.change, kpi.changeType)}
                </div>
                
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
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
                "rounded-full transition-all duration-300 cursor-pointer",
                index === currentPage 
                  ? "bg-primary w-8 h-2" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2 h-2"
              )}
              aria-label={`Ir para página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
