import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LAIADashboard } from "@/components/laia/LAIADashboard";
import { LAIASectorManager } from "@/components/laia/LAIASectorManager";
import { LAIAAssessmentTable } from "@/components/laia/LAIAAssessmentTable";
import { LAIAAssessmentForm } from "@/components/laia/LAIAAssessmentForm";
import { LAIAAssessmentDetail } from "@/components/laia/LAIAAssessmentDetail";
import { LAIAImportWizard } from "@/components/laia/LAIAImportWizard";
import { useBranches } from "@/services/branches";
import { 
  Leaf, 
  Plus, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Building2,
  ArrowLeft,
  Upload,
  ChevronRight
} from "lucide-react";
import type { LAIAAssessment } from "@/types/laia";

type ViewMode = "list" | "create" | "edit";

export default function LAIAUnidadePage() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  
  const { data: branches, isLoading: branchLoading } = useBranches();
  const branch = branches?.find(b => b.id === branchId);

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

  if (branchLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unidade não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A unidade solicitada não existe ou foi removida.
          </p>
          <Button onClick={() => navigate("/laia")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para seleção de unidades
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>LAIA - {branch.name} | Plataforma Daton</title>
        <meta 
          name="description" 
          content={`Aspectos e Impactos Ambientais - ${branch.name}`} 
        />
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
              <Link 
                to="/laia" 
                className="hover:text-foreground transition-colors"
              >
                LAIA
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{branch.name}</span>
            </nav>
            
            {/* Title */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/laia")}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                  {branch.name}
                  {branch.is_headquarters && (
                    <Badge variant="secondary" className="ml-2">Matriz</Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Levantamento e Avaliação dos Aspectos e Impactos Ambientais
                </p>
              </div>
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
            branchId={branchId!}
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
              <LAIADashboard branchId={branchId} />
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              <LAIAAssessmentTable 
                branchId={branchId}
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
          branchId={branchId}
        />
      </div>
    </>
  );
}
