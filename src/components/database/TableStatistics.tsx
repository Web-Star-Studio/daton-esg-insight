import { Card, CardContent } from '@/components/ui/card';
import { Database, Link2, Columns3, FileCode } from 'lucide-react';

interface TableStatisticsProps {
  totalTables: number;
  totalRelationships: number;
  totalColumns: number;
  totalDomains: number;
}

export function TableStatistics({ 
  totalTables, 
  totalRelationships, 
  totalColumns,
  totalDomains 
}: TableStatisticsProps) {
  const stats = [
    { icon: Database, label: 'Tabelas', value: totalTables, color: 'text-primary' },
    { icon: Link2, label: 'Relacionamentos', value: totalRelationships, color: 'text-success' },
    { icon: Columns3, label: 'Colunas', value: totalColumns, color: 'text-warning' },
    { icon: FileCode, label: 'Domínios', value: totalDomains, color: 'text-destructive' },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <Card key={label} className="border-muted/40">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
              </div>
              <Icon className={cn("h-10 w-10", color)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
