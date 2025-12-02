import { supabase } from "@/integrations/supabase/client";

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
    console.error("Error fetching training statuses:", error);
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
    console.error("Error creating training status:", error);
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
    console.error("Error deleting training status:", error);
    throw error;
  }
}
