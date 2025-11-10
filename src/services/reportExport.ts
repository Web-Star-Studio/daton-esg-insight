import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

interface ExportOptions {
  format: 'word' | 'pdf';
  includeVisuals: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
}

export async function exportReportToWord(
  reportId: string,
  sections: any[],
  options: ExportOptions
) {
  // Buscar informações do relatório
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(name)')
    .eq('id', reportId)
    .single();

  if (!report) throw new Error('Report not found');

  const companies = report.companies as any;
  const companyName = companies?.name || 'Empresa';
  const documentSections: any[] = [];

  // Capa
  if (options.includeCoverPage) {
    documentSections.push({
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      children: [
        new Paragraph({
          text: 'Relatório de Sustentabilidade',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { before: 2880, after: 240 },
        }),
        new Paragraph({
          text: companyName,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          text: `Ano: ${report.year}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
      ],
    });
  }

  // Sumário (simplificado)
  if (options.includeTableOfContents) {
    const tocChildren = [
      new Paragraph({
        text: 'Sumário',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 },
      }),
    ];

    sections.forEach((section, idx) => {
      tocChildren.push(
        new Paragraph({
          text: `${idx + 1}. ${section.template?.template_name || 'Seção'}`,
          spacing: { after: 120 },
        })
      );
    });

    documentSections.push({
      properties: {},
      children: tocChildren,
    });
  }

  // Seções do relatório
  for (const section of sections) {
    const sectionChildren: any[] = [
      new Paragraph({
        text: section.template?.template_name || 'Seção',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 240 },
      }),
    ];

    // Adicionar conteúdo textual
    if (section.generated_text) {
      const paragraphs = section.generated_text.split('\n\n');
      paragraphs.forEach((para: string) => {
        if (para.trim()) {
          // Detectar títulos markdown
          if (para.startsWith('## ')) {
            sectionChildren.push(
              new Paragraph({
                text: para.replace('## ', ''),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
              })
            );
          } else if (para.startsWith('### ')) {
            sectionChildren.push(
              new Paragraph({
                text: para.replace('### ', ''),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 120, after: 120 },
              })
            );
          } else {
            sectionChildren.push(
              new Paragraph({
                text: para.replace(/\*\*/g, ''),
                spacing: { after: 120 },
              })
            );
          }
        }
      });
    }

    // Adicionar visuais (como tabelas de dados)
    if (options.includeVisuals && section.generated_visuals) {
      for (const visual of section.generated_visuals) {
        sectionChildren.push(
          new Paragraph({
            text: visual.title,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 },
          })
        );

        if (visual.type === 'table' && visual.data) {
          // Criar tabela no Word
          const tableRows: TableRow[] = [];
          
          // Header
          if (visual.config?.columns) {
            tableRows.push(
              new TableRow({
                children: visual.config.columns.map((col: string) =>
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: col, bold: true })]
                    })],
                    shading: { fill: 'E0E0E0' },
                  })
                ),
              })
            );
          }

          // Data rows
          visual.data.forEach((row: any) => {
            if (visual.config?.columns) {
              tableRows.push(
                new TableRow({
                  children: visual.config.columns.map((col: string) =>
                    new TableCell({
                      children: [new Paragraph({ text: String(row[col] || '') })],
                    })
                  ),
                })
              );
            }
          });

          sectionChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        } else {
          // Para gráficos, adicionar nota
          sectionChildren.push(
            new Paragraph({
              children: [new TextRun({ text: `[Gráfico: ${visual.title}]`, italics: true })],
              spacing: { after: 240 },
            })
          );
        }
      }
    }

    documentSections.push({
      properties: {},
      children: sectionChildren,
    });
  }

  const doc = new Document({
    sections: documentSections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `relatorio-sustentabilidade-${companyName}-${report.year}.docx`);
}

export async function exportReportToPDF(
  reportId: string,
  sections: any[],
  options: ExportOptions
) {
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(name)')
    .eq('id', reportId)
    .single();

  if (!report) throw new Error('Report not found');

  const companies = report.companies as any;
  const companyName = companies?.name || 'Empresa';
  const pdf = new jsPDF('p', 'mm', 'a4');
  let currentY = 20;

  // Capa
  if (options.includeCoverPage) {
    pdf.setFontSize(24);
    pdf.text('Relatório de Sustentabilidade', 105, 80, { align: 'center' });
    pdf.setFontSize(20);
    pdf.text(companyName, 105, 100, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(`Ano: ${report.year}`, 105, 120, { align: 'center' });
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 140, { align: 'center' });
    pdf.addPage();
    currentY = 20;
  }

  // Seções
  for (const section of sections) {
    // Título da seção
    pdf.setFontSize(18);
    pdf.text(section.template?.template_name || 'Seção', 20, currentY);
    currentY += 10;

    // Conteúdo
    if (section.generated_text) {
      pdf.setFontSize(11);
      const textLines = pdf.splitTextToSize(section.generated_text, 170);
      
      for (const line of textLines) {
        if (currentY > 270) {
          pdf.addPage();
          currentY = 20;
        }
        pdf.text(line, 20, currentY);
        currentY += 6;
      }
    }

    currentY += 10;

    // Nota sobre visuais
    if (options.includeVisuals && section.generated_visuals?.length > 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`[${section.generated_visuals.length} visuais disponíveis na versão digital]`, 20, currentY);
      pdf.setTextColor(0, 0, 0);
      currentY += 10;
    }

    // Nova página para próxima seção
    if (sections.indexOf(section) < sections.length - 1) {
      pdf.addPage();
      currentY = 20;
    }
  }

  pdf.save(`relatorio-sustentabilidade-${companyName}-${report.year}.pdf`);
}
