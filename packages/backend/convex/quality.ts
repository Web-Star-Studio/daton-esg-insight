import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const severityValidator = v.string();
const statusValidator = v.string();

const trendDirectionValidator = v.union(
  v.literal("up"),
  v.literal("down"),
  v.literal("stable"),
);

const qualityNcReturn = v.object({
  id: v.id("qualityNonConformities"),
  sourceId: v.optional(v.string()),
  companyId: v.string(),
  ncNumber: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  severity: v.string(),
  status: v.string(),
  source: v.optional(v.string()),
  detectedDate: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  resolvedAt: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  currentStage: v.optional(v.number()),
  stage1CompletedAt: v.optional(v.string()),
  stage2CompletedAt: v.optional(v.string()),
  stage3CompletedAt: v.optional(v.string()),
  stage4CompletedAt: v.optional(v.string()),
  stage5CompletedAt: v.optional(v.string()),
  stage6CompletedAt: v.optional(v.string()),
  revisionNumber: v.optional(v.number()),
  parentNcId: v.optional(v.string()),
  organizationalUnitId: v.optional(v.string()),
  processId: v.optional(v.string()),
  sector: v.optional(v.string()),
  damageLevel: v.optional(v.string()),
  impactAnalysis: v.optional(v.string()),
  rootCauseAnalysis: v.optional(v.string()),
  correctiveActions: v.optional(v.string()),
  preventiveActions: v.optional(v.string()),
  effectivenessEvaluation: v.optional(v.string()),
  effectivenessDate: v.optional(v.string()),
  responsibleUserId: v.optional(v.string()),
  approvedByUserId: v.optional(v.string()),
  approvalDate: v.optional(v.string()),
  approvalNotes: v.optional(v.string()),
  recurrenceCount: v.optional(v.number()),
  createdAt: v.string(),
  updatedAt: v.string(),
});

const qualityNcSyncArgs = {
  companyId: v.string(),
  sourceId: v.string(),
  ncNumber: v.optional(v.string()),
  title: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  severity: severityValidator,
  status: statusValidator,
  source: v.optional(v.string()),
  detectedDate: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  resolvedAt: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  currentStage: v.optional(v.number()),
  stage1CompletedAt: v.optional(v.string()),
  stage2CompletedAt: v.optional(v.string()),
  stage3CompletedAt: v.optional(v.string()),
  stage4CompletedAt: v.optional(v.string()),
  stage5CompletedAt: v.optional(v.string()),
  stage6CompletedAt: v.optional(v.string()),
  revisionNumber: v.optional(v.number()),
  parentNcId: v.optional(v.string()),
  organizationalUnitId: v.optional(v.string()),
  processId: v.optional(v.string()),
  sector: v.optional(v.string()),
  damageLevel: v.optional(v.string()),
  impactAnalysis: v.optional(v.string()),
  rootCauseAnalysis: v.optional(v.string()),
  correctiveActions: v.optional(v.string()),
  preventiveActions: v.optional(v.string()),
  effectivenessEvaluation: v.optional(v.string()),
  effectivenessDate: v.optional(v.string()),
  responsibleUserId: v.optional(v.string()),
  approvedByUserId: v.optional(v.string()),
  approvalDate: v.optional(v.string()),
  approvalNotes: v.optional(v.string()),
  recurrenceCount: v.optional(v.number()),
};

const qualityDashboardReturn = v.object({
  metrics: v.object({
    totalNCs: v.number(),
    openNCs: v.number(),
    resolvedNCs: v.number(),
    totalRisks: v.number(),
    criticalRisks: v.number(),
    actionPlans: v.number(),
    overdueActions: v.number(),
    qualityScore: v.number(),
    avgResolutionTime: v.number(),
    trendDirection: trendDirectionValidator,
  }),
  recentNCs: v.array(
    v.object({
      id: v.id("qualityNonConformities"),
      nc_number: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      severity: v.string(),
      status: v.string(),
      created_at: v.string(),
    }),
  ),
  plansProgress: v.array(
    v.object({
      id: v.id("qualityActionPlans"),
      title: v.string(),
      status: v.string(),
      totalItems: v.number(),
      completedItems: v.number(),
      avgProgress: v.number(),
      overdueItems: v.number(),
    }),
  ),
});

function normalizeSeverity(severity: string): string {
  if (severity === "Media") {
    return "Média";
  }
  if (severity === "Critica") {
    return "Crítica";
  }
  if (severity === "critical") {
    return "Crítica";
  }
  if (severity === "major") {
    return "Alta";
  }
  if (severity === "minor") {
    return "Média";
  }
  if (severity === "observation") {
    return "Baixa";
  }
  return severity;
}

