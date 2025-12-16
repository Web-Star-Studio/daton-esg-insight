import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Types
export interface DocumentComplianceIndicator {
  totalEvaluated: number;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
}

export interface DocumentComplianceEvolution {
  month: string;
  compliant: number;
  nonCompliant: number;
  rate: number;
}

export interface SupplierDocumentCompliance {
  supplierId: string;
  supplierName: string;
  totalDocuments: number;
  compliantDocuments: number;
  complianceRate: number;
}

export interface PerformanceIndicator {
  totalEvaluated: number;
  averageScore: number;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
}

export interface PerformanceEvolution {
  month: string;
  averageScore: number;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
}

export interface SupplierPerformanceRanking {
  supplierId: string;
  supplierName: string;
  averageScore: number;
  evaluationCount: number;
}

export interface PortalParticipationIndicator {
  trainings: { total: number; completed: number; rate: number };
  readings: { total: number; confirmed: number; rate: number };
  surveys: { total: number; responded: number; rate: number };
}

export interface SupplierParticipation {
  supplierId: string;
  supplierName: string;
  trainingsCompleted: number;
  trainingsTotal: number;
  readingsConfirmed: number;
  readingsTotal: number;
  surveysResponded: number;
  surveysTotal: number;
  overallRate: number;
}

// AVA1 - Document Compliance Indicators
export async function getDocumentComplianceIndicators(
  companyId: string,
  period: 'month' | 'year',
  date: Date
): Promise<DocumentComplianceIndicator> {
  const start = period === 'month' ? startOfMonth(date) : startOfYear(date);
  const end = period === 'month' ? endOfMonth(date) : endOfYear(date);

  const { data, error } = await supabase
    .from('supplier_document_evaluations')
    .select('evaluation_result')
    .eq('company_id', companyId)
    .gte('evaluation_date', start.toISOString())
    .lte('evaluation_date', end.toISOString());

  if (error) throw error;

  const totalEvaluated = data?.length || 0;
  const compliant = data?.filter((d: any) => d.evaluation_result === 'approved').length || 0;
  const nonCompliant = totalEvaluated - compliant;
  const complianceRate = totalEvaluated > 0 ? (compliant / totalEvaluated) * 100 : 0;

  return { totalEvaluated, compliant, nonCompliant, complianceRate };
}

export async function getDocumentComplianceEvolution(
  companyId: string,
  months: number = 12
): Promise<DocumentComplianceEvolution[]> {
  const evolution: DocumentComplianceEvolution[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const { data } = await supabase
      .from('supplier_document_evaluations')
      .select('evaluation_result')
      .eq('company_id', companyId)
      .gte('evaluation_date', start.toISOString())
      .lte('evaluation_date', end.toISOString());

    const total = data?.length || 0;
    const compliant = data?.filter((d: any) => d.evaluation_result === 'approved').length || 0;
    const nonCompliant = total - compliant;
    const rate = total > 0 ? (compliant / total) * 100 : 0;

    evolution.push({
      month: format(date, 'MMM'),
      compliant,
      nonCompliant,
      rate
    });
  }

  return evolution;
}

export async function getDocumentComplianceBySupplier(
  companyId: string,
  period: 'month' | 'year',
  date: Date
): Promise<SupplierDocumentCompliance[]> {
  const start = period === 'month' ? startOfMonth(date) : startOfYear(date);
  const end = period === 'month' ? endOfMonth(date) : endOfYear(date);

  const { data: evaluations } = await supabase
    .from('supplier_document_evaluations')
    .select('supplier_id, evaluation_result')
    .eq('company_id', companyId)
    .gte('evaluation_date', start.toISOString())
    .lte('evaluation_date', end.toISOString());

  const supplierMap = new Map<string, { total: number; compliant: number }>();

  (evaluations as any[] || []).forEach((ev: any) => {
    const supplierId = ev.supplier_id;
    
    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, { total: 0, compliant: 0 });
    }
    
    const current = supplierMap.get(supplierId)!;
    current.total++;
    if (ev.evaluation_result === 'approved') current.compliant++;
  });

  return Array.from(supplierMap.entries()).map(([supplierId, data]) => ({
    supplierId,
    supplierName: `Fornecedor ${supplierId.slice(0, 8)}`,
    totalDocuments: data.total,
    compliantDocuments: data.compliant,
    complianceRate: data.total > 0 ? (data.compliant / data.total) * 100 : 0
  })).sort((a, b) => b.complianceRate - a.complianceRate);
}

