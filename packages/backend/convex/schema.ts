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
  sourceId: v.optional(v.string()),
  companyId: v.string(),
  ncNumber: v.optional(v.string()),
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
};

const qualityActionPlan = {
  companyId: v.string(),
  title: v.string(),
  status: v.union(
    v.literal("Planejada"),
    v.literal("Em Execução"),
    v.literal("Concluída"),
    v.literal("Cancelada"),
  ),
  totalItems: v.number(),
  completedItems: v.number(),
  overdueItems: v.number(),
  dueDate: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const qualityRisk = {
  companyId: v.string(),
  title: v.string(),
  level: v.union(
    v.literal("Muito Baixo"),
    v.literal("Baixo"),
    v.literal("Médio"),
    v.literal("Alto"),
    v.literal("Crítico"),
  ),
  status: v.union(
    v.literal("Ativo"),
    v.literal("Mitigado"),
    v.literal("Encerrado"),
  ),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const qualityImmediateAction = {
  sourceId: v.optional(v.string()),
  companyId: v.string(),
  nonConformitySourceId: v.string(),
  description: v.string(),
  responsibleUserId: v.optional(v.string()),
  dueDate: v.string(),
  completionDate: v.optional(v.string()),
  evidence: v.optional(v.string()),
  attachments: v.optional(v.array(v.any())),
  status: v.optional(v.string()),
  createdByUserId: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const qualityCauseAnalysis = {
  sourceId: v.optional(v.string()),
  companyId: v.string(),
  nonConformitySourceId: v.string(),
  analysisMethod: v.string(),
  rootCause: v.optional(v.string()),
  mainCauses: v.optional(v.array(v.string())),
  similarNcIds: v.optional(v.array(v.any())),
  attachments: v.optional(v.array(v.any())),
  ishikawaData: v.optional(v.any()),
  fiveWhysData: v.optional(v.array(v.any())),
  responsibleUserId: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  createdByUserId: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const qualityNcActionPlan = {
  sourceId: v.optional(v.string()),
  companyId: v.string(),
  nonConformitySourceId: v.string(),
  whatAction: v.string(),
  whyReason: v.optional(v.string()),
  howMethod: v.optional(v.string()),
  whereLocation: v.optional(v.string()),
  whoResponsibleId: v.optional(v.string()),
  whenDeadline: v.string(),
  howMuchCost: v.optional(v.string()),
  status: v.optional(v.string()),
  evidence: v.optional(v.string()),
  attachments: v.optional(v.array(v.any())),
  evidenceAttachments: v.optional(v.array(v.any())),
  completionDate: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  orderIndex: v.optional(v.number()),
  createdByUserId: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const qualityEffectiveness = {
  sourceId: v.optional(v.string()),
  companyId: v.string(),
  nonConformitySourceId: v.string(),
  isEffective: v.optional(v.boolean()),
  evidence: v.string(),
  attachments: v.optional(v.array(v.any())),
  requiresRiskUpdate: v.optional(v.boolean()),
  riskUpdateNotes: v.optional(v.string()),
  requiresSgqChange: v.optional(v.boolean()),
  sgqChangeNotes: v.optional(v.string()),
  evaluatedByUserId: v.optional(v.string()),
  evaluatedAt: v.optional(v.string()),
  postponedTo: v.optional(v.string()),
  postponedReason: v.optional(v.string()),
  postponedResponsibleId: v.optional(v.string()),
  revisionNumber: v.optional(v.number()),
  generatedRevisionNcId: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

const supplier = {
  companyId: v.string(),
  personType: v.optional(v.union(v.literal("PF"), v.literal("PJ"))),
  displayName: v.optional(v.string()),
  supplierName: v.optional(v.string()),
  cnpj: v.optional(v.string()),
  category: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  contactPhone: v.optional(v.string()),
  hasInventory: v.optional(v.boolean()),
  scope3Category: v.optional(v.string()),
  annualEmissionsEstimate: v.optional(v.number()),
  dataQualityScore: v.optional(v.number()),
  notes: v.optional(v.string()),
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
    .index("by_companyId_and_status", ["companyId", "status"])
    .index("by_companyId_and_sourceId", ["companyId", "sourceId"]),
  qualityActionPlans: defineTable(qualityActionPlan)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
  qualityRisks: defineTable(qualityRisk)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
  qualityImmediateActions: defineTable(qualityImmediateAction)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_sourceId", ["companyId", "sourceId"])
    .index("by_companyId_and_nonConformitySourceId", [
      "companyId",
      "nonConformitySourceId",
    ]),
  qualityCauseAnalyses: defineTable(qualityCauseAnalysis)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_sourceId", ["companyId", "sourceId"])
    .index("by_companyId_and_nonConformitySourceId", [
      "companyId",
      "nonConformitySourceId",
    ]),
  qualityNcActionPlans: defineTable(qualityNcActionPlan)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_sourceId", ["companyId", "sourceId"])
    .index("by_companyId_and_nonConformitySourceId", [
      "companyId",
      "nonConformitySourceId",
    ]),
  qualityEffectiveness: defineTable(qualityEffectiveness)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_sourceId", ["companyId", "sourceId"])
    .index("by_companyId_and_nonConformitySourceId", [
      "companyId",
      "nonConformitySourceId",
    ])
    .index("by_companyId_and_nonConformitySourceId_and_revisionNumber", [
      "companyId",
      "nonConformitySourceId",
      "revisionNumber",
    ]),
  suppliers: defineTable(supplier)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_category", ["companyId", "category"])
    .index("by_companyId_and_status", ["companyId", "status"]),
});