function isResolvedStatus(status: string): boolean {
  return (
    status === "Resolvida" ||
    status === "Fechada" ||
    status === "Encerrada" ||
    status === "Aprovada" ||
    status === "closed"
  );
}

function isOpenStatus(status: string): boolean {
  return (
    status === "Aberta" ||
    status === "Pendente" ||
    status === "Em Andamento" ||
    status === "Em Tratamento" ||
    status === "open" ||
    status === "in_progress"
  );
}

function normalizeStatus(status: string): string {
  if (status === "Em Análise" || status === "Em Correção") {
    return "Em Tratamento";
  }
  if (status === "approved") {
    return "Aprovada";
  }
  if (status === "cancelled") {
    return "Cancelada";
  }
  if (status === "pending") {
    return "Pendente";
  }
  return status;
}

function mapNonConformityFromRow(
  row: {
    _id: Id<"qualityNonConformities">;
    sourceId?: string;
    companyId: string;
    ncNumber?: string;
    title: string;
    description?: string;
    category?: string;
    severity: string;
    status: string;
    source?: string;
    detectedDate?: string;
    dueDate?: string;
    resolvedAt?: string;
    completedAt?: string;
    currentStage?: number;
    stage1CompletedAt?: string;
    stage2CompletedAt?: string;
    stage3CompletedAt?: string;
    stage4CompletedAt?: string;
    stage5CompletedAt?: string;
    stage6CompletedAt?: string;
    revisionNumber?: number;
    parentNcId?: string;
    organizationalUnitId?: string;
    processId?: string;
    sector?: string;
    damageLevel?: string;
    impactAnalysis?: string;
    rootCauseAnalysis?: string;
    correctiveActions?: string;
    preventiveActions?: string;
    effectivenessEvaluation?: string;
    effectivenessDate?: string;
    responsibleUserId?: string;
    approvedByUserId?: string;
    approvalDate?: string;
    approvalNotes?: string;
    recurrenceCount?: number;
    createdAt: string;
    updatedAt: string;
  },
) {
  return {
    id: row._id,
    sourceId: row.sourceId,
    companyId: row.companyId,
    ncNumber: row.ncNumber ?? `NC-${String(row._id)}`,
    title: row.title,
    description: row.description,
    category: row.category,
    severity: normalizeSeverity(row.severity),
    status: normalizeStatus(row.status),
    source: row.source,
    detectedDate: row.detectedDate,
    dueDate: row.dueDate,
    resolvedAt: row.resolvedAt,
    completedAt: row.completedAt,
    currentStage: row.currentStage,
    stage1CompletedAt: row.stage1CompletedAt,
    stage2CompletedAt: row.stage2CompletedAt,
    stage3CompletedAt: row.stage3CompletedAt,
    stage4CompletedAt: row.stage4CompletedAt,
    stage5CompletedAt: row.stage5CompletedAt,
    stage6CompletedAt: row.stage6CompletedAt,
    revisionNumber: row.revisionNumber,
    parentNcId: row.parentNcId,
    organizationalUnitId: row.organizationalUnitId,
    processId: row.processId,
    sector: row.sector,
    damageLevel: row.damageLevel,
    impactAnalysis: row.impactAnalysis,
    rootCauseAnalysis: row.rootCauseAnalysis,
    correctiveActions: row.correctiveActions,
    preventiveActions: row.preventiveActions,
    effectivenessEvaluation: row.effectivenessEvaluation,
    effectivenessDate: row.effectivenessDate,
    responsibleUserId: row.responsibleUserId,
    approvedByUserId: row.approvedByUserId,
    approvalDate: row.approvalDate,
    approvalNotes: row.approvalNotes,
    recurrenceCount: row.recurrenceCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildMonthCounts(
  ncs: Array<{ createdAt: string }>,
): { current: number; previous: number } {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let current = 0;
  let previous = 0;

  for (const nc of ncs) {
    const created = new Date(nc.createdAt);
    const month = created.getMonth();
    const year = created.getFullYear();

    if (month === currentMonth && year === currentYear) {
      current += 1;
    } else if (month === previousMonth && year === previousYear) {
      previous += 1;
    }
  }

  return { current, previous };
}

function buildTrendDirection(current: number, previous: number): "up" | "down" | "stable" {
  if (current > previous) {
    return "up";
  }
  if (current < previous) {
    return "down";
  }
  return "stable";
}

function buildChangePercentage(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export const getNonConformities = query({
  args: {
    companyId: v.string(),
  },
  returns: v.array(qualityNcReturn),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("qualityNonConformities")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return rows.map((row) => mapNonConformityFromRow(row));
  },
});

export const getNonConformityBySourceId = query({
  args: {
    companyId: v.string(),
    sourceId: v.string(),
  },
  returns: v.union(qualityNcReturn, v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("qualityNonConformities")
      .withIndex("by_companyId_and_sourceId", (q) =>
        q.eq("companyId", args.companyId).eq("sourceId", args.sourceId),
      )
      .unique();

    if (!row) {
      return null;
    }

    return mapNonConformityFromRow(row);
  },
});

export const getQualityDashboard = query({
  args: {
    companyId: v.string(),
  },
  returns: qualityDashboardReturn,
  handler: async (ctx, args) => {
    const [ncs, plans, risks] = await Promise.all([
      ctx.db
        .query("qualityNonConformities")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("qualityActionPlans")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("qualityRisks")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
    ]);

    const totalNCs = ncs.length;
    const openNCs = ncs.filter((nc) => isOpenStatus(nc.status)).length;
    const resolvedNCs = ncs.filter((nc) => isResolvedStatus(nc.status)).length;

    const totalRisks = risks.length;
    const criticalRisks = risks.filter(
      (risk) => risk.level === "Crítico" && risk.status === "Ativo",
    ).length;

    const actionPlans = plans.length;
    const now = new Date();

    const overdueFromPlanCounters = plans.reduce(
      (sum, plan) => sum + plan.overdueItems,
      0,
    );
    const overdueFromPlanDates = plans.filter(
      (plan) =>
        plan.status !== "Concluída" &&
        !!plan.dueDate &&
        new Date(plan.dueDate) < now,
    ).length;
    const overdueActions = Math.max(
      overdueFromPlanCounters,
      overdueFromPlanDates,
    );

    const resolutionDurationsDays = ncs
      .filter((nc) => isResolvedStatus(nc.status) && nc.detectedDate && nc.resolvedAt)
      .map((nc) => {
        const detected = new Date(nc.detectedDate as string).getTime();
        const resolved = new Date(nc.resolvedAt as string).getTime();
        const millis = resolved - detected;
        return millis > 0 ? millis / (1000 * 60 * 60 * 24) : 0;
      })
      .filter((days) => days >= 0);

    const avgResolutionTime =
      resolutionDurationsDays.length > 0
        ? Number(
            (
              resolutionDurationsDays.reduce((sum, days) => sum + days, 0) /
              resolutionDurationsDays.length
            ).toFixed(1),
          )
        : 0;

    const { current, previous } = buildMonthCounts(ncs);
    const trendDirection = buildTrendDirection(current, previous);

    const resolutionRate = totalNCs > 0 ? (resolvedNCs / totalNCs) * 100 : 100;
    const qualityScore = Number(
      clamp(
        Math.round(resolutionRate - overdueActions * 5 - criticalRisks * 3),
        0,
        100,
      ).toFixed(0),
    );

    const recentNCs = ncs
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((nc) => ({
        id: nc._id,
        nc_number: nc.ncNumber ?? `NC-${String(nc._id)}`,
        title: nc.title,
        description: nc.description,
        severity: normalizeSeverity(nc.severity),
        status: nc.status,
        created_at: nc.createdAt,
      }));

    const plansProgress = plans
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((plan) => ({
        id: plan._id,
        title: plan.title,
        status: plan.status,
        totalItems: plan.totalItems,
        completedItems: plan.completedItems,
        avgProgress:
          plan.totalItems > 0
            ? Number(((plan.completedItems / plan.totalItems) * 100).toFixed(0))
            : 0,
        overdueItems: plan.overdueItems,
      }));

    return {
      metrics: {
        totalNCs,
        openNCs,
        resolvedNCs,
        totalRisks,
        criticalRisks,
        actionPlans,
        overdueActions,
        qualityScore,
        avgResolutionTime,
        trendDirection,
      },
      recentNCs,
      plansProgress,
    };
  },
});

export const getQualityIndicators = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    ncTrend: v.object({
      current: v.number(),
      previous: v.number(),
      change: v.number(),
    }),
    resolutionRate: v.object({
      resolved: v.number(),
      total: v.number(),
      percentage: v.number(),
    }),
    overdueActions: v.number(),
    qualityScore: v.number(),
    hasRealIndicators: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const [ncs, plans, risks] = await Promise.all([
      ctx.db
        .query("qualityNonConformities")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("qualityActionPlans")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("qualityRisks")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
    ]);

    const { current, previous } = buildMonthCounts(ncs);
    const change = buildChangePercentage(current, previous);

    const resolved = ncs.filter((nc) => isResolvedStatus(nc.status)).length;
    const total = ncs.length;
    const percentage = total > 0 ? Number(((resolved / total) * 100).toFixed(0)) : 0;

    const now = new Date();
    const overdueFromPlanCounters = plans.reduce(
      (sum, plan) => sum + plan.overdueItems,
      0,
    );
    const overdueFromPlanDates = plans.filter(
      (plan) =>
        plan.status !== "Concluída" &&
        !!plan.dueDate &&
        new Date(plan.dueDate) < now,
    ).length;
    const overdueActions = Math.max(
      overdueFromPlanCounters,
      overdueFromPlanDates,
    );

    const criticalRisks = risks.filter(
      (risk) => risk.level === "Crítico" && risk.status === "Ativo",
    ).length;

    const qualityScore = Number(
      clamp(
        Math.round((total > 0 ? (resolved / total) * 100 : 100) - overdueActions * 5 - criticalRisks * 3),
        0,
        100,
      ).toFixed(0),
    );

    return {
      ncTrend: {
        current,
        previous,
        change,
      },
      resolutionRate: {
        resolved,
        total,
        percentage,
      },
      overdueActions,
      qualityScore,
      hasRealIndicators: total > 0 || plans.length > 0,
    };
  },
});

