import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const supplierReturn = v.object({
  id: v.id("suppliers"),
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
});

export const listByCompany = query({
  args: {
    companyId: v.string(),
  },
  returns: v.array(supplierReturn),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("suppliers")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return rows.map((row) => ({
      id: row._id,
      companyId: row.companyId,
      personType: row.personType,
      displayName: row.displayName,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const create = mutation({
  args: {
    companyId: v.string(),
    personType: v.union(v.literal("PF"), v.literal("PJ")),
    displayName: v.string(),
    status: v.union(
      v.literal("Ativo"),
      v.literal("Inativo"),
      v.literal("Suspenso"),
    ),
  },
  returns: v.id("suppliers"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("suppliers", {
      companyId: args.companyId,
      personType: args.personType,
      displayName: args.displayName,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});
