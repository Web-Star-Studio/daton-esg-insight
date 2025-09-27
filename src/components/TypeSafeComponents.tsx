import React from 'react';
import { ComponentSize, ComponentVariant, LoadingState } from '@/types/common';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Type-safe Loading component
interface LoadingSpinnerProps {
  size?: ComponentSize;
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Type-safe Status Badge
interface StatusBadgeProps {
  status: LoadingState;
  labels?: Partial<Record<LoadingState, string>>;
  className?: string;
}

export function StatusBadge({ status, labels, className }: StatusBadgeProps) {
  const defaultLabels: Record<LoadingState, string> = {
    idle: 'Inativo',
    loading: 'Carregando',
    success: 'Sucesso',
    error: 'Erro'
  };

  const variants: Record<LoadingState, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    idle: 'secondary',
    loading: 'default',
    success: 'default',
    error: 'destructive'
  };

  const label = labels?.[status] || defaultLabels[status];
  const variant = variants[status];

  return (
    <Badge variant={variant} className={className}>
      {status === 'loading' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {label}
    </Badge>
  );
}

// Type-safe Empty State component
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon: Icon,
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn('text-center py-12', className)}>
      <CardContent className="space-y-4">
        {Icon && (
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Type-safe Error Display component
interface ErrorDisplayProps {
  error: string | Error;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  title = 'Ocorreu um erro',
  onRetry,
  className 
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Card className={cn('border-destructive/50', className)}>
      <CardHeader>
        <CardTitle className="text-destructive text-lg">{title}</CardTitle>
        <CardDescription>{errorMessage}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent>
          <Button onClick={onRetry} variant="outline" size="sm">
            Tentar Novamente
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Type-safe Data Table component
interface DataTableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  onRowClick,
  className
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSpinner text="Carregando dados..." className="py-8" />;
  }

  if (data.length === 0) {
    return (
      <EmptyState 
        title={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th 
                key={String(column.key)}
                className="text-left p-2 font-medium"
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr 
              key={item.id}
              className={cn(
                'border-b hover:bg-muted/50',
                onRowClick && 'cursor-pointer'
              )}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="p-2">
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key] || '-')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Type-safe Metric Card component
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'stable';
  };
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  className
}: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-muted-foreground'
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn('text-xs mt-2', trendColors[trend.direction])}>
            {trend.direction === 'up' && '↗'} 
            {trend.direction === 'down' && '↘'} 
            {trend.direction === 'stable' && '→'} 
            {trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}