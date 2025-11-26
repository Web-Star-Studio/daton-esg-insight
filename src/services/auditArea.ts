import { supabase } from "@/integrations/supabase/client";

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditArea {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  department?: string;
  process_owner_id?: string;
  applicable_standards?: any;
  risk_level: RiskLevel;
  last_audit_date?: string;
  next_audit_date?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAuditAreaData {
  name: string;
  description?: string;
  department?: string;
  process_owner_id?: string;
  applicable_standards?: any;
  risk_level?: RiskLevel;
  next_audit_date?: string;
}

export class AuditAreaService {
  async getAreas(): Promise<AuditArea[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_areas')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as unknown as AuditArea[];
  }

  async createArea(areaData: CreateAuditAreaData): Promise<AuditArea> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_areas')
      .insert([{
        ...areaData,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AuditArea;
  }

  async updateArea(id: string, updates: Partial<AuditArea>): Promise<AuditArea> {
    const { data, error } = await supabase
      .from('audit_areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AuditArea;
  }

  async deleteArea(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_areas')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
  }
}

export const auditAreaService = new AuditAreaService();
