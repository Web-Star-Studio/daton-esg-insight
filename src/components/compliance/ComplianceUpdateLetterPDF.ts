// PDF da Carta de Atualização Mensal — replica o layout do SOGI usando
// jsPDF + jspdf-autotable (mesma stack do projeto, ver
// src/services/legislationReportExport.ts).

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LetterContent, SerializedLine } from "@/services/complianceUpdateLetters";
import { APPLICABILITY_LABELS, formatReferenceMonthLabel } from "@/lib/complianceSystems";

const SECTIONS: Array<{ key: keyof LetterContent["sections"]; title: string }> = [
  { key: "published", title: "Requisitos Publicados" },
  { key: "modified", title: "Requisitos Alterados" },
  { key: "excluded", title: "Requisitos Excluídos" },
  { key: "revoked", title: "Requisitos Revogados" },
  { key: "included_by_review", title: "Requisitos Incluídos por Revisão" },
];

function formatRow(line: SerializedLine): string[] {
  return [
    `${line.code}\n${line.title}`,
    line.summary || "—",
    APPLICABILITY_LABELS[line.applicability] ?? line.applicability,
    line.systems.join(", ") || "—",
    line.origin || "—",
    line.observation || "—",
    line.alterador || "—",
  ];
}

export function downloadComplianceUpdateLetterPDF(content: LetterContent, generatorName: string | null) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // UTC-safe: `format()` do date-fns resolve em timezone local. Em BRT
  // (UTC-3), uma data salva como "2026-05-01" UTC vira 30/04 local, e o
  // formatador devolve "abril" pra uma carta de maio. O helper abaixo faz
  // parsing manual e usa um array de meses, evitando a armadilha.
  const monthLabelCap = formatReferenceMonthLabel(content.reference_month, "/");

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Carta de Atualização", 14, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.text(monthLabelCap, pageWidth - 14, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  // Header inclui cidade quando disponível (espelha SOGI:
  // "TRANSPORTES GABARDO - Porto Alegre"). Cai pro nome puro se não tem.
  const locationParts = [content.unit_city, content.unit_state].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const headerLine = locationParts.length > 0
    ? `${content.unit_name.toUpperCase()} — ${locationParts.join(" / ")}`
    : content.unit_name.toUpperCase();
  doc.text(headerLine, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(9);
  doc.text("Prezados(as),", 14, 38);
  const intro = `Para efeito de atualização do mapa de requisitos legais e outros requisitos da unidade, informamos que no mês de ${monthLabelCap}, foram publicadas, alteradas, excluídas e revogadas as seguintes normas pertinentes ao sistema da empresa.`;
  const introLines = doc.splitTextToSize(intro, pageWidth - 28);
  doc.text(introLines, 14, 44);

  let yPos = 44 + introLines.length * 5 + 6;

  // Sumário executivo
  if (content.executive_summary) {
    if (yPos > 170) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Sumário Executivo", 14, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(content.executive_summary, pageWidth - 28);
    // Imprime linha a linha checando overflow. `splitTextToSize` só quebra
    // wrap horizontal; sem isso, sumário >25 linhas escapa pra fora da
    // página em vez de criar página nova.
    const lineHeight = 5;
    const bottomMargin = 195;
    for (const line of summaryLines) {
      if (yPos > bottomMargin) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 14, yPos);
      yPos += lineHeight;
    }
    yPos += 6;
  }

  // Cinco tabelas — replica formato SOGI: seções vazias não são impressas.
  // Se TODAS as cinco estiverem vazias, fica só o sumário executivo (que
  // o servidor já preenche com "Nenhuma mudança normativa registrada").
  for (const section of SECTIONS) {
    const lines = content.sections[section.key];
    if (lines.length === 0) continue;
    if (yPos > 170) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos + 2,
      head: [[
        "Requisito",
        "Sumário",
        "Aplicabilidade",
        "Sistemas",
        "Origem",
        "Justificativa/Observação",
        "Alterador",
      ]],
      body: lines.map(formatRow),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2, valign: "top" },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 60 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 25 },
        5: { cellWidth: 60 },
        6: { cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Footer em duas linhas (espelha SOGI):
  //   linha 1: Daton ESG Insight · Gerado em … · Por: Nome
  //   linha 2: numeração de página alinhada à direita
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const generatedAtLabel = format(new Date(content.generated_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
    const generatorSuffix = generatorName ? ` · Por: ${generatorName}` : "";
    const footerLeft = `Daton ESG Insight · Gerado em ${generatedAtLabel}${generatorSuffix}`;
    doc.text(footerLeft, 14, 200);
    doc.text(`${i} / ${pageCount}`, pageWidth - 14, 200, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  const fileName = `Carta_Atualizacao_${content.unit_name.replace(/\s+/g, "_")}_${content.reference_month}.pdf`;
  doc.save(fileName);
}
