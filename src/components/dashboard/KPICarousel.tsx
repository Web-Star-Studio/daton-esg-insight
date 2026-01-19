import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const maxIndex = Math.max(0, items.length - itemsPerPage);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < maxIndex;
  
  const goBack = useCallback(() => {
    if (canGoBack && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
  }, [canGoBack, isAnimating]);
  
  const goForward = useCallback(() => {
    if (canGoForward && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
    }
  }, [canGoForward, maxIndex, isAnimating]);

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

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

  // Calculate the width percentage for each item based on items per page
  const itemWidthPercent = 100 / itemsPerPage;
  const translateX = -(currentIndex * itemWidthPercent);

  return (
    <div className="relative" data-tour="metrics">
      {/* Navigation Arrows */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full bg-background shadow-md border-border/50 transition-all duration-300",
            canGoBack ? "hover:scale-110 hover:bg-primary hover:text-primary-foreground" : "opacity-40 cursor-not-allowed"
          )}
          onClick={goBack}
          disabled={!canGoBack || isAnimating}
          aria-label="Ver itens anteriores"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full bg-background shadow-md border-border/50 transition-all duration-300",
            canGoForward ? "hover:scale-110 hover:bg-primary hover:text-primary-foreground" : "opacity-40 cursor-not-allowed"
          )}
          onClick={goForward}
          disabled={!canGoForward || isAnimating}
          aria-label="Ver próximos itens"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* KPI Cards Container with overflow hidden */}
      <div className="overflow-hidden px-2" ref={containerRef}>
        <div 
          className="flex transition-transform duration-400 ease-out"
          style={{ 
            transform: `translateX(${translateX}%)`,
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
          }}
        >
          {items.map((kpi, index) => {
            const Icon = kpi.icon;
            
            return (
              <div
                key={kpi.id}
                className="flex-shrink-0 px-3"
                style={{ width: `${itemWidthPercent}%` }}
              >
                <Card
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                    "bg-card border-border/50 h-full"
                  )}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                }
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5"
              )}
              aria-label={`Ir para posição ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
