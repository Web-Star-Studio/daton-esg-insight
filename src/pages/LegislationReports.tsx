import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Globe, 
  Building2, 
  Bookmark,
  Loader2 
} from "lucide-react";
import { useLegislationReports } from "@/hooks/useLegislationReports";
import { useLegislationStats, useLegislationThemes } from "@/hooks/data/useLegislations";
import { 
  ApplicabilityPieChart, 
  StatusBarChart, 
  JurisdictionPieChart,
  ComplianceOverviewChart,
  AlertsSummaryCard 
} from "@/components/legislation/LegislationReportCharts";
import { LEGISLATION_REPORT_TEMPLATES, LegislationReportConfig } from "@/services/legislationReportExport";
import { Skeleton } from "@/components/ui/skeleton";

const LegislationReports: React.FC = () => {
  const navigate = useNavigate();
  const { generateReport, isGenerating } = useLegislationReports();
  const { data: stats, isLoading: isLoadingStats } = useLegislationStats();
  const { themes, isLoading: isLoadingThemes } = useLegislationThemes();
  
  const [activeTab, setActiveTab] = useState<'global' | 'unit' | 'theme'>('global');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'both'>('pdf');
  const [sections, setSections] = useState({
    summary: true,
    byApplicability: true,
    byStatus: true,
    byJurisdiction: true,
    alerts: true,
    detailedList: true,
  });

  const handleSectionChange = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGenerateReport = async () => {
    const config: LegislationReportConfig = {
      reportType: activeTab,
      format,
      themeId: activeTab === 'theme' ? selectedTheme : undefined,
      sections,
      includeCharts: true,
    };
    
    await generateReport(config);
  };

  const reportTypes = [
    {
      id: 'global' as const,
      icon: Globe,
      title: 'Relatório Global',
      description: 'Visão completa de todas as legislações',
    },
    {
      id: 'unit' as const,
      icon: Building2,
      title: 'Relatório por Unidade',
      description: 'Conformidade por filial/unidade',
    },
    {
      id: 'theme' as const,
      icon: Bookmark,
      title: 'Relatório por Tema',
      description: 'Análise por macrotema',
    },
  ];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Relatórios de Legislações | Licenciamento</title>
        <meta name="description" content="Gere relatórios detalhados de conformidade legal" />
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/licenciamento/legislacoes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Relatórios de Legislações
            </h1>
            <p className="text-muted-foreground mt-1">
              Gere relatórios detalhados em PDF ou Excel
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Report Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Relatório</CardTitle>
              <CardDescription>Selecione o tipo de relatório a gerar</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  {reportTypes.map(type => (
                    <TabsTrigger key={type.id} value={type.id} className="text-xs">
                      <type.icon className="h-4 w-4 mr-1" />
                      {type.id === 'global' ? 'Global' : type.id === 'unit' ? 'Unidade' : 'Tema'}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="global" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {LEGISLATION_REPORT_TEMPLATES.global.description}
                  </p>
                </TabsContent>
                
                <TabsContent value="unit" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {LEGISLATION_REPORT_TEMPLATES.unit.description}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    * Funcionalidade completa em desenvolvimento
                  </p>
                </TabsContent>
                
                <TabsContent value="theme" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {LEGISLATION_REPORT_TEMPLATES.theme.description}
                  </p>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os temas</SelectItem>
                      {themes?.map(theme => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Sections Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Seções do Relatório</CardTitle>
              <CardDescription>Selecione as seções a incluir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="summary" 
                  checked={sections.summary}
                  onCheckedChange={() => handleSectionChange('summary')}
                />
                <Label htmlFor="summary" className="text-sm cursor-pointer">
                  Resumo Executivo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="byApplicability" 
                  checked={sections.byApplicability}
                  onCheckedChange={() => handleSectionChange('byApplicability')}
                />
                <Label htmlFor="byApplicability" className="text-sm cursor-pointer">
                  Distribuição por Aplicabilidade
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="byStatus" 
                  checked={sections.byStatus}
                  onCheckedChange={() => handleSectionChange('byStatus')}
                />
                <Label htmlFor="byStatus" className="text-sm cursor-pointer">
                  Distribuição por Status
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="byJurisdiction" 
                  checked={sections.byJurisdiction}
                  onCheckedChange={() => handleSectionChange('byJurisdiction')}
                />
                <Label htmlFor="byJurisdiction" className="text-sm cursor-pointer">
                  Distribuição por Jurisdição
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="alerts" 
                  checked={sections.alerts}
                  onCheckedChange={() => handleSectionChange('alerts')}
                />
                <Label htmlFor="alerts" className="text-sm cursor-pointer">
                  Alertas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="detailedList" 
                  checked={sections.detailedList}
                  onCheckedChange={() => handleSectionChange('detailedList')}
                />
                <Label htmlFor="detailedList" className="text-sm cursor-pointer">
                  Lista Detalhada
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Formato de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="text-sm cursor-pointer">PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="text-sm cursor-pointer">Excel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="text-sm cursor-pointer">Ambos (PDF + Excel)</Label>
                </div>
              </RadioGroup>
              
              <Separator className="my-4" />
              
              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prévia do Relatório</CardTitle>
              <CardDescription>
                Visualização dos dados que serão incluídos no relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[280px]" />
                  ))}
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Reais</p>
                        <p className="text-2xl font-bold text-pink-600">{stats.byApplicability.real}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Conformes</p>
                        <p className="text-2xl font-bold text-green-600">{stats.byStatus.conforme}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Alertas</p>
                        <p className={`text-2xl font-bold ${stats.alerts > 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {stats.alerts}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sections.byApplicability && <ApplicabilityPieChart stats={stats} />}
                    {sections.byStatus && <StatusBarChart stats={stats} />}
                    {sections.byJurisdiction && <JurisdictionPieChart stats={stats} />}
                    {sections.summary && <ComplianceOverviewChart stats={stats} />}
                  </div>

                  {sections.alerts && <AlertsSummaryCard stats={stats} />}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegislationReports;
