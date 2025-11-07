import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "Ativo")
    .order("full_name");

  if (error) throw error;
  return data || [];
};

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });
};