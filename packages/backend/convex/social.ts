import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const socialStatusValidator = v.union(
  v.literal("Planejado"),
  v.literal("Em Andamento"),
  v.literal("Concluído"),
  v.literal("Cancelado"),
);

const socialProjectReturn = v.object({
  id: v.id("socialProjects"),
  companyId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  objective: v.optional(v.string()),
  targetAudience: v.optional(v.string()),
  location: v.optional(v.string()),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  status: socialStatusValidator,
  budget: v.optional(v.number()),
  investedAmount: v.number(),
  impactMetrics: v.record(v.string(), v.number()),
  responsibleUserId: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
});

const groupedHoursMetric = v.object({
  name: v.string(),
  hours: v.number(),
  avgHours: v.number(),
  employees: v.number(),
});

const filteredTrainingEmployee = v.object({
  employee_id: v.string(),
  employee_name: v.string(),
  department: v.optional(v.string()),
  position: v.optional(v.string()),
  location: v.optional(v.string()),
  hours: v.number(),
});

export const getSocialProjects = query({
  args: {
    companyId: v.string(),
  },
  returns: v.array(socialProjectReturn),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("socialProjects")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return rows.map((row) => ({
      id: row._id,
      companyId: row.companyId,
      name: row.name,
      description: row.description,
      objective: row.objective,
      targetAudience: row.targetAudience,
      location: row.location,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      budget: row.budget,
      investedAmount: row.investedAmount,
      impactMetrics: row.impactMetrics,
      responsibleUserId: row.responsibleUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const getSocialImpactMetrics = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    totalProjects: v.number(),
    activeProjects: v.number(),
    completedProjects: v.number(),
    totalInvestment: v.number(),
    totalBudget: v.number(),
    budgetUtilization: v.number(),
    statusDistribution: v.record(v.string(), v.number()),
    beneficiariesReached: v.number(),
    averageInvestmentPerProject: v.number(),
  }),
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("socialProjects")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (project) => project.status === "Em Andamento",
    ).length;
    const completedProjects = projects.filter(
      (project) => project.status === "Concluído",
    ).length;
    const totalInvestment = projects.reduce(
      (sum, project) => sum + project.investedAmount,
      0,
    );
    const totalBudget = projects.reduce(
      (sum, project) => sum + (project.budget ?? 0),
      0,
    );

    const statusDistribution: Record<string, number> = {};
    for (const project of projects) {
      statusDistribution[project.status] =
        (statusDistribution[project.status] ?? 0) + 1;
    }

    const beneficiariesReached = projects.reduce(
      (sum, project) => sum + (project.impactMetrics.beneficiariesReached ?? 0),
      0,
    );

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalInvestment,
      totalBudget,
      budgetUtilization:
        totalBudget > 0 ? (totalInvestment / totalBudget) * 100 : 0,
      statusDistribution,
      beneficiariesReached,
      averageInvestmentPerProject:
        totalProjects > 0 ? totalInvestment / totalProjects : 0,
    };
  },
});

export const getEmployeesStats = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    totalEmployees: v.number(),
    activeEmployees: v.number(),
    departments: v.number(),
    genderDistribution: v.record(v.string(), v.number()),
    avgSalary: v.number(),
  }),
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("socialEmployees")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const departments = new Set<string>();
    for (const employee of employees) {
      if (employee.department) {
        departments.add(employee.department);
      }
    }

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.status === "Ativo")
        .length,
      departments: departments.size,
      genderDistribution: {},
      avgSalary: 0,
    };
  },
});

