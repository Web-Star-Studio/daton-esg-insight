/**
 * ExportButtons - Botões de exportação do relatório
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AuditReportData, ReportsService } from "@/services/audit/reports";
import { Download, FileSpreadsheet, FileText, FileJson, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonsProps {
  reportData: AuditReportData;
}

export function ExportButtons({ reportData }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const exportToExcel = async () => {
    setExporting('excel');
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Relatório de Auditoria'],
        [],
        ['Título', reportData.audit.title],
        ['Tipo', reportData.audit.audit_type],
        ['Status', reportData.audit.status],
        ['Data Início', reportData.audit.start_date || 'N/A'],
        ['Data Fim', reportData.audit.end_date || 'N/A'],
        ['Auditor Líder', reportData.audit.lead_auditor || 'N/A'],
        [],
        ['Pontuação'],
        ['Nota', reportData.scoring?.grade || 'N/A'],
        ['Percentual', `${reportData.scoring?.percentage?.toFixed(1) || 0}%`],
        ['Total de Itens', reportData.scoring?.total_items || 0],
        ['Conforme', reportData.scoring?.conforming_items || 0],
        ['Não Conforme', reportData.scoring?.non_conforming_items || 0],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo');

      // Sessions sheet
      const sessionsData = [
        ['Nome', 'Data', 'Status', 'Progresso', 'Total', 'Respondidos'],
        ...reportData.sessions.map(s => [
          s.name,
          s.scheduled_date || 'N/A',
          s.status,
          `${s.progress.toFixed(0)}%`,
          s.total_items,
          s.responded_items
        ])
      ];
      const sessionsSheet = XLSX.utils.aoa_to_sheet(sessionsData);
      XLSX.utils.book_append_sheet(wb, sessionsSheet, 'Sessões');

      // Occurrences sheet
      const occurrencesData = [
        ['Título', 'Tipo', 'Status', 'Prioridade', 'Descrição', 'Prazo'],
        ...reportData.occurrences.map(o => [
          o.title,
          ReportsService.getOccurrenceTypeLabel(o.occurrence_type),
          ReportsService.getStatusLabel(o.status),
          o.priority ? ReportsService.getPriorityLabel(o.priority) : 'N/A',
          o.description,
          o.due_date || 'N/A'
        ])
      ];
      const occurrencesSheet = XLSX.utils.aoa_to_sheet(occurrencesData);
      XLSX.utils.book_append_sheet(wb, occurrencesSheet, 'Ocorrências');

      XLSX.writeFile(wb, `auditoria_${reportData.audit.title.replace(/\s+/g, '_')}.xlsx`);
      toast({ title: "Relatório exportado para Excel" });
    } catch (error) {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = async () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Relatório de Auditoria', 14, 20);
      
      doc.setFontSize(12);
      doc.text(reportData.audit.title, 14, 30);
      
      // Summary info
      doc.setFontSize(10);
      let y = 45;
      doc.text(`Tipo: ${reportData.audit.audit_type}`, 14, y);
      doc.text(`Status: ${reportData.audit.status}`, 14, y + 6);
      doc.text(`Período: ${reportData.audit.start_date || 'N/A'} - ${reportData.audit.end_date || 'N/A'}`, 14, y + 12);
      doc.text(`Auditor: ${reportData.audit.lead_auditor || 'N/A'}`, 14, y + 18);
      
      // Scoring
      y = 75;
      doc.setFontSize(14);
      doc.text('Pontuação', 14, y);
      doc.setFontSize(10);
      doc.text(`Nota: ${reportData.scoring?.grade || 'N/A'}`, 14, y + 10);
      doc.text(`Percentual: ${reportData.scoring?.percentage?.toFixed(1) || 0}%`, 14, y + 16);
      doc.text(`Itens Conformes: ${reportData.scoring?.conforming_items || 0}`, 14, y + 22);
      doc.text(`Itens Não Conformes: ${reportData.scoring?.non_conforming_items || 0}`, 14, y + 28);

      // Sessions table
      if (reportData.sessions.length > 0) {
        doc.setFontSize(14);
        doc.text('Sessões', 14, y + 45);
        
        autoTable(doc, {
          startY: y + 50,
          head: [['Nome', 'Data', 'Status', 'Progresso']],
          body: reportData.sessions.map(s => [
            s.name,
            s.scheduled_date || 'N/A',
            s.status,
            `${s.progress.toFixed(0)}%`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
      }

      // Occurrences table
      if (reportData.occurrences.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || y + 80;
        doc.setFontSize(14);
        doc.text('Ocorrências', 14, finalY + 15);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Título', 'Tipo', 'Status', 'Prazo']],
          body: reportData.occurrences.map(o => [
            o.title,
            ReportsService.getOccurrenceTypeLabel(o.occurrence_type),
            ReportsService.getStatusLabel(o.status),
            o.due_date || 'N/A'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Gerado em: ${new Date().toLocaleString('pt-BR')} | Página ${i} de ${pageCount}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`auditoria_${reportData.audit.title.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Relatório exportado para PDF" });
    } catch (error) {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const exportToJSON = () => {
    setExporting('json');
    try {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_${reportData.audit.title.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Relatório exportado para JSON" });
    } catch (error) {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!!exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
