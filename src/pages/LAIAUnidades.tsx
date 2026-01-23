import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranches } from "@/services/branches";
import { useLAIABranchStats } from "@/hooks/useLAIA";
import { LAIAUnidadesFilters } from "@/components/laia/LAIAUnidadesFilters";
import { 
  Building2, 
  Leaf, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  MapPin
} from "lucide-react";

export default function LAIAUnidades() {
  const navigate = useNavigate();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: branchStats, isLoading: statsLoading } = useLAIABranchStats();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "headquarters" | "branch">("all");
  const [sortBy, setSortBy] = useState<"name" | "total" | "criticos" | "significativos">("name");
  const [quickFilter, setQuickFilter] = useState<"criticos" | "sem_aspectos" | null>(null);

  const isLoading = branchesLoading || statsLoading;

  const getStatsForBranch = (branchId: string) => {
    return branchStats?.find(s => s.branch_id === branchId) || {
      total: 0,
      criticos: 0,
      significativos: 0,
      nao_significativos: 0
    };
  };

  const activeBranches = branches?.filter(b => b.status === 'Ativo') || [];

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    return [...new Set(activeBranches.map(b => b.city).filter(Boolean) as string[])].sort();
  }, [activeBranches]);

  // Filter and sort logic
  const filteredBranches = useMemo(() => {
    let result = activeBranches;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(term) ||
        b.city?.toLowerCase().includes(term)
      );
    }

    // City filter
    if (cityFilter && cityFilter !== "all") {
      result = result.filter(b => b.city === cityFilter);
    }

    // Type filter
    if (typeFilter === "headquarters") {
      result = result.filter(b => b.is_headquarters);
    } else if (typeFilter === "branch") {
      result = result.filter(b => !b.is_headquarters);
    }

    // Quick filters
    if (quickFilter === "criticos") {
      result = result.filter(b => getStatsForBranch(b.id).criticos > 0);
    } else if (quickFilter === "sem_aspectos") {
      result = result.filter(b => getStatsForBranch(b.id).total === 0);
    }

    // Sorting
    result = [...result].sort((a, b) => {
      const statsA = getStatsForBranch(a.id);
      const statsB = getStatsForBranch(b.id);

      switch (sortBy) {
        case "total":
          return statsB.total - statsA.total;
        case "criticos":
          return statsB.criticos - statsA.criticos;
        case "significativos":
          return statsB.significativos - statsA.significativos;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [activeBranches, searchTerm, cityFilter, typeFilter, sortBy, quickFilter, branchStats]);

  const hasActiveFilters = searchTerm !== "" || 
    cityFilter !== "all" || 
    typeFilter !== "all" || 
    quickFilter !== null;

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("all");
    setTypeFilter("all");
    setQuickFilter(null);
    setSortBy("name");
  };

  return (
    <>
      <Helmet>
        <title>LAIA - Unidades | Plataforma Daton</title>
        <meta 
          name="description" 
          content="Selecione uma unidade para gerenciar aspectos e impactos ambientais" 
        />
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            LAIA - Aspectos e Impactos Ambientais
          </h1>
          <p className="text-muted-foreground">
            Selecione uma unidade para gerenciar o levantamento e avaliação dos aspectos ambientais
          </p>
        </div>

        {/* Filters */}
        {!isLoading && activeBranches.length > 0 && (
          <LAIAUnidadesFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            cities={uniqueCities}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            stats={{ total: activeBranches.length, filtered: filteredBranches.length }}
            onQuickFilter={setQuickFilter}
            activeQuickFilter={quickFilter}
          />
        )}

        {/* Branch Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeBranches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma unidade cadastrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre suas filiais para começar a gerenciar os aspectos ambientais
              </p>
              <Button onClick={() => navigate("/configuracao-organizacional")}>
                Ir para Configuração
              </Button>
            </CardContent>
          </Card>
        ) : filteredBranches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma unidade encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar os filtros para encontrar unidades
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBranches.map((branch) => {
              const stats = getStatsForBranch(branch.id);
              
              return (
                <Card 
                  key={branch.id} 
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
                  onClick={() => navigate(`/laia/unidade/${branch.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                      </div>
                      {branch.is_headquarters && (
                        <Badge variant="secondary">Matriz</Badge>
                      )}
                    </div>
                    {(branch.city || branch.state) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[branch.city, branch.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                        <Leaf className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{stats.total}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-2xl font-bold text-red-600">{stats.criticos}</p>
                          <p className="text-xs text-muted-foreground">Críticos</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-2xl font-bold text-amber-600">{stats.significativos}</p>
                          <p className="text-xs text-muted-foreground">Significativos</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-green-600">{stats.nao_significativos}</p>
                          <p className="text-xs text-muted-foreground">Não Signif.</p>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end text-sm text-primary group-hover:translate-x-1 transition-transform">
                      <span>Ver detalhes</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
