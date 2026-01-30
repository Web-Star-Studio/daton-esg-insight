import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { OccurrenceMetrics, OccurrenceTrendPoint } from "@/types/entities/quality";

export interface RiskOccurrence {
    id: string;
    company_id: string;
    risk_id: string;
    occurrence_date: string;
    title: string;
    description?: string;
    actual_impact: string; // 'Baixo' | 'Médio' | 'Alto'
    financial_impact?: number;
    operational_impact?: string;
    response_actions?: string;
    lessons_learned?: string;
    status: string; // 'Aberta' | 'Em Tratamento' | 'Resolvida' | 'Fechada'
    responsible_user_id?: string;
    resolution_date?: string;
    prevention_measures?: string;
    created_by_user_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateRiskOccurrenceData {
    risk_id: string;
    occurrence_date: string;
    title: string;
    description?: string;
    actual_impact: 'Baixo' | 'Médio' | 'Alto';
    financial_impact?: number;
    operational_impact?: string;
    response_actions?: string;
    lessons_learned?: string;
    responsible_user_id?: string;
    prevention_measures?: string;
}

class RiskOccurrencesService {
    async getOccurrences(): Promise<RiskOccurrence[]> {
        const { data, error } = await supabase
            .from('risk_occurrences' as 'risk_occurrences')
            .select(`
                *,
                esg_risks!inner(risk_title)
            `)
            .order('occurrence_date', { ascending: false });

        if (error) {
            logger.error('Error fetching risk occurrences', error, 'quality');
            throw new Error(error.message);
        }

        return (data || []) as unknown as RiskOccurrence[];
    }

    async getOccurrencesByRisk(riskId: string): Promise<RiskOccurrence[]> {
        const { data, error } = await supabase
            .from('risk_occurrences' as 'risk_occurrences')
            .select('*')
            .eq('risk_id', riskId)
            .order('occurrence_date', { ascending: false });

        if (error) {
            logger.error('Error fetching occurrences by risk', error, 'quality');
            throw new Error(error.message);
        }

        return (data || []) as unknown as RiskOccurrence[];
    }

    async createOccurrence(occurrence: CreateRiskOccurrenceData): Promise<RiskOccurrence> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('risk_occurrences' as 'risk_occurrences')
            .insert({
                ...occurrence,
                company_id: profile?.company_id,
                created_by_user_id: user.id
            })
            .select()
            .single();

        if (error) {
            logger.error('Error creating risk occurrence', error, 'quality');
            throw new Error(error.message);
        }

        return data as unknown as RiskOccurrence;
    }

    async updateOccurrence(id: string, updates: Partial<CreateRiskOccurrenceData>): Promise<RiskOccurrence> {
        const { data, error } = await supabase
            .from('risk_occurrences' as 'risk_occurrences')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Error updating risk occurrence', error, 'quality');
            throw new Error(error.message);
        }

        return data as unknown as RiskOccurrence;
    }

    async deleteOccurrence(id: string): Promise<void> {
        const { error } = await supabase
            .from('risk_occurrences' as 'risk_occurrences')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Error deleting risk occurrence', error, 'quality');
            throw new Error(error.message);
        }
    }

    async getOccurrenceMetrics(): Promise<OccurrenceMetrics> {
        const occurrences = await this.getOccurrences();
        const currentYear = new Date().getFullYear();
        
        const thisYearOccurrences = occurrences.filter(occ => 
            new Date(occ.occurrence_date).getFullYear() === currentYear
        );

        const byImpact = thisYearOccurrences.reduce((acc, occ) => {
            acc[occ.actual_impact] = (acc[occ.actual_impact] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byStatus = occurrences.reduce((acc, occ) => {
            acc[occ.status] = (acc[occ.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalFinancialImpact = occurrences.reduce((sum, occ) => 
            sum + (occ.financial_impact || 0), 0
        );

        // Calcular tempo médio de resolução
        const resolvedOccurrences = occurrences.filter(occ => 
            occ.status === 'Resolvida' && occ.resolution_date
        );

        const avgResolutionTime = resolvedOccurrences.length > 0 
            ? resolvedOccurrences.reduce((sum, occ) => {
                const occurrenceDate = new Date(occ.occurrence_date);
                const resolutionDate = new Date(occ.resolution_date!);
                return sum + Math.ceil((resolutionDate.getTime() - occurrenceDate.getTime()) / (1000 * 60 * 60 * 24));
            }, 0) / resolvedOccurrences.length
            : 0;

        return {
            total: occurrences.length,
            thisYear: thisYearOccurrences.length,
            open: byStatus['Aberta'] || 0,
            inTreatment: byStatus['Em Tratamento'] || 0,
            resolved: byStatus['Resolvida'] || 0,
            closed: byStatus['Fechada'] || 0,
            byImpact,
            totalFinancialImpact,
            avgResolutionDays: Math.round(avgResolutionTime)
        };
    }

    async getRiskOccurrenceTrend(): Promise<OccurrenceTrendPoint[]> {
        const occurrences = await this.getOccurrences();
        const last6Months: OccurrenceTrendPoint[] = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            const monthOccurrences = occurrences.filter(occ => 
                occ.occurrence_date.startsWith(monthYear)
            );

            last6Months.push({
                month: monthYear,
                count: monthOccurrences.length,
                highImpact: monthOccurrences.filter(occ => occ.actual_impact === 'Alto').length,
                financialImpact: monthOccurrences.reduce((sum, occ) => sum + (occ.financial_impact || 0), 0)
            });
        }

        return last6Months;
    }
}

export const riskOccurrencesService = new RiskOccurrencesService();