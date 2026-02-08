import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const socialProject = {
  companyId: v.string(),
  name: v.string(),
  status: v.union(
    v.literal("Planejado"),
    v.literal("Em Andamento"),
    v.literal("Concluido"),
    v.literal("Cancelado"),
  ),
  budget: v.optional(v.number()),
  investedAmount: v.number(),
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
  qualityNonConformities: defineTable(qualityNc)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
  suppliers: defineTable(supplier)
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_status", ["companyId", "status"]),
});
