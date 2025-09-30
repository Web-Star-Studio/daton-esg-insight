import { Card, CardContent } from '@/components/ui/card';
import { Map, CheckCircle, Edit, Clock } from 'lucide-react';
import type { ProcessMap } from '@/services/processMapping';

interface ProcessStatsCardsProps {
  processMaps?: ProcessMap[];
}

export function ProcessStatsCards({ processMaps }: ProcessStatsCardsProps) {
  if (!processMaps || processMaps.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Map className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{processMaps.length}</p>
              <p className="text-sm text-muted-foreground">Total de Processos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {processMaps.filter(p => p.status === 'Approved').length}
              </p>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Edit className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">
                {processMaps.filter(p => p.status === 'Draft').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Elaboração</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">
                {processMaps.filter(p => p.status === 'Review').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Revisão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
