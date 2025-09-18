import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function GRIEconomicModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Módulo Econômico - Em Desenvolvimento
        </CardTitle>
        <CardDescription>
          Indicadores econômicos GRI (201-206) - Funcionalidade em construção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Este módulo será implementado para gerenciar indicadores econômicos como performance econômica, anticorrupção e práticas de compras.
        </p>
      </CardContent>
    </Card>
  );
}