export const getSafetyMetrics = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    totalIncidents: v.number(),
    daysLostTotal: v.number(),
    withMedicalTreatment: v.number(),
    accidentsWithLostTime: v.number(),
    ltifr: v.number(),
    severityRate: v.number(),
    avgResolutionTime: v.number(),
    severityDistribution: v.record(v.string(), v.number()),
    incidentTrend: v.array(
      v.object({
        month: v.number(),
        incidents: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const incidents = await ctx.db
      .query("socialSafetyIncidents")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const totalIncidents = incidents.length;
    const daysLostTotal = incidents.reduce(
      (sum, incident) => sum + incident.daysLost,
      0,
    );
    const withMedicalTreatment = incidents.filter(
      (incident) => incident.medicalTreatmentRequired,
    ).length;
    const accidentsWithLostTime = incidents.filter(
      (incident) => incident.daysLost > 0,
    ).length;

    const severityDistribution: Record<string, number> = {};
    for (const incident of incidents) {
      severityDistribution[incident.severity] =
        (severityDistribution[incident.severity] ?? 0) + 1;
    }

    const monthlyMap: Record<number, number> = {};
    for (const incident of incidents) {
      const month = new Date(incident.incidentDate).getMonth() + 1;
      monthlyMap[month] = (monthlyMap[month] ?? 0) + 1;
    }

    const incidentTrend: Array<{ month: number; incidents: number }> = [];
    for (let i = 1; i <= 12; i += 1) {
      incidentTrend.push({ month: i, incidents: monthlyMap[i] ?? 0 });
    }

    return {
      totalIncidents,
      daysLostTotal,
      withMedicalTreatment,
      accidentsWithLostTime,
      ltifr: 0,
      severityRate: 0,
      avgResolutionTime: 0,
      severityDistribution,
      incidentTrend,
    };
  },
});

export const getTrainingMetrics = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    totalTrainings: v.number(),
    completedTrainings: v.number(),
    completionRate: v.number(),
    averageScore: v.number(),
    totalHoursTrained: v.number(),
    averageHoursPerEmployee: v.number(),
    categoryDistribution: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const trainings = await ctx.db
      .query("socialTrainingRecords")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const totalTrainings = trainings.length;
    const completedTrainings = trainings.filter(
      (training) => training.status === "Concluído",
    ).length;
    const totalHoursTrained = trainings
      .filter((training) => training.status === "Concluído")
      .reduce((sum, training) => sum + training.totalHours, 0);

    const distinctEmployees = new Set<string>();
    for (const training of trainings) {
      distinctEmployees.add(training.employeeId);
    }

    const scoredTrainings = trainings.filter(
      (training) => training.score !== undefined,
    );
    const averageScore =
      scoredTrainings.length > 0
        ? scoredTrainings.reduce((sum, training) => sum + (training.score ?? 0), 0) /
          scoredTrainings.length
        : 0;

    return {
      totalTrainings,
      completedTrainings,
      completionRate:
        totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0,
      averageScore,
      totalHoursTrained,
      averageHoursPerEmployee:
        distinctEmployees.size > 0 ? totalHoursTrained / distinctEmployees.size : 0,
      categoryDistribution: {},
    };
  },
});

export const getFilterOptions = query({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    locations: v.array(v.string()),
    departments: v.array(v.string()),
    positions: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("socialEmployees")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const locations = new Set<string>();
    const departments = new Set<string>();
    const positions = new Set<string>();

    for (const employee of employees) {
      if (employee.location) {
        locations.add(employee.location);
      }
      if (employee.department) {
        departments.add(employee.department);
      }
      if (employee.position) {
        positions.add(employee.position);
      }
    }

    return {
      locations: Array.from(locations).sort(),
      departments: Array.from(departments).sort(),
      positions: Array.from(positions).sort(),
    };
  },
});

