import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calculator } from "lucide-react";
import type { ConversionFactor } from "@/services/conversionFactors";

interface ConversionFactorCardProps {
  factor: ConversionFactor;
}

export function ConversionFactorCard({ factor }: ConversionFactorCardProps) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {factor.category}
          </Badge>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-base font-medium leading-tight">
          Conversão de Unidades
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Conversion Display */}
          <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-sm font-medium">1 {factor.from_unit}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary" />
            <div className="text-center">
              <div className="text-sm font-medium">{factor.conversion_factor} {factor.to_unit}</div>
            </div>
          </div>

          {/* Factor Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fator:</span>
              <span className="font-medium">{factor.conversion_factor}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">De:</span>
              <span className="font-medium">{factor.from_unit}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Para:</span>
              <span className="font-medium">{factor.to_unit}</span>
            </div>
          </div>

          {/* Source */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium">Fonte:</div>
              <div className="truncate">{factor.source}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}