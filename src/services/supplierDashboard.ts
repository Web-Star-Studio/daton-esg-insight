import { supabase } from "@/integrations/supabase/client";
import { getWasteSuppliers } from "./wasteSuppliers";
import { getSupplierContracts } from "./supplierContracts";
import { logger } from "@/utils/logger";

export interface SupplierDashboardData {
  id: string;
  name: string;
  type: string;
  status: string;
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
    lastEvaluation?: string;
  };
  compliance: {
    licenseStatus: string;
    licenseExpiry?: string;
    certificationsValid: number;
    certificationsTotal: number;
  };
  incidents: {
    open: number;
    resolved: number;
    total: number;
  };
  documents: {
    total: number;
    pending: number;
    validated: number;
  };
}

export const getSupplierDashboardData = async (supplierId: string): Promise<SupplierDashboardData | null> => {
  try {
    // Get supplier basic info
    const suppliers = await getWasteSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);
    
    if (!supplier) throw new Error('Supplier not found');

    // Get contracts data
    const contracts = await getSupplierContracts(supplierId);
    const activeContracts = contracts.filter(c => c.status === 'Ativo');
    
    // Calculate expiring contracts (next 30 days)
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);
    
    const expiringContracts = activeContracts.filter(c => {
      const endDate = new Date(c.end_date);
      return endDate <= future && endDate >= now;
    });

    // Get performance metrics
    const { data: performanceMetrics } = await supabase
      .from('supplier_performance_metrics')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    // Get supplier evaluations (from existing table)
    const { data: evaluations } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    const dashboardData: SupplierDashboardData = {
      id: supplier.id,
      name: supplier.company_name,
      type: supplier.supplier_type || 'Não especificado',
      status: supplier.status || 'Ativo',
      contracts: {
        active: activeContracts.length,
        total: contracts.length,
        totalValue: activeContracts.reduce((sum, c) => sum + (c.value || 0), 0),
        expiring: expiringContracts.length
      },
      performance: {
        overallScore: performanceMetrics?.overall_score || 0,
        qualityScore: performanceMetrics?.quality_score || 0,
        deliveryScore: performanceMetrics?.delivery_score || 0,
        serviceScore: performanceMetrics?.service_level_score || 0,
        lastEvaluation: performanceMetrics?.period_end
      },
      compliance: {
        licenseStatus: getLicenseStatus(supplier.license_expiry),
        licenseExpiry: supplier.license_expiry,
        certificationsValid: 0, // To be calculated from documents
        certificationsTotal: 0   // To be calculated from documents
      },
      incidents: {
        open: performanceMetrics?.incidents_count || 0,
        resolved: 0,
        total: performanceMetrics?.incidents_count || 0
      },
      documents: {
        total: 0,
        pending: 0,
        validated: 0
      }
    };

    return dashboardData;
  } catch (error) {
    logger.error('Error fetching supplier dashboard data', error, 'supplier');
    return null;
  }
};

export const updateSupplierPerformanceMetrics = async (
  supplierId: string,
  metrics: {
    qualityScore?: number;
    deliveryScore?: number;
    costPerformanceScore?: number;
    serviceLevelScore?: number;
    periodStart: string;
    periodEnd: string;
    metricsData?: Record<string, number | string | boolean>;
  }
) => {
  try {
    const overallScore = calculateOverallScore({
      quality: metrics.qualityScore || 0,
      delivery: metrics.deliveryScore || 0,
      cost: metrics.costPerformanceScore || 0,
      service: metrics.serviceLevelScore || 0
    });

    // Get user's company_id
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    const { data, error } = await supabase
      .from('supplier_performance_metrics')
      .insert({
        supplier_id: supplierId,
        company_id: profile?.company_id,
        period_start: metrics.periodStart,
        period_end: metrics.periodEnd,
        quality_score: metrics.qualityScore,
        delivery_score: metrics.deliveryScore,
        cost_performance_score: metrics.costPerformanceScore,
        service_level_score: metrics.serviceLevelScore,
        overall_score: overallScore,
        metrics_data: metrics.metricsData || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating supplier performance metrics', error, 'supplier');
    throw error;
  }
};

export const getSuppliersOverview = async () => {
  try {
    const suppliers = await getWasteSuppliers();
    
    // Get performance metrics for all suppliers
    const { data: allMetrics } = await supabase
      .from('supplier_performance_metrics')
      .select('supplier_id, overall_score, period_end')
      .order('period_end', { ascending: false });

    const overview = suppliers.map(supplier => {
      // Get latest performance metric for this supplier
      const latestMetric = allMetrics?.find(m => m.supplier_id === supplier.id);
      
      return {
        id: supplier.id,
        name: supplier.company_name,
        type: supplier.supplier_type || 'Não especificado',
        status: supplier.status || 'Ativo',
        overallScore: latestMetric?.overall_score || 0,
        licenseStatus: getLicenseStatus(supplier.license_expiry),
        lastEvaluation: latestMetric?.period_end
      };
    });

    const stats = {
      total: suppliers.length,
      active: suppliers.filter(s => s.status === 'Ativo').length,
      highPerformance: overview.filter(s => s.overallScore >= 8).length,
      needsAttention: overview.filter(s => s.overallScore < 6).length,
      expiredLicenses: overview.filter(s => s.licenseStatus === 'Vencida').length
    };

    return { overview, stats };
  } catch (error) {
    logger.error('Error fetching suppliers overview', error, 'supplier');
    throw error;
  }
};

const getLicenseStatus = (expiryDate?: string): string => {
  if (!expiryDate) return 'Não informada';
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Vencida';
  if (diffDays <= 30) return 'Vencendo';
  return 'Válida';
};

const calculateOverallScore = (scores: {
  quality: number;
  delivery: number;
  cost: number;
  service: number;
}): number => {
  const weights = {
    quality: 0.3,
    delivery: 0.25,
    cost: 0.2,
    service: 0.25
  };

  return (
    scores.quality * weights.quality +
    scores.delivery * weights.delivery +
    scores.cost * weights.cost +
    scores.service * weights.service
  );
};