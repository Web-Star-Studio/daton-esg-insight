import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, Shield } from 'lucide-react';
import { TableSchema, getDomainInfo } from '@/utils/databaseSchemaParser';
import { ColumnTypeIcon } from './ColumnTypeIcon';
import { RelationshipBadge } from './RelationshipBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DatabaseTableCardProps {
  table: TableSchema;
  onTableClick?: (tableName: string) => void;
}

export function DatabaseTableCard({ table, onTableClick }: DatabaseTableCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const domainInfo = getDomainInfo(table.domain);
  
  const handleCopySQL = () => {
    const sql = `SELECT * FROM ${table.name} LIMIT 10;`;
    navigator.clipboard.writeText(sql);
    toast.success('SQL copiado para área de transferência');
  };
  
  return (
    <Card className="border-muted/40 hover:border-primary/30 transition-colors">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{domainInfo.icon}</span>
                <CardTitle className="text-xl font-mono">{table.name}</CardTitle>
                {table.hasRLS && (
                  <Badge variant="outline" className="bg-success/10 border-success/30">
                    <Shield className="h-3 w-3 mr-1" />
                    RLS
                  </Badge>
                )}
              </div>
              <CardDescription>{table.description}</CardDescription>
              <Badge 
                variant="secondary" 
                className="mt-2"
                style={{ backgroundColor: `${domainInfo.color}20`, borderColor: domainInfo.color }}
              >
                {domainInfo.name}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopySQL}
                title="Copiar SQL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Columns */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ColumnTypeIcon type="TEXT" />
                Colunas ({table.columns.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {table.columns.map(column => (
                  <div 
                    key={column.name} 
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <ColumnTypeIcon type={column.type} className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      "font-mono text-sm flex-1",
                      column.isPrimaryKey && "font-bold text-warning",
                      column.isForeignKey && "text-primary"
                    )}>
                      {column.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {column.type}
                    </Badge>
                    {column.isPrimaryKey && (
                      <Badge className="text-xs bg-warning/20 text-warning border-warning/30">
                        PK
                      </Badge>
                    )}
                    {column.isForeignKey && (
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                        FK
                      </Badge>
                    )}
                    {column.nullable && (
                      <span className="text-xs text-muted-foreground">nullable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Relationships */}
            {table.relationships.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  🔗 Relacionamentos ({table.relationships.length})
                </h4>
                <div className="space-y-2">
                  {table.relationships.map((rel, idx) => (
                    <RelationshipBadge 
                      key={idx} 
                      relationship={rel} 
                      onTableClick={onTableClick}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Business Rules */}
            {table.businessRules.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  📋 Regras de Negócio
                </h4>
                <ul className="space-y-2">
                  {table.businessRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-muted-foreground">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
