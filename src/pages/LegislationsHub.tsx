import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Scale, ArrowLeft, FileText, ClipboardList, Upload } from "lucide-react";
import { LegislationImportDialog } from "@/components/legislation/LegislationImportDialog";
import { LegislationKPIs } from "@/components/legislation/LegislationKPIs";
import { LegislationDashboardCharts } from "@/components/legislation/LegislationDashboardCharts";
import { LegislationFilters } from "@/components/legislation/LegislationFilters";
import { LegislationList } from "@/components/legislation/LegislationList";
import { useLegislations } from "@/hooks/data/useLegislations";

const LegislationsHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    jurisdiction: "",
    themeId: "",
    applicability: "",
    status: "",
  });

  // Combine tab filter with other filters
  const effectiveFilters = {
    ...filters,
    jurisdiction: activeTab !== "all" ? activeTab : filters.jurisdiction,
  };

  const { legislations, isLoading, deleteLegislation, refetch } = useLegislations(effectiveFilters);

  const handleClearFilters = () => {
    setFilters({
      search: "",
      jurisdiction: "",
      themeId: "",
      applicability: "",
      status: "",
    });
  };

  const handleKpiClick = (filter: { applicability?: string; status?: string; type?: string }) => {
    if (filter.type === "all") {
      handleClearFilters();
    } else if (filter.type === "alerts") {
      navigate('/licenciamento/legislacoes/alertas');
      return;
    } else if (filter.type === "pending") {
      setFilters(prev => ({
        ...prev,
        applicability: "",
        status: "pendente",
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        applicability: filter.applicability || "",
        status: filter.status || "",
      }));
    }
    
    // Scroll para a tabela de legislações
    setTimeout(() => {
      document.getElementById('legislations-table')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Gestão de Legislações | Licenciamento</title>
        <meta name="description" content="Gestão de conformidade legal e regulatória por unidade" />
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/licenciamento')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Scale className="h-8 w-8 text-primary" />
              Gestão de Legislações
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de conformidade legal por unidade
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>
          <Button variant="outline" onClick={() => navigate('/licenciamento/legislacoes/compliance')}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Questionário
          </Button>
          <Button variant="outline" onClick={() => navigate('/licenciamento/legislacoes/relatorios')}>
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button onClick={() => navigate('/licenciamento/legislacoes/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Legislação
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <LegislationKPIs onKpiClick={handleKpiClick} />

      {/* Dashboard Visual */}
      <LegislationDashboardCharts />

      {/* Main Content */}
      <Card id="legislations-table">
        <CardHeader className="pb-3">
          <CardTitle>Legislações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs by Jurisdiction */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="federal">Federal</TabsTrigger>
              <TabsTrigger value="estadual">Estadual</TabsTrigger>
              <TabsTrigger value="municipal">Municipal</TabsTrigger>
              <TabsTrigger value="nbr">NBR</TabsTrigger>
              <TabsTrigger value="internacional">Internacional</TabsTrigger>
            </TabsList>

            {/* Filters */}
            <LegislationFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />

            {/* Content */}
            <TabsContent value={activeTab} className="mt-4">
              <LegislationList
                legislations={legislations}
                isLoading={isLoading}
                onDelete={deleteLegislation}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <LegislationImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => refetch?.()}
      />
    </div>
  );
};

export default LegislationsHub;
