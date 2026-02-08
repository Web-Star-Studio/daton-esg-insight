import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const supplierStatusValidator = v.union(
  v.literal("Ativo"),
  v.literal("Inativo"),
  v.literal("Suspenso"),
);

const personTypeValidator = v.union(v.literal("PF"), v.literal("PJ"));

const supplierReturn = v.object({
  id: v.id("suppliers"),
  companyId: v.string(),
  personType: v.optional(personTypeValidator),
  displayName: v.optional(v.string()),
  status: supplierStatusValidator,
  createdAt: v.string(),
  updatedAt: v.string(),
});

const emissionSupplierReturn = v.object({
  id: v.id("suppliers"),
  companyId: v.string(),
  supplierName: v.string(),
  cnpj: v.optional(v.string()),
  category: v.string(),
  contactEmail: v.optional(v.string()),
  contactPhone: v.optional(v.string()),
  hasInventory: v.boolean(),
  scope3Category: v.string(),
  annualEmissionsEstimate: v.optional(v.number()),
  dataQualityScore: v.number(),
  notes: v.optional(v.string()),
  status: supplierStatusValidator,
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
      displayName: row.displayName ?? row.supplierName,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const create = mutation({
  args: {
    companyId: v.string(),
    personType: personTypeValidator,
    displayName: v.string(),
    status: supplierStatusValidator,
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

export const getEmissionSuppliers = query({
  args: {
    companyId: v.string(),
  },
  returns: v.array(emissionSupplierReturn),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("suppliers")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return rows
      .filter((row) => !!row.supplierName)
      .map((row) => ({
        id: row._id,
        companyId: row.companyId,
        supplierName: row.supplierName ?? row.displayName ?? "",
        cnpj: row.cnpj,
        category: row.category ?? "other",
        contactEmail: row.contactEmail,
        contactPhone: row.contactPhone,
        hasInventory: row.hasInventory ?? false,
        scope3Category: row.scope3Category ?? "1",
        annualEmissionsEstimate: row.annualEmissionsEstimate,
        dataQualityScore: row.dataQualityScore ?? 3,
        notes: row.notes,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
  },
});

export const createEmissionSupplier = mutation({
  args: {
    companyId: v.string(),
    supplierName: v.string(),
    cnpj: v.optional(v.string()),
    category: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    hasInventory: v.optional(v.boolean()),
    scope3Category: v.optional(v.string()),
    annualEmissionsEstimate: v.optional(v.number()),
    dataQualityScore: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(supplierStatusValidator),
  },
  returns: v.id("suppliers"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("suppliers", {
      companyId: args.companyId,
      supplierName: args.supplierName,
      displayName: args.supplierName,
      cnpj: args.cnpj,
      category: args.category,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      hasInventory: args.hasInventory ?? false,
      scope3Category: args.scope3Category ?? "1",
      annualEmissionsEstimate: args.annualEmissionsEstimate,
      dataQualityScore: args.dataQualityScore ?? 3,
      notes: args.notes,
      status: args.status ?? "Ativo",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateEmissionSupplier = mutation({
  args: {
    id: v.id("suppliers"),
    updates: v.object({
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
      status: v.optional(supplierStatusValidator),
    }),
  },
  returns: v.id("suppliers"),
  handler: async (ctx, args) => {
    const updates: {
      supplierName?: string;
      displayName?: string;
      cnpj?: string;
      category?: string;
      contactEmail?: string;
      contactPhone?: string;
      hasInventory?: boolean;
      scope3Category?: string;
      annualEmissionsEstimate?: number;
      dataQualityScore?: number;
      notes?: string;
      status?: "Ativo" | "Inativo" | "Suspenso";
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (args.updates.supplierName !== undefined) {
      updates.supplierName = args.updates.supplierName;
      updates.displayName = args.updates.supplierName;
    }
    if (args.updates.cnpj !== undefined) updates.cnpj = args.updates.cnpj;
    if (args.updates.category !== undefined) updates.category = args.updates.category;
    if (args.updates.contactEmail !== undefined) {
      updates.contactEmail = args.updates.contactEmail;
    }
    if (args.updates.contactPhone !== undefined) {
      updates.contactPhone = args.updates.contactPhone;
    }
    if (args.updates.hasInventory !== undefined) {
      updates.hasInventory = args.updates.hasInventory;
    }
    if (args.updates.scope3Category !== undefined) {
      updates.scope3Category = args.updates.scope3Category;
    }
    if (args.updates.annualEmissionsEstimate !== undefined) {
      updates.annualEmissionsEstimate = args.updates.annualEmissionsEstimate;
    }
    if (args.updates.dataQualityScore !== undefined) {
      updates.dataQualityScore = args.updates.dataQualityScore;
    }
    if (args.updates.notes !== undefined) updates.notes = args.updates.notes;
    if (args.updates.status !== undefined) updates.status = args.updates.status;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const deleteEmissionSupplier = mutation({
  args: {
    id: v.id("suppliers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
