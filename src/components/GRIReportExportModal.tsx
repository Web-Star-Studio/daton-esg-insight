import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Globe, 
  FileSpreadsheet, 
  Eye, 
  Printer,
  Mail,
  Share2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { GRIReport } from "@/services/griReports";
import { supabase } from "@/integrations/supabase/client";

interface GRIReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: GRIReport;
}

export function GRIReportExportModal({ isOpen, onClose, report }: GRIReportExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<string>('');

  const handleExport = async (type: 'pdf' | 'html' | 'docx') => {
    setIsExporting(true);
    setExportType(type);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { data, error } = await supabase.functions.invoke('gri-content-generator', {
        body: {
          action: 'export',
          reportId: report.id,
          format: type,
          includeMetadata: true,
          includeIndicators: true,
          includeSections: true
        }
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (error) throw error;

      // Simulate file download
      const blob = new Blob([data.content], { 
        type: type === 'pdf' ? 'application/pdf' : 
              type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              'text/html'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}_${report.year}.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Relatório exportado em ${type.toUpperCase()} com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório. Tente novamente.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportType('');
    }
  };

  const handlePreview = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gri-content-generator', {
        body: {
          action: 'preview',
          reportId: report.id
        }
      });

      if (error) throw error;

      // Open preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(data.content);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('Erro ao gerar prévia:', error);
      toast.error('Erro ao gerar prévia do relatório.');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/relatorio-publico/${report.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link do relatório copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar link do relatório.');
    }
  };

  const getCompletionStatus = () => {
    if (report.completion_percentage >= 100) {
      return { icon: CheckCircle2, color: "text-green-600", text: "Completo" };
    } else if (report.completion_percentage >= 70) {
      return { icon: AlertCircle, color: "text-yellow-600", text: "Quase Completo" };
    } else {
      return { icon: AlertCircle, color: "text-red-600", text: "Incompleto" };
    }
  };

  const status = getCompletionStatus();
  const StatusIcon = status.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Prévia e Exportação - {report.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status do Relatório</span>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${status.color}`} />
                  <Badge variant={report.completion_percentage >= 100 ? "default" : "secondary"}>
                    {status.text}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Progresso Geral</span>
                <span className="font-semibold">{report.completion_percentage}%</span>
              </div>
              <Progress value={report.completion_percentage} className="h-3" />
              
              {report.completion_percentage < 100 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Para uma exportação completa, recomendamos finalizar todos os indicadores obrigatórios e seções principais.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Exportando {exportType.toUpperCase()}...</span>
                    <span className="font-semibold">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévia e Compartilhamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handlePreview}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Globe className="h-4 w-4" />
                  Prévia Online
                </Button>
                
                <Button 
                  onClick={handleShare}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar Link
                </Button>
                
                <Button 
                  onClick={() => window.print()}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="w-full justify-start gap-2"
                  variant="default"
                >
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </Button>
                
                <Button 
                  onClick={() => handleExport('docx')}
                  disabled={isExporting}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar Word
                </Button>
                
                <Button 
                  onClick={() => handleExport('html')}
                  disabled={isExporting}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Globe className="h-4 w-4" />
                  Exportar HTML
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Report Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Padrão GRI:</span>
                  <p className="text-muted-foreground">{report.gri_standard_version}</p>
                </div>
                <div>
                  <span className="font-medium">Período:</span>
                  <p className="text-muted-foreground">
                    {report.reporting_period_start} a {report.reporting_period_end}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Última Atualização:</span>
                  <p className="text-muted-foreground">
                    {new Date(report.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-muted-foreground">{report.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}