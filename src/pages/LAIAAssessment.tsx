import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LAIADashboard } from "@/components/laia/LAIADashboard";
import { LAIASectorManager } from "@/components/laia/LAIASectorManager";
import { LAIAAssessmentTable } from "@/components/laia/LAIAAssessmentTable";
import { LAIAAssessmentForm } from "@/components/laia/LAIAAssessmentForm";
import { LAIAAssessmentDetail } from "@/components/laia/LAIAAssessmentDetail";
import { LAIAImportWizard } from "@/components/laia/LAIAImportWizard";
import { 
  Leaf, 
  Plus, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Building2,
  ArrowLeft,
  Upload
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LAIAAssessment } from "@/types/laia";

type ViewMode = "list" | "create" | "edit";

export default function LAIAAssessmentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedAssessment, setSelectedAssessment] = useState<LAIAAssessment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleView = (assessment: LAIAAssessment) => {
    setSelectedAssessment(assessment);
    setDetailOpen(true);
  };

  const handleEdit = (assessment: LAIAAssessment) => {
    setSelectedAssessment(assessment);
    setViewMode("edit");
    setActiveTab("assessments");
  };

  const handleCreateSuccess = () => {
    setViewMode("list");
    setActiveTab("assessments");
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <Helmet>
        <title>LAIA - Aspectos e Impactos Ambientais | Plataforma Daton</title>
        <meta 
          name="description" 
          content="Levantamento e Avaliação dos Aspectos e Impactos Ambientais" 
        />
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                LAIA
              </h1>
              <p className="text-sm text-muted-foreground">
                Levantamento e Avaliação dos Aspectos e Impactos Ambientais
              </p>
            </div>
          </div>

          {activeTab === "assessments" && viewMode === "list" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
              <Button onClick={() => setViewMode("create")}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Avaliação
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        {viewMode === "create" ? (
          <LAIAAssessmentForm 
            onSuccess={handleCreateSuccess}
            onCancel={() => setViewMode("list")}
          />
        ) : viewMode === "edit" && selectedAssessment ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Edição em desenvolvimento...</p>
            <Button variant="link" onClick={() => setViewMode("list")}>
              Voltar para lista
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="assessments" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Avaliações</span>
              </TabsTrigger>
              <TabsTrigger value="sectors" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Setores</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <LAIADashboard />
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              <LAIAAssessmentTable 
                onView={handleView}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="sectors" className="mt-6">
              <LAIASectorManager />
            </TabsContent>
          </Tabs>
        )}

        {/* Detail Sheet */}
        <LAIAAssessmentDetail
          assessment={selectedAssessment}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedAssessment(null);
          }}
          onEdit={handleEdit}
        />

        {/* Import Wizard */}
        <LAIAImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
        />
      </div>
    </>
  );
}
