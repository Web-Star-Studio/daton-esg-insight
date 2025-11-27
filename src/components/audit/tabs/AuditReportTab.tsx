import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface AuditReportTabProps {
  audit: any;
}

export function AuditReportTab({ audit }: AuditReportTabProps) {
  const [generating, setGenerating] = useState(false);

  const { data: findings } = useQuery({
    queryKey: ['audit-findings', audit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', audit.id)
        .order('severity', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['audit-areas', audit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_area_assignments')
        .select('*, area:audit_areas(*)')
        .eq('audit_id', audit.id);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: checklistResponses } = useQuery({
    queryKey: ['checklist-responses', audit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_checklist_responses')
        .select('*')
        .eq('audit_id', audit.id);
      
      if (error) throw error;
      return data || [];
    },
  });

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.text("RELATÓRIO DE AUDITORIA", 105, yPosition, { align: "center" });
      yPosition += 15;

      // Audit Info
      doc.setFontSize(12);
      doc.text(`Título: ${audit.title}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Tipo: ${audit.audit_type === 'internal' ? 'Interna' : audit.audit_type === 'external' ? 'Externa' : audit.audit_type}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Status: ${audit.status}`, 20, yPosition);
      yPosition += 7;
      
      if (audit.start_date) {
        doc.text(`Período: ${format(new Date(audit.start_date), 'dd/MM/yyyy', { locale: ptBR })} a ${audit.end_date ? format(new Date(audit.end_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Em andamento'}`, 20, yPosition);
        yPosition += 7;
      }
      
      if (audit.auditor) {
        doc.text(`Auditor: ${audit.auditor}`, 20, yPosition);
        yPosition += 10;
      }

      // Executive Summary
      doc.setFontSize(14);
      doc.text("Sumário Executivo", 20, yPosition);
      yPosition += 10;

      const conformityRate = checklistResponses 
        ? ((checklistResponses.filter(r => r.response === 'conforming').length / checklistResponses.length) * 100).toFixed(1)
        : '0';

      doc.setFontSize(11);
      doc.text(`Total de Achados: ${findings?.length || 0}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Taxa de Conformidade: ${conformityRate}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Áreas Auditadas: ${areas?.length || 0}`, 20, yPosition);
      yPosition += 12;

      // Findings by Severity
      if (findings && findings.length > 0) {
        doc.setFontSize(14);
        doc.text("Achados por Severidade", 20, yPosition);
        yPosition += 10;

        const severityCounts = {
          critical: findings.filter(f => f.severity === 'critical').length,
          major: findings.filter(f => f.severity === 'major').length,
          minor: findings.filter(f => f.severity === 'minor').length,
          observation: findings.filter(f => f.severity === 'observation').length,
        };

        autoTable(doc, {
          startY: yPosition,
          head: [['Severidade', 'Quantidade']],
          body: [
            ['Crítico', severityCounts.critical.toString()],
            ['Maior', severityCounts.major.toString()],
            ['Menor', severityCounts.minor.toString()],
            ['Observação', severityCounts.observation.toString()],
          ],
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;

        // Detailed Findings
        doc.addPage();
        yPosition = 20;
        doc.setFontSize(14);
        doc.text("Achados Detalhados", 20, yPosition);
        yPosition += 10;

        autoTable(doc, {
          startY: yPosition,
          head: [['Descrição', 'Severidade', 'Status']],
          body: findings.map(f => [
            f.description,
            f.severity === 'critical' ? 'Crítico' : f.severity === 'major' ? 'Maior' : f.severity === 'minor' ? 'Menor' : 'Observação',
            f.status === 'open' ? 'Aberto' : f.status === 'in_progress' ? 'Em Andamento' : f.status === 'resolved' ? 'Resolvido' : 'Fechado'
          ]),
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
          },
        });
      }

      // Save PDF
      const fileName = `Auditoria_${audit.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Relatório gerado",
        description: "O PDF foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Relatório de Auditoria</h3>
          <p className="text-sm text-muted-foreground">
            Gere e exporte o relatório final da auditoria
          </p>
        </div>
        <Button onClick={generatePDF} disabled={generating}>
          <Download className="mr-2 h-4 w-4" />
          {generating ? "Gerando..." : "Exportar PDF"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Conteúdo do Relatório</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Informações gerais da auditoria</li>
              <li>Sumário executivo com KPIs</li>
              <li>Achados organizados por severidade</li>
              <li>Lista detalhada de não conformidades</li>
              <li>Status das ações corretivas</li>
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total de Achados</p>
              <p className="text-2xl font-bold">{findings?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Áreas Auditadas</p>
              <p className="text-2xl font-bold">{areas?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Respostas Checklist</p>
              <p className="text-2xl font-bold">{checklistResponses?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
