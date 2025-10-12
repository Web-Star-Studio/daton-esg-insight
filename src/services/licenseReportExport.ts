import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export async function exportAlertsReport(
  licenseId?: string,
  format: 'pdf' | 'excel' = 'pdf'
): Promise<void> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('Not authenticated');

  let query = supabase
    .from('license_alerts')
    .select('*, license:licenses(name)')
    .eq('company_id', userAndCompany.company_id)
    .order('created_at', { ascending: false });

  if (licenseId) {
    query = query.eq('license_id', licenseId);
  }

  const { data: alerts, error } = await query;
  if (error) throw error;

  if (format === 'pdf') {
    exportAlertsToPDF(alerts || []);
  } else {
    exportAlertsToExcel(alerts || []);
  }
}

function exportAlertsToPDF(alerts: any[]) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Relatório de Alertas', 14, 20);

  // Date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  // Summary
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const high = alerts.filter(a => a.severity === 'high').length;
  const medium = alerts.filter(a => a.severity === 'medium').length;
  const low = alerts.filter(a => a.severity === 'low').length;

  doc.setFontSize(12);
  doc.text('Resumo:', 14, 38);
  doc.setFontSize(10);
  doc.text(`Total de Alertas: ${alerts.length}`, 14, 45);
  doc.text(`Críticos: ${critical} | Altos: ${high} | Médios: ${medium} | Baixos: ${low}`, 14, 52);

  // Table
  const tableData = alerts.map(alert => [
    alert.license?.name || 'N/A',
    alert.title || 'Sem título',
    alert.severity === 'critical' ? 'Crítico' : 
    alert.severity === 'high' ? 'Alto' : 
    alert.severity === 'medium' ? 'Médio' : 'Baixo',
    alert.priority || 'média',
    new Date(alert.created_at).toLocaleDateString('pt-BR')
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Licença', 'Título', 'Severidade', 'Prioridade', 'Data']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`alertas-${Date.now()}.pdf`);
}

function exportAlertsToExcel(alerts: any[]) {
  const data = alerts.map(alert => ({
    'Licença': alert.license?.name || 'N/A',
    'Título': alert.title,
    'Mensagem': alert.message,
    'Severidade': alert.severity === 'critical' ? 'Crítico' : 
                  alert.severity === 'high' ? 'Alto' : 
                  alert.severity === 'medium' ? 'Médio' : 'Baixo',
    'Prioridade': alert.priority,
    'Tipo': alert.alert_type,
    'Categoria': alert.category,
    'Data de Criação': new Date(alert.created_at).toLocaleDateString('pt-BR'),
    'Auto-gerado': alert.auto_generated ? 'Sim' : 'Não'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alertas');

  // Auto-width columns
  const maxWidth = data.reduce((w, r) => Math.max(w, r['Título']?.length || 0), 10);
  ws['!cols'] = [
    { wch: 20 }, // Licença
    { wch: maxWidth }, // Título
    { wch: 40 }, // Mensagem
    { wch: 10 }, // Severidade
    { wch: 10 }, // Prioridade
    { wch: 15 }, // Tipo
    { wch: 15 }, // Categoria
    { wch: 15 }, // Data
    { wch: 12 }  // Auto-gerado
  ];

  XLSX.writeFile(wb, `alertas-${Date.now()}.xlsx`);
}

export async function exportObservationsReport(
  licenseId?: string,
  format: 'pdf' | 'excel' = 'pdf'
): Promise<void> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('Not authenticated');

  let query = supabase
    .from('license_observations')
    .select('*, license:licenses(name)')
    .eq('company_id', userAndCompany.company_id)
    .order('created_at', { ascending: false });

  if (licenseId) {
    query = query.eq('license_id', licenseId);
  }

  const { data: observations, error } = await query;
  if (error) throw error;

  if (format === 'pdf') {
    exportObservationsToPDF(observations || []);
  } else {
    exportObservationsToExcel(observations || []);
  }
}

function exportObservationsToPDF(observations: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Relatório de Observações', 14, 20);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  const tableData = observations.map(obs => [
    obs.license?.name || 'N/A',
    obs.title,
    obs.observation_type,
    obs.priority,
    obs.requires_followup ? 'Sim' : 'Não',
    new Date(obs.created_at).toLocaleDateString('pt-BR')
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Licença', 'Título', 'Tipo', 'Prioridade', 'Followup', 'Data']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] }
  });

  doc.save(`observacoes-${Date.now()}.pdf`);
}

function exportObservationsToExcel(observations: any[]) {
  const data = observations.map(obs => ({
    'Licença': obs.license?.name || 'N/A',
    'Título': obs.title,
    'Texto': obs.observation_text,
    'Tipo': obs.observation_type,
    'Categoria': obs.category,
    'Prioridade': obs.priority,
    'Visibilidade': obs.visibility,
    'Requer Followup': obs.requires_followup ? 'Sim' : 'Não',
    'Data Followup': obs.followup_date || 'N/A',
    'Arquivada': obs.is_archived ? 'Sim' : 'Não',
    'Data de Criação': new Date(obs.created_at).toLocaleDateString('pt-BR')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Observações');

  ws['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 }
  ];

  XLSX.writeFile(wb, `observacoes-${Date.now()}.xlsx`);
}

export async function exportComplianceReport(format: 'pdf' | 'excel' = 'pdf'): Promise<void> {
  const userAndCompany = await getUserAndCompany();
  if (!userAndCompany) throw new Error('Not authenticated');

  // Buscar dados
  const { data: alerts } = await supabase
    .from('license_alerts')
    .select('*')
    .eq('company_id', userAndCompany.company_id);

  const { data: licenses } = await supabase
    .from('licenses')
    .select('*')
    .eq('company_id', userAndCompany.company_id);

  const { data: conditions } = await supabase
    .from('license_conditions')
    .select('*')
    .in('license_id', licenses?.map(l => l.id) || []);

  if (format === 'pdf') {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório de Compliance', 14, 20);

    doc.setFontSize(12);
    doc.text(`Total de Licenças: ${licenses?.length || 0}`, 14, 35);
    doc.text(`Licenças Ativas: ${licenses?.filter(l => l.status === 'Ativa').length || 0}`, 14, 42);
    doc.text(`Licenças Vencidas: ${licenses?.filter(l => l.status === 'Vencida').length || 0}`, 14, 49);
    doc.text(`Alertas Críticos: ${alerts?.filter(a => a.severity === 'critical').length || 0}`, 14, 56);
    doc.text(`Condicionantes Pendentes: ${conditions?.filter(c => c.status === 'pending').length || 0}`, 14, 63);

    const complianceScore = calculateComplianceScore(licenses || [], alerts || [], conditions || []);
    doc.setFontSize(16);
    doc.text(`Score de Conformidade: ${complianceScore}%`, 14, 75);

    doc.save(`compliance-${Date.now()}.pdf`);
  } else {
    const data = [{
      'Total de Licenças': licenses?.length || 0,
      'Licenças Ativas': licenses?.filter(l => l.status === 'Ativa').length || 0,
      'Licenças Vencidas': licenses?.filter(l => l.status === 'Vencida').length || 0,
      'Alertas Críticos': alerts?.filter(a => a.severity === 'critical').length || 0,
      'Condicionantes Pendentes': conditions?.filter(c => c.status === 'pending').length || 0,
      'Score de Conformidade': calculateComplianceScore(licenses || [], alerts || [], conditions || [])
    }];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compliance');

    XLSX.writeFile(wb, `compliance-${Date.now()}.xlsx`);
  }
}

function calculateComplianceScore(licenses: any[], alerts: any[], conditions: any[]): number {
  let score = 100;

  // Penalidades
  const expiredLicenses = licenses.filter(l => l.status === 'Vencida').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const overdueConditions = conditions.filter(c => 
    c.status === 'pending' && c.due_date && new Date(c.due_date) < new Date()
  ).length;

  score -= expiredLicenses * 20;
  score -= criticalAlerts * 10;
  score -= overdueConditions * 5;

  return Math.max(0, Math.min(100, score));
}
