import { memo, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { defaultPropsComparator } from '@/hooks/useMemoizedComponent';

// Componentes memoizados para performance

export const MemoizedButton = memo(Button, defaultPropsComparator);

export const MemoizedInput = memo(forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => <Input ref={ref} {...props} />));

MemoizedInput.displayName = 'MemoizedInput';

export const MemoizedCard = memo(Card, defaultPropsComparator);

export const MemoizedCardHeader = memo(CardHeader, defaultPropsComparator);

export const MemoizedCardTitle = memo(CardTitle, defaultPropsComparator);

export const MemoizedCardContent = memo(CardContent, defaultPropsComparator);

export const MemoizedBadge = memo(Badge, defaultPropsComparator);

// Lista otimizada com memoização por item
interface OptimizedListItemProps<T> {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

const OptimizedListItemComponent = <T,>({ 
  item, 
  index, 
  renderItem 
}: OptimizedListItemProps<T>) => {
  return <>{renderItem(item, index)}</>;
};

export const OptimizedListItem = memo(OptimizedListItemComponent, (prevProps, nextProps) => {
  return prevProps.item === nextProps.item && prevProps.index === nextProps.index;
});

// Lista virtualizada simples para grandes datasets
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

export const VirtualizedList = memo(function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor
}: VirtualizedListProps<T>) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = 0; // Implementação básica - pode ser expandida com scroll
  const endIndex = Math.min(startIndex + visibleCount, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      role="list"
      aria-label={`Lista com ${items.length} itens`}
    >
      {visibleItems.map((item, index) => (
        <div
          key={keyExtractor(item)}
          style={{ height: itemHeight }}
          role="listitem"
        >
          <OptimizedListItem
            item={item}
            index={startIndex + index}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        </div>
      ))}
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Wrapper para formulários com acessibilidade
interface AccessibleFormFieldProps {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const AccessibleFormField = memo(({
  id,
  label,
  error,
  description,
  required,
  children
}: AccessibleFormFieldProps) => {
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const descriptionId = description ? `${id}-description` : undefined;
  
  const ariaDescribedBy = [descriptionId, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="space-y-2">
      <label 
        id={labelId}
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="obrigatório">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}
      
      <div>
        {children}
      </div>
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
});

AccessibleFormField.displayName = 'AccessibleFormField';