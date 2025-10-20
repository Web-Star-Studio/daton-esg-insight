import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { type IntegratedReport } from '@/services/integratedReports';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useReportExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (report: IntegratedReport) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Capa
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(report.report_title, pageWidth / 2, 40, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Período: ${format(new Date(report.reporting_period_start), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(report.reporting_period_end), 'dd/MM/yyyy', { locale: ptBR })}`,
        pageWidth / 2,
        60,
        { align: 'center' }
      );

      // Scores ESG
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Scores ESG', 20, 20);

      const scoresData = [
        ['Categoria', 'Score'],
        ['Ambiental', `${report.environmental_score || 0}%`],
        ['Social', `${report.social_score || 0}%`],
        ['Governança', `${report.governance_score || 0}%`],
        ['Score Geral', `${report.overall_esg_score || 0}%`],
      ];

      autoTable(doc, {
        head: [scoresData[0]],
        body: scoresData.slice(1),
        startY: 30,
        theme: 'grid',
      });

      // Content sections
      if (report.content) {
        const content = report.content;

        // Executive Summary
        if (content.executive_summary) {
          doc.addPage();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Sumário Executivo', 20, 20);
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          let yPos = 35;
          
          if (content.executive_summary.key_highlights) {
            content.executive_summary.key_highlights.forEach((highlight: string) => {
              doc.text(`• ${highlight}`, 20, yPos);
              yPos += 8;
            });
          }
        }

        // Environmental
        if (content.environmental) {
          doc.addPage();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Performance Ambiental', 20, 20);

          const envData = [
            ['Métrica', 'Valor'],
            ['Emissões Totais', `${content.environmental.total_emissions?.toFixed(2) || 0} tCO2e`],
            ['Fontes de Emissão', `${content.environmental.emission_sources || 0}`],
            ['Iniciativas de Redução', `${content.environmental.reduction_initiatives || 0}`],
          ];

          autoTable(doc, {
            head: [envData[0]],
            body: envData.slice(1),
            startY: 30,
          });
        }

        // Social
        if (content.social) {
          doc.addPage();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Performance Social', 20, 20);

          const socialData = [
            ['Métrica', 'Valor'],
            ['Total de Funcionários', `${content.social.total_employees || 0}`],
            ['Incidentes de Segurança', `${content.social.safety_incidents || 0}`],
            ['Projetos Sociais', `${content.social.social_projects || 0}`],
          ];

          autoTable(doc, {
            head: [socialData[0]],
            body: socialData.slice(1),
            startY: 30,
          });
        }

        // Governance
        if (content.governance) {
          doc.addPage();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Governança', 20, 20);

          const govData = [
            ['Métrica', 'Valor'],
            ['Total de Riscos', `${content.governance.total_risks || 0}`],
            ['Riscos Críticos', `${content.governance.critical_risks || 0}`],
          ];

          autoTable(doc, {
            head: [govData[0]],
            body: govData.slice(1),
            startY: 30,
          });
        }
      }

      // Rodapé em todas as páginas
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`${report.report_title}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (report: IntegratedReport) => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Aba: Sumário
      const summaryData = [
        ['Relatório ESG Integrado'],
        [''],
        ['Título', report.report_title],
        ['Tipo', report.report_type],
        ['Período Início', format(new Date(report.reporting_period_start), 'dd/MM/yyyy', { locale: ptBR })],
        ['Período Fim', format(new Date(report.reporting_period_end), 'dd/MM/yyyy', { locale: ptBR })],
        ['Framework', report.framework || 'N/A'],
        ['Status', report.status],
        [''],
        ['Scores ESG'],
        ['Categoria', 'Score (%)'],
        ['Ambiental', report.environmental_score || 0],
        ['Social', report.social_score || 0],
        ['Governança', report.governance_score || 0],
        ['Score Geral', report.overall_esg_score || 0],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sumário');

      // Aba: Dados Ambientais
      if (report.content?.environmental) {
        const env = report.content.environmental;
        const envData = [
          ['Performance Ambiental'],
          [''],
          ['Métrica', 'Valor'],
          ['Emissões Totais (tCO2e)', env.total_emissions || 0],
          ['Fontes de Emissão', env.emission_sources || 0],
          ['Iniciativas de Redução', env.reduction_initiatives || 0],
        ];
        const envSheet = XLSX.utils.aoa_to_sheet(envData);
        XLSX.utils.book_append_sheet(workbook, envSheet, 'Ambiental');
      }

      // Aba: Dados Sociais
      if (report.content?.social) {
        const social = report.content.social;
        const socialData = [
          ['Performance Social'],
          [''],
          ['Métrica', 'Valor'],
          ['Total de Funcionários', social.total_employees || 0],
          ['Incidentes de Segurança', social.safety_incidents || 0],
          ['Projetos Sociais', social.social_projects || 0],
          ['Horas de Treinamento', social.training_hours || 0],
        ];
        const socialSheet = XLSX.utils.aoa_to_sheet(socialData);
        XLSX.utils.book_append_sheet(workbook, socialSheet, 'Social');
      }

      // Aba: Governança
      if (report.content?.governance) {
        const gov = report.content.governance;
        const govData = [
          ['Governança'],
          [''],
          ['Métrica', 'Valor'],
          ['Total de Riscos', gov.total_risks || 0],
          ['Riscos Críticos', gov.critical_risks || 0],
          ['Políticas Revisadas', gov.policies_reviewed || 0],
        ];
        const govSheet = XLSX.utils.aoa_to_sheet(govData);
        XLSX.utils.book_append_sheet(workbook, govSheet, 'Governança');
      }

      XLSX.writeFile(workbook, `${report.report_title}.xlsx`);
      toast.success('Excel exportado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao exportar Excel: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF,
    exportToExcel,
    isExporting,
  };
}
