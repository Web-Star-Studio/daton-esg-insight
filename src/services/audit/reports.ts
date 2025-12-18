/**
 * Audit Reports Service
 * Serviço para geração de relatórios de auditoria
 */

import { supabase } from "@/integrations/supabase/client";
import { ScoringService, ScoringResult } from "./scoring";

export interface AuditReportData {
  audit: {
    id: string;
    title: string;
    audit_type: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    scope: string | null;
    lead_auditor: string | null;
    target_entity: string | null;
  };
  scoring: ScoringResult | null;
  sessions: Array<{
    id: string;
    name: string;
    scheduled_date: string | null;
    status: string;
    progress: number;
    total_items: number;
    responded_items: number;
  }>;
  occurrences: Array<{
    id: string;
    title: string;
    occurrence_type: string;
    status: string;
    priority: string | null;
    description: string;
    corrective_action: string | null;
    due_date: string | null;
  }>;
  standards: Array<{
    id: string;
    name: string;
    version: string | null;
  }>;
  responsesSummary: {
    byType: Record<string, number>;
    bySession: Record<string, { conforming: number; nonConforming: number; partial: number; na: number }>;
  };
  generatedAt: string;
}

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'json';
  sections: {
    summary: boolean;
    scoring: boolean;
    sessions: boolean;
    occurrences: boolean;
    details: boolean;
  };
  includeEvidence: boolean;
  includeCharts: boolean;
}

