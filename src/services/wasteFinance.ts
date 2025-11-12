/**
 * Waste Finance Service
 * Serviço para gestão financeira de resíduos (Contas a Pagar/Receber)
 */

import { supabase } from "@/integrations/supabase/client";

export interface PayableWaste {
  id: string;
  mtr_number: string;
  waste_description: string;
  collection_date: string;
  quantity: number;
  unit: string;
  destination_name?: string;
  transporter_name?: string;
  destination_cost_total?: number;
  transport_cost?: number;
  total_payable?: number;
  amount_paid?: number;
  payment_status?: string;
  payment_date?: string;
  payment_notes?: string;
  invoice_payment?: string;
  cdf_number?: string;
}

export interface ReceivableWaste {
  id: string;
  mtr_number: string;
  waste_description: string;
  collection_date: string;
  quantity: number;
  unit: string;
  destination_name?: string;
  revenue_per_unit?: number;
  revenue_total?: number;
  final_treatment_type?: string;
}

export interface PayablesStats {
  total_to_pay: number;
  overdue_count: number;
  overdue_amount: number;
  paid_this_month: number;
  pending_count: number;
  pending_amount: number;
  partial_count: number;
  partial_amount: number;
}

export interface ReceivablesStats {
  total_revenue_year: number;
  revenue_by_material: Record<string, number>;
  monthly_comparison: Array<{ month: string; revenue: number }>;
  avg_price_per_ton: number;
}

/**
 * Busca resíduos com contas a pagar
 */
export async function getPayableWastes(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PayableWaste[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  let query = supabase
    .from('waste_logs')
    .select('*')
    .eq('company_id', profile.company_id)
    .not('total_payable', 'is', null)
    .order('collection_date', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('payment_status', filters.status);
  }

  if (filters?.startDate) {
    query = query.gte('collection_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('collection_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching payable wastes:', error);
    throw new Error('Erro ao buscar contas a pagar');
  }

  return data || [];
}

/**
 * Busca resíduos com contas a receber (recicláveis vendidos)
 */
export async function getReceivableWastes(year?: number): Promise<ReceivableWaste[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const targetYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from('waste_logs')
    .select('*')
    .eq('company_id', profile.company_id)
    .not('revenue_total', 'is', null)
    .gte('collection_date', `${targetYear}-01-01`)
    .lte('collection_date', `${targetYear}-12-31`)
    .order('collection_date', { ascending: false });

  if (error) {
    console.error('Error fetching receivable wastes:', error);
    throw new Error('Erro ao buscar contas a receber');
  }

  return data || [];
}

/**
 * Calcula estatísticas de contas a pagar
 */
export async function getPayablesStats(): Promise<PayablesStats> {
  const allPayables = await getPayableWastes();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalToPay = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let paidThisMonth = 0;
  let pendingCount = 0;
  let pendingAmount = 0;
  let partialCount = 0;
  let partialAmount = 0;

  allPayables.forEach(waste => {
    const payable = waste.total_payable || 0;
    const paid = waste.amount_paid || 0;
    const status = waste.payment_status || 'Pendente';
    const collectionDate = new Date(waste.collection_date);
    const daysSinceCollection = Math.floor((now.getTime() - collectionDate.getTime()) / (1000 * 60 * 60 * 24));

    // Total a pagar
    if (status !== 'Quitado') {
      totalToPay += (payable - paid);
    }

    // Vencidas (>30 dias sem pagamento)
    if (status !== 'Quitado' && daysSinceCollection > 30) {
      overdueCount++;
      overdueAmount += (payable - paid);
    }

    // Pagas no mês atual
    if (waste.payment_date) {
      const paymentDate = new Date(waste.payment_date);
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        paidThisMonth += paid;
      }
    }

    // Pendentes
    if (status === 'Pendente') {
      pendingCount++;
      pendingAmount += payable;
    }

    // Parciais
    if (status === 'Parcial') {
      partialCount++;
      partialAmount += (payable - paid);
    }
  });

  return {
    total_to_pay: Math.round(totalToPay * 100) / 100,
    overdue_count: overdueCount,
    overdue_amount: Math.round(overdueAmount * 100) / 100,
    paid_this_month: Math.round(paidThisMonth * 100) / 100,
    pending_count: pendingCount,
    pending_amount: Math.round(pendingAmount * 100) / 100,
    partial_count: partialCount,
    partial_amount: Math.round(partialAmount * 100) / 100,
  };
}

/**
 * Calcula estatísticas de contas a receber
 */
export async function getReceivablesStats(year?: number): Promise<ReceivablesStats> {
  const receivables = await getReceivableWastes(year);
  
  const totalRevenueYear = receivables.reduce((sum, w) => sum + (w.revenue_total || 0), 0);
  
  const revenueByMaterial: Record<string, number> = {};
  receivables.forEach(w => {
    const material = w.waste_description || 'Outros';
    revenueByMaterial[material] = (revenueByMaterial[material] || 0) + (w.revenue_total || 0);
  });

  // Receita mensal
  const monthlyRevenue = new Array(12).fill(0);
  receivables.forEach(w => {
    const month = new Date(w.collection_date).getMonth();
    monthlyRevenue[month] += (w.revenue_total || 0);
  });

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyComparison = monthlyRevenue.map((revenue, index) => ({
    month: monthNames[index],
    revenue: Math.round(revenue * 100) / 100
  }));

  // Preço médio por tonelada
  const totalQuantityTons = receivables.reduce((sum, w) => {
    const quantity = w.unit.toLowerCase().includes('kg') ? w.quantity / 1000 : w.quantity;
    return sum + quantity;
  }, 0);
  const avgPricePerTon = totalQuantityTons > 0 ? totalRevenueYear / totalQuantityTons : 0;

  return {
    total_revenue_year: Math.round(totalRevenueYear * 100) / 100,
    revenue_by_material: revenueByMaterial,
    monthly_comparison: monthlyComparison,
    avg_price_per_ton: Math.round(avgPricePerTon * 100) / 100,
  };
}

/**
 * Registra pagamento de resíduo
 */
export async function registerPayment(
  wasteLogId: string,
  amountPaid: number,
  paymentDate: string,
  paymentNotes?: string
): Promise<void> {
  const { data: waste } = await supabase
    .from('waste_logs')
    .select('total_payable, amount_paid, payment_notes')
    .eq('id', wasteLogId)
    .single();

  if (!waste) throw new Error('Registro não encontrado');

  const totalPaid = (waste.amount_paid || 0) + amountPaid;
  const totalPayable = waste.total_payable || 0;

  let paymentStatus = 'Pendente';
  if (totalPaid >= totalPayable) {
    paymentStatus = 'Quitado';
  } else if (totalPaid > 0) {
    paymentStatus = 'Parcial';
  }

  const { error } = await supabase
    .from('waste_logs')
    .update({
      amount_paid: totalPaid,
      payment_status: paymentStatus,
      payment_date: paymentDate,
      payment_notes: paymentNotes || waste.payment_notes
    })
    .eq('id', wasteLogId);

  if (error) {
    console.error('Error registering payment:', error);
    throw new Error('Erro ao registrar pagamento');
  }
}
