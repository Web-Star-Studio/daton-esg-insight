import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const socialProjectReturn = v.object({
  id: v.id("socialProjects"),
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
});

export const listByCompany = query({
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
      status: row.status,
      budget: row.budget,
      investedAmount: row.investedAmount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const create = mutation({
  args: {
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
  },
  returns: v.id("socialProjects"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("socialProjects", {
      companyId: args.companyId,
      name: args.name,
      status: args.status,
      budget: args.budget,
      investedAmount: args.investedAmount,
      createdAt: now,
      updatedAt: now,
    });
  },
});
