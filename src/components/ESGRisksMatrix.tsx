import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Edit, 
  Search, 
  Calendar,
  Shield,
  TrendingUp,
  Eye,
  Plus,
  Target
} from "lucide-react";
import { getESGRisks, getRiskMetrics, getRiskMatrix } from "@/services/esgRisks";

interface ESGRisksMatrixProps {
  onEditRisk: (risk: any) => void;
  onCreateRisk: () => void;
  onViewRisk?: (risk: any) => void;
}

export function ESGRisksMatrix({ onEditRisk, onCreateRisk, onViewRisk }: ESGRisksMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

  const { data: risks = [], isLoading } = useOptimizedQuery({
    queryKey: ['esg-risks'],
    queryFn: getESGRisks,
  });

  const { data: riskMetrics } = useOptimizedQuery({
    queryKey: ['risk-metrics'],
    queryFn: getRiskMetrics,
  });

  const { data: riskMatrix } = useOptimizedQuery({
    queryKey: ['risk-matrix'],
    queryFn: getRiskMatrix,
  });

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.risk_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.risk_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || risk.esg_category === filterCategory;
    const matchesLevel = filterLevel === "all" || risk.inherent_risk_level === filterLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Crítico': return 'bg-red-100 text-red-800 border-red-200';
      case 'Alto': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Médio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixo': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Muito Baixo': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Environmental': return 'bg-green-100 text-green-800 border-green-200';
      case 'Social': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Governance': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const needsReview = (nextReviewDate: string) => {
    if (!nextReviewDate) return false;
    return new Date(nextReviewDate) <= new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total de Riscos</p>
                <p className="text-2xl font-bold">{riskMetrics?.totalRisks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Riscos Críticos</p>
                <p className="text-2xl font-bold">{riskMetrics?.criticalRisks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Riscos Altos</p>
                <p className="text-2xl font-bold">{riskMetrics?.highRisks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Precisam Revisão</p>
                <p className="text-2xl font-bold">{riskMetrics?.risksNeedingReview || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Matriz de Riscos ESG
              </CardTitle>
              <CardDescription>
                Gerencie e monitore os riscos ESG da organização
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'matrix')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="matrix">Matriz</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onCreateRisk}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Risco
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar riscos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoria ESG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Environmental">Ambiental</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Governance">Governança</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Níveis</SelectItem>
                <SelectItem value="Crítico">Crítico</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Baixo">Baixo</SelectItem>
                <SelectItem value="Muito Baixo">Muito Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'matrix' && riskMatrix && (
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Probabilidade vs Impacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted text-left">Probabilidade / Impacto</th>
                    <th className="border p-2 bg-green-50 text-center">Baixo</th>
                    <th className="border p-2 bg-yellow-50 text-center">Médio</th>
                    <th className="border p-2 bg-red-50 text-center">Alto</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(riskMatrix).map(([probability, impacts]) => (
                    <tr key={probability}>
                      <td className="border p-2 font-medium bg-muted">{probability}</td>
                      {Object.entries(impacts).map(([impact, count]) => (
                        <td key={impact} className="border p-2 text-center">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">riscos</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risks List */}
      {viewMode === 'list' && (
        <div className="grid gap-4">
          {filteredRisks.map((risk) => (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{risk.risk_title}</h3>
                      <Badge className={getRiskLevelColor(risk.inherent_risk_level)}>
                        {risk.inherent_risk_level || 'Indefinido'}
                      </Badge>
                      <Badge className={getCategoryColor(risk.esg_category)}>
                        {risk.esg_category}
                      </Badge>
                      {needsReview(risk.next_review_date) && (
                        <Badge variant="destructive">
                          <Calendar className="w-3 h-3 mr-1" />
                          Revisão Vencida
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {risk.risk_description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Probabilidade:</span>
                        <Badge variant="outline" className={
                          risk.probability === 'Alta' ? 'border-red-200 text-red-700' :
                          risk.probability === 'Média' ? 'border-yellow-200 text-yellow-700' :
                          'border-green-200 text-green-700'
                        }>
                          {risk.probability}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Impacto:</span>
                        <Badge variant="outline" className={
                          risk.impact === 'Alto' ? 'border-red-200 text-red-700' :
                          risk.impact === 'Médio' ? 'border-yellow-200 text-yellow-700' :
                          'border-green-200 text-green-700'
                        }>
                          {risk.impact}
                        </Badge>
                      </div>
                    </div>
                    
                    {(risk.mitigation_actions || risk.control_measures) && (
                      <div className="space-y-2 text-sm">
                        {risk.mitigation_actions && (
                          <div>
                            <span className="font-medium text-muted-foreground">Ações de Mitigação: </span>
                            <span className="text-muted-foreground">{risk.mitigation_actions}</span>
                          </div>
                        )}
                        {risk.control_measures && (
                          <div>
                            <span className="font-medium text-muted-foreground">Controles: </span>
                            <span className="text-muted-foreground">{risk.control_measures}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {risk.review_frequency && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Frequência: {risk.review_frequency}
                        </div>
                      )}
                      
                      {risk.next_review_date && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Próxima revisão: {new Date(risk.next_review_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewRisk?.(risk)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRisk(risk)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredRisks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum risco encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategory !== "all" || filterLevel !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Cadastre o primeiro risco ESG"
                  }
                </p>
                {!searchTerm && filterCategory === "all" && filterLevel === "all" && (
                  <Button onClick={onCreateRisk}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Risco
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}