import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

import type { OnboardingFlowState, OnboardingUser } from "./types";

interface OnboardingSelectionRecord {
  id?: string;
  user_id: string;
  company_id: string;
  current_step: number;
  selected_modules: string[];
  module_configurations: Json;
  company_profile: Json;
  is_completed: boolean;
  updated_at?: string;
  completed_at?: string;
}

const getCompanyIdFromProfile = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (error || !data?.company_id) {
    return null;
  }

  return data.company_id as string;
};

export const fetchOnboardingSelection = async (
  userId: string,
): Promise<OnboardingSelectionRecord | null> => {
  const { data, error } = await supabase
    .from("onboarding_selections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as OnboardingSelectionRecord;
};

export const resolveCompanyIdForSave = async (
  user: OnboardingUser,
): Promise<string | null> => {
  if (user.company?.id) {
    return user.company.id;
  }

  return getCompanyIdFromProfile(user.id);
};

export const resolveCompanyIdForCompletion = async (
  user: OnboardingUser,
): Promise<string> => {
  const companyId = await resolveCompanyIdForSave(user);

  if (!companyId) {
    throw new Error("Company ID not found");
  }

  return companyId;
};

export const upsertOnboardingProgress = async ({
  userId,
  companyId,
  state,
}: {
  userId: string;
  companyId: string;
  state: OnboardingFlowState;
}): Promise<OnboardingSelectionRecord> => {
  const payload: OnboardingSelectionRecord = {
    user_id: userId,
    company_id: companyId,
    current_step: state.currentStep,
    selected_modules: state.selectedModules,
    module_configurations: state.moduleConfigurations as unknown as Json,
    company_profile: (state.companyProfile || {}) as unknown as Json,
    is_completed: state.isCompleted,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("onboarding_selections")
    .upsert([payload], {
      onConflict: "user_id",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as OnboardingSelectionRecord;
};

export const finalizeOnboardingInDatabase = async ({
  userId,
  companyId,
  state,
}: {
  userId: string;
  companyId: string;
  state: OnboardingFlowState;
}): Promise<void> => {
  const { error: updateError } = await supabase
    .from("onboarding_selections")
    .upsert(
      [
        {
          user_id: userId,
          company_id: companyId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          selected_modules: state.selectedModules,
          module_configurations: state.moduleConfigurations as unknown as Json,
          company_profile: (state.companyProfile || {}) as unknown as Json,
          current_step: state.totalSteps - 1,
        },
      ],
      {
        onConflict: "user_id",
      },
    );

  if (updateError && updateError.code !== "23505") {
    throw updateError;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ has_completed_onboarding: true })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }
};
