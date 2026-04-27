import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Wand2, AlertTriangle } from "lucide-react";
import { Branch } from "@/services/branches";
import { findBranchForInstanciaHint, findBestMatch } from "./UnitMappingStep";

// Map explícito: nome-base do arquivo (lowercase, sem extensão) → code da
// filial-alvo. Cobre os casos conhecidos das planilhas regionais sem coluna
// de unidade. Match é validado contra o universo real de filiais ativas.
const FILE_TO_BRANCH_HINT: Record<string, string> = {
  pr: 'SJP',
  gocarr: 'GO-CARREGAMENTO',
  es: 'CARIACICA',
};

export interface SingleBranchTarget {
  branchId: string;
  branchName: string;
  branchCode?: string | null;
  state?: string | null;
  city?: string | null;
  autoMatched: boolean;
}

interface SingleBranchMappingStepProps {
  fileName: string;
  rowCount: number;
  branches: Branch[];
  target: SingleBranchTarget | null;
  onTargetChange: (target: SingleBranchTarget | null) => void;
}

// Resolve a filial-alvo automaticamente a partir do nome do arquivo.
// Sequência: hint manual conhecido (pr→SJP), depois findBestMatch genérico
// contra o nome-base do arquivo (cobre casos novos com nomes auto-explicativos).
export function autoMatchSingleBranch(fileName: string, branches: Branch[]): Branch | null {
  if (!fileName) return null;
  const baseName = fileName.replace(/\.[^.]+$/, '').toLowerCase().trim();

  // Tenta hint conhecido primeiro
  const hintCode = FILE_TO_BRANCH_HINT[baseName];
  if (hintCode) {
    const byHint = findBestMatch(hintCode, branches) || findBranchForInstanciaHint(hintCode, branches);
    if (byHint) return byHint;
  }

  // Fallback: bate o nome do arquivo direto
  const direct = findBestMatch(baseName.toUpperCase(), branches)
    || findBranchForInstanciaHint(baseName, branches);
  return direct;
}

export function SingleBranchMappingStep({
  fileName,
  rowCount,
  branches,
  target,
  onTargetChange,
}: SingleBranchMappingStepProps) {
  const activeBranches = useMemo(
    () => branches.filter(b => b.status === 'Ativa' || b.status === 'Ativo'),
    [branches]
  );

  const handleSelect = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) {
      onTargetChange(null);
      return;
    }
    onTargetChange({
      branchId: branch.id,
      branchName: branch.code ? `${branch.code} - ${branch.name}` : branch.name,
      branchCode: branch.code,
      state: branch.state,
      city: branch.city,
      autoMatched: false,
    });
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          A planilha <strong>{fileName}</strong> não tem colunas por unidade.
          Todas as <strong>{rowCount} legislações</strong> serão aplicadas em uma única filial.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Filial de destino</Label>
          {target?.autoMatched && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Wand2 className="h-3 w-3 mr-1" />
              auto-detectada
            </Badge>
          )}
        </div>

        <Select value={target?.branchId || ''} onValueChange={handleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar filial..." />
          </SelectTrigger>
          <SelectContent className="bg-background">
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
          </SelectContent>
        </Select>

        {target && (
          <div className="text-sm text-muted-foreground">
            UF: <strong className="text-foreground">{target.state || '—'}</strong>
            {' · '}
            Município: <strong className="text-foreground">{target.city || '—'}</strong>
          </div>
        )}

        {!target && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
            <AlertTriangle className="h-4 w-4" />
            Selecione a filial antes de continuar.
          </div>
        )}
      </div>

      <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
        Cada linha da planilha vai gerar uma avaliação de compliance nessa filial usando
        os campos <code className="bg-muted px-1 rounded">APLICABILIDADE</code> e
        {' '}<code className="bg-muted px-1 rounded">ATENDIMENTO</code> (ou STATUS).
      </div>
    </div>
  );
}
