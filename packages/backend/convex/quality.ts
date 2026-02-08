import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const qualityNcReturn = v.object({
  id: v.id("qualityNonConformities"),
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
});

export const listByCompany = query({
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
      title: row.title,
      severity: row.severity,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const create = mutation({
  args: {
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
  },
  returns: v.id("qualityNonConformities"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("qualityNonConformities", {
      companyId: args.companyId,
      title: args.title,
      severity: args.severity,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});
