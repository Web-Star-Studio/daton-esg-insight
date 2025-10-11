import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

interface ReadinessCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  critical: boolean;
}

interface ProductionReadinessCardProps {
  checks: ReadinessCheck[];
  isReady: boolean;
  criticalFailures: ReadinessCheck[];
  warnings: ReadinessCheck[];
}

export function ProductionReadinessCard({ 
  checks, 
  isReady, 
  criticalFailures, 
  warnings 
}: ProductionReadinessCardProps) {
  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Aprovado</Badge>;
      case 'warn':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Aviso</Badge>;
      case 'fail':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Falha</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status de Produção</CardTitle>
            <CardDescription>
              Verificação de prontidão para ambiente de produção
            </CardDescription>
          </div>
          {isReady ? (
            <Badge className="bg-success text-success-foreground">✓ Pronto</Badge>
          ) : (
            <Badge variant="destructive">✗ Não Pronto</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Critical Failures */}
        {criticalFailures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Problemas Críticos</h3>
            </div>
            <div className="space-y-2 ml-7">
              {criticalFailures.map((check, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{check.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-warning">Avisos</h3>
            </div>
            <div className="space-y-2 ml-7">
              {warnings.map((check, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{check.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Checks Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Todas as Verificações</h3>
          </div>
          <div className="space-y-2 ml-7">
            {checks.map((check, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <span className="text-sm">{check.name}</span>
                </div>
                {getStatusBadge(check.status)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