export const ReportsService = {
  async getAuditReportData(auditId: string): Promise<AuditReportData> {
    // Fetch audit basic info
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single();

    if (auditError) throw auditError;

    // Fetch scoring data
    const scoring = await ScoringService.getScoringResult(auditId);

    // Fetch sessions
    const { data: sessions } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('audit_id', auditId)
      .order('scheduled_date');

    // Fetch occurrences
    const { data: occurrences } = await supabase
      .from('audit_occurrences')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at');

    // Fetch linked standards
    const { data: standardsLink } = await supabase
      .from('audit_standards_link')
      .select('standard_id')
      .eq('audit_id', auditId);

    let standards: Array<{ id: string; name: string; version: string | null }> = [];
    if (standardsLink && standardsLink.length > 0) {
      const standardIds = standardsLink.map(s => s.standard_id);
      const { data: standardsData } = await supabase
        .from('audit_standards')
        .select('id, name, version')
        .in('id', standardIds);
      standards = standardsData || [];
    }

    // Calculate responses summary
    const { data: responses } = await supabase
      .from('audit_item_responses')
      .select('*, audit_response_options!inner(conformity_level), audit_session_items!inner(session_id)')
      .eq('audit_id', auditId);

    const responsesSummary = {
      byType: {} as Record<string, number>,
      bySession: {} as Record<string, { conforming: number; nonConforming: number; partial: number; na: number }>
    };

    responses?.forEach(r => {
      const level = (r.audit_response_options as any)?.conformity_level || 'unknown';
      responsesSummary.byType[level] = (responsesSummary.byType[level] || 0) + 1;

      const sessionId = (r.audit_session_items as any)?.session_id;
      if (sessionId) {
        if (!responsesSummary.bySession[sessionId]) {
          responsesSummary.bySession[sessionId] = { conforming: 0, nonConforming: 0, partial: 0, na: 0 };
        }
        if (level === 'conforme') responsesSummary.bySession[sessionId].conforming++;
        else if (level === 'nao_conforme') responsesSummary.bySession[sessionId].nonConforming++;
        else if (level === 'parcial') responsesSummary.bySession[sessionId].partial++;
        else if (level === 'nao_aplicavel') responsesSummary.bySession[sessionId].na++;
      }
    });

    return {
      audit: {
        id: audit.id,
        title: audit.title,
        audit_type: audit.audit_type,
        status: audit.status,
        start_date: audit.start_date,
        end_date: audit.end_date,
        scope: audit.scope,
        lead_auditor: audit.auditor,
        target_entity: audit.target_entity
      },
      scoring,
      sessions: (sessions || []).map(s => ({
        id: s.id,
        name: s.name,
        scheduled_date: s.session_date,
        status: s.status,
        progress: s.total_items > 0 ? (s.responded_items / s.total_items) * 100 : 0,
        total_items: s.total_items || 0,
        responded_items: s.responded_items || 0
      })),
      occurrences: (occurrences || []).map(o => ({
        id: o.id,
        title: o.title,
        occurrence_type: o.occurrence_type,
        status: o.status || 'aberta',
        priority: o.priority,
        description: o.description,
        corrective_action: o.corrective_action,
        due_date: o.due_date
      })),
      standards,
      responsesSummary,
      generatedAt: new Date().toISOString()
    };
  },

  generateExcelData(reportData: AuditReportData): any[][] {
    const sheets: Record<string, any[][]> = {};

    // Summary sheet
    sheets['Resumo'] = [
      ['Relatório de Auditoria'],
      [],
      ['Título', reportData.audit.title],
      ['Tipo', reportData.audit.audit_type],
      ['Status', reportData.audit.status],
      ['Data Início', reportData.audit.start_date || 'N/A'],
      ['Data Fim', reportData.audit.end_date || 'N/A'],
      ['Escopo', reportData.audit.scope || 'N/A'],
      ['Auditor Líder', reportData.audit.lead_auditor || 'N/A'],
      ['Entidade Auditada', reportData.audit.target_entity || 'N/A'],
      [],
      ['Pontuação'],
      ['Nota', reportData.scoring?.grade || 'N/A'],
      ['Percentual', `${reportData.scoring?.percentage?.toFixed(1) || 0}%`],
      ['Status', reportData.scoring?.status || 'Pendente'],
      [],
      ['Itens'],
      ['Total', reportData.scoring?.total_items || 0],
      ['Respondidos', reportData.scoring?.responded_items || 0],
      ['Conforme', reportData.scoring?.conforming_items || 0],
      ['Não Conforme', reportData.scoring?.non_conforming_items || 0],
      ['Parcial', reportData.scoring?.partial_items || 0],
      ['N/A', reportData.scoring?.na_items || 0],
    ];

    // Sessions sheet
    sheets['Sessões'] = [
      ['Nome', 'Data Programada', 'Status', 'Progresso', 'Total Itens', 'Respondidos'],
      ...reportData.sessions.map(s => [
        s.name,
        s.scheduled_date || 'N/A',
        s.status,
        `${s.progress.toFixed(1)}%`,
        s.total_items,
        s.responded_items
      ])
    ];

    // Occurrences sheet
    sheets['Ocorrências'] = [
      ['Título', 'Tipo', 'Status', 'Prioridade', 'Descrição', 'Ação Corretiva', 'Prazo'],
      ...reportData.occurrences.map(o => [
        o.title,
        o.occurrence_type,
        o.status,
        o.priority || 'N/A',
        o.description,
        o.corrective_action || 'N/A',
        o.due_date || 'N/A'
      ])
    ];

    return Object.entries(sheets).map(([name, data]) => [name, ...data.flat()]);
  },

  getOccurrenceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'nc_maior': 'Não Conformidade Maior',
      'nc_menor': 'Não Conformidade Menor',
      'observacao': 'Observação',
      'oportunidade': 'Oportunidade de Melhoria'
    };
    return labels[type] || type;
  },

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'passed': 'Aprovado',
      'failed': 'Reprovado',
      'conditional': 'Aprovado Condicionalmente',
      'pending': 'Pendente',
      'aberta': 'Aberta',
      'em_tratamento': 'Em Tratamento',
      'fechada': 'Fechada',
      'planejada': 'Planejada',
      'em_execucao': 'Em Execução',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    };
    return labels[status] || status;
  },

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'alta': 'Alta',
      'media': 'Média',
      'baixa': 'Baixa'
    };
    return labels[priority] || priority;
  }
};
