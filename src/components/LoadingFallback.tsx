import { TreeLoadingScreen } from "@/components/TreeLoadingScreen";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback(_props: LoadingFallbackProps) {
  return <TreeLoadingScreen />;
}

// Skeleton específicos para diferentes tipos de conteúdo
export function TableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/30 animate-pulse rounded" />
      ))}
    </div>
  );
}

export function FormLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-1/3 bg-muted/30 animate-pulse rounded" />
          <div className="h-10 bg-muted/30 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="h-5 w-2/3 bg-muted/30 animate-pulse rounded" />
        <div className="h-4 w-full bg-muted/30 animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted/30 animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
