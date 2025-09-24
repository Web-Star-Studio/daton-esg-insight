import { supabase } from "@/integrations/supabase/client";

export interface Opportunity {
    id: string;
    company_id: string;
    title: string;
    description?: string;
    category: string;
    probability: string; // 'Baixa' | 'Média' | 'Alta'
    impact: string; // 'Baixo' | 'Médio' | 'Alto'
    opportunity_level: string;
    status: string; // 'Identificada' | 'Em Análise' | 'Em Implementação' | 'Implementada' | 'Descartada'
    responsible_user_id?: string;
    identification_date: string;
    target_date?: string;
    potential_value?: number;
    implementation_cost?: number;
    roi_estimate?: number;
    mitigation_actions?: string;
    monitoring_indicators?: string;
    review_date?: string;
    next_review_date?: string;
    created_by_user_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateOpportunityData {
    title: string;
    description?: string;
    category: string;
    probability: 'Baixa' | 'Média' | 'Alta';
    impact: 'Baixo' | 'Médio' | 'Alto';
    responsible_user_id?: string;
    target_date?: string;
    potential_value?: number;
    implementation_cost?: number;
    roi_estimate?: number;
    mitigation_actions?: string;
    monitoring_indicators?: string;
}

class OpportunitiesService {
    async getOpportunities(): Promise<Opportunity[]> {
        const { data, error } = await supabase
            .from('opportunities')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching opportunities:', error);
            throw new Error(error.message);
        }

        return (data || []) as Opportunity[];
    }

    async getOpportunity(id: string): Promise<Opportunity | null> {
        const { data, error } = await supabase
            .from('opportunities')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching opportunity:', error);
            throw new Error(error.message);
        }

        return data as Opportunity;
    }

    async createOpportunity(opportunity: CreateOpportunityData): Promise<Opportunity> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: { user: userProfile } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('opportunities' as any)
            .insert({
                ...opportunity,
                company_id: profile?.company_id,
                created_by_user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating opportunity:', error);
            throw new Error(error.message);
        }

        return data as unknown as Opportunity;
    }

    async updateOpportunity(id: string, updates: Partial<CreateOpportunityData>): Promise<Opportunity> {
        const { data, error } = await supabase
            .from('opportunities' as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating opportunity:', error);
            throw new Error(error.message);
        }

        return data as unknown as Opportunity;
    }

    async deleteOpportunity(id: string): Promise<void> {
        const { error } = await supabase
            .from('opportunities' as any)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting opportunity:', error);
            throw new Error(error.message);
        }
    }

    async getOpportunityMatrix(): Promise<any> {
        const opportunities = await this.getOpportunities();
        
        const matrix: any = {};
        const probabilityLevels = ['Baixa', 'Média', 'Alta'];
        const impactLevels = ['Baixo', 'Médio', 'Alto'];

        probabilityLevels.forEach(prob => {
            matrix[prob] = {};
            impactLevels.forEach(impact => {
                matrix[prob][impact] = opportunities.filter(
                    op => op.probability === prob && op.impact === impact && op.status !== 'Descartada'
                ).length;
            });
        });

        return matrix;
    }

    async getOpportunityMetrics(): Promise<any> {
        const opportunities = await this.getOpportunities();
        const activeOpportunities = opportunities.filter(op => op.status !== 'Descartada');

        const byCategory = activeOpportunities.reduce((acc, op) => {
            acc[op.category] = (acc[op.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byLevel = activeOpportunities.reduce((acc, op) => {
            acc[op.opportunity_level] = (acc[op.opportunity_level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalPotentialValue = activeOpportunities.reduce((sum, op) => 
            sum + (op.potential_value || 0), 0
        );

        const totalImplementationCost = activeOpportunities.reduce((sum, op) => 
            sum + (op.implementation_cost || 0), 0
        );

        return {
            total: activeOpportunities.length,
            critical: byLevel['Crítica'] || 0,
            high: byLevel['Alta'] || 0,
            inImplementation: opportunities.filter(op => op.status === 'Em Implementação').length,
            implemented: opportunities.filter(op => op.status === 'Implementada').length,
            byCategory,
            byLevel,
            totalPotentialValue,
            totalImplementationCost,
            potentialROI: totalImplementationCost > 0 ? 
                ((totalPotentialValue - totalImplementationCost) / totalImplementationCost) * 100 : 0
        };
    }
}

export const opportunitiesService = new OpportunitiesService();