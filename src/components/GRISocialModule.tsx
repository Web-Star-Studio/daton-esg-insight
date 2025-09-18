import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function GRISocialModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Módulo Social - Em Desenvolvimento
        </CardTitle>
        <CardDescription>
          Indicadores sociais GRI (401-418) - Funcionalidade em construção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Este módulo será implementado para gerenciar indicadores sociais como emprego, saúde e segurança, treinamento e diversidade.
        </p>
      </CardContent>
    </Card>
  );
}