import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useBranches, Branch } from "@/services/branches";
import { Skeleton } from "@/components/ui/skeleton";

export interface UnitApplicability {
  branch_id: string;
  branch_name: string;
  branch_state: string | null;
  selected: boolean;
  applicability: 'real' | 'potential' | 'na' | 'pending';
  compliance_status: 'conforme' | 'para_conhecimento' | 'adequacao' | 'plano_acao' | 'pending';
}

interface LegislationUnitSelectorProps {
  jurisdiction: string;
  legislationState?: string;
  value: UnitApplicability[];
  onChange: (units: UnitApplicability[]) => void;
}

const applicabilityOptions = [
  { value: 'pending', label: 'Pendente', color: 'bg-muted text-muted-foreground' },
  { value: 'real', label: 'Real (Aplicável)', color: 'bg-green-500/10 text-green-600' },
  { value: 'potential', label: 'Potencial', color: 'bg-yellow-500/10 text-yellow-600' },
  { value: 'na', label: 'Não Aplicável', color: 'bg-red-500/10 text-red-600' },
];

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'conforme', label: 'Conforme' },
  { value: 'para_conhecimento', label: 'Para Conhecimento' },
  { value: 'adequacao', label: 'Em Adequação' },
  { value: 'plano_acao', label: 'Plano de Ação' },
];

export const LegislationUnitSelector: React.FC<LegislationUnitSelectorProps> = ({
  jurisdiction,
  legislationState,
  value,
  onChange,
}) => {
  const { data: branches, isLoading } = useBranches();
  const [bulkApplicability, setBulkApplicability] = useState<string>('real');

  // Initialize units when branches load
  useEffect(() => {
    if (branches && branches.length > 0 && value.length === 0) {
      const initialUnits: UnitApplicability[] = branches.map((branch: Branch) => {
        // For state legislations, pre-select branches in the same state
        const shouldPreSelect = jurisdiction === 'estadual' && legislationState
          ? branch.state?.toUpperCase() === legislationState.toUpperCase()
          : false;

        return {
          branch_id: branch.id,
          branch_name: branch.name,
          branch_state: branch.state || null,
          selected: shouldPreSelect,
          applicability: shouldPreSelect ? 'real' : 'pending',
          compliance_status: 'pending',
        };
      });
      onChange(initialUnits);
    }
  }, [branches, jurisdiction, legislationState]);

  // Update pre-selection when jurisdiction/state changes
  useEffect(() => {
    if (value.length > 0 && jurisdiction === 'estadual' && legislationState) {
      const updatedUnits = value.map(unit => ({
        ...unit,
        selected: unit.branch_state?.toUpperCase() === legislationState.toUpperCase(),
        applicability: unit.branch_state?.toUpperCase() === legislationState.toUpperCase() 
          ? 'real' as const 
          : 'pending' as const,
      }));
      onChange(updatedUnits);
    }
  }, [jurisdiction, legislationState]);

  const handleSelectAll = (checked: boolean) => {
    const updatedUnits = value.map(unit => ({
      ...unit,
      selected: checked,
      applicability: checked ? 'real' as const : 'pending' as const,
    }));
    onChange(updatedUnits);
  };

  const handleUnitSelect = (branchId: string, checked: boolean) => {
    const updatedUnits = value.map(unit => 
      unit.branch_id === branchId 
        ? { ...unit, selected: checked, applicability: checked ? 'real' as const : 'pending' as const }
        : unit
    );
    onChange(updatedUnits);
  };

  const handleApplicabilityChange = (branchId: string, applicability: UnitApplicability['applicability']) => {
    const updatedUnits = value.map(unit => 
      unit.branch_id === branchId 
        ? { ...unit, applicability, selected: applicability !== 'na' && applicability !== 'pending' }
        : unit
    );
    onChange(updatedUnits);
  };

  const handleStatusChange = (branchId: string, compliance_status: UnitApplicability['compliance_status']) => {
    const updatedUnits = value.map(unit => 
      unit.branch_id === branchId 
        ? { ...unit, compliance_status }
        : unit
    );
    onChange(updatedUnits);
  };

  const applyBulkApplicability = () => {
    const selectedIds = value.filter(u => u.selected).map(u => u.branch_id);
    const updatedUnits = value.map(unit => 
      selectedIds.includes(unit.branch_id)
        ? { ...unit, applicability: bulkApplicability as UnitApplicability['applicability'] }
        : unit
    );
    onChange(updatedUnits);
  };

  const selectedCount = value.filter(u => u.selected).length;
  const applicableCount = value.filter(u => u.applicability === 'real' || u.applicability === 'potential').length;
  const allSelected = value.length > 0 && selectedCount === value.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Aplicabilidade por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Aplicabilidade por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma unidade cadastrada.</p>
            <p className="text-sm">Cadastre unidades/filiais para definir aplicabilidade.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Aplicabilidade por Unidade
        </CardTitle>
        <CardDescription>
          {jurisdiction === 'federal' 
            ? 'Legislações federais são nacionais, mas podem ter aplicação diferenciada por estado. Selecione as unidades onde esta legislação é aplicável.'
            : jurisdiction === 'estadual'
            ? 'Unidades no mesmo estado foram pré-selecionadas. Ajuste conforme necessário.'
            : 'Defina a aplicabilidade desta legislação para cada unidade.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Selecionar todas
            </label>
          </div>
          
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Aplicar às selecionadas:</span>
              <Select value={bulkApplicability} onValueChange={setBulkApplicability}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {applicabilityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="secondary" onClick={applyBulkApplicability}>
                Aplicar
              </Button>
            </div>
          )}
        </div>

        {/* Unit List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {value.map((unit) => (
            <div 
              key={unit.branch_id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                unit.selected ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
              }`}
            >
              <Checkbox
                checked={unit.selected}
                onCheckedChange={(checked) => handleUnitSelect(unit.branch_id, checked as boolean)}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{unit.branch_name}</span>
                  {unit.branch_state && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <MapPin className="h-3 w-3 mr-1" />
                      {unit.branch_state}
                    </Badge>
                  )}
                </div>
              </div>

              <Select 
                value={unit.applicability} 
                onValueChange={(val) => handleApplicabilityChange(unit.branch_id, val as UnitApplicability['applicability'])}
              >
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {applicabilityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(unit.applicability === 'real' || unit.applicability === 'potential') && (
                <Select 
                  value={unit.compliance_status} 
                  onValueChange={(val) => handleStatusChange(unit.branch_id, val as UnitApplicability['compliance_status'])}
                >
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 pt-4 border-t text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{applicableCount}</strong> unidades com legislação aplicável
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
