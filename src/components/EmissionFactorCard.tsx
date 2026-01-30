import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Calculator, ExternalLink, Edit } from "lucide-react";
import { EmissionFactor } from "@/services/emissionFactors";
import { Separator } from "@/components/ui/separator";

interface EmissionFactorCardProps {
  factor: EmissionFactor;
  onDelete?: (id: string) => void;
  onEdit?: (factor: EmissionFactor) => void;
}

// GWP values from IPCC AR6 (100-year horizon)
const GWP_VALUES = {
  CH4: 27, // Metano
  N2O: 273, // Óxido Nitroso  
  CO2: 1 // Dióxido de Carbono (baseline)
};

export function EmissionFactorCard({ factor, onDelete, onEdit }: EmissionFactorCardProps) {
  const getTypeLabel = (type: string) => {
    return type === "system" ? "Sistema" : "Customizado";
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === "system" ? "secondary" : "default";
  };

  // Calculate CO₂ equivalent automatically
  const calculateCO2Equivalent = () => {
    // Check if this is a refrigerant gas with direct GWP
    const details = factor.details_json as Record<string, unknown> | null;
    const gwpDirect = details?.gwp_direct;
    if (typeof gwpDirect === 'number') {
      // For refrigerant gases, 1 kg of gas = gwp_direct kg CO₂e
      return gwpDirect;
    }
    
    // Standard calculation for other gases
    const co2 = factor.co2_factor || 0;
    const ch4 = (factor.ch4_factor || 0) * GWP_VALUES.CH4;
    const n2o = (factor.n2o_factor || 0) * GWP_VALUES.N2O;
    
    return co2 + ch4 + n2o;
  };

  const co2Equivalent = calculateCO2Equivalent();

  // Check if factor has source URL
  const hasSourceUrl = factor.source?.includes('http');

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight">{factor.name}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={getTypeBadgeVariant(factor.type)}>
              {getTypeLabel(factor.type)}
            </Badge>
            {factor.type === 'custom' && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(factor)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Editar fator"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(factor.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Deletar fator"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {factor.category} • {factor.activity_unit}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* CO₂ Equivalent - Destaque principal */}
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">CO₂ Equivalente</span>
          </div>
          <div className="text-lg font-mono font-bold text-primary">
            {(() => {
              const details = factor.details_json as Record<string, unknown> | null;
              return details?.gwp_direct ? 
                `${co2Equivalent.toLocaleString()} kg CO₂e/${factor.activity_unit}` :
                `${co2Equivalent.toFixed(6)} kg CO₂e/${factor.activity_unit}`;
            })()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {(() => {
              const details = factor.details_json as Record<string, unknown> | null;
              return details?.gwp_direct ? 
                `GWP direto (${details.gwp_source})` :
                "Calculado com GWP do IPCC AR6 (100 anos)";
            })()}
          </p>
        </div>

        <Separator />

        {/* Individual gas factors */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Fatores por Gás Individual:</h4>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>CO₂:</span>
              <span className="font-mono">{factor.co2_factor || 0} kg CO₂/{factor.activity_unit}</span>
            </div>
            
            {factor.ch4_factor && factor.ch4_factor > 0 && (
              <div className="flex justify-between text-sm">
                <span>CH₄:</span>
                <div className="text-right">
                  <div className="font-mono">{factor.ch4_factor} kg CH₄/{factor.activity_unit}</div>
                  <div className="text-xs text-muted-foreground">
                    × {GWP_VALUES.CH4} (GWP) = {(factor.ch4_factor * GWP_VALUES.CH4).toFixed(6)} kg CO₂e
                  </div>
                </div>
              </div>
            )}
            
            {factor.n2o_factor && factor.n2o_factor > 0 && (
              <div className="flex justify-between text-sm">
                <span>N₂O:</span>
                <div className="text-right">
                  <div className="font-mono">{factor.n2o_factor} kg N₂O/{factor.activity_unit}</div>
                  <div className="text-xs text-muted-foreground">
                    × {GWP_VALUES.N2O} (GWP) = {(factor.n2o_factor * GWP_VALUES.N2O).toFixed(6)} kg CO₂e
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Source and metadata */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                <strong>Fonte:</strong> {factor.source}
                {factor.year_of_validity && ` (${factor.year_of_validity})`}
              </p>
            </div>
            {hasSourceUrl && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              {factor.type === 'system' ? 'Validado oficialmente' : 'Fator customizado'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}