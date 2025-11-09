import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Audit, AuditFinding } from '@/services/audit';

export const useAuditReportExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportAuditReportToPDF = async (
    audits: Audit[],
    findings: AuditFinding[],
    stats: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
    }
  ) => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();
      let yPosition = 20;

      // Capa
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Consolidado de Auditorias', 105, yPosition, { align: 'center' });
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 105, yPosition, { align: 'center' });
      
      yPosition += 20;

      // Estatísticas Gerais
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Estatísticas Gerais', 14, yPosition);
      yPosition += 10;

      const statsData = [
        ['Total de Auditorias', stats.total.toString()],
        ['Concluídas', `${stats.byStatus['Concluída'] || 0} (${Math.round((stats.byStatus['Concluída'] || 0) / stats.total * 100)}%)`],
        ['Em Andamento', `${stats.byStatus['Em Andamento'] || 0} (${Math.round((stats.byStatus['Em Andamento'] || 0) / stats.total * 100)}%)`],
        ['Planejadas', `${stats.byStatus['Planejada'] || 0} (${Math.round((stats.byStatus['Planejada'] || 0) / stats.total * 100)}%)`],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Distribuição por Tipo
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Tipo', 14, yPosition);
      yPosition += 10;

      const typeData = Object.entries(stats.byType).map(([type, count]) => [
        type,
        count.toString(),
        `${Math.round((count / stats.total) * 100)}%`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Tipo', 'Quantidade', 'Percentual']],
        body: typeData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Lista de Auditorias
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Lista de Auditorias', 14, yPosition);
      yPosition += 10;

      const auditData = audits.map(audit => [
        audit.title || 'Sem título',
        audit.audit_type || '-',
        audit.status || '-',
        audit.created_at ? format(new Date(audit.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Título', 'Tipo', 'Status', 'Data de Criação']],
        body: auditData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
      });

      // Achados de Auditoria (se houver)
      if (findings.length > 0) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Achados de Auditoria', 14, yPosition);
        yPosition += 10;

        const findingsData = findings.map(finding => [
          finding.description?.substring(0, 40) || '-',
          finding.severity || '-',
          finding.status || '-',
          finding.profiles?.full_name || 'Não atribuído',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Descrição', 'Severidade', 'Status', 'Responsável']],
          body: findingsData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
        });
      }

      // Rodapé com numeração
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Salvar PDF
      doc.save(`relatorio-auditorias-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportAuditReportToPDF,
    isExporting,
  };
};
