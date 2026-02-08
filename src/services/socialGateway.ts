import { ConvexHttpClient } from "convex/browser";
import { supabase } from "@/integrations/supabase/client";
import {
  getEmployeesStats as getEmployeesStatsSupabase,
} from "@/services/employees";
import {
  getSafetyMetrics as getSafetyMetricsSupabase,
} from "@/services/safetyIncidents";
import {
  getTrainingMetrics as getTrainingMetricsSupabase,
} from "@/services/trainingPrograms";
import {
  getSocialImpactMetrics as getSocialImpactMetricsSupabase,
  getSocialProjects as getSocialProjectsSupabase,
  createSocialProject as createSocialProjectSupabase,
  updateSocialProject as updateSocialProjectSupabase,
  deleteSocialProject as deleteSocialProjectSupabase,
  SocialProject,
} from "@/services/socialProjects";
import {
  getFilterOptions as getFilterOptionsSupabase,
  getFilteredTrainingMetrics as getFilteredTrainingMetricsSupabase,
} from "@/services/socialDashboard";
import type {
  EmployeesStats,
  FilteredTrainingMetrics,
  SafetyMetrics,
  SocialFilterOptions,
  SocialFilters,
  SocialImpactMetrics,
  SocialProjectContract,
  TrainingMetrics,
} from "@ws/shared";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convexEnabled = import.meta.env.VITE_USE_CONVEX_SOCIAL === "true" && !!convexUrl;

const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

async function getCurrentUserCompanyId(): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("Empresa não encontrada para o usuário");
  }

  return profile.company_id;
}

async function convexQuery<T>(name: string, args: Record<string, unknown>): Promise<T> {
  if (!convexClient) {
    throw new Error("Convex não configurado");
  }

  return (await convexClient.query(
    name as unknown as never,
    args as unknown as never,
  )) as T;
}

async function convexMutation<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!convexClient) {
    throw new Error("Convex não configurado");
  }

  return (await convexClient.mutation(
    name as unknown as never,
    args as unknown as never,
  )) as T;
}

function mapProjectFromConvex(project: SocialProjectContract): SocialProject {
  return {
    id: project.id,
    company_id: project.companyId,
    name: project.name,
    description: project.description,
    objective: project.objective,
    target_audience: project.targetAudience,
    location: project.location,
    start_date: project.startDate,
    end_date: project.endDate,
    budget: project.budget,
    invested_amount: project.investedAmount,
    status: project.status,
    impact_metrics: project.impactMetrics,
    responsible_user_id: project.responsibleUserId,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

function normalizeImpactMetrics(value: unknown): Record<string, any> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
}

function normalizeProjectFromSupabase(project: SocialProject): SocialProject {
  return {
    ...project,
    impact_metrics: normalizeImpactMetrics(project.impact_metrics),
  };
}

function mapProjectToConvexInput(
  project: Omit<SocialProject, "id" | "created_at" | "updated_at">,
): Omit<SocialProjectContract, "id" | "createdAt" | "updatedAt"> {
  return {
    companyId: project.company_id,
    name: project.name,
    description: project.description,
    objective: project.objective,
    targetAudience: project.target_audience,
    location: project.location,
    startDate: project.start_date,
    endDate: project.end_date,
    budget: project.budget,
    investedAmount: project.invested_amount,
    status: project.status as SocialProjectContract["status"],
    impactMetrics: project.impact_metrics as Record<string, number>,
    responsibleUserId: project.responsible_user_id,
  };
}

function mapProjectUpdatesToConvex(
  updates: Partial<SocialProject>,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.objective !== undefined) mapped.objective = updates.objective;
  if (updates.target_audience !== undefined) {
    mapped.targetAudience = updates.target_audience;
  }
  if (updates.location !== undefined) mapped.location = updates.location;
  if (updates.start_date !== undefined) mapped.startDate = updates.start_date;
  if (updates.end_date !== undefined) mapped.endDate = updates.end_date;
  if (updates.budget !== undefined) mapped.budget = updates.budget;
  if (updates.invested_amount !== undefined) {
    mapped.investedAmount = updates.invested_amount;
  }
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.impact_metrics !== undefined) {
    mapped.impactMetrics = updates.impact_metrics;
  }
  if (updates.responsible_user_id !== undefined) {
    mapped.responsibleUserId = updates.responsible_user_id;
  }

  return mapped;
}

export { type SocialProject };

