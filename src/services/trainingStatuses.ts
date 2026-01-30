import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface TrainingStatus {
  id: string;
  name: string;
  color: string;
  company_id: string | null;
  created_at: string;
}

export async function getTrainingStatuses(companyId?: string): Promise<TrainingStatus[]> {
  let query = supabase
    .from("training_statuses")
    .select("*")
    .order("name");

  if (companyId) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Error fetching training statuses", error, "training");
    throw error;
  }

  return (data || []) as TrainingStatus[];
}

export async function createTrainingStatus(
  name: string,
  companyId: string,
  color: string = "bg-gray-500"
): Promise<TrainingStatus> {
  const { data, error } = await supabase
    .from("training_statuses")
    .insert({
      name,
      color,
      company_id: companyId,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error creating training status", error, "training");
    throw error;
  }

  return data as TrainingStatus;
}

export async function deleteTrainingStatus(id: string): Promise<void> {
  const { error } = await supabase
    .from("training_statuses")
    .delete()
    .eq("id", id);

  if (error) {
    logger.error("Error deleting training status", error, "training");
    throw error;
  }
}