export const getQualityMetrics = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    totalNCs: v.number(),
    openNCs: v.number(),
    resolvedNCs: v.number(),
    totalRisks: v.number(),
    criticalRisks: v.number(),
    actionPlans: v.number(),
    overdueActions: v.number(),
    qualityScore: v.number(),
    avgResolutionTime: v.number(),
    trendDirection: trendDirectionValidator,
  }),
  handler: async (ctx, args) => {
    const [ncs, plans, risks] = await Promise.all([
      ctx.db
        .query("qualityNonConformities")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("qualityActionPlans")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
      ctx.db
        .query("qualityRisks")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .collect(),
    ]);

    const totalNCs = ncs.length;
    const openNCs = ncs.filter((nc) => isOpenStatus(nc.status)).length;
    const resolvedNCs = ncs.filter((nc) => isResolvedStatus(nc.status)).length;
    const totalRisks = risks.length;
    const criticalRisks = risks.filter(
      (risk) => risk.level === "Crítico" && risk.status === "Ativo",
    ).length;

    const now = new Date();
    const overdueFromPlanCounters = plans.reduce(
      (sum, plan) => sum + plan.overdueItems,
      0,
    );
    const overdueFromPlanDates = plans.filter(
      (plan) =>
        plan.status !== "Concluída" &&
        !!plan.dueDate &&
        new Date(plan.dueDate) < now,
    ).length;
    const overdueActions = Math.max(
      overdueFromPlanCounters,
      overdueFromPlanDates,
    );

    const resolutionDurationsDays = ncs
      .filter((nc) => isResolvedStatus(nc.status) && nc.detectedDate && nc.resolvedAt)
      .map((nc) => {
        const detected = new Date(nc.detectedDate as string).getTime();
        const resolved = new Date(nc.resolvedAt as string).getTime();
        const millis = resolved - detected;
        return millis > 0 ? millis / (1000 * 60 * 60 * 24) : 0;
      })
      .filter((days) => days >= 0);

    const avgResolutionTime =
      resolutionDurationsDays.length > 0
        ? Number(
            (
              resolutionDurationsDays.reduce((sum, days) => sum + days, 0) /
              resolutionDurationsDays.length
            ).toFixed(1),
          )
        : 0;

    const { current, previous } = buildMonthCounts(ncs);

    return {
      totalNCs,
      openNCs,
      resolvedNCs,
      totalRisks,
      criticalRisks,
      actionPlans: plans.length,
      overdueActions,
      qualityScore: Number(
        clamp(
          Math.round((totalNCs > 0 ? (resolvedNCs / totalNCs) * 100 : 100) - overdueActions * 5 - criticalRisks * 3),
          0,
          100,
        ).toFixed(0),
      ),
      avgResolutionTime,
      trendDirection: buildTrendDirection(current, previous),
    };
  },
});