export async function getEmployeesStats(): Promise<EmployeesStats> {
  if (!convexEnabled) {
    return (await getEmployeesStatsSupabase()) as EmployeesStats;
  }

  const companyId = await getCurrentUserCompanyId();
  return await convexQuery<EmployeesStats>("social:getEmployeesStats", {
    companyId,
  });
}

export async function getSafetyMetrics(): Promise<SafetyMetrics> {
  if (!convexEnabled) {
    return (await getSafetyMetricsSupabase()) as SafetyMetrics;
  }

  const companyId = await getCurrentUserCompanyId();
  return await convexQuery<SafetyMetrics>("social:getSafetyMetrics", {
    companyId,
  });
}

export async function getTrainingMetrics(): Promise<TrainingMetrics> {
  if (!convexEnabled) {
    return (await getTrainingMetricsSupabase()) as TrainingMetrics;
  }

  const companyId = await getCurrentUserCompanyId();
  return await convexQuery<TrainingMetrics>("social:getTrainingMetrics", {
    companyId,
  });
}

export async function getSocialImpactMetrics(): Promise<SocialImpactMetrics> {
  if (!convexEnabled) {
    return (await getSocialImpactMetricsSupabase()) as SocialImpactMetrics;
  }

  const companyId = await getCurrentUserCompanyId();
  return await convexQuery<SocialImpactMetrics>("social:getSocialImpactMetrics", {
    companyId,
  });
}

export async function getSocialProjects(): Promise<Array<SocialProject>> {
  if (!convexEnabled) {
    const projects = (await getSocialProjectsSupabase()) ?? [];
    return projects.map((project) =>
      normalizeProjectFromSupabase(project as SocialProject),
    );
  }

  const companyId = await getCurrentUserCompanyId();
  const projects = await convexQuery<Array<SocialProjectContract>>(
    "social:getSocialProjects",
    { companyId },
  );

  return projects.map(mapProjectFromConvex);
}

export async function createSocialProject(
  project: Omit<SocialProject, "id" | "created_at" | "updated_at">,
): Promise<SocialProject> {
  if (!convexEnabled) {
    const created = await createSocialProjectSupabase(project);
    return normalizeProjectFromSupabase(created as SocialProject);
  }

  const companyId = await getCurrentUserCompanyId();
  const projectId = await convexMutation<string>("social:createSocialProject", {
    ...mapProjectToConvexInput({ ...project, company_id: companyId }),
  });

  const projects = await getSocialProjects();
  const created = projects.find((item) => item.id === projectId);

  if (!created) {
    throw new Error("Projeto social criado, mas não encontrado após atualização");
  }

  return created;
}

export async function updateSocialProject(
  id: string,
  updates: Partial<SocialProject>,
): Promise<SocialProject> {
  if (!convexEnabled) {
    const updated = await updateSocialProjectSupabase(id, updates);
    return normalizeProjectFromSupabase(updated as SocialProject);
  }

  await convexMutation<string>("social:updateSocialProject", {
    id,
    updates: mapProjectUpdatesToConvex(updates),
  });

  const projects = await getSocialProjects();
  const updated = projects.find((item) => item.id === id);

  if (!updated) {
    throw new Error("Projeto social atualizado, mas não encontrado após atualização");
  }

  return updated;
}

export async function deleteSocialProject(id: string): Promise<void> {
  if (!convexEnabled) {
    await deleteSocialProjectSupabase(id);
    return;
  }

  await convexMutation<null>("social:deleteSocialProject", { id });
}

export async function getFilterOptions(): Promise<SocialFilterOptions> {
  if (!convexEnabled) {
    return await getFilterOptionsSupabase();
  }

  const companyId = await getCurrentUserCompanyId();
  return await convexQuery<SocialFilterOptions>("social:getFilterOptions", {
    companyId,
  });
}

export async function getFilteredTrainingMetrics(
  filters: SocialFilters,
): Promise<FilteredTrainingMetrics> {
  if (!convexEnabled) {
    return (await getFilteredTrainingMetricsSupabase(filters)) as FilteredTrainingMetrics;
  }

  const companyId = await getCurrentUserCompanyId();

  return await convexQuery<FilteredTrainingMetrics>(
    "social:getFilteredTrainingMetrics",
    {
      companyId,
      location: filters.location || undefined,
      department: filters.department || undefined,
      position: filters.position || undefined,
      minHours: filters.minHours ?? undefined,
      maxHours: filters.maxHours ?? undefined,
    },
  );
}
