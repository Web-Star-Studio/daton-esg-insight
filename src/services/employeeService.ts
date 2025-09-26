import { supabase } from "@/integrations/supabase/client";

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "Ativo")
    .order("full_name");

  if (error) throw error;
  return data || [];
};