import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const socialProject = {
  companyId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  objective: v.optional(v.string()),
  targetAudience: v.optional(v.string()),
  location: v.optional(v.string()),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  status: v.union(
    v.literal("Planejado"),
    v.literal("Em Andamento"),
    v.literal("Concluído"),
    v.literal("Cancelado"),
  ),
  budget: v.optional(v.number()),
  investedAmount: v.number(),
  impactMetrics: v.record(v.string(), v.number()),
  responsibleUserId: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const socialEmployee = {
  companyId: v.string(),
  fullName: v.string(),
  status: v.string(),
  department: v.optional(v.string()),
  position: v.optional(v.string()),
  location: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const socialTrainingRecord = {
  companyId: v.string(),
  employeeId: v.string(),
  employeeName: v.string(),
  department: v.optional(v.string()),
  position: v.optional(v.string()),
  location: v.optional(v.string()),
  totalHours: v.number(),
  status: v.string(),
  score: v.optional(v.number()),
  completionDate: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const socialSafetyIncident = {
  companyId: v.string(),
  incidentDate: v.string(),
  severity: v.string(),
  daysLost: v.number(),
  medicalTreatmentRequired: v.boolean(),
  status: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const qualityNc = {
  companyId: v.string(),
  title: v.string(),
  severity: v.union(
    v.literal("Baixa"),
    v.literal("Media"),
    v.literal("Alta"),
    v.literal("Critica"),
  ),
  status: v.union(
    v.literal("Aberta"),
    v.literal("Em Andamento"),
    v.literal("Resolvida"),
    v.literal("Fechada"),
  ),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const supplier = {
  companyId: v.string(),
  personType: v.union(v.literal("PF"), v.literal("PJ")),
  displayName: v.string(),
  status: v.union(
    v.literal("Ativo"),
    v.literal("Inativo"),
    v.literal("Suspenso"),
  ),
  createdAt: v.string(),
  updatedAt: v.string(),
};

export default defineSchema({
  socialProjects: defineTable(socialProject)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
  socialEmployees: defineTable(socialEmployee)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
  socialTrainingRecords: defineTable(socialTrainingRecord)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"])
    .index("by_companyId_and_employeeId", ["companyId", "employeeId"]),
  socialSafetyIncidents: defineTable(socialSafetyIncident)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
  qualityNonConformities: defineTable(qualityNc)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
  suppliers: defineTable(supplier)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
});
