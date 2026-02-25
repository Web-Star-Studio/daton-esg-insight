import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLAIASectors, useLAIAAssessments } from "@/hooks/useLAIA";
import { useBranches } from "@/services/branches";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Filter,
  X,
} from "lucide-react";
import {
  TEMPORALITY_OPTIONS,
  OPERATIONAL_SITUATION_OPTIONS,
  INCIDENCE_OPTIONS,
  IMPACT_CLASS_OPTIONS,
  getCategoryColor,
  getSignificanceColor,
} from "@/types/laia";
import type { LAIAAssessment } from "@/types/laia";

export default function LAIASectorDetailPage() {
  const { branchId, sectorId } = useParams<{ branchId: string; sectorId: string }>();
  const navigate = useNavigate();

  const { data: sectors, isLoading: loadingSectors } = useLAIASectors(branchId);
  const { data: branches } = useBranches();
  const { data: assessments, isLoading: loadingAssessments } = useLAIAAssessments({
    branch_id: branchId,
    sector_id: sectorId,
  });

  const [temporality, setTemporality] = useState<string>("");
  const [operationalSituation, setOperationalSituation] = useState<string>("");
  const [incidence, setIncidence] = useState<string>("");
  const [impactClass, setImpactClass] = useState<string>("");

  const sector = sectors?.find((s) => s.id === sectorId);
  const branch = branches?.find((b) => b.id === branchId);

  const filtered = useMemo(() => {
    if (!assessments) return [];
    return assessments.filter((a) => {
      if (temporality && a.temporality !== temporality) return false;
      if (operationalSituation && a.operational_situation !== operationalSituation) return false;
      if (incidence && a.incidence !== incidence) return false;
      if (impactClass && a.impact_class !== impactClass) return false;
      return true;
    });
  }, [assessments, temporality, operationalSituation, incidence, impactClass]);

  const stats = useMemo(() => {
    const all = assessments ?? [];
    return {
      total: all.length,
      criticos: all.filter((a) => a.category === "critico").length,
      significativos: all.filter((a) => a.significance === "significativo").length,
      nao_significativos: all.filter((a) => a.significance === "nao_significativo").length,
    };
  }, [assessments]);

  const hasFilters = temporality || operationalSituation || incidence || impactClass;

  const clearFilters = () => {
    setTemporality("");
    setOperationalSituation("");
    setIncidence("");
    setImpactClass("");
  };

  if (loadingSectors || loadingAssessments) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Setor não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(`/laia/unidade/${branchId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/laia")} className="hover:text-foreground transition-colors">
          LAIA
        </button>
        <span>/</span>
        <button onClick={() => navigate(`/laia/unidade/${branchId}`)} className="hover:text-foreground transition-colors">
          {branch?.code || branch?.name || "Unidade"}
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{sector.code}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/laia/unidade/${branchId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{sector.code} - {sector.name}</h1>
            {sector.description && (
              <p className="text-muted-foreground mt-1">{sector.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.criticos}</p>
                <p className="text-xs text-muted-foreground">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.significativos}</p>
                <p className="text-xs text-muted-foreground">Significativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.nao_significativos}</p>
                <p className="text-xs text-muted-foreground">Não Significativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Temporalidade</label>
              <Select value={temporality} onValueChange={setTemporality}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPORALITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Situação Operacional</label>
              <Select value={operationalSituation} onValueChange={setOperationalSituation}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONAL_SITUATION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Incidência</label>
              <Select value={incidence} onValueChange={setIncidence}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Classe de Impacto</label>
              <Select value={impactClass} onValueChange={setImpactClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_CLASS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Avaliações {hasFilters ? `(${filtered.length} de ${stats.total})` : `(${stats.total})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Aspecto</TableHead>
                    <TableHead>Impacto</TableHead>
                    <TableHead className="text-center">Pont.</TableHead>
                    <TableHead className="text-center">Categoria</TableHead>
                    <TableHead className="text-center">Significância</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.aspect_code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{a.activity_operation}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{a.environmental_aspect}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{a.environmental_impact}</TableCell>
                      <TableCell className="text-center font-medium">{a.total_score}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getCategoryColor(a.category)}>
                          {a.category === "critico" ? "Crítico" : a.category === "moderado" ? "Moderado" : "Desprezível"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getSignificanceColor(a.significance)}>
                          {a.significance === "significativo" ? "Significativo" : "Não Significativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Activity className="mb-3 h-10 w-10" />
              <p>{hasFilters ? "Nenhuma avaliação corresponde aos filtros." : "Nenhuma avaliação cadastrada neste setor."}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
