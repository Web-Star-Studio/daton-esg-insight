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

export type StatusBucket = "conforme" | "plano_acao" | "na" | "pending" | "outros";

export interface RiskLegislation {
  id: string;
  normType: string;
  normNumber: string | null;
  title: string;
  totalBranches: number;
  conforme: number;
  planoAcao: number;
  pending: number;
  na: number;
  outros: number;
  riskScore: number;
  branchStatuses: Array<{
    branchId: string;
    code: string | null;
    name: string;
    status: StatusBucket | null;
  }>;
}

export interface NormTypeStats {
  type: string;
  legislations: number;
  evaluations: number;
  conforme: number;
  planoAcao: number;
  na: number;
  pending: number;
  outros: number;
}

export interface BranchFocusItem {
  id: string;
  normType: string;
  normNumber: string | null;
  title: string;
}

export interface BranchFocus {
  branchId: string;
  planoAcao: BranchFocusItem[];
  pending: BranchFocusItem[];
  outros: BranchFocusItem[];
}

export interface DataQualityIssues {
  branchesWithoutEvaluations: Array<{
    branchId: string;
    code: string | null;
    name: string;
    state: string | null;
  }>;
  legislationsWithoutEvaluations: number;
  typeCasingDuplicates: Array<{ canonical: string; variants: string[] }>;
  suspiciousDates: Array<{
    id: string;
    normType: string;
    normNumber: string | null;
    title: string;
    publicationDate: string;
    reason: "future" | "too_old";
  }>;
  hasAny: boolean;
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
  topRiskLegislations: RiskLegislation[];
  normTypeStats: NormTypeStats[];
  dataQuality: DataQualityIssues;
  branchFocus: Record<string, BranchFocus>;
}

const RISK_THRESHOLD = 0.05;

