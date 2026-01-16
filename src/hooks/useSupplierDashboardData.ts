import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierDashboardData {
  contracts: {
    active: number;
    total: number;
    totalValue: number;
    expiring: number;
  };
  performance: {
    overallScore: number;
    qualityScore: number;
    deliveryScore: number;
    serviceScore: number;
    costScore: number;
    lastEvaluation?: string;
  };
  incidents: {
    open: number;
    total: number;
    critical: number;
    byType: Record<string, number>;
  };
  compliance: {
    licenseStatus: 'Válida' | 'Vencendo' | 'Vencida' | 'Não informada';
    licenseExpiry?: string;
    documentsTotal: number;
    documentsApproved: number;
    documentsPending: number;
    documentsExpired: number;
  };
  history: {
    failures: Array<{
      id: string;
      date: string;
      type: string;
      severity: string;
      description: string | null;
    }>;
    evaluations: Array<{
      id: string;
      date: string;
      overallScore: number;
    }>;
  };
}

async function fetchSupplierDashboardData(supplierId: string): Promise<SupplierDashboardData> {
  // Fetch all data in parallel
  const [
    contractsResult,
    performanceResult,
    failuresResult,
    documentsResult,
    supplierResult
  ] = await Promise.all([
    // Contracts
    supabase
      .from('supplier_contracts')
      .select('*')
      .eq('supplier_id', supplierId),
    
    // Performance metrics (latest)
    supabase
      .from('supplier_performance_metrics')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('period_end', { ascending: false })
      .limit(5),
    
    // Failures (last 12 months)
    (supabase.from('supplier_supply_failures') as any)
      .select('*')
      .eq('supplier_id', supplierId)
      .gte('failure_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('failure_date', { ascending: false }),
    
    // Documents
    supabase
      .from('supplier_document_submissions')
      .select('*')
      .eq('supplier_id', supplierId),
    
    // Supplier info (cast to any to handle dynamic columns)
    (supabase.from('supplier_management') as any)
      .select('license_expiry, status')
      .eq('id', supplierId)
      .single()
  ]);

  const contracts = contractsResult.data || [];
  const performance = performanceResult.data || [];
  const failures = failuresResult.data || [];
  const documents = documentsResult.data || [];
  const supplier = supplierResult.data;

  // Calculate contract metrics
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const activeContracts = contracts.filter(c => c.status === 'Ativo');
  const expiringContracts = activeContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= thirtyDaysFromNow;
  });

  // Get latest performance
  const latestPerformance = performance[0];

  // Calculate failure metrics
  const failuresByType: Record<string, number> = {};
  failures.forEach(f => {
    failuresByType[f.failure_type] = (failuresByType[f.failure_type] || 0) + 1;
  });
  const criticalFailures = failures.filter(f => f.severity === 'critical').length;

  // Calculate document metrics
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const pendingDocs = documents.filter(d => d.status === 'pending' || d.status === 'submitted').length;
  const expiredDocs = documents.filter(d => {
    if (d.expiry_date) {
      return new Date(d.expiry_date) < now;
    }
    return false;
  }).length;

  // Determine license status
  let licenseStatus: 'Válida' | 'Vencendo' | 'Vencida' | 'Não informada' = 'Não informada';
  if (supplier?.license_expiry) {
    const expiryDate = new Date(supplier.license_expiry);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      licenseStatus = 'Vencida';
    } else if (daysUntilExpiry <= 30) {
      licenseStatus = 'Vencendo';
    } else {
      licenseStatus = 'Válida';
    }
  }

  return {
    contracts: {
      active: activeContracts.length,
      total: contracts.length,
      totalValue: activeContracts.reduce((sum, c) => sum + (c.value || 0), 0),
      expiring: expiringContracts.length
    },
    performance: {
      overallScore: latestPerformance?.overall_score || 0,
      qualityScore: latestPerformance?.quality_score || 0,
      deliveryScore: latestPerformance?.delivery_score || 0,
      serviceScore: latestPerformance?.service_level_score || 0,
      costScore: latestPerformance?.cost_performance_score || 0,
      lastEvaluation: latestPerformance?.period_end
    },
    incidents: {
      open: failures.length,
      total: failures.length,
      critical: criticalFailures,
      byType: failuresByType
    },
    compliance: {
      licenseStatus,
      licenseExpiry: supplier?.license_expiry,
      documentsTotal: documents.length,
      documentsApproved: approvedDocs,
      documentsPending: pendingDocs,
      documentsExpired: expiredDocs
    },
    history: {
      failures: failures.slice(0, 10).map(f => ({
        id: f.id,
        date: f.failure_date,
        type: f.failure_type,
        severity: f.severity,
        description: f.description
      })),
      evaluations: performance.map(p => ({
        id: p.id,
        date: p.period_end,
        overallScore: p.overall_score
      }))
    }
  };
}

export function useSupplierDashboardData(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier-dashboard', supplierId],
    queryFn: () => fetchSupplierDashboardData(supplierId!),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
