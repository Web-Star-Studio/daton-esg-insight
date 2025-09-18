import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function GRIGovernanceModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Módulo Governança - Em Desenvolvimento
        </CardTitle>
        <CardDescription>
          Indicadores de governança GRI 2 - Funcionalidade em construção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Este módulo será implementado para gerenciar indicadores de governança como estrutura organizacional, estratégia e engajamento.
        </p>
      </CardContent>
    </Card>
  );
}