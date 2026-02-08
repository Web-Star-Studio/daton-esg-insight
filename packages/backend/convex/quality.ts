import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const severityValidator = v.union(
  v.literal("Baixa"),
  v.literal("Media"),
  v.literal("Média"),
  v.literal("Alta"),
  v.literal("Critica"),
  v.literal("Crítica"),
);

const statusValidator = v.union(
  v.literal("Aberta"),
  v.literal("Em Andamento"),
  v.literal("Resolvida"),
  v.literal("Fechada"),
);

const trendDirectionValidator = v.union(
  v.literal("up"),
  v.literal("down"),
  v.literal("stable"),
);

const qualityNcReturn = v.object({
  id: v.id("qualityNonConformities"),
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
  createdAt: v.string(),
  updatedAt: v.string(),
});

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

function normalizeSeverity(
  severity: "Baixa" | "Media" | "Média" | "Alta" | "Critica" | "Crítica",
): "Baixa" | "Média" | "Alta" | "Crítica" {
  if (severity === "Media") {
    return "Média";
  }
  if (severity === "Critica") {
    return "Crítica";
  }
  return severity;
}

function isResolvedStatus(status: string): boolean {
  return status === "Resolvida" || status === "Fechada";
}

function isOpenStatus(status: string): boolean {
  return status === "Aberta" || status === "Em Andamento";
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

    return rows.map((row) => ({
      id: row._id,
      companyId: row.companyId,
      ncNumber: row.ncNumber ?? `NC-${String(row._id)}`,
      title: row.title,
      description: row.description,
      category: row.category,
      severity: normalizeSeverity(row.severity),
      status: row.status,
      source: row.source,
      detectedDate: row.detectedDate,
      dueDate: row.dueDate,
      resolvedAt: row.resolvedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
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
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    severity: severityValidator,
    status: v.optional(statusValidator),
    source: v.optional(v.string()),
    detectedDate: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  returns: v.id("qualityNonConformities"),
  handler: async (ctx, args) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const ncNumber = `NC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;

    return await ctx.db.insert("qualityNonConformities", {
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

// Backward-compatible aliases during migration.
export const listByCompany = getNonConformities;
export const create = createNonConformity;
