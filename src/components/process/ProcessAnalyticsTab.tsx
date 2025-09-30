import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle } from 'lucide-react';
import type { ProcessMap } from '@/services/processMapping';

interface ProcessAnalyticsTabProps {
  processMaps?: ProcessMap[];
}

export function ProcessAnalyticsTab({ processMaps }: ProcessAnalyticsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processMaps && processMaps.length > 0 ? (
            <div className="space-y-4">
              {['Estratégico', 'Operacional', 'Apoio'].map(type => {
                const count = processMaps.filter(p => p.process_type === type).length;
                const percentage = processMaps.length > 0 ? (count / processMaps.length) * 100 : 0;
                
                return (
                  <div key={type}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{type}</span>
                      <span className="text-sm text-muted-foreground">{count} processos</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum dado disponível para análise
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Status dos Processos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processMaps && processMaps.length > 0 ? (
            <div className="space-y-4">
              {['Draft', 'Review', 'Approved', 'Archived'].map(status => {
                const count = processMaps.filter(p => p.status === status).length;
                const percentage = processMaps.length > 0 ? (count / processMaps.length) * 100 : 0;
                
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{status}</span>
                      <span className="text-sm text-muted-foreground">{count} processos</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum dado disponível para análise
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