export const getNonConformityStats = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    total: v.number(),
    bySeverity: v.record(v.string(), v.number()),
    byStatus: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const ncs = await ctx.db
      .query("qualityNonConformities")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const nc of ncs) {
      const severity = normalizeSeverity(nc.severity);
      bySeverity[severity] = (bySeverity[severity] ?? 0) + 1;
      byStatus[nc.status] = (byStatus[nc.status] ?? 0) + 1;
    }

    return {
      total: ncs.length,
      bySeverity,
      byStatus,
    };
  },
});

export const getActionPlansProgress = query({
  args: {
    companyId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.id("qualityActionPlans"),
      title: v.string(),
      status: v.string(),
      totalItems: v.number(),
      completedItems: v.number(),
      avgProgress: v.number(),
      overdueItems: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("qualityActionPlans")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return plans.map((plan) => ({
      id: plan._id,
      title: plan.title,
      status: plan.status,
      totalItems: plan.totalItems,
      completedItems: plan.completedItems,
      avgProgress:
        plan.totalItems > 0
          ? Number(((plan.completedItems / plan.totalItems) * 100).toFixed(0))
          : 0,
      overdueItems: plan.overdueItems,
    }));
  },
});

export const getPredictiveAnalysis = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    nextMonthNCs: v.number(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    patterns: v.array(
      v.object({
        type: v.string(),
        confidence: v.number(),
        description: v.string(),
      }),
    ),
    recommendations: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        impact: v.string(),
        effort: v.string(),
        priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const ncs = await ctx.db
      .query("qualityNonConformities")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentNCs = ncs.filter(
      (nc) => new Date(nc.createdAt) >= thirtyDaysAgo,
    );

    const nextMonthNCs = Math.max(1, Math.round(recentNCs.length * 1.1));

    const overdueOrOpen = ncs.filter((nc) => isOpenStatus(nc.status)).length;
    const riskLevel =
      overdueOrOpen > 10 ? "high" : overdueOrOpen > 5 ? "medium" : "low";

    return {
      nextMonthNCs,
      riskLevel,
      patterns: [
        {
          type: "Trend",
          confidence: 75,
          description: "Tendência de recorrência em categorias com maior volume recente de NCs",
        },
        {
          type: "Process",
          confidence: 68,
          description: "Maior concentração de NCs em processos com ações atrasadas",
        },
      ],
      recommendations: [
        {
          title: "Priorizar NCs abertas mais antigas",
          description: "Reduza o backlog de NCs em aberto para diminuir risco operacional",
          impact: "Alto",
          effort: "Médio",
          priority: "high",
        },
        {
          title: "Reforçar rituais de acompanhamento",
          description: "Acompanhe semanalmente planos com progresso abaixo de 50%",
          impact: "Médio",
          effort: "Baixo",
          priority: "medium",
        },
      ],
    };
  },
});

