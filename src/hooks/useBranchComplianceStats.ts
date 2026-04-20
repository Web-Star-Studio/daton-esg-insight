import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface BranchComplianceStats {
  branchId: string;
  code: string | null;
  name: string;
  city: string | null;
  state: string | null;
  isHeadquarters: boolean;
  total: number;
  conforme: number;
  planoAcao: number;
  na: number;
  pending: number;
  outros: number;
  complianceRate: number;
  riskScore: number;
}

export interface ComplianceOverview {
  branches: BranchComplianceStats[];
  totals: {
    legislations: number;
    evaluations: number;
    conforme: number;
    planoAcao: number;
    na: number;
    pending: number;
    outros: number;
  };
  globalComplianceRate: number;
  branchesAtRisk: number;
  evaluatedBranches: number;
}

const RISK_THRESHOLD = 0.05;

type ComplianceRow = {
  branch_id: string;
  compliance_status: string | null;
  applicability: string | null;
};

type BranchRow = {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  state: string | null;
  is_headquarters: boolean;
  status: string | null;
};

const aggregate = (
  branches: BranchRow[],
  rows: ComplianceRow[],
  legislationsCount: number,
): ComplianceOverview => {
  const byBranch = new Map<string, BranchComplianceStats>();
  for (const b of branches) {
    byBranch.set(b.id, {
      branchId: b.id,
      code: b.code,
      name: b.name,
      city: b.city,
      state: b.state,
      isHeadquarters: !!b.is_headquarters,
      total: 0,
      conforme: 0,
      planoAcao: 0,
      na: 0,
      pending: 0,
      outros: 0,
      complianceRate: 0,
      riskScore: 0,
    });
  }

  let totConforme = 0, totPlano = 0, totNa = 0, totPending = 0, totOutros = 0;

  for (const r of rows) {
    const stats = byBranch.get(r.branch_id);
    if (!stats) continue;
    stats.total++;
    const status = (r.compliance_status || '').toLowerCase();
    const applicability = (r.applicability || '').toLowerCase();
    // 'na' pode chegar tanto via compliance_status='na' quanto applicability='na';
    // priorizamos applicability porque ele determina se a norma se aplica.
    if (applicability === 'na' || status === 'na') {
      stats.na++; totNa++;
    } else if (status === 'conforme') {
      stats.conforme++; totConforme++;
    } else if (status === 'plano_acao') {
      stats.planoAcao++; totPlano++;
    } else if (status === 'pending' || !status) {
      stats.pending++; totPending++;
    } else {
      stats.outros++; totOutros++;
    }
  }

  let evaluatedBranches = 0;
  let branchesAtRisk = 0;
  for (const b of byBranch.values()) {
    const aplicaveis = b.total - b.na;
    b.complianceRate = aplicaveis > 0 ? b.conforme / aplicaveis : 0;
    b.riskScore = b.total > 0 ? b.planoAcao / b.total : 0;
    if (b.total > 0) evaluatedBranches++;
    if (b.riskScore > RISK_THRESHOLD) branchesAtRisk++;
  }

  const totalEvals = totConforme + totPlano + totNa + totPending + totOutros;
  const totalAplicaveis = totalEvals - totNa;
  const globalRate = totalAplicaveis > 0 ? totConforme / totalAplicaveis : 0;

  return {
    branches: Array.from(byBranch.values()).sort((a, b) => b.complianceRate - a.complianceRate),
    totals: {
      legislations: legislationsCount,
      evaluations: totalEvals,
      conforme: totConforme,
      planoAcao: totPlano,
      na: totNa,
      pending: totPending,
      outros: totOutros,
    },
    globalComplianceRate: globalRate,
    branchesAtRisk,
    evaluatedBranches,
  };
};

export const useBranchComplianceStats = (jurisdiction: string = 'federal') => {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

  return useQuery({
    queryKey: ['branch-compliance-stats', companyId, jurisdiction],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async (): Promise<ComplianceOverview> => {
      const { data: branches, error: branchErr } = await supabase
        .from('branches')
        .select('id, code, name, city, state, is_headquarters, status')
        .eq('company_id', companyId!);
      if (branchErr) throw branchErr;

      const { data: legislations, error: legErr } = await supabase
        .from('legislations')
        .select('id')
        .eq('company_id', companyId!)
        .eq('jurisdiction', jurisdiction);
      if (legErr) throw legErr;

      const legIds = (legislations || []).map(l => l.id);
      if (legIds.length === 0) {
        return aggregate(branches || [], [], 0);
      }

      const PAGE = 1000;
      const compliance: ComplianceRow[] = [];
      for (let i = 0; i < legIds.length; i += PAGE) {
        const slice = legIds.slice(i, i + PAGE);
        const { data, error } = await supabase
          .from('legislation_unit_compliance')
          .select('branch_id, compliance_status, applicability')
          .in('legislation_id', slice);
        if (error) throw error;
        if (data) compliance.push(...(data as ComplianceRow[]));
      }

      return aggregate(
        (branches || []).filter(b => b.status === 'Ativa' || b.status === 'Ativo'),
        compliance,
        legIds.length,
      );
    },
  });
};
