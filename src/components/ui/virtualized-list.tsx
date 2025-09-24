import React, { useMemo, useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton-loader';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  loading = false,
  className,
  overscan = 5
}: VirtualizedListProps<T>) {
  const listRef = useRef<List>(null);

  // Memoize item renderer for performance
  const ItemRenderer = useMemo(() => 
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>
        {renderItem(items[index], index)}
      </div>
    ), [items, renderItem]
  );

  if (loading) {
    return (
      <div className={cn("space-y-2", className)} style={{ height }}>
        {Array.from({ length: Math.ceil(height / itemHeight) }).map((_, i) => (
          <Skeleton key={i} className="w-full" style={{ height: itemHeight }} />
        ))}
      </div>
    );
  }

  return (
    <List
      ref={listRef}
      className={className}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscan}
    >
      {ItemRenderer}
    </List>
  );
}

// Virtualized table component
interface VirtualizedTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    render?: (value: any, item: T, index: number) => React.ReactNode;
    width?: number;
  }[];
  height: number;
  rowHeight?: number;
  loading?: boolean;
  className?: string;
}

export function VirtualizedTable<T>({
  data,
  columns,
  height,
  rowHeight = 50,
  loading = false,
  className
}: VirtualizedTableProps<T>) {
  const TableRow = useMemo(() => 
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = data[index];
      
      return (
        <div 
          style={style} 
          className="flex items-center border-b border-border/50 hover:bg-muted/50"
        >
          {columns.map((column) => (
            <div 
              key={String(column.key)}
              className="px-4 py-2 flex-1 text-sm"
              style={{ width: column.width }}
            >
              {column.render 
                ? column.render(item[column.key], item, index)
                : String(item[column.key] || '')
              }
            </div>
          ))}
        </div>
      );
    }, [data, columns]
  );

  if (loading) {
    return (
      <div className={cn("border rounded-lg", className)}>
        {/* Header skeleton */}
        <div className="flex bg-muted/50 border-b">
          {columns.map((column) => (
            <Skeleton 
              key={String(column.key)}
              className="h-10 flex-1 mx-2 my-2"
              style={{ width: column.width }}
            />
          ))}
        </div>
        {/* Rows skeleton */}
        <div style={{ height }}>
          {Array.from({ length: Math.ceil(height / rowHeight) }).map((_, i) => (
            <div key={i} className="flex border-b border-border/50">
              {columns.map((column) => (
                <Skeleton 
                  key={String(column.key)}
                  className="h-10 flex-1 mx-2 my-2"
                  style={{ width: column.width }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Table Header */}
      <div className="flex bg-muted/50 border-b border-border sticky top-0 z-10">
        {columns.map((column) => (
          <div 
            key={String(column.key)}
            className="px-4 py-3 font-medium text-sm flex-1"
            style={{ width: column.width }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized Body */}
      <List
        height={height}
        itemCount={data.length}
        itemSize={rowHeight}
        overscanCount={5}
      >
        {TableRow}
      </List>
    </div>
  );
}

// Infinite scrolling list
interface InfiniteScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  itemHeight: number;
  containerHeight: number;
  className?: string;
  threshold?: number;
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  loading,
  itemHeight,
  containerHeight,
  className,
  threshold = 5
}: InfiniteScrollListProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const handleItemsRendered = useMemo(() => 
    ({ visibleStopIndex }: { visibleStopIndex: number }) => {
      if (
        hasMore && 
        !isLoadingMore && 
        visibleStopIndex >= items.length - threshold
      ) {
        setIsLoadingMore(true);
        loadMore();
      }
    }, [hasMore, isLoadingMore, items.length, threshold, loadMore]
  );

  useEffect(() => {
    if (!loading) {
      setIsLoadingMore(false);
    }
  }, [loading]);

  const ItemRenderer = useMemo(() => 
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      // Show loading skeleton for items being loaded
      if (index >= items.length) {
        return (
          <div style={style}>
            <Skeleton className="w-full h-full" />
          </div>
        );
      }

      return (
        <div style={style}>
          {renderItem(items[index], index)}
        </div>
      );
    }, [items, renderItem]
  );

  // Add extra items for loading state
  const itemCount = hasMore ? items.length + 1 : items.length;

  return (
    <List
      className={className}
      height={containerHeight}
      itemCount={itemCount}
      itemSize={itemHeight}
      onItemsRendered={handleItemsRendered}
      overscanCount={10}
    >
      {ItemRenderer}
    </List>
  );
}