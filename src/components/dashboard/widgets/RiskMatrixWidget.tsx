import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function RiskMatrixWidget({ companyId }: { companyId: string }) {
  const { data: risks, isLoading } = useQuery({
    queryKey: ['risk-matrix', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('esg_risks')
        .select('probability, impact, status')
        .eq('company_id', companyId)
        .eq('status', 'Ativo') as { data: any[] | null; error: any };
      if (error) throw error;

      const getRiskLevel = (prob: string, imp: string) => {
        const levels = { 'Baixo': 1, 'Médio': 2, 'Alto': 3 };
        const score = (levels[prob as keyof typeof levels] || 0) * (levels[imp as keyof typeof levels] || 0);
        if (score >= 6) return 'critical';
        if (score >= 4) return 'high';
        if (score >= 2) return 'medium';
        return 'low';
      };

      const distribution = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      data?.forEach((risk: any) => {
        const level = getRiskLevel(risk.probability, risk.impact);
        distribution[level]++;
      });

      return { distribution, total: data?.length || 0 };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Matriz de Riscos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{risks?.total}</p>
              <p className="text-sm text-muted-foreground">Riscos Ativos</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-destructive">
                {risks?.distribution.critical}
              </p>
              <p className="text-sm text-muted-foreground">Críticos</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                Alto
              </span>
              <span className="font-medium">{risks?.distribution.high}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                Médio
              </span>
              <span className="font-medium">{risks?.distribution.medium}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Baixo
              </span>
              <span className="font-medium">{risks?.distribution.low}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
