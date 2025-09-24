import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Target, 
  FileText, 
  Bot,
  Lightbulb,
  BarChart3,
  Settings,
  Plus
} from "lucide-react";
import { GRIIndicatorManagementModal } from "@/components/GRIIndicatorManagementModal";
import { AutoFillDemoButton } from "@/components/AutoFillDemoButton";
import { GRIIndicatorDashboard } from "@/components/GRIIndicatorDashboard";
import { GRIEnvironmentalModule } from "@/components/GRIEnvironmentalModule";
import { GRISocialModule } from "@/components/GRISocialModule";
import { GRIGovernanceModule } from "@/components/GRIGovernanceModule";
import { GRIEconomicModule } from "@/components/GRIEconomicModule";
import { GRIAnalyticsModule } from "@/components/GRIAnalyticsModule";
import { getGRIIndicators, getGRIIndicatorData } from "@/services/griReports";
import { getIndicatorCompletionStats, getIndicatorsByCategory } from "@/services/griIndicators";

export default function IndicadoresGRI() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showManagementModal, setShowManagementModal] = useState(false);

  const { data: indicators = [], isLoading: indicatorsLoading } = useQuery({
    queryKey: ["gri-indicators"],
    queryFn: getGRIIndicators
  });

  const { data: completionStats, isLoading: statsLoading } = useQuery({
    queryKey: ["gri-completion-stats"],
    queryFn: getIndicatorCompletionStats
  });

  const { data: categorizedIndicators = {}, isLoading: categorizedLoading } = useQuery({
    queryKey: ["gri-indicators-by-category"],
    queryFn: getIndicatorsByCategory
  });

  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || (indicator as any).category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "Todos os Indicadores" },
    { value: "Universal", label: "Universais (GRI 2)" },
    { value: "Economic", label: "Econômicos (GRI 201-206)" },
    { value: "Environmental", label: "Ambientais (GRI 301-308)" },
    { value: "Social", label: "Sociais (GRI 401-418)" }
  ];

  if (indicatorsLoading || statsLoading || categorizedLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando indicadores GRI...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Indicadores GRI</h1>
          <p className="text-muted-foreground">
            Sistema inteligente de gestão de indicadores de sustentabilidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowManagementModal(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Gerenciar
          </Button>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{completionStats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total de Indicadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completionStats?.completed || 0}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{completionStats?.in_progress || 0}</p>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{completionStats?.completion_percentage || 0}%</p>
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
              </div>
            </div>
            <Progress value={completionStats?.completion_percentage || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar indicadores por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Badge
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="environmental">Ambiental</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="governance">Governança</TabsTrigger>
          <TabsTrigger value="economic">Econômico</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <GRIIndicatorDashboard 
            indicators={filteredIndicators}
            completionStats={completionStats}
            categorizedIndicators={categorizedIndicators}
          />
        </TabsContent>

        <TabsContent value="environmental" className="space-y-6">
          <GRIEnvironmentalModule />
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <GRISocialModule />
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <GRIGovernanceModule />
        </TabsContent>

        <TabsContent value="economic" className="space-y-6">
          <GRIEconomicModule />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <GRIAnalyticsModule 
            indicators={filteredIndicators}
            completionStats={completionStats}
            categorizedIndicators={categorizedIndicators}
          />
        </TabsContent>
      </Tabs>

      {/* Auto Fill Demo Section */}
      <AutoFillDemoButton 
        onUpdate={() => {
          toast({
            title: "Demonstração",
            description: "Esta é uma demonstração do auto preenchimento!",
          });
        }}
      />

      {/* Management Modal */}
      {showManagementModal && (
        <GRIIndicatorManagementModal
          isOpen={showManagementModal}
          onClose={() => setShowManagementModal(false)}
          indicators={indicators}
        />
      )}
    </>
  );
}