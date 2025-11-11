import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Share2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GRIReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

export const GRIReportExportModal: React.FC<GRIReportExportModalProps> = ({ isOpen, onClose, report }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<string>('');

  const handleExport = async (type: 'pdf' | 'html' | 'docx') => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: "A exportação completa está disponível na Etapa 5 do wizard após gerar as seções do relatório.",
      variant: "default",
    });
  };

  const handlePreview = async () => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: "A prévia completa está disponível na Etapa 5 do wizard após gerar as seções do relatório.",
      variant: "default",
    });
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/relatorio-publico/${report.id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Sucesso",
        description: "Link do relatório copiado para a área de transferência!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar link do relatório.",
        variant: "destructive",
      });
    }
  };

  const getCompletionStatus = () => {
    const percentage = report.completion_percentage || 0;
    
    if (percentage >= 100) {
      return { 
        icon: <CheckCircle className="h-5 w-5 text-green-600" />, 
        color: "text-green-600", 
        text: "Completo" 
      };
    } else if (percentage >= 70) {
      return { 
        icon: <Clock className="h-5 w-5 text-yellow-600" />, 
        color: "text-yellow-600", 
        text: "Quase Completo" 
      };
    } else {
      return { 
        icon: <AlertCircle className="h-5 w-5 text-red-600" />, 
        color: "text-red-600", 
        text: "Incompleto" 
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Prévia e Exportação - {report.title}
            {getCompletionStatus().icon}
          </DialogTitle>
          <DialogDescription>
            Visualize, exporte ou compartilhe seu relatório de sustentabilidade GRI em diferentes formatos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Status do Relatório
                <Badge variant={report.completion_percentage >= 70 ? "default" : "secondary"}>
                  {getCompletionStatus().text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso Geral</span>
                  <span>{Math.round(report.completion_percentage || 0)}%</span>
                </div>
                <Progress value={report.completion_percentage || 0} className="h-2" />
              </div>
              
              {report.completion_percentage < 70 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Para uma exportação completa, recomendamos finalizar todos os indicadores obrigatórios e seções principais.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Exportando {exportType.toUpperCase()}...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Preview and Share */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévia e Compartilhamento
                </CardTitle>
                <CardDescription>
                  Visualize o relatório online ou compartilhe com stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handlePreview}
                  disabled={isExporting}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Prévia Online
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleShare}
                  disabled={isExporting}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar Link
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                  disabled={isExporting}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </CardContent>
            </Card>

            {/* Downloads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloads
                </CardTitle>
                <CardDescription>
                  Baixe o relatório em diferentes formatos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleExport('docx')}
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Word
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleExport('html')}
                  disabled={isExporting}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
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
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Padrão GRI:</div>
                  <div className="text-muted-foreground">{report.gri_standard_version || 'GRI Standards'}</div>
                </div>
                <div>
                  <div className="font-medium">Período:</div>
                  <div className="text-muted-foreground">
                    {report.reporting_period_start} a {report.reporting_period_end}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Última Atualização:</div>
                  <div className="text-muted-foreground">
                    {new Date(report.updated_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Status:</div>
                  <div className="text-muted-foreground">{report.status || 'Rascunho'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};