import { supabase } from "@/integrations/supabase/client";

// Service para funções integradas de gestão de riscos
class RiskManagementService {
    async getRiskManagementStats(): Promise<any> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) throw new Error('Company not found');

        const { data, error } = await supabase
            .rpc('calculate_risk_management_stats', {
                p_company_id: profile.company_id
            });

        if (error) {
            console.error('Error getting risk management stats:', error);
            throw new Error(error.message);
        }

        return data;
    }

    async getDashboardData(): Promise<any> {
        try {
            const [stats, riskTrend] = await Promise.all([
                this.getRiskManagementStats(),
                this.getRiskTrendData()
            ]);

            return {
                ...stats,
                trend: riskTrend
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    private async getRiskTrendData(): Promise<any[]> {
        const { data: risks, error } = await supabase
            .from('esg_risks')
            .select('created_at, inherent_risk_level')
            .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at');

        if (error) {
            console.error('Error getting risk trend:', error);
            return [];
        }

        // Agrupar por mês
        const monthlyData = risks?.reduce((acc, risk) => {
            const month = risk.created_at.substring(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = { total: 0, critical: 0, high: 0 };
            }
            acc[month].total++;
            if (risk.inherent_risk_level === 'Crítico') acc[month].critical++;
            if (risk.inherent_risk_level === 'Alto') acc[month].high++;
            return acc;
        }, {} as Record<string, any>) || {};

        // Converter para array
        return Object.entries(monthlyData).map(([month, data]) => ({
            month,
            ...data
        }));
    }

    async getUpcomingReviews(): Promise<any[]> {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Riscos que precisam de revisão
        const { data: risks } = await supabase
            .from('esg_risks')
            .select('id, risk_title, next_review_date, inherent_risk_level')
            .lte('next_review_date', nextMonth.toISOString().split('T')[0])
            .eq('status', 'Ativo')
            .order('next_review_date');

        // Oportunidades que precisam de revisão
        const { data: opportunities } = await supabase
            .from('opportunities')
            .select('id, title, next_review_date, opportunity_level')
            .lte('next_review_date', nextMonth.toISOString().split('T')[0])
            .in('status', ['Identificada', 'Em Análise', 'Em Implementação'])
            .order('next_review_date');

        return [
            ...(risks || []).map(r => ({ ...r, type: 'risk' })),
            ...(opportunities || []).map(o => ({ ...o, type: 'opportunity' }))
        ];
    }

    async getComplianceStatus(): Promise<any> {
        // Verificar conformidade com ISO 31000
        const stats = await this.getRiskManagementStats();
        
        const requirements = [
            {
                name: 'Identificação de Riscos',
                status: stats.total_risks > 0 ? 'Conforme' : 'Não Conforme',
                description: 'Pelo menos um risco deve ser identificado'
            },
            {
                name: 'Análise de Riscos',
                status: stats.total_risks > 0 ? 'Conforme' : 'Não Conforme',
                description: 'Riscos devem ter probabilidade e impacto definidos'
            },
            {
                name: 'Identificação de Oportunidades',
                status: stats.opportunities_count > 0 ? 'Conforme' : 'Parcial',
                description: 'Oportunidades devem ser identificadas e gerenciadas'
            },
            {
                name: 'Monitoramento de Ocorrências',
                status: 'Conforme', // Sistema permite registro de ocorrências
                description: 'Sistema deve permitir registro de materializações de risco'
            }
        ];

        const conformeCount = requirements.filter(r => r.status === 'Conforme').length;
        const compliance = Math.round((conformeCount / requirements.length) * 100);

        return {
            compliance,
            requirements,
            lastAssessment: new Date().toISOString().split('T')[0]
        };
    }
}

export const riskManagementService = new RiskManagementService();