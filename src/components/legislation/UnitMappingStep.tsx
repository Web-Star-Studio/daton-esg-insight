import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, MapPin, AlertTriangle, Check, X } from "lucide-react";
import { Branch } from "@/services/branches";

export interface UnitMapping {
  excelCode: string;
  branchId: string | null;
  branchName?: string;
  autoMatched: boolean;
}

interface UnitMappingStepProps {
  detectedUnits: string[];
  branches: Branch[];
  mappings: UnitMapping[];
  onMappingsChange: (mappings: UnitMapping[]) => void;
}

// Find best matching branch for a unit code
function findBestMatch(unitCode: string, branches: Branch[]): Branch | null {
  const normalized = unitCode.toUpperCase().trim();
  
  // Exact match on code
  const exactCodeMatch = branches.find(b => 
    b.code?.toUpperCase().trim() === normalized
  );
  if (exactCodeMatch) return exactCodeMatch;
  
  // Exact match on name
  const exactNameMatch = branches.find(b => 
    b.name.toUpperCase().trim() === normalized
  );
  if (exactNameMatch) return exactNameMatch;
  
  // Contains match on code
  const containsCodeMatch = branches.find(b => 
    b.code?.toUpperCase().includes(normalized) || 
    normalized.includes(b.code?.toUpperCase() || '')
  );
  if (containsCodeMatch) return containsCodeMatch;
  
  // Contains match on name or city
  const containsMatch = branches.find(b => 
    b.name.toUpperCase().includes(normalized) ||
    b.city?.toUpperCase().includes(normalized) ||
    normalized.includes(b.city?.toUpperCase() || '')
  );
  if (containsMatch) return containsMatch;
  
  return null;
}

export function UnitMappingStep({
  detectedUnits,
  branches,
  mappings,
  onMappingsChange,
}: UnitMappingStepProps) {
  const activeBranches = useMemo(() => 
    branches.filter(b => b.status === 'Ativa' || b.status === 'Ativo'),
    [branches]
  );

  const handleMappingChange = (excelCode: string, branchId: string | null) => {
    const branch = branches.find(b => b.id === branchId);
    const newMappings = mappings.map(m => 
      m.excelCode === excelCode 
        ? { 
            ...m, 
            branchId, 
            branchName: branch?.name,
            autoMatched: false 
          }
        : m
    );
    onMappingsChange(newMappings);
  };

  const mappedCount = mappings.filter(m => m.branchId).length;
  const autoMatchedCount = mappings.filter(m => m.autoMatched && m.branchId).length;

  return (
    <div className="space-y-4">
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Detectamos <strong>{detectedUnits.length} colunas de unidades</strong> na planilha.
          Vincule cada código a uma filial cadastrada no sistema para importar as avaliações por unidade.
        </AlertDescription>
      </Alert>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="secondary" className="py-1 px-3">
          <Building2 className="h-3 w-3 mr-1" />
          {detectedUnits.length} unidades detectadas
        </Badge>
        <Badge 
          variant={mappedCount === detectedUnits.length ? "default" : "outline"} 
          className={`py-1 px-3 ${mappedCount === detectedUnits.length ? 'bg-green-600' : ''}`}
        >
          <Check className="h-3 w-3 mr-1" />
          {mappedCount} mapeadas
        </Badge>
        {autoMatchedCount > 0 && (
          <Badge variant="secondary" className="py-1 px-3 bg-blue-100 text-blue-800">
            {autoMatchedCount} auto-detectadas
          </Badge>
        )}
        {mappedCount < detectedUnits.length && (
          <Badge variant="secondary" className="py-1 px-3 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {detectedUnits.length - mappedCount} não mapeadas
          </Badge>
        )}
      </div>

      {/* Mapping table */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-4 space-y-3">
          {mappings.map((mapping) => (
            <div 
              key={mapping.excelCode} 
              className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
            >
              {/* Excel code */}
              <div className="w-[100px] flex-shrink-0">
                <Label className="text-xs text-muted-foreground">Coluna Excel</Label>
                <div className="font-mono font-semibold text-lg">
                  {mapping.excelCode}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-muted-foreground">→</div>

              {/* Branch selector */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Filial do Sistema</Label>
                <Select
                  value={mapping.branchId || "ignore"}
                  onValueChange={(value) => 
                    handleMappingChange(mapping.excelCode, value === "ignore" ? null : value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar filial..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="ignore">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <X className="h-4 w-4" />
                        Ignorar esta coluna
                      </div>
                    </SelectItem>
                    {activeBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{branch.name}</span>
                          {branch.code && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {branch.code}
                            </Badge>
                          )}
                          {branch.city && (
                            <span className="text-xs text-muted-foreground">
                              ({branch.city})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status indicator */}
              <div className="w-[80px] flex-shrink-0 text-right">
                {mapping.branchId ? (
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    OK
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Ignorar
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="p-3 bg-muted/30 rounded-lg text-sm">
        <p className="font-medium mb-2">Legenda dos valores na planilha:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-muted-foreground">
          <div><code className="bg-muted px-1 rounded">1</code> = N.A (Não Aplicável)</div>
          <div><code className="bg-muted px-1 rounded">2</code> = OK (Conforme)</div>
          <div><code className="bg-muted px-1 rounded">3</code> = NÃO (Não Conforme)</div>
          <div><code className="bg-muted px-1 rounded">x</code> = S/AV (Sem Avaliação)</div>
          <div><code className="bg-muted px-1 rounded">z</code> = n/p (Não Presente)</div>
        </div>
      </div>
    </div>
  );
}

// Helper to create initial mappings from detected units
export function createInitialMappings(detectedUnits: string[], branches: Branch[]): UnitMapping[] {
  return detectedUnits.map(code => {
    const bestMatch = findBestMatch(code, branches);
    return {
      excelCode: code,
      branchId: bestMatch?.id || null,
      branchName: bestMatch?.name,
      autoMatched: !!bestMatch,
    };
  });
}
