/**
 * Audit Scoring Service
 * Serviço para cálculos e pontuação de auditorias
 */

import { supabase } from "@/integrations/supabase/client";

export interface ScoringConfig {
  id: string;
  company_id: string;
  audit_id: string;
  scoring_method: 'weighted' | 'simple' | 'percentage';
  response_weights: Record<string, number>;
  nc_major_penalty: number;
  nc_minor_penalty: number;
  observation_penalty: number;
  opportunity_bonus: number;
  include_na_in_total: boolean;
  max_score: number;
  passing_score: number;
  session_weights: Record<string, number>;
  standard_weights: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface ScoringResult {
  id: string;
  company_id: string;
  audit_id: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  total_items: number;
  responded_items: number;
  conforming_items: number;
  non_conforming_items: number;
  partial_items: number;
  na_items: number;
  nc_major_count: number;
  nc_minor_count: number;
  observation_count: number;
  opportunity_count: number;
  session_scores: Record<string, { score: number; max: number; percentage: number }>;
  standard_scores: Record<string, { score: number; max: number; percentage: number }>;
  grade: string | null;
  status: 'pending' | 'passed' | 'failed' | 'conditional';
  calculated_at: string;
  calculated_by: string | null;
  calculation_version: number;
  created_at: string;
  updated_at: string;
}

export interface GradeConfig {
  id: string;
  company_id: string;
  name: string;
  is_default: boolean;
  grades: GradeLevel[];
  created_at: string;
  updated_at: string;
}

export interface GradeLevel {
  grade: string;
  min_percentage: number;
  max_percentage: number;
  label: string;
  color: string;
}

export interface CalculationResult {
  total_score: number;
  max_possible_score: number;
  percentage: number;
  total_items: number;
  responded_items: number;
  conforming_items: number;
  non_conforming_items: number;
  partial_items: number;
  na_items: number;
  nc_major_count: number;
  nc_minor_count: number;
  observation_count: number;
  opportunity_count: number;
}

export const ScoringService = {
  // Scoring Config
  async getScoringConfig(auditId: string): Promise<ScoringConfig | null> {
    const { data, error } = await supabase
      .from('audit_scoring_config')
      .select('*')
      .eq('audit_id', auditId)
      .maybeSingle();

    if (error) throw error;
    return data as ScoringConfig | null;
  },

  async createOrUpdateScoringConfig(
    auditId: string,
    companyId: string,
    config: Partial<ScoringConfig>
  ): Promise<ScoringConfig> {
    const { data, error } = await supabase
      .from('audit_scoring_config')
      .upsert({
        audit_id: auditId,
        company_id: companyId,
        ...config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'audit_id' })
      .select()
      .single();

    if (error) throw error;
    return data as ScoringConfig;
  },

  // Scoring Results
  async getScoringResult(auditId: string): Promise<ScoringResult | null> {
    const { data, error } = await supabase
      .from('audit_scoring_results')
      .select('*')
      .eq('audit_id', auditId)
      .maybeSingle();

    if (error) throw error;
    return data as ScoringResult | null;
  },

  async calculateScore(auditId: string): Promise<CalculationResult> {
    const { data, error } = await supabase
      .rpc('calculate_audit_score', { p_audit_id: auditId });

    if (error) throw error;
    return data as unknown as CalculationResult;
  },

  async updateGrade(auditId: string, grade: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('audit_scoring_results')
      .update({ 
        grade, 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('audit_id', auditId);

    if (error) throw error;
  },

  // Grade Config
  async getGradeConfigs(companyId: string): Promise<GradeConfig[]> {
    const { data, error } = await supabase
      .from('audit_grade_config')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      grades: d.grades as unknown as GradeLevel[]
    })) as GradeConfig[];
  },

  async getDefaultGradeConfig(companyId: string): Promise<GradeConfig | null> {
    const { data, error } = await supabase
      .from('audit_grade_config')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { ...data, grades: data.grades as unknown as GradeLevel[] } as GradeConfig;
  },

  async createGradeConfig(
    companyId: string,
    config: Omit<GradeConfig, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<GradeConfig> {
    const { data, error } = await supabase
      .from('audit_grade_config')
      .insert({
        company_id: companyId,
        name: config.name,
        is_default: config.is_default,
        grades: config.grades as unknown as any
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, grades: data.grades as unknown as GradeLevel[] } as GradeConfig;
  },

  async updateGradeConfig(
    id: string,
    config: Partial<GradeConfig>
  ): Promise<GradeConfig> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (config.name !== undefined) updateData.name = config.name;
    if (config.is_default !== undefined) updateData.is_default = config.is_default;
    if (config.grades !== undefined) updateData.grades = config.grades;

    const { data, error } = await supabase
      .from('audit_grade_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { ...data, grades: data.grades as unknown as GradeLevel[] } as GradeConfig;
  },

  async deleteGradeConfig(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_grade_config')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Utility functions
  determineGrade(percentage: number, grades: GradeLevel[]): GradeLevel | null {
    const sortedGrades = [...grades].sort((a, b) => b.min_percentage - a.min_percentage);
    return sortedGrades.find(g => percentage >= g.min_percentage && percentage <= g.max_percentage) || null;
  },

  determineStatus(percentage: number, passingScore: number): 'passed' | 'failed' | 'conditional' {
    if (percentage >= passingScore) return 'passed';
    if (percentage >= passingScore * 0.8) return 'conditional';
    return 'failed';
  },

  getDefaultGrades(): GradeLevel[] {
    return [
      { grade: 'A', min_percentage: 90, max_percentage: 100, label: 'Excelente', color: '#22c55e' },
      { grade: 'B', min_percentage: 80, max_percentage: 89.99, label: 'Bom', color: '#84cc16' },
      { grade: 'C', min_percentage: 70, max_percentage: 79.99, label: 'Regular', color: '#eab308' },
      { grade: 'D', min_percentage: 50, max_percentage: 69.99, label: 'Insuficiente', color: '#f97316' },
      { grade: 'F', min_percentage: 0, max_percentage: 49.99, label: 'Reprovado', color: '#ef4444' }
    ];
  }
};
