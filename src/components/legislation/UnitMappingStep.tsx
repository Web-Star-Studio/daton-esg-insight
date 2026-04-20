import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, MapPin, AlertTriangle, Check, X, RefreshCw } from "lucide-react";
import { Branch } from "@/services/branches";

export interface UnitMapping {
  excelCode: string;
  branchId: string | null;
  branchName?: string;
  autoMatched: boolean;
  propagateState?: string;
  propagateBranchIds?: string[];
  propagateBranchNames?: string[];
}

interface UnitMappingStepProps {
  detectedUnits: string[];
  branches: Branch[];
  mappings: UnitMapping[];
  onMappingsChange: (mappings: UnitMapping[]) => void;
  onRedetect?: () => void;
}

// Siglas brasileiras válidas para detecção de colunas que representam um UF.
const UF_CODES = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

function activeBranchesIn(state: string, branches: Branch[]): Branch[] {
  const uf = state.toUpperCase().trim();
  return branches
    .filter(b => (b.status === 'Ativa' || b.status === 'Ativo') && b.state?.toUpperCase().trim() === uf)
    .sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name));
}

// Find best matching branch for a unit code.
// Ordem: code exato → name exato → prefixo de 3+ letras (DUC→DUQUE) →
// UF (pega primeira filial do estado alfabeticamente) → contains/city.
function findBestMatch(unitCode: string, branches: Branch[]): Branch | null {
  const normalized = unitCode.toUpperCase().trim();
  const active = branches.filter(b => b.status === 'Ativa' || b.status === 'Ativo');

  const exactCodeMatch = active.find(b => b.code?.toUpperCase().trim() === normalized);
  if (exactCodeMatch) return exactCodeMatch;

  const exactNameMatch = active.find(b => b.name.toUpperCase().trim() === normalized);
  if (exactNameMatch) return exactNameMatch;

  // Prefix match on code (ex.: DUC → DUQUE). Mínimo 3 chars para evitar falsos positivos.
  if (normalized.length >= 3) {
    const prefixMatch = active.find(b => {
      const code = b.code?.toUpperCase().trim() || '';
      return code.length >= normalized.length && code.startsWith(normalized);
    });
    if (prefixMatch) return prefixMatch;
  }

  // UF match: sigla é estado e existe filial nesse UF → pega a primeira alfabeticamente.
  if (UF_CODES.has(normalized)) {
    const inState = activeBranchesIn(normalized, active);
    if (inState.length > 0) return inState[0];
  }

  const containsCodeMatch = active.find(b =>
    b.code?.toUpperCase().includes(normalized) ||
    normalized.includes(b.code?.toUpperCase() || '')
  );
  if (containsCodeMatch) return containsCodeMatch;

  const containsMatch = active.find(b =>
    b.name.toUpperCase().includes(normalized) ||
    b.city?.toUpperCase().includes(normalized) ||
    normalized.includes(b.city?.toUpperCase() || '')
  );
  if (containsMatch) return containsMatch;

  return null;
}

// Prefixo especial usado no Select para identificar propagação por UF.
const STATE_PREFIX = 'state:';

