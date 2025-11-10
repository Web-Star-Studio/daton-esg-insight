import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Building2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GRIEconomicModule() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Gestão e Desempenho Econômico
          </CardTitle>
          <CardDescription>
            Indicadores econômicos GRI 201-205: Desempenho, Impactos Indiretos, Compras e Anticorrupção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O módulo econômico completo está disponível no Assistente GRI. 
              Acesse através do botão "Novo Relatório" para iniciar a coleta estruturada de dados econômicos.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-sm">GRI 201</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Desempenho econômico, valor gerado e distribuído, riscos climáticos
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-sm">GRI 203-204</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Impactos econômicos indiretos e práticas de compra local
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-sm">GRI 205</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anticorrupção, treinamentos e casos reportados
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}