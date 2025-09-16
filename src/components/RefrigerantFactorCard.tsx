import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Snowflake, AlertTriangle } from "lucide-react";
import type { RefrigerantFactor } from "@/services/refrigerantFactors";

interface RefrigerantFactorCardProps {
  factor: RefrigerantFactor;
}

export function RefrigerantFactorCard({ factor }: RefrigerantFactorCardProps) {
  const getGWPBadgeVariant = (gwp: number) => {
    if (gwp < 100) return "default";
    if (gwp < 1000) return "secondary";
    if (gwp < 5000) return "destructive";
    return "destructive";
  };

  const getGWPLevel = (gwp: number) => {
    if (gwp < 100) return "Baixo";
    if (gwp < 1000) return "Médio";
    if (gwp < 5000) return "Alto";
    return "Muito Alto";
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {factor.category}
          </Badge>
          <div className="flex items-center gap-1">
            {!factor.is_kyoto_gas && (
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            )}
            <Snowflake className="h-4 w-4 text-blue-500" />
          </div>
        </div>
        <CardTitle className="text-base font-medium leading-tight">
          {factor.refrigerant_code}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {factor.chemical_name}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* GWP AR6 Highlight */}
          <div className="text-center p-3 bg-primary/5 rounded-lg border">
            <div className="text-2xl font-bold text-primary">
              {factor.gwp_ar6.toLocaleString()}
            </div>
            <Badge variant={getGWPBadgeVariant(factor.gwp_ar6)} className="text-xs mt-1">
              GWP AR6 - {getGWPLevel(factor.gwp_ar6)}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              kg CO₂eq / kg refrigerante
            </div>
          </div>

          {/* Historical GWP Values */}
          {(factor.gwp_ar5 || factor.gwp_ar4) && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Valores Históricos:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {factor.gwp_ar5 && (
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="font-medium">{factor.gwp_ar5.toLocaleString()}</div>
                    <div className="text-muted-foreground">GWP AR5</div>
                  </div>
                )}
                {factor.gwp_ar4 && (
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="font-medium">{factor.gwp_ar4.toLocaleString()}</div>
                    <div className="text-muted-foreground">GWP AR4</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chemical Formula */}
          {factor.chemical_formula && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Fórmula:</div>
              <div className="font-mono text-sm bg-muted/30 px-2 py-1 rounded text-center">
                {factor.chemical_formula}
              </div>
            </div>
          )}

          {/* Source */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium">Fonte:</div>
              <div className="truncate">{factor.source}</div>
              {!factor.is_kyoto_gas && (
                <div className="text-orange-600 mt-1 font-medium">
                  ⚠️ Gás não-Quioto
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}