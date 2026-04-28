// Resolve company_id do usuário autenticado.
//
// Usado em services/queries que precisam escopar leituras por empresa.
// Sem esse filtro, queries do Postgrest podem retornar registros de outras
// companies até o limite default de 1000 rows, contaminando KPIs e listagens.

import { supabase } from "@/integrations/supabase/client";

export async function getCurrentCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  return profile.company_id;
}
