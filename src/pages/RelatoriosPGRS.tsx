import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, Eye, Calendar, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { unifiedToast } from "@/utils/unifiedToast";
import { downloadPGRSReport, getActivePGRSStatus } from "@/services/pgrsReports";

export default function RelatoriosPGRS() {
  const navigate = useNavigate();
  const [downloadingPlanId, setDownloadingPlanId] = useState<string | null>(null);

  // Buscar status do plano ativo
  const { data: activeStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["pgrs-active-status"],
    queryFn: getActivePGRSStatus,
  });

  // Buscar todos os planos PGRS
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ["pgrs-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pgrs_plans")
        .select(`
          *,
          pgrs_waste_sources(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDownloadReport = async (planId: string) => {
    setDownloadingPlanId(planId);
    try {
      const plan = plans?.find(p => p.id === planId);
      const filename = `PGRS_${plan?.plan_name?.replace(/\s+/g, '_') || 'Plano'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      const success = await downloadPGRSReport(planId, filename);
      
      if (success) {
        unifiedToast.success("Relatório gerado com sucesso!", {
          description: "O download do PDF foi iniciado."
        });
      } else {
        throw new Error("Falha ao gerar o relatório");
      }
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      unifiedToast.error("Erro ao gerar relatório", {
        description: "Não foi possível gerar o relatório PGRS. Tente novamente."
      });
    } finally {
      setDownloadingPlanId(null);
    }
  };

  const isLoading = loadingStatus || loadingPlans;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/residuos")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Relatórios PGRS</h1>
          </div>
          <p className="text-muted-foreground">
            Geração e download de relatórios do Plano de Gerenciamento de Resíduos Sólidos
          </p>
        </div>
      </div>

      {/* Plano Ativo - Destaque */}
      {activeStatus && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Plano Ativo: {activeStatus.plan_name}
                </CardTitle>
                <CardDescription>
                  Criado em {format(new Date(activeStatus.creation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </div>
              <Button
                onClick={() => handleDownloadReport(activeStatus.id)}
                disabled={downloadingPlanId === activeStatus.id}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {downloadingPlanId === activeStatus.id ? "Gerando..." : "Baixar Relatório"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <div className="p-2 bg-primary/10 rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fontes de Resíduos</p>
                  <p className="text-2xl font-bold">{activeStatus.sources_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <div className="p-2 bg-primary/10 rounded-md">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Procedimentos</p>
                  <p className="text-2xl font-bold">{activeStatus.procedures_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Metas</p>
                  <p className="text-2xl font-bold">{activeStatus.goals_count || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Todos os Planos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Histórico de Planos</h2>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Carregando planos...
              </div>
            </CardContent>
          </Card>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-4">
            {plans.map((plan) => {
              const isActive = plan.status === 'active';
              const sourcesCount = Array.isArray(plan.pgrs_waste_sources) 
                ? plan.pgrs_waste_sources.length 
                : 0;

              return (
                <Card key={plan.id} className={isActive ? 'border-primary/30' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {plan.plan_name}
                          {isActive && (
                            <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full">
                              Ativo
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(plan.creation_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span>{sourcesCount} fontes de resíduos</span>
                        </CardDescription>
                      </div>
                      <Button
                        variant={isActive ? "default" : "outline"}
                        onClick={() => handleDownloadReport(plan.id)}
                        disabled={downloadingPlanId === plan.id}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingPlanId === plan.id ? "Gerando..." : "Baixar PDF"}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum plano PGRS encontrado. Crie um plano na página de Gestão de Resíduos.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre os Relatórios PGRS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">O que está incluído no relatório:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Informações da empresa e caracterização</li>
              <li>Identificação completa de todas as fontes geradoras de resíduos</li>
              <li>Classificação e quantificação dos resíduos por tipo</li>
              <li>Procedimentos operacionais de segregação, acondicionamento e coleta</li>
              <li>Destinação final e transportadores autorizados</li>
              <li>Metas de redução e reciclagem estabelecidas</li>
              <li>Indicadores de desempenho do programa</li>
            </ul>
          </div>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Os relatórios são gerados em formato PDF de acordo com as exigências da Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
