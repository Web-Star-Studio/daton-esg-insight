import { Badge } from '@/components/ui/badge';
import { ArrowRight, Link2 } from 'lucide-react';
import { TableRelationship } from '@/utils/databaseSchemaParser';

interface RelationshipBadgeProps {
  relationship: TableRelationship;
  onTableClick?: (tableName: string) => void;
}

export function RelationshipBadge({ relationship, onTableClick }: RelationshipBadgeProps) {
  const { columns, referencedTable, referencedColumns, isOneToOne } = relationship;
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="outline" className="bg-primary/10 border-primary/30">
        <Link2 className="h-3 w-3 mr-1" />
        {columns.join(', ')}
      </Badge>
      
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      
      <button
        onClick={() => onTableClick?.(referencedTable)}
        className="hover:underline text-primary font-medium"
      >
        {referencedTable}
      </button>
      
      <span className="text-muted-foreground">
        ({referencedColumns.join(', ')})
      </span>
      
      {isOneToOne && (
        <Badge variant="secondary" className="text-xs">
          1:1
        </Badge>
      )}
    </div>
  );
}