// AVA2 - Performance Compliance Indicators
export async function getPerformanceIndicators(
  companyId: string,
  period: 'month' | 'year',
  date: Date
): Promise<PerformanceIndicator> {
  const start = period === 'month' ? startOfMonth(date) : startOfYear(date);
  const end = period === 'month' ? endOfMonth(date) : endOfYear(date);

  const { data, error } = await supabase
    .from('supplier_performance_evaluations')
    .select('overall_score, quality_score, delivery_score, price_score')
    .eq('company_id', companyId)
    .gte('evaluation_date', start.toISOString())
    .lte('evaluation_date', end.toISOString());

  if (error) throw error;

  const evals = data as any[] || [];
  const totalEvaluated = evals.length;
  
  if (totalEvaluated === 0) {
    return { totalEvaluated: 0, averageScore: 0, qualityScore: 0, deliveryScore: 0, priceScore: 0 };
  }

  const averageScore = evals.reduce((sum, d) => sum + (d.overall_score || 0), 0) / totalEvaluated;
  const qualityScore = evals.reduce((sum, d) => sum + (d.quality_score || 0), 0) / totalEvaluated;
  const deliveryScore = evals.reduce((sum, d) => sum + (d.delivery_score || 0), 0) / totalEvaluated;
  const priceScore = evals.reduce((sum, d) => sum + (d.price_score || 0), 0) / totalEvaluated;

  return { totalEvaluated, averageScore, qualityScore, deliveryScore, priceScore };
}

export async function getPerformanceEvolution(
  companyId: string,
  months: number = 12
): Promise<PerformanceEvolution[]> {
  const evolution: PerformanceEvolution[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const { data } = await supabase
      .from('supplier_performance_evaluations')
      .select('overall_score, quality_score, delivery_score, price_score')
      .eq('company_id', companyId)
      .gte('evaluation_date', start.toISOString())
      .lte('evaluation_date', end.toISOString());

    const evals = data as any[] || [];
    const count = evals.length;
    
    evolution.push({
      month: format(date, 'MMM'),
      averageScore: count > 0 ? evals.reduce((sum, d) => sum + (d.overall_score || 0), 0) / count : 0,
      qualityScore: count > 0 ? evals.reduce((sum, d) => sum + (d.quality_score || 0), 0) / count : 0,
      deliveryScore: count > 0 ? evals.reduce((sum, d) => sum + (d.delivery_score || 0), 0) / count : 0,
      priceScore: count > 0 ? evals.reduce((sum, d) => sum + (d.price_score || 0), 0) / count : 0
    });
  }

  return evolution;
}

export async function getTopPerformingSuppliers(
  companyId: string,
  limit: number = 5
): Promise<SupplierPerformanceRanking[]> {
  const { data } = await supabase
    .from('supplier_performance_evaluations')
    .select('supplier_id, overall_score')
    .eq('company_id', companyId)
    .order('evaluation_date', { ascending: false });

  const supplierMap = new Map<string, number[]>();

  (data as any[] || []).forEach((ev: any) => {
    const supplierId = ev.supplier_id;
    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, []);
    }
    supplierMap.get(supplierId)!.push(ev.overall_score || 0);
  });

  return Array.from(supplierMap.entries())
    .map(([supplierId, scores]) => ({
      supplierId,
      supplierName: `Fornecedor ${supplierId.slice(0, 8)}`,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      evaluationCount: scores.length
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, limit);
}

export async function getLowPerformingSuppliers(
  companyId: string,
  limit: number = 5
): Promise<SupplierPerformanceRanking[]> {
  const topSuppliers = await getTopPerformingSuppliers(companyId, 1000);
  return topSuppliers.reverse().slice(0, limit);
}

// EXT1 - Portal Participation Indicators
export async function getPortalParticipationIndicators(
  companyId: string,
  period: 'month' | 'year',
  date: Date
): Promise<PortalParticipationIndicator> {
  const start = period === 'month' ? startOfMonth(date) : startOfYear(date);
  const end = period === 'month' ? endOfMonth(date) : endOfYear(date);

  // Trainings
  const { data: trainings } = await supabase
    .from('supplier_training_progress')
    .select('status')
    .eq('company_id', companyId)
    .gte('assigned_at', start.toISOString())
    .lte('assigned_at', end.toISOString());

  const trainingsArr = trainings as any[] || [];
  const trainingsTotal = trainingsArr.length;
  const trainingsCompleted = trainingsArr.filter(t => t.status === 'completed').length;

  // Readings
  const { data: readings } = await supabase
    .from('supplier_reading_confirmations')
    .select('confirmed_at')
    .eq('company_id', companyId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const readingsArr = readings as any[] || [];
  const readingsTotal = readingsArr.length;
  const readingsConfirmed = readingsArr.filter(r => r.confirmed_at !== null).length;

  // Surveys
  const { data: surveys } = await supabase
    .from('supplier_survey_responses')
    .select('status')
    .eq('company_id', companyId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const surveysArr = surveys as any[] || [];
  const surveysTotal = surveysArr.length;
  const surveysResponded = surveysArr.filter(s => s.status === 'completed').length;

  return {
    trainings: {
      total: trainingsTotal,
      completed: trainingsCompleted,
      rate: trainingsTotal > 0 ? (trainingsCompleted / trainingsTotal) * 100 : 0
    },
    readings: {
      total: readingsTotal,
      confirmed: readingsConfirmed,
      rate: readingsTotal > 0 ? (readingsConfirmed / readingsTotal) * 100 : 0
    },
    surveys: {
      total: surveysTotal,
      responded: surveysResponded,
      rate: surveysTotal > 0 ? (surveysResponded / surveysTotal) * 100 : 0
    }
  };
}

export async function getParticipationBySupplier(
  companyId: string
): Promise<SupplierParticipation[]> {
  // Return empty for now - will be populated when data exists
  return [];
}