export const createNonConformity = mutation({
  args: {
    companyId: v.string(),
    sourceId: v.optional(v.string()),
    ncNumber: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    severity: severityValidator,
    status: v.optional(statusValidator),
    source: v.optional(v.string()),
    detectedDate: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    resolvedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    currentStage: v.optional(v.number()),
    stage1CompletedAt: v.optional(v.string()),
    stage2CompletedAt: v.optional(v.string()),
    stage3CompletedAt: v.optional(v.string()),
    stage4CompletedAt: v.optional(v.string()),
    stage5CompletedAt: v.optional(v.string()),
    stage6CompletedAt: v.optional(v.string()),
    revisionNumber: v.optional(v.number()),
    parentNcId: v.optional(v.string()),
    organizationalUnitId: v.optional(v.string()),
    processId: v.optional(v.string()),
    sector: v.optional(v.string()),
    damageLevel: v.optional(v.string()),
    impactAnalysis: v.optional(v.string()),
    rootCauseAnalysis: v.optional(v.string()),
    correctiveActions: v.optional(v.string()),
    preventiveActions: v.optional(v.string()),
    effectivenessEvaluation: v.optional(v.string()),
    effectivenessDate: v.optional(v.string()),
    responsibleUserId: v.optional(v.string()),
    approvedByUserId: v.optional(v.string()),
    approvalDate: v.optional(v.string()),
    approvalNotes: v.optional(v.string()),
    recurrenceCount: v.optional(v.number()),
  },
  returns: v.id("qualityNonConformities"),
  handler: async (ctx, args) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const ncNumber =
      args.ncNumber ??
      `NC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;

    return await ctx.db.insert("qualityNonConformities", {
      sourceId: args.sourceId,
      companyId: args.companyId,
      ncNumber,
      title: args.title,
      description: args.description,
      category: args.category,
      severity: args.severity,
      status: args.status ?? "Aberta",
      source: args.source,
      detectedDate: args.detectedDate,
      dueDate: args.dueDate,
      resolvedAt: args.resolvedAt,
      completedAt: args.completedAt,
      currentStage: args.currentStage,
      stage1CompletedAt: args.stage1CompletedAt,
      stage2CompletedAt: args.stage2CompletedAt,
      stage3CompletedAt: args.stage3CompletedAt,
      stage4CompletedAt: args.stage4CompletedAt,
      stage5CompletedAt: args.stage5CompletedAt,
      stage6CompletedAt: args.stage6CompletedAt,
      revisionNumber: args.revisionNumber,
      parentNcId: args.parentNcId,
      organizationalUnitId: args.organizationalUnitId,
      processId: args.processId,
      sector: args.sector,
      damageLevel: args.damageLevel,
      impactAnalysis: args.impactAnalysis,
      rootCauseAnalysis: args.rootCauseAnalysis,
      correctiveActions: args.correctiveActions,
      preventiveActions: args.preventiveActions,
      effectivenessEvaluation: args.effectivenessEvaluation,
      effectivenessDate: args.effectivenessDate,
      responsibleUserId: args.responsibleUserId,
      approvedByUserId: args.approvedByUserId,
      approvalDate: args.approvalDate,
      approvalNotes: args.approvalNotes,
      recurrenceCount: args.recurrenceCount,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  },
});

export const updateNonConformity = mutation({
  args: {
    id: v.id("qualityNonConformities"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      severity: v.optional(severityValidator),
      status: v.optional(statusValidator),
      source: v.optional(v.string()),
      detectedDate: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      resolvedAt: v.optional(v.string()),
      completedAt: v.optional(v.string()),
      currentStage: v.optional(v.number()),
      stage1CompletedAt: v.optional(v.string()),
      stage2CompletedAt: v.optional(v.string()),
      stage3CompletedAt: v.optional(v.string()),
      stage4CompletedAt: v.optional(v.string()),
      stage5CompletedAt: v.optional(v.string()),
      stage6CompletedAt: v.optional(v.string()),
      revisionNumber: v.optional(v.number()),
      parentNcId: v.optional(v.string()),
      organizationalUnitId: v.optional(v.string()),
      processId: v.optional(v.string()),
      sector: v.optional(v.string()),
      damageLevel: v.optional(v.string()),
      impactAnalysis: v.optional(v.string()),
      rootCauseAnalysis: v.optional(v.string()),
      correctiveActions: v.optional(v.string()),
      preventiveActions: v.optional(v.string()),
      effectivenessEvaluation: v.optional(v.string()),
      effectivenessDate: v.optional(v.string()),
      responsibleUserId: v.optional(v.string()),
      approvedByUserId: v.optional(v.string()),
      approvalDate: v.optional(v.string()),
      approvalNotes: v.optional(v.string()),
      recurrenceCount: v.optional(v.number()),
    }),
  },
  returns: v.id("qualityNonConformities"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: new Date().toISOString(),
    });
    return args.id;
  },
});

export const deleteNonConformity = mutation({
  args: {
    id: v.id("qualityNonConformities"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

export const upsertNonConformityBySourceId = mutation({
  args: qualityNcSyncArgs,
  returns: v.id("qualityNonConformities"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("qualityNonConformities")
      .withIndex("by_companyId_and_sourceId", (q) =>
        q.eq("companyId", args.companyId).eq("sourceId", args.sourceId),
      )
      .unique();

    const nowIso = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        severity: normalizeSeverity(args.severity),
        status: normalizeStatus(args.status),
        updatedAt: nowIso,
      });
      return existing._id;
    }

    return await ctx.db.insert("qualityNonConformities", {
      ...args,
      severity: normalizeSeverity(args.severity),
      status: normalizeStatus(args.status),
      ncNumber: args.ncNumber ?? `NC-${args.sourceId.slice(-8)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  },
});

export const deleteNonConformityBySourceId = mutation({
  args: {
    companyId: v.string(),
    sourceId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("qualityNonConformities")
      .withIndex("by_companyId_and_sourceId", (q) =>
        q.eq("companyId", args.companyId).eq("sourceId", args.sourceId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});

// Backward-compatible aliases during migration.
export const listByCompany = getNonConformities;
export const create = createNonConformity;
