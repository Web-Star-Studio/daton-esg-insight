import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function EmissionsSummaryWidget({ companyId }: { companyId: string }) {
  const { data: emissions, isLoading } = useQuery({
    queryKey: ['emissions-summary', companyId],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('emission_sources')
        .select('total_co2e')
        .eq('company_id', companyId)
        .gte('created_at', `${currentYear}-01-01`)
        .lte('created_at', `${currentYear}-12-31`);

      if (error) throw error;

      const total = data?.reduce((sum, item: any) => sum + (item.total_co2e || 0), 0) || 0;
      const lastMonth = data?.slice(-30).reduce((sum, item: any) => sum + (item.total_co2e || 0), 0) || 0;
      const previousMonth = data?.slice(-60, -30).reduce((sum, item: any) => sum + (item.total_co2e || 0), 0) || 0;
      
      const trend = previousMonth > 0 
        ? ((lastMonth - previousMonth) / previousMonth) * 100 
        : 0;

      return { total, trend };
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
          <BarChart3 className="h-5 w-5" />
          Emissões {new Date().getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold">
              {emissions?.total.toFixed(2)} tCO₂e
            </p>
            <p className="text-sm text-muted-foreground">
              Total acumulado no ano
            </p>
          </div>
          <div className="flex items-center gap-2">
            {emissions && emissions.trend > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  +{emissions.trend.toFixed(1)}% vs mês anterior
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  {emissions?.trend.toFixed(1)}% vs mês anterior
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
