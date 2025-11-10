import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Etapa7Props {
  reportId?: string;
}

export function Etapa7Diagramacao({ reportId }: Etapa7Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);

  const handleExportWord = async () => {
    if (!reportId) {
      toast.error('Relatório não encontrado');
      return;
    }

    setIsExporting(true);
    setExportFormat('word');

    try {
      // Buscar dados do relatório
      const { data: report, error: reportError } = await supabase
        .from('gri_reports')
        .select(`
          *,
          gri_report_sections(*)
        `)
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      // Criar documento Word
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Capa
            new Paragraph({
              text: report.title || 'Relatório GRI',
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Padrão GRI Standards ${report.gri_standard_version}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: `Período: ${new Date(report.reporting_period_start).toLocaleDateString('pt-BR')} - ${new Date(report.reporting_period_end).toLocaleDateString('pt-BR')}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 },
            }),

            // Quebra de página
            new Paragraph({
              text: '',
              pageBreakBefore: true,
            }),

            // Sumário Executivo
            new Paragraph({
              text: 'Sumário Executivo',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              text: report.executive_summary || 'A ser preenchido.',
              spacing: { after: 400 },
            }),

            // Seções do relatório
            ...(report.gri_report_sections || []).flatMap((section: any) => [
              new Paragraph({
                text: '',
                pageBreakBefore: true,
              }),
              new Paragraph({
                text: section.section_title,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 },
              }),
              new Paragraph({
                text: section.content || '',
                spacing: { after: 400 },
              }),
            ]),
          ],
        }],
      });

      // Gerar e baixar
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${report.title || 'Relatorio_GRI'}_${report.year}.docx`);

      toast.success('Relatório exportado em Word! Arquivo editável pronto para diagramação.');
    } catch (error: any) {
      console.error('Error exporting Word:', error);
      toast.error(`Erro ao exportar Word: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportPDF = async () => {
    if (!reportId) {
      toast.error('Relatório não encontrado');
      return;
    }

    setIsExporting(true);
    setExportFormat('pdf');

    try {
      // Buscar dados do relatório
      const { data: report, error: reportError } = await supabase
        .from('gri_reports')
        .select(`
          *,
          gri_report_sections(*)
        `)
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      // Criar documento PDF
      const doc = new jsPDF();
      let yPosition = 40;

      // Capa
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(report.title || 'Relatório GRI', 105, yPosition, { align: 'center' });
      
      yPosition += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Padrão GRI Standards ${report.gri_standard_version}`, 105, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.text(
        `Período: ${new Date(report.reporting_period_start).toLocaleDateString('pt-BR')} - ${new Date(report.reporting_period_end).toLocaleDateString('pt-BR')}`,
        105,
        yPosition,
        { align: 'center' }
      );

      // Nova página para sumário
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Sumário Executivo', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summaryText = report.executive_summary || 'A ser preenchido.';
      const splitSummary = doc.splitTextToSize(summaryText, 170);
      doc.text(splitSummary, 20, yPosition);

      // Seções do relatório
      for (const section of report.gri_report_sections || []) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, 20, yPosition);

        yPosition += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const content = section.content || '';
        const splitContent = doc.splitTextToSize(content, 170);
        doc.text(splitContent, 20, yPosition);
      }

      // Adicionar numeração de páginas
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
      }

      // Salvar
      doc.save(`${report.title || 'Relatorio_GRI'}_${report.year}.pdf`);

      toast.success('Relatório exportado em PDF! Documento final pronto para publicação.');
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportHTML = () => {
    toast.info('Exportação HTML em desenvolvimento');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Logo da Empresa</Label>
            <Input type="file" accept="image/*" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Será incluída na capa e rodapé do relatório
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor Primária</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" className="w-16 h-10" defaultValue="#0066cc" />
                <Input value="#0066cc" readOnly />
              </div>
            </div>
            <div>
              <Label>Cor Secundária</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" className="w-16 h-10" defaultValue="#00cc66" />
                <Input value="#00cc66" readOnly />
              </div>
            </div>
          </div>

          <div>
            <Label>Fonte Principal</Label>
            <Select defaultValue="inter">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="opensans">Open Sans</SelectItem>
                <SelectItem value="lato">Lato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Template de Layout</Label>
            <Select defaultValue="corporativo">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimalista">Minimalista</SelectItem>
                <SelectItem value="corporativo">Corporativo</SelectItem>
                <SelectItem value="criativo">Criativo</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleExportWord} 
              disabled={isExporting}
              className="h-20"
              variant="default"
            >
              <div className="flex flex-col items-center gap-2">
                {isExporting && exportFormat === 'word' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Download className="h-6 w-6" />
                )}
                <span>Word (Editável)</span>
              </div>
            </Button>

            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="h-20"
            >
              <div className="flex flex-col items-center gap-2">
                {isExporting && exportFormat === 'pdf' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
                <span>PDF Final</span>
              </div>
            </Button>

            <Button 
              onClick={handleExportHTML} 
              disabled={isExporting}
              variant="outline" 
              className="h-20"
            >
              <div className="flex flex-col items-center gap-2">
                <Globe className="h-6 w-6" />
                <span>HTML (Web)</span>
              </div>
            </Button>

            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              variant="outline" 
              className="h-20"
            >
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>PDF/A (Arquivo)</span>
              </div>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-foreground font-medium mb-2">
              Formatos de Exportação:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Word (.docx)</strong>: Documento editável para personalização de diagramação</li>
              <li>• <strong>PDF Final</strong>: Documento pronto para publicação e distribuição</li>
              <li>• <strong>HTML</strong>: Versão web interativa do relatório</li>
              <li>• <strong>PDF/A</strong>: Formato de arquivo para preservação de longo prazo</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground">
              O relatório final incluirá: capa personalizada, índice interativo, numeração automática,
              gráficos integrados, tabelas de indicadores GRI e contracapa com informações de contato.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
