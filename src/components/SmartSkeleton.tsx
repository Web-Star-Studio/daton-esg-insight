import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SmartSkeletonProps {
  variant: 'card' | 'table' | 'chart' | 'list' | 'stats' | 'form' | 'dashboard';
  rows?: number;
  className?: string;
  animated?: boolean;
}

export const SmartSkeleton: React.FC<SmartSkeletonProps> = ({
  variant,
  rows = 3,
  className,
  animated = true
}) => {
  const animationClass = animated ? 'animate-pulse' : '';

  switch (variant) {
    case 'card':
      return (
        <Card className={cn('w-full', className)}>
          <CardHeader>
            <Skeleton className={cn('h-6 w-3/4', animationClass)} />
            <Skeleton className={cn('h-4 w-1/2', animationClass)} />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className={cn('h-4 w-full', animationClass)} />
            ))}
          </CardContent>
        </Card>
      );

    case 'table':
      return (
        <div className={cn('w-full space-y-4', className)}>
          <div className="flex justify-between items-center">
            <Skeleton className={cn('h-8 w-1/4', animationClass)} />
            <Skeleton className={cn('h-8 w-32', animationClass)} />
          </div>
          <div className="border rounded-lg">
            <div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted/50">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className={cn('h-4 w-full', animationClass)} />
              ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className={cn('h-4 w-full', animationClass)} />
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case 'chart':
      return (
        <Card className={cn('w-full', className)}>
          <CardHeader>
            <Skeleton className={cn('h-6 w-1/3', animationClass)} />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between space-x-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className={cn('w-full', animationClass)}
                  style={{ height: `${Math.random() * 200 + 50}px` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={cn('h-3 w-8', animationClass)} />
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case 'stats':
      return (
        <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className={cn('h-4 w-24', animationClass)} />
                    <Skeleton className={cn('h-8 w-16', animationClass)} />
                    <Skeleton className={cn('h-3 w-20', animationClass)} />
                  </div>
                  <Skeleton className={cn('h-8 w-8 rounded', animationClass)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className={cn('space-y-3', className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Skeleton className={cn('h-10 w-10 rounded-full', animationClass)} />
              <div className="flex-1 space-y-2">
                <Skeleton className={cn('h-4 w-3/4', animationClass)} />
                <Skeleton className={cn('h-3 w-1/2', animationClass)} />
              </div>
              <Skeleton className={cn('h-8 w-20', animationClass)} />
            </div>
          ))}
        </div>
      );

    case 'form':
      return (
        <Card className={cn('w-full', className)}>
          <CardHeader>
            <Skeleton className={cn('h-6 w-1/3', animationClass)} />
            <Skeleton className={cn('h-4 w-2/3', animationClass)} />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className={cn('h-4 w-1/4', animationClass)} />
                <Skeleton className={cn('h-10 w-full', animationClass)} />
              </div>
            ))}
            <div className="flex justify-end space-x-2">
              <Skeleton className={cn('h-10 w-20', animationClass)} />
              <Skeleton className={cn('h-10 w-24', animationClass)} />
            </div>
          </CardContent>
        </Card>
      );

    case 'dashboard':
      return (
        <div className={cn('space-y-6', className)}>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className={cn('h-8 w-64', animationClass)} />
              <Skeleton className={cn('h-4 w-96', animationClass)} />
            </div>
            <Skeleton className={cn('h-10 w-32', animationClass)} />
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className={cn('h-4 w-24', animationClass)} />
                      <Skeleton className={cn('h-8 w-16', animationClass)} />
                      <Skeleton className={cn('h-3 w-20', animationClass)} />
                    </div>
                    <Skeleton className={cn('h-8 w-8 rounded', animationClass)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Chart */}
          <Card>
            <CardHeader>
              <Skeleton className={cn('h-6 w-1/3', animationClass)} />
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-end justify-between space-x-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className={cn('w-full', animationClass)}
                    style={{ height: `${Math.random() * 300 + 100}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className={cn('h-6 w-1/2', animationClass)} />
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className={cn('h-32 w-32 rounded-full', animationClass)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

    default:
      return <Skeleton className={cn('h-4 w-full', animationClass, className)} />;
  }
};