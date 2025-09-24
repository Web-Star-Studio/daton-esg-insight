import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  loading?: boolean;
  error?: Error | string | null;
  retry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}

export function LoadingState({
  loading,
  error,
  retry,
  empty,
  emptyMessage = "Nenhum dado encontrado",
  emptyIcon,
  className,
  children,
  skeleton
}: LoadingStateProps) {
  // Loading state
  if (loading) {
    if (skeleton) {
      return <div className={className}>{skeleton}</div>;
    }
    
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium mb-2">Erro ao carregar dados</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {errorMessage || "Ocorreu um erro inesperado"}
                </p>
              </div>
              {retry && (
                <Button 
                  onClick={retry} 
                  variant="outline" 
                  size="sm"
                  className="hover-scale"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (empty) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center space-y-4">
          {emptyIcon || (
            <div className="p-3 bg-muted/50 rounded-full w-fit mx-auto">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="font-medium mb-2">Nenhum resultado</h3>
            <p className="text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render children
  return <div className={className}>{children}</div>;
}

// Specialized loading components
export function ButtonLoading({ 
  loading, 
  children, 
  ...props 
}: { loading: boolean; children: React.ReactNode } & React.ComponentProps<typeof Button>) {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function InlineLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  );
}