export function UnitMappingStep({
  detectedUnits,
  branches,
  mappings,
  onMappingsChange,
  onRedetect,
}: UnitMappingStepProps) {
  const activeBranches = useMemo(() =>
    branches.filter(b => b.status === 'Ativa' || b.status === 'Ativo'),
    [branches]
  );

  // Estados que têm ao menos 1 filial ativa — oferecemos como opção de propagação.
  const statesWithBranches = useMemo(() => {
    const map = new Map<string, Branch[]>();
    for (const b of activeBranches) {
      const uf = b.state?.toUpperCase().trim();
      if (!uf) continue;
      if (!map.has(uf)) map.set(uf, []);
      map.get(uf)!.push(b);
    }
    return Array.from(map.entries())
      .map(([uf, list]) => ({
        uf,
        branches: list.sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name)),
      }))
      .sort((a, b) => a.uf.localeCompare(b.uf));
  }, [activeBranches]);

  const handleSelectChange = (excelCode: string, value: string) => {
    const newMappings = mappings.map(m => {
      if (m.excelCode !== excelCode) return m;

      if (value === 'ignore') {
        return {
          ...m,
          branchId: null,
          branchName: undefined,
          autoMatched: false,
          propagateState: undefined,
          propagateBranchIds: undefined,
          propagateBranchNames: undefined,
        };
      }

      if (value.startsWith(STATE_PREFIX)) {
        const uf = value.slice(STATE_PREFIX.length);
        const stateBranches = activeBranchesIn(uf, branches);
        return {
          ...m,
          branchId: null,
          branchName: undefined,
          autoMatched: false,
          propagateState: uf,
          propagateBranchIds: stateBranches.map(b => b.id),
          propagateBranchNames: stateBranches.map(b => (b.code ? `${b.code} - ${b.name}` : b.name)),
        };
      }

      const branch = branches.find(b => b.id === value) || null;
      return {
        ...m,
        branchId: value,
        branchName: branch ? (branch.code ? `${branch.code} - ${branch.name}` : branch.name) : undefined,
        autoMatched: false,
        propagateState: undefined,
        propagateBranchIds: undefined,
        propagateBranchNames: undefined,
      };
    });
    onMappingsChange(newMappings);
  };

  const selectValueFor = (m: UnitMapping): string => {
    if (m.propagateState) return `${STATE_PREFIX}${m.propagateState}`;
    if (m.branchId) return m.branchId;
    return 'ignore';
  };

  const mappedCount = mappings.filter(m => m.branchId || (m.propagateBranchIds && m.propagateBranchIds.length > 0)).length;
  const autoMatchedCount = mappings.filter(m => m.autoMatched && (m.branchId || m.propagateState)).length;
  const propagatedCount = mappings.filter(m => m.propagateState).length;

  return (
    <div className="space-y-4">
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Detectamos <strong>{detectedUnits.length} colunas de unidades</strong> na planilha.
          Vincule cada código a uma filial, ou escolha um estado para replicar a avaliação em todas as filiais daquele UF.
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
        {propagatedCount > 0 && (
          <Badge variant="secondary" className="py-1 px-3 bg-purple-100 text-purple-800">
            <MapPin className="h-3 w-3 mr-1" />
            {propagatedCount} propagando por UF
          </Badge>
        )}
        {mappedCount < detectedUnits.length && (
          <Badge variant="secondary" className="py-1 px-3 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {detectedUnits.length - mappedCount} não mapeadas
          </Badge>
        )}
        {onRedetect && (
          <Button variant="outline" size="sm" onClick={onRedetect}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-detectar
          </Button>
        )}
      </div>

      {/* Mapping table */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-4 space-y-3">
          {mappings.map((mapping) => {
            const propBranches = mapping.propagateBranchNames || [];
            return (
              <div
                key={mapping.excelCode}
                className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
              >
                <div className="w-[100px] flex-shrink-0">
                  <Label className="text-xs text-muted-foreground">Coluna Excel</Label>
                  <div className="font-mono font-semibold text-lg">
                    {mapping.excelCode}
                  </div>
                </div>

                <div className="text-muted-foreground">→</div>

                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Destino</Label>
                  <Select
                    value={selectValueFor(mapping)}
                    onValueChange={(value) => handleSelectChange(mapping.excelCode, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar destino..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="ignore">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <X className="h-4 w-4" />
                          Ignorar esta coluna
                        </div>
                      </SelectItem>

                      <SelectGroup>
                        <SelectLabel>Filiais</SelectLabel>
                        {activeBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{branch.code ? `${branch.code} - ${branch.name}` : branch.name}</span>
                              {branch.state && (
                                <Badge variant="outline" className="text-xs ml-1">
                                  {branch.state}
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
                      </SelectGroup>

                      {statesWithBranches.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Estados (todas as filiais do UF)</SelectLabel>
                          {statesWithBranches.map(({ uf, branches: list }) => (
                            <SelectItem key={uf} value={`${STATE_PREFIX}${uf}`}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>Estado {uf}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({list.length} {list.length === 1 ? 'filial' : 'filiais'})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                  {mapping.propagateState && propBranches.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aplicará em: {propBranches.join(', ')}
                    </p>
                  )}
                </div>

                <div className="w-[90px] flex-shrink-0 text-right">
                  {mapping.propagateState ? (
                    <Badge variant="default" className="bg-purple-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      UF {mapping.propagateState}
                    </Badge>
                  ) : mapping.branchId ? (
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
            );
          })}
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="p-3 bg-muted/30 rounded-lg text-sm">
        <p className="font-medium mb-2">Legenda dos valores na planilha:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-muted-foreground">
          <div><code className="bg-muted px-1 rounded">1</code> = N/A (Não Aplicável)</div>
          <div><code className="bg-muted px-1 rounded">2</code> = OK (Conforme)</div>
          <div><code className="bg-muted px-1 rounded">3</code> = Precisa de Plano de Ação</div>
          <div><code className="bg-muted px-1 rounded">x</code> = Sem Avaliação</div>
          <div><code className="bg-muted px-1 rounded">z</code> = Não Pertinente</div>
        </div>
      </div>
    </div>
  );
}

// Helper to create initial mappings from detected units.
// Auto-match (conservador — prefere single-branch a propagação):
//   1) filial exata (code/name)
//   2) filial por prefixo de sigla
//   3) se o code é sigla de UF → pega a primeira filial do UF (alfabética por code).
//      Propagação para "todas as filiais do UF" fica como opção manual no select.
//   4) fallback: contains/city
export function createInitialMappings(detectedUnits: string[], branches: Branch[]): UnitMapping[] {
  const active = branches.filter(b => b.status === 'Ativa' || b.status === 'Ativo');

  return detectedUnits.map(code => {
    const normalized = code.toUpperCase().trim();

    if (UF_CODES.has(normalized)) {
      const inState = activeBranchesIn(normalized, active);
      if (inState.length >= 1) {
        const b = inState[0];
        return {
          excelCode: code,
          branchId: b.id,
          branchName: b.code ? `${b.code} - ${b.name}` : b.name,
          autoMatched: true,
        };
      }
    }

    const bestMatch = findBestMatch(code, active);
    return {
      excelCode: code,
      branchId: bestMatch?.id || null,
      branchName: bestMatch ? (bestMatch.code ? `${bestMatch.code} - ${bestMatch.name}` : bestMatch.name) : undefined,
      autoMatched: !!bestMatch,
    };
  });
}
