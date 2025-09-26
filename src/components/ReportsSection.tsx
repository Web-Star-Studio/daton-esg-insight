import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp, Users, Target } from "lucide-react";
import { generatePerformanceReport, generateCompetencyGapReport, generateGoalsReport, exportToCSV } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportsSectionProps {
  onGenerateReports: () => void;
}

export function ReportsSection({ onGenerateReports }: ReportsSectionProps) {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExportReport = async (reportType: string) => {
    setGeneratingReport(reportType);
    try {
      let data: any[] = [];
      let filename = "";

      switch (reportType) {
        case "performance":
          data = await generatePerformanceReport();
          filename = "relatorio_desempenho";
          break;
        case "competency":
          data = await generateCompetencyGapReport();
          filename = "relatorio_competencias";
          break;
        case "goals":
          data = await generateGoalsReport();
          filename = "relatorio_metas";
          break;
        default:
          throw new Error("Tipo de relatório inválido");
      }

      if (data.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum dado encontrado para gerar o relatório.",
          variant: "destructive",
        });
        return;
      }

      exportToCSV(data, filename);
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const reportTypes = [
    {
      id: "performance",
      title: "Relatório de Desempenho",
      description: "Avaliações de desempenho por funcionário e período",
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: "competency",
      title: "Relatório de Competências",
      description: "Análise de lacunas de competências organizacionais",
      icon: Users,
      color: "bg-green-100 text-green-800"
    },
    {
      id: "goals",
      title: "Relatório de Metas",
      description: "Acompanhamento do progresso das metas individuais",
      icon: Target,
      color: "bg-purple-100 text-purple-800"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Relatórios Disponíveis</h3>
          <p className="text-sm text-muted-foreground">
            Exporte dados de desempenho em formato CSV
          </p>
        </div>
        <Button onClick={onGenerateReports}>
          <Download className="h-4 w-4 mr-2" />
          Gerar Todos
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isGenerating = generatingReport === report.id;
          
          return (
            <Card key={report.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Badge className={report.color}>
                    Relatório
                  </Badge>
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-sm">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Última atualização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportReport(report.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                        Gerando...
                      </div>
                    ) : (
                      <>
                        <FileText className="h-3 w-3 mr-1" />
                        Exportar CSV
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações sobre Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <h4 className="font-medium mb-2">Formato dos Dados</h4>
              <p className="text-muted-foreground">
                Os relatórios são exportados em formato CSV, compatível com Excel e outras ferramentas de análise.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dados Incluídos</h4>
              <p className="text-muted-foreground">
                Incluem apenas dados do período selecionado e funcionários ativos na organização.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Atualização</h4>
              <p className="text-muted-foreground">
                Os dados são atualizados em tempo real conforme novas avaliações são concluídas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}