import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Branch } from "@/services/branches";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BranchSelectionSectionProps {
  branches: Branch[];
  selectedBranchIds: string[];
  onSelectionChange: (branchIds: string[]) => void;
  jurisdiction: 'federal' | 'estadual' | 'municipal' | 'nbr' | 'internacional';
  legislationState?: string;
  legislationMunicipality?: string;
  isLoading?: boolean;
}

// Helper to calculate auto-selection based on jurisdiction
const calculateAutoSelection = (
  jurisdiction: string,
  branches: Branch[],
  legislationState?: string,
  legislationMunicipality?: string
): string[] => {
  switch (jurisdiction) {
    case 'federal':
    case 'nbr':
    case 'internacional':
      return branches.map(b => b.id);
    case 'estadual':
      if (legislationState) {
        return branches
          .filter(b => b.state?.toLowerCase() === legislationState.toLowerCase())
          .map(b => b.id);
      }
      return [];
    case 'municipal':
      if (legislationState && legislationMunicipality) {
        return branches
          .filter(b => 
            b.state?.toLowerCase() === legislationState.toLowerCase() &&
            b.city?.toLowerCase() === legislationMunicipality.toLowerCase()
          )
          .map(b => b.id);
      }
      return [];
    default:
      return [];
  }
};

export const BranchSelectionSection: React.FC<BranchSelectionSectionProps> = ({
  branches,
  selectedBranchIds,
  onSelectionChange,
  jurisdiction,
  legislationState,
  legislationMunicipality,
  isLoading,
}) => {
  // Track if we've done initial auto-selection
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Use refs to break dependency cycles and prevent infinite loops
  const onSelectionChangeRef = useRef(onSelectionChange);
  const branchesRef = useRef(branches);
  
  // Update refs on each render (but don't trigger effects)
  onSelectionChangeRef.current = onSelectionChange;
  branchesRef.current = branches;
  
  // Track previous values to detect actual changes
  const prevValuesRef = useRef({
    jurisdiction,
    legislationState,
    legislationMunicipality,
  });

  // Initial auto-selection - runs ONCE when branches load
  useEffect(() => {
    if (hasInitialized || isLoading || branches.length === 0) return;
    
    const autoSelectedIds = calculateAutoSelection(
      jurisdiction,
      branches,
      legislationState,
      legislationMunicipality
    );
    
    if (autoSelectedIds.length > 0) {
      onSelectionChangeRef.current(autoSelectedIds);
    }
    
    // Initialize prev values ref here too
    prevValuesRef.current = { jurisdiction, legislationState, legislationMunicipality };
    setHasInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized, isLoading, branches.length]);

  // Re-calculate when jurisdiction/location changes AFTER initialization
  // IMPORTANT: branches is NOT in dependencies - we use branchesRef instead
  useEffect(() => {
    if (!hasInitialized) return;
    
    const prev = prevValuesRef.current;
    const jurisdictionChanged = prev.jurisdiction !== jurisdiction;
    const stateChanged = prev.legislationState !== legislationState;
    const municipalityChanged = prev.legislationMunicipality !== legislationMunicipality;
    
    // Exit early if nothing changed
    if (!jurisdictionChanged && !stateChanged && !municipalityChanged) {
      return;
    }
    
    // Update refs ONLY when something actually changed
    prevValuesRef.current = { jurisdiction, legislationState, legislationMunicipality };
    
    // Use branchesRef to access current branches without causing re-execution
    const autoSelectedIds = calculateAutoSelection(
      jurisdiction,
      branchesRef.current,
      legislationState,
      legislationMunicipality
    );
    onSelectionChangeRef.current(autoSelectedIds);
  }, [hasInitialized, jurisdiction, legislationState, legislationMunicipality]);

  const handleToggleBranch = (branchId: string) => {
    if (selectedBranchIds.includes(branchId)) {
      onSelectionChange(selectedBranchIds.filter(id => id !== branchId));
    } else {
      onSelectionChange([...selectedBranchIds, branchId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(branches.map(b => b.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  // Group branches by state for better visualization
  const branchesByState = useMemo(() => {
    const grouped: Record<string, Branch[]> = {};
    branches.forEach(branch => {
      const state = branch.state || 'Não definido';
      if (!grouped[state]) {
        grouped[state] = [];
      }
      grouped[state].push(branch);
    });
    return grouped;
  }, [branches]);

  const getJurisdictionInfo = () => {
    switch (jurisdiction) {
      case 'federal':
        return { text: 'Legislação Federal: aplica-se a todas as filiais do Brasil', color: 'bg-blue-500/10 text-blue-700' };
      case 'nbr':
        return { text: 'Norma NBR: aplica-se a todas as unidades', color: 'bg-purple-500/10 text-purple-700' };
      case 'internacional':
        return { text: 'Norma Internacional: aplica-se a todas as unidades', color: 'bg-green-500/10 text-green-700' };
      case 'estadual':
        return { text: `Legislação Estadual${legislationState ? ` (${legislationState})` : ''}: filiais do estado foram pré-selecionadas`, color: 'bg-amber-500/10 text-amber-700' };
      case 'municipal':
        return { text: `Legislação Municipal${legislationMunicipality ? ` (${legislationMunicipality}/${legislationState})` : ''}: filiais do município foram pré-selecionadas`, color: 'bg-orange-500/10 text-orange-700' };
      default:
        return { text: 'Selecione as filiais aplicáveis', color: 'bg-muted text-muted-foreground' };
    }
  };

  const jurisdictionInfo = getJurisdictionInfo();

  if (branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Aplicação por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma filial cadastrada. Cadastre filiais em <strong>Configurações → Configuração Organizacional</strong> para poder vincular legislações às unidades.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Aplicação por Unidade
        </CardTitle>
        <CardDescription>
          Selecione as filiais onde esta legislação se aplica. A seleção será usada para criar avaliações de conformidade individuais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Jurisdiction Info */}
        <div className={`p-3 rounded-lg flex items-center gap-2 ${jurisdictionInfo.color}`}>
          <Info className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{jurisdictionInfo.text}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
              Selecionar Todas
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
              Desmarcar Todas
            </Button>
          </div>
          <Badge variant="secondary">
            {selectedBranchIds.length} de {branches.length} selecionadas
          </Badge>
        </div>

        {/* Branches grouped by state */}
        <div className="space-y-4">
          {Object.entries(branchesByState).map(([state, stateBranches]) => (
            <div key={state} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {state}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stateBranches.map((branch) => {
                  const isSelected = selectedBranchIds.includes(branch.id);
                  return (
                    <div
                      key={branch.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${isSelected 
                          ? 'bg-primary/5 border-primary' 
                          : 'bg-card hover:bg-muted/50'
                        }
                      `}
                      onClick={() => handleToggleBranch(branch.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleBranch(branch.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{branch.name}</span>
                          {branch.is_headquarters && (
                            <Badge variant="secondary" className="text-xs">Matriz</Badge>
                          )}
                        </div>
                        {branch.city && (
                          <span className="text-xs text-muted-foreground">
                            {branch.city}{branch.state ? ` - ${branch.state}` : ''}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
