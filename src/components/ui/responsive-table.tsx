import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  mobileCardRenderer?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  mobileCardRenderer,
  emptyMessage = "Nenhum dado encontrado",
  className,
  isLoading,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile card view
  if (isMobile && mobileCardRenderer) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => (
          <Card key={keyExtractor(item)} className="overflow-hidden">
            <CardContent className="p-4">
              {mobileCardRenderer(item)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view with horizontal scroll
  return (
    <div className={cn("overflow-x-auto rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={cn(
                  column.className,
                  column.hideOnMobile && "hidden md:table-cell"
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={keyExtractor(item)}>
              {columns.map((column) => (
                <TableCell
                  key={`${keyExtractor(item)}-${String(column.key)}`}
                  className={cn(
                    column.className,
                    column.hideOnMobile && "hidden md:table-cell"
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : String(item[column.key as keyof T] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
