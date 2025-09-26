import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Share, Calendar, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificationData {
  id: string;
  employeeName: string;
  employeeCode: string;
  programName: string;
  category: string;
  completionDate: string;
  score: number;
  duration: number;
  instructor: string;
  validUntil?: string;
}

interface TrainingCertificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification?: CertificationData | null;
}

export function TrainingCertificationModal({ 
  open, 
  onOpenChange, 
  certification 
}: TrainingCertificationModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!certification) return null;

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
      pdf.save(`certificado-${certification.employeeName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = (score: number) => {
    if (score >= 8) return 'Excelente';
    if (score >= 6) return 'Aprovado';
    return 'Reprovado';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Certificado de Treinamento
          </DialogTitle>
          <DialogDescription>
            Certificado de conclusão do treinamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Preview */}
          <div 
            ref={certificateRef}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-8 relative overflow-hidden"
            style={{ minHeight: '500px' }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5">
              <div className="absolute top-4 left-4 w-32 h-32 border-4 border-blue-300 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-24 h-24 border-4 border-blue-300 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-300 rounded-full"></div>
            </div>

            {/* Certificate content */}
            <div className="relative z-10 text-center space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex justify-center mb-4">
                  <Award className="w-16 h-16 text-yellow-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  CERTIFICADO DE CONCLUSÃO
                </h1>
                <p className="text-lg text-gray-600">
                  Programa de Treinamento
                </p>
              </div>

              {/* Main content */}
              <div className="space-y-6 py-6">
                <p className="text-lg text-gray-700">
                  Certificamos que
                </p>
                
                <h2 className="text-4xl font-bold text-blue-800 py-2 border-b-2 border-blue-300 inline-block">
                  {certification.employeeName}
                </h2>
                
                <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                  concluiu com sucesso o programa de treinamento
                </p>
                
                <h3 className="text-2xl font-semibold text-gray-800 px-4 py-2 bg-white rounded-lg shadow-sm inline-block">
                  {certification.programName}
                </h3>
                
                <div className="grid grid-cols-2 gap-8 max-w-md mx-auto text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Categoria:</p>
                    <p className="font-semibold text-gray-800">{certification.category}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Carga Horária:</p>
                    <p className="font-semibold text-gray-800">{certification.duration}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Nota Final:</p>
                    <p className="font-semibold text-gray-800">{certification.score.toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Instrutor:</p>
                    <p className="font-semibold text-gray-800">{certification.instructor}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-8 border-t border-blue-200 space-y-4">
                <p className="text-sm text-gray-600">
                  Emitido em {format(new Date(certification.completionDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                {certification.validUntil && (
                  <p className="text-sm text-gray-600">
                    Válido até {format(new Date(certification.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
                
                <div className="flex justify-center items-center gap-8 pt-4">
                  <div className="text-center border-t border-gray-400 pt-2 px-8">
                    <p className="text-sm font-semibold">Departamento de RH</p>
                  </div>
                  <div className="text-center border-t border-gray-400 pt-2 px-8">
                    <p className="text-sm font-semibold">Coordenação de Treinamentos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações do Funcionário
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{certification.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matrícula:</span>
                  <span className="font-medium">{certification.employeeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(certification.score)}>
                    {getStatusText(certification.score)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Detalhes do Treinamento
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Programa:</span>
                  <span className="font-medium">{certification.programName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-medium">{certification.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">{certification.duration}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nota Final:</span>
                  <span className="font-medium">{certification.score.toFixed(1)}/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? "Gerando PDF..." : "Baixar PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}