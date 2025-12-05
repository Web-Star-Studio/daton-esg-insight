import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrainingParticipant } from '@/services/trainingProgramParticipants';

interface AttendanceListOptions {
  programName: string;
  programDate?: string;
  instructor?: string;
  location?: string;
  participants: TrainingParticipant[];
}

export const generateAttendanceListPDF = ({
  programName,
  programDate,
  instructor,
  location,
  participants,
}: AttendanceListOptions): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTA DE PRESENÇA', pageWidth / 2, 20, { align: 'center' });
  
  // Program info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(programName, pageWidth / 2, 32, { align: 'center' });
  
  // Details section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 45;
  
  doc.text(`Data: ${programDate ? format(new Date(programDate), 'dd/MM/yyyy', { locale: ptBR }) : '____/____/________'}`, 14, yPos);
  yPos += 7;
  
  if (instructor) {
    doc.text(`Instrutor: ${instructor}`, 14, yPos);
    yPos += 7;
  }
  
  if (location) {
    doc.text(`Local: ${location}`, 14, yPos);
    yPos += 7;
  }
  
  doc.text(`Total de Participantes: ${participants.length}`, 14, yPos);
  yPos += 12;
  
  // Participants table
  const tableData = participants.map((p, index) => [
    (index + 1).toString(),
    p.employee_name,
    p.employee_code,
    p.department || '-',
    '', // Assinatura (empty for signature)
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Nome', 'Matrícula', 'Departamento', 'Assinatura']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35 },
      4: { cellWidth: 60 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      minCellHeight: 12,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Footer with signature lines
  const finalY = (doc as any).lastAutoTable.finalY + 25;
  
  if (finalY < doc.internal.pageSize.getHeight() - 50) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Instructor signature
    doc.line(14, finalY, 90, finalY);
    doc.text('Assinatura do Instrutor', 52, finalY + 5, { align: 'center' });
    
    // Date
    doc.line(120, finalY, 196, finalY);
    doc.text('Data', 158, finalY + 5, { align: 'center' });
  }
  
  // Generation timestamp
  const timestamp = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Gerado em: ${timestamp}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  
  // Download the PDF
  doc.save(`lista_presenca_${programName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};
