import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDashboardContent } from "@/components/forms/FormDashboard";
import { ROUTE_PATHS } from "@/constants/routePaths";

export default function FormDashboardPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  if (!formId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">ID do formulário não encontrado.</p>
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTE_PATHS.DATA.CUSTOM_FORMS)}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Formulários
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTE_PATHS.DATA.CUSTOM_FORMS)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Formulários
        </Button>
      </div>

      {/* Dashboard Content */}
      <FormDashboardContent formId={formId} />
    </div>
  );
}