type ComplianceRow = {
  legislation_id: string;
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

type LegislationRow = {
  id: string;
  norm_type: string | null;
  norm_number: string | null;
  title: string | null;
  publication_date: string | null;
};

const classify = (row: ComplianceRow): StatusBucket => {
  const status = (row.compliance_status || '').toLowerCase();
  const applicability = (row.applicability || '').toLowerCase();
  if (applicability === 'na' || status === 'na') return 'na';
  if (status === 'conforme') return 'conforme';
  if (status === 'plano_acao') return 'plano_acao';
  if (status === 'pending' || !status) return 'pending';
  return 'outros';
};

const aggregate = (
  branches: BranchRow[],
  rows: ComplianceRow[],
  legislations: LegislationRow[],
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

  // Por legislação: contagens + mapa branch→status para dots na UI.
  const byLegislation = new Map<string, RiskLegislation>();
  for (const l of legislations) {
    byLegislation.set(l.id, {
      id: l.id,
      normType: l.norm_type || '—',
      normNumber: l.norm_number,
      title: l.title || '(sem título)',
      totalBranches: 0,
      conforme: 0,
      planoAcao: 0,
      pending: 0,
      na: 0,
      outros: 0,
      riskScore: 0,
      branchStatuses: [],
    });
  }

  // Por tipo de norma: contagens agregadas.
  const byType = new Map<string, NormTypeStats>();
  const legIdToType = new Map<string, string>();
  for (const l of legislations) {
    const t = (l.norm_type || '—').trim();
    legIdToType.set(l.id, t);
    if (!byType.has(t)) {
      byType.set(t, {
        type: t,
        legislations: 0,
        evaluations: 0,
        conforme: 0,
        planoAcao: 0,
        na: 0,
        pending: 0,
        outros: 0,
      });
    }
    byType.get(t)!.legislations++;
  }

  // Por filial: listas de plano_acao / pending / outros pra drill-down no drawer.
  const branchFocus = new Map<string, BranchFocus>();
  for (const b of branches) {
    branchFocus.set(b.id, { branchId: b.id, planoAcao: [], pending: [], outros: [] });
  }

  let totConforme = 0, totPlano = 0, totNa = 0, totPending = 0, totOutros = 0;

  for (const r of rows) {
    const stats = byBranch.get(r.branch_id);
    if (!stats) continue;
    const bucket = classify(r);

    stats.total++;
    stats[bucket === 'plano_acao' ? 'planoAcao' : bucket]++;
    if (bucket === 'conforme') totConforme++;
    else if (bucket === 'plano_acao') totPlano++;
    else if (bucket === 'na') totNa++;
    else if (bucket === 'pending') totPending++;
    else totOutros++;

    if (bucket === 'plano_acao' || bucket === 'pending' || bucket === 'outros') {
      const legStats = byLegislation.get(r.legislation_id);
      const focus = branchFocus.get(r.branch_id);
      if (legStats && focus) {
        const item: BranchFocusItem = {
          id: legStats.id,
          normType: legStats.normType,
          normNumber: legStats.normNumber,
          title: legStats.title,
        };
        if (bucket === 'plano_acao') focus.planoAcao.push(item);
        else if (bucket === 'pending') focus.pending.push(item);
        else focus.outros.push(item);
      }
    }

    const legStats = byLegislation.get(r.legislation_id);
    if (legStats) {
      legStats.totalBranches++;
      legStats[bucket === 'plano_acao' ? 'planoAcao' : bucket]++;
      legStats.branchStatuses.push({
        branchId: stats.branchId,
        code: stats.code,
        name: stats.name,
        status: bucket,
      });
    }

    const typeStats = byType.get(legIdToType.get(r.legislation_id) || '—');
    if (typeStats) {
      typeStats.evaluations++;
      typeStats[bucket === 'plano_acao' ? 'planoAcao' : bucket]++;
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

  // Ordena filial-status das legislações seguindo a ordem alfabética do code.
  for (const leg of byLegislation.values()) {
    leg.riskScore = leg.totalBranches > 0
      ? (leg.planoAcao + leg.pending * 0.5) / leg.totalBranches
      : 0;
    leg.branchStatuses.sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name));
  }

  const topRiskLegislations = Array.from(byLegislation.values())
    .filter(l => l.planoAcao > 0 || l.pending > 0)
    .sort((a, b) => {
      if (b.planoAcao !== a.planoAcao) return b.planoAcao - a.planoAcao;
      if (b.pending !== a.pending) return b.pending - a.pending;
      return b.riskScore - a.riskScore;
    })
    .slice(0, 10);

  const normTypeStats = Array.from(byType.values())
    .filter(t => t.evaluations > 0)
    .sort((a, b) => b.evaluations - a.evaluations)
    .slice(0, 10);

  const totalEvals = totConforme + totPlano + totNa + totPending + totOutros;
  const totalAplicaveis = totalEvals - totNa;
  const globalRate = totalAplicaveis > 0 ? totConforme / totalAplicaveis : 0;

  // ================= Data quality =================
  const branchesWithoutEvaluations = Array.from(byBranch.values())
    .filter(b => b.total === 0)
    .map(b => ({ branchId: b.branchId, code: b.code, name: b.name, state: b.state }));

  const legislationsWithoutEvaluations = Array.from(byLegislation.values())
    .filter(l => l.totalBranches === 0).length;

  // Detecta tipos duplicados por casing/espaço/acento (ex.: "LEI" vs "Lei", "PORTARIA  IBAMA" com 2 espaços)
  const typeCanonicalize = (t: string) =>
    t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const typeVariants = new Map<string, Set<string>>();
  for (const l of legislations) {
    const raw = (l.norm_type || '').trim();
    if (!raw) continue;
    const canon = typeCanonicalize(raw);
    if (!typeVariants.has(canon)) typeVariants.set(canon, new Set());
    typeVariants.get(canon)!.add(raw);
  }
  const typeCasingDuplicates = Array.from(typeVariants.entries())
    .filter(([, s]) => s.size > 1)
    .map(([canonical, s]) => ({ canonical, variants: Array.from(s).sort() }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));

  // Datas suspeitas: futuro ou antes de 1900.
  const todayIso = new Date().toISOString().slice(0, 10);
  const suspiciousDates: DataQualityIssues["suspiciousDates"] = [];
  for (const l of legislations) {
    if (!l.publication_date) continue;
    const d = l.publication_date.slice(0, 10);
    if (d > todayIso) {
      suspiciousDates.push({
        id: l.id,
        normType: l.norm_type || '—',
        normNumber: l.norm_number,
        title: l.title || '(sem título)',
        publicationDate: d,
        reason: 'future',
      });
    } else if (d < '1900-01-01') {
      suspiciousDates.push({
        id: l.id,
        normType: l.norm_type || '—',
        normNumber: l.norm_number,
        title: l.title || '(sem título)',
        publicationDate: d,
        reason: 'too_old',
      });
    }
  }

  const dataQuality: DataQualityIssues = {
    branchesWithoutEvaluations,
    legislationsWithoutEvaluations,
    typeCasingDuplicates,
    suspiciousDates,
    hasAny:
      branchesWithoutEvaluations.length > 0 ||
      legislationsWithoutEvaluations > 0 ||
      typeCasingDuplicates.length > 0 ||
      suspiciousDates.length > 0,
  };

  return {
    branches: Array.from(byBranch.values()).sort((a, b) => b.complianceRate - a.complianceRate),
    totals: {
      legislations: legislations.length,
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
    topRiskLegislations,
    normTypeStats,
    dataQuality,
    branchFocus: Object.fromEntries(
      Array.from(branchFocus.entries()).map(([id, focus]) => {
        const sortItems = (items: BranchFocusItem[]) =>
          items.sort((a, b) => (a.normType + (a.normNumber || '')).localeCompare(b.normType + (b.normNumber || '')));
        return [
          id,
          {
            ...focus,
            planoAcao: sortItems(focus.planoAcao),
            pending: sortItems(focus.pending),
            outros: sortItems(focus.outros),
          },
        ];
      })
    ),
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

      // Pagina legislations também — empresas grandes podem ter > 1000 entries
      // e o limite default do Supabase truncava silenciosamente.
      const LEG_PAGE = 1000;
      const legRows: LegislationRow[] = [];
      for (let off = 0; ; off += LEG_PAGE) {
        const { data: legislations, error: legErr } = await supabase
          .from('legislations')
          .select('id, norm_type, norm_number, title, publication_date')
          .eq('company_id', companyId!)
          .eq('jurisdiction', jurisdiction)
          .range(off, off + LEG_PAGE - 1);
        if (legErr) throw legErr;
        if (!legislations || legislations.length === 0) break;
        legRows.push(...(legislations as LegislationRow[]));
        if (legislations.length < LEG_PAGE) break;
      }
      const legIds = legRows.map(l => l.id);
      const activeBranches = (branches || []).filter(b => b.status === 'Ativa' || b.status === 'Ativo');
      if (legIds.length === 0) {
        return aggregate(activeBranches, [], []);
      }

      // IDs em chunks (supabase `.in()` é prático até ~500-1000 IDs) e dentro
      // de cada chunk paginamos via `.range()` porque o Supabase tem soft-limit
      // de 1000 rows por response. Sem isso, empresas com > 1000 avaliações
      // tinham os cálculos do painel silenciosamente cortados.
      const ID_CHUNK = 400;
      const ROW_PAGE = 1000;
      const MAX_ROWS = 200_000; // guarda contra OOM em bases patológicas
      const compliance: ComplianceRow[] = [];
      outer: for (let i = 0; i < legIds.length; i += ID_CHUNK) {
        const slice = legIds.slice(i, i + ID_CHUNK);
        let offset = 0;
        while (true) {
          const { data, error } = await supabase
            .from('legislation_unit_compliance')
            .select('legislation_id, branch_id, compliance_status, applicability')
            .in('legislation_id', slice)
            .range(offset, offset + ROW_PAGE - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          compliance.push(...(data as ComplianceRow[]));
          if (compliance.length >= MAX_ROWS) break outer;
          if (data.length < ROW_PAGE) break;
          offset += ROW_PAGE;
        }
      }

      return aggregate(activeBranches, compliance, legRows);
    },
  });
};