export const getFilteredTrainingMetrics = query({
  args: {
    companyId: v.string(),
    location: v.optional(v.string()),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    minHours: v.optional(v.number()),
    maxHours: v.optional(v.number()),
  },
  returns: v.object({
    totalEmployees: v.number(),
    totalHours: v.number(),
    avgHours: v.number(),
    hoursByLocation: v.array(groupedHoursMetric),
    hoursByDepartment: v.array(groupedHoursMetric),
    hoursByPosition: v.array(groupedHoursMetric),
    employeeDetails: v.array(filteredTrainingEmployee),
  }),
  handler: async (ctx, args) => {
    const trainings = await ctx.db
      .query("socialTrainingRecords")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const filteredTrainings = trainings.filter((training) => {
      if (training.status !== "Concluído") {
        return false;
      }
      if (args.location && training.location !== args.location) {
        return false;
      }
      if (args.department && training.department !== args.department) {
        return false;
      }
      if (args.position && training.position !== args.position) {
        return false;
      }
      return true;
    });

    const employeeHoursMap: Record<
      string,
      {
        employee_id: string;
        employee_name: string;
        location?: string;
        department?: string;
        position?: string;
        hours: number;
      }
    > = {};

    for (const training of filteredTrainings) {
      const existing = employeeHoursMap[training.employeeId];
      if (existing) {
        existing.hours += training.totalHours;
      } else {
        employeeHoursMap[training.employeeId] = {
          employee_id: training.employeeId,
          employee_name: training.employeeName,
          location: training.location,
          department: training.department,
          position: training.position,
          hours: training.totalHours,
        };
      }
    }

    const minHours = args.minHours ?? 0;
    const maxHours = args.maxHours ?? 100;
    const filteredByHours = Object.values(employeeHoursMap).filter(
      (employee) => employee.hours >= minHours && employee.hours <= maxHours,
    );

    const totalHours = filteredByHours.reduce(
      (sum, employee) => sum + employee.hours,
      0,
    );
    const totalEmployees = filteredByHours.length;
    const avgHours = totalEmployees > 0 ? totalHours / totalEmployees : 0;

    const locationGroup: Record<string, { total: number; count: number }> = {};
    const departmentGroup: Record<string, { total: number; count: number }> = {};
    const positionGroup: Record<string, { total: number; count: number }> = {};

    for (const employee of filteredByHours) {
      const location = employee.location ?? "Não especificado";
      const department = employee.department ?? "Não especificado";
      const position = employee.position ?? "Não especificado";

      locationGroup[location] ??= { total: 0, count: 0 };
      locationGroup[location].total += employee.hours;
      locationGroup[location].count += 1;

      departmentGroup[department] ??= { total: 0, count: 0 };
      departmentGroup[department].total += employee.hours;
      departmentGroup[department].count += 1;

      positionGroup[position] ??= { total: 0, count: 0 };
      positionGroup[position].total += employee.hours;
      positionGroup[position].count += 1;
    }

    const toGroupedMetrics = (
      group: Record<string, { total: number; count: number }>,
    ): Array<{ name: string; hours: number; avgHours: number; employees: number }> =>
      Object.entries(group)
        .map(([name, data]) => ({
          name,
          hours: data.total,
          avgHours: Number((data.total / data.count).toFixed(1)),
          employees: data.count,
        }))
        .sort((a, b) => b.hours - a.hours);

    return {
      totalEmployees,
      totalHours,
      avgHours: Number(avgHours.toFixed(1)),
      employeeDetails: filteredByHours.sort((a, b) => b.hours - a.hours),
      hoursByLocation: toGroupedMetrics(locationGroup),
      hoursByDepartment: toGroupedMetrics(departmentGroup),
      hoursByPosition: toGroupedMetrics(positionGroup),
    };
  },
});

export const createSocialProject = mutation({
  args: {
    companyId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    objective: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    status: socialStatusValidator,
    budget: v.optional(v.number()),
    investedAmount: v.number(),
    impactMetrics: v.record(v.string(), v.number()),
    responsibleUserId: v.optional(v.string()),
  },
  returns: v.id("socialProjects"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("socialProjects", {
      companyId: args.companyId,
      name: args.name,
      description: args.description,
      objective: args.objective,
      targetAudience: args.targetAudience,
      location: args.location,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      budget: args.budget,
      investedAmount: args.investedAmount,
      impactMetrics: args.impactMetrics,
      responsibleUserId: args.responsibleUserId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSocialProject = mutation({
  args: {
    id: v.id("socialProjects"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      objective: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      location: v.optional(v.string()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      status: v.optional(socialStatusValidator),
      budget: v.optional(v.number()),
      investedAmount: v.optional(v.number()),
      impactMetrics: v.optional(v.record(v.string(), v.number())),
      responsibleUserId: v.optional(v.string()),
    }),
  },
  returns: v.id("socialProjects"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: new Date().toISOString(),
    });
    return args.id;
  },
});

export const deleteSocialProject = mutation({
  args: {
    id: v.id("socialProjects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Backward-compatible aliases during migration.
export const listByCompany = getSocialProjects;
export const create = createSocialProject;
