import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function OpportunitiesWidget({ companyId }: { companyId: string }) {
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities-summary', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('potential_value, status, impact')
        .eq('company_id', companyId)
        .in('status', ['Identificada', 'Em Avaliação', 'Planejada']);

      if (error) throw error;

      const totalValue = data?.reduce((sum, opp) => sum + (opp.potential_value || 0), 0) || 0;
      const highImpact = data?.filter(opp => opp.impact === 'Alto').length || 0;

      return {
        total: data?.length || 0,
        totalValue,
        highImpact
      };
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
          <Sparkles className="h-5 w-5" />
          Oportunidades Estratégicas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{opportunities?.total}</p>
              <p className="text-sm text-muted-foreground">Em Análise</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {opportunities?.highImpact}
              </p>
              <p className="text-sm text-muted-foreground">Alto Impacto</p>
            </div>
          </div>

          {opportunities && opportunities.totalValue > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Valor Potencial</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {opportunities.totalValue.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
