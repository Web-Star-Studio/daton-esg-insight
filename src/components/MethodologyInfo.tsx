import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Info, Calculator, Globe, BookOpen } from "lucide-react";

export function MethodologyInfo() {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Metodologia de Cálculo</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* GWP Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Potencial de Aquecimento Global (GWP)</h3>
          </div>
          
          <Alert className="mb-3">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Metodologia oficial:</strong> Valores GWP baseados no <strong>IPCC Sixth Assessment Report (AR6) - Horizonte de 100 anos</strong>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-background rounded-lg p-3 border">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1</div>
                <div className="text-sm font-medium">CO₂</div>
                <div className="text-xs text-muted-foreground">Dióxido de Carbono</div>
                <div className="text-xs text-muted-foreground">(baseline)</div>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-3 border">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">27</div>
                <div className="text-sm font-medium">CH₄</div>
                <div className="text-xs text-muted-foreground">Metano</div>
                <div className="text-xs text-muted-foreground">× 27 = CO₂e</div>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-3 border">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">273</div>
                <div className="text-sm font-medium">N₂O</div>
                <div className="text-xs text-muted-foreground">Óxido Nitroso</div>
                <div className="text-xs text-muted-foreground">× 273 = CO₂e</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Calculation Formula */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Fórmula de Conversão para CO₂ Equivalente</h3>
          </div>
          
          <div className="bg-background rounded-lg p-4 border font-mono text-sm">
            <div className="text-center space-y-2">
              <div><strong>tCO₂e Total =</strong></div>
              <div>
                <span className="text-blue-600">Atividade × Fator_CO₂</span> + 
                <span className="text-green-600 ml-2">Atividade × Fator_CH₄ × 27</span> + 
                <span className="text-orange-600 ml-2">Atividade × Fator_N₂O × 273</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Onde "Atividade" é a quantidade consumida/utilizada na unidade especificada para cada fator.
          </p>
        </div>

        <Separator />

        {/* Standards and Compliance */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Conformidade e Padrões</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline">GHG Protocol</Badge>
            <Badge variant="outline">ISO 14064</Badge>
            <Badge variant="outline">IPCC AR6</Badge>
            <Badge variant="outline">MCTI 2025</Badge>
            <Badge variant="outline">ANP/ANL</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Todos os fatores e cálculos seguem as diretrizes internacionais do GHG Protocol Corporate Standard 
            e são compatíveis com normas ISO 14064 para inventários de GEE, utilizando as referências 
            mais recentes do MCTI e ANP para fatores nacionais brasileiros.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}