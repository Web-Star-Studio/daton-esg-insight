import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, 
  TrendingUp, 
  Star, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  BarChart3,
  Activity,
  Shield,
  Leaf,
  FileBarChart
} from "lucide-react";
import { intelligentReportingService, type SmartReportTemplate } from "@/services/intelligentReporting";
import { useQuery } from "@tanstack/react-query";

interface SmartTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  selectedTemplateId?: string;
}

const CATEGORY_ICONS = {
  esg: Leaf,
  quality: CheckCircle2,
  compliance: Shield,
  emissions: Activity,
  governance: BarChart3,
};

const CATEGORY_LABELS = {
  esg: 'ESG',
  quality: 'Qualidade',
  compliance: 'Compliance',
  emissions: 'Emissões',
  governance: 'Governança',
};

export function SmartTemplateSelector({ onSelectTemplate, selectedTemplateId }: SmartTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"accuracy" | "insights" | "frequency">("accuracy");

  const { data: templates, isLoading } = useQuery({
    queryKey: ['smart-templates'],
    queryFn: () => intelligentReportingService.getSmartReportTemplates(),
  });

  const filteredTemplates = templates
    ?.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "accuracy") return b.accuracy_score - a.accuracy_score;
      if (sortBy === "insights") return b.insights_count - a.insights_count;
      return a.frequency.localeCompare(b.frequency);
    });

  const getFrequencyColor = (frequency: string) => {
    const colors = {
      daily: 'bg-purple-100 text-purple-800',
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-green-100 text-green-800',
      quarterly: 'bg-yellow-100 text-yellow-800',
      annual: 'bg-gray-100 text-gray-800',
    };
    return colors[frequency as keyof typeof colors] || colors.monthly;
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="esg">ESG</SelectItem>
                <SelectItem value="quality">Qualidade</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="emissions">Emissões</SelectItem>
                <SelectItem value="governance">Governança</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <TrendingUp className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accuracy">Maior Acurácia</SelectItem>
                <SelectItem value="insights">Mais Insights</SelectItem>
                <SelectItem value="frequency">Frequência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Carregando templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates?.map((template) => {
            const CategoryIcon = CATEGORY_ICONS[template.category];
            const isSelected = selectedTemplateId === template.id;

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      {template.ai_enhanced && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          IA
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Acurácia</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{template.accuracy_score}%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Insights</p>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        <span className="text-sm font-medium">{template.insights_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category & Frequency */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                    <Badge className={`text-xs ${getFrequencyColor(template.frequency)}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {getFrequencyLabel(template.frequency)}
                    </Badge>
                  </div>

                  {/* Data Sources */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Fontes de Dados:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.data_sources.slice(0, 3).map((source, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                      {template.data_sources.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.data_sources.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Selecionado
                      </>
                    ) : (
                      <>
                        <FileBarChart className="h-4 w-4 mr-2" />
                        Selecionar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredTemplates?.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mt-4">Nenhum template encontrado</p>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
        </div>
      )}
    </div>
  );
}