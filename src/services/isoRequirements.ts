import { supabase } from "@/integrations/supabase/client";

export type ISOStandardType = 'ISO_9001' | 'ISO_14001' | 'ISO_39001' | 'ISO_45001';

export interface ISORequirement {
  id: string;
  standard: ISOStandardType;
  version: string;
  clause_number: string;
  clause_title: string;
  description: string;
  guidance_notes?: string;
  evidence_examples?: string[];
  active: boolean;
  created_at: string;
}

export class ISORequirementsService {
  async getAllRequirements(): Promise<ISORequirement[]> {
    const { data, error } = await supabase
      .from('iso_requirements')
      .select('*')
      .eq('active', true)
      .order('standard')
      .order('clause_number');

    if (error) throw error;
    return (data || []) as unknown as ISORequirement[];
  }

  async getRequirementsByStandard(standard: ISOStandardType): Promise<ISORequirement[]> {
    const { data, error } = await supabase
      .from('iso_requirements')
      .select('*')
      .eq('standard', standard)
      .eq('active', true)
      .order('clause_number');

    if (error) throw error;
    return (data || []) as unknown as ISORequirement[];
  }

  async searchRequirements(searchTerm: string): Promise<ISORequirement[]> {
    const { data, error } = await supabase
      .from('iso_requirements')
      .select('*')
      .or(`clause_title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,clause_number.ilike.%${searchTerm}%`)
      .eq('active', true)
      .order('standard')
      .order('clause_number');

    if (error) throw error;
    return (data || []) as unknown as ISORequirement[];
  }
}

export const isoRequirementsService = new ISORequirementsService();
