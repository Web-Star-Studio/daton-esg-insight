import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  ShoppingCart, 
  Shield, 
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Target,
  Coins,
  PieChart
} from "lucide-react";
import { calculateSustainableInvestments, type SustainableInvestmentResult } from "@/services/sustainableInvestmentAnalysis";
import { SustainableInvestmentDashboard } from "@/components/economic/SustainableInvestmentDashboard";
import { calculateSustainableRevenue, type SustainableRevenueResult } from "@/services/sustainableRevenueAnalysis";
import { SustainableRevenueDashboard } from "@/components/economic/SustainableRevenueDashboard";
import { calculateEconomicValueDistribution, type EconomicValueDistributionResult } from "@/services/economicValueDistribution";
import { EconomicValueDistributionDashboard } from "@/components/economic/EconomicValueDistributionDashboard";

interface EconomicDataCollectionModuleProps {
  reportId: string;
  onComplete?: () => void;
}

const ECONOMIC_QUESTIONS = [
  {
    id: 'financial_statements',
    icon: FileText,
    title: 'Demonstrações Financeiras',
    question: 'A organização possui demonstrações financeiras atualizadas (Balanço Patrimonial, DRE)?',
    helpText: 'Balanço, DRE, Demonstração de Fluxo de Caixa, preferencialmente auditadas.',
    fields: ['has_financial_statements', 'balance_sheet_date', 'income_statement_date', 'financial_statements_audited', 'auditor_name'],
    requiredDocuments: ['Balanço Patrimonial', 'DRE', 'Demonstração Fluxo de Caixa', 'Relatório Auditoria'],
    griStandards: ['GRI 201-1'],
    dataIntegration: 'companies'
  },
  {
    id: 'performance_reports',
    icon: BarChart3,
    title: 'Relatórios de Desempenho',
    question: 'Existem relatórios de desempenho econômico/financeiro com análises?',
    helpText: 'Relatórios gerenciais, análises orçamentárias, dashboards financeiros.',
    fields: ['has_performance_reports', 'performance_analysis_frequency', 'has_management_report', 'has_budget_analysis'],
    requiredDocuments: ['Relatório Gerencial', 'Análise Orçamentária'],
    griStandards: ['GRI 201-1'],
    dataIntegration: null
  },
  {
    id: 'innovation_investments',
    icon: Lightbulb,
    title: 'Investimentos em Inovação e Sustentabilidade',
    question: 'A organização realiza investimentos em inovação e sustentabilidade?',
    helpText: 'P&D, automação, digitalização, projetos de sustentabilidade, economia circular.',
    fields: ['has_innovation_investments', 'innovation_investment_types', 'sustainability_investment_annual', 'innovation_projects_count'],
    requiredDocuments: ['Planilha CAPEX', 'Planilha OPEX', 'Relatório Inovação'],
    griStandards: ['GRI 201-1', 'GRI 203-1'],
    dataIntegration: 'material_flow_analysis'
  },
  {
    id: 'efficiency_indicators',
    icon: Target,
    title: 'Indicadores de Eficiência',
    question: 'A organização monitora indicadores de eficiência e produtividade?',
    helpText: 'EBITDA, margem líquida, ROE, ROA, produtividade, receita por funcionário.',
    fields: ['tracks_efficiency_indicators', 'efficiency_indicators_tracked', 'has_performance_dashboard'],
    requiredDocuments: ['Relatório Gerencial', 'Dashboard de KPIs'],
    griStandards: ['GRI 201-1'],
    dataIntegration: 'companies'
  },
  {
    id: 'sustainable_procurement',
    icon: ShoppingCart,
    title: 'Compras Sustentáveis',
    question: 'Existem políticas ou critérios de compras sustentáveis?',
    helpText: 'Política de compras com critérios socioambientais, avaliação de fornecedores, compras locais.',
    fields: ['has_sustainable_procurement_policy', 'procurement_policy_approval_date', 'procurement_criteria', 'has_supplier_evaluation'],
    requiredDocuments: ['Política de Compras', 'Avaliação Fornecedores'],
    griStandards: ['GRI 204-1'],
    dataIntegration: 'suppliers'
  },
  {
    id: 'esg_risks',
    icon: Shield,
    title: 'Riscos e Oportunidades ESG',
    question: 'A organização avalia riscos e oportunidades relacionados a ESG?',
    helpText: 'Matriz de riscos, análise de riscos climáticos, oportunidades de mercado ESG.',
    fields: ['has_esg_risk_assessment', 'risk_assessment_methodology', 'risk_assessment_frequency', 'has_climate_risk_analysis'],
    requiredDocuments: ['Mapa de Riscos ESG', 'Análise Climática'],
    griStandards: ['GRI 201-2'],
    dataIntegration: 'esg_risks'
  },
];

export function EconomicDataCollectionModule({ reportId, onComplete }: EconomicDataCollectionModuleProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [companyId, setCompanyId] = useState('');
  const [companySector, setCompanySector] = useState('');
  const [sustainableInvestmentData, setSustainableInvestmentData] = useState<SustainableInvestmentResult | null>(null);
  const [calculatingSustainableInvestment, setCalculatingSustainableInvestment] = useState(false);
  const [sustainableRevenueData, setSustainableRevenueData] = useState<SustainableRevenueResult | null>(null);
  const [calculatingSustainableRevenue, setCalculatingSustainableRevenue] = useState(false);
  const [valueDistributionData, setValueDistributionData] = useState<EconomicValueDistributionResult | null>(null);
  const [calculatingValueDistribution, setCalculatingValueDistribution] = useState(false);

  useEffect(() => {
    loadData();
  }, [reportId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');
      setCompanyId(profile.company_id);

      // Get company sector
      const { data: company } = await supabase
        .from('companies')
        .select('sector')
        .eq('id', profile.company_id)
        .single();
      
      if (company?.sector) {
        setCompanySector(company.sector);
      }

      // Load existing economic data
      const { data: economicData } = await supabase
        .from('gri_economic_data_collection')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (economicData) {
        setFormData(economicData);
        setQuantitativeData({
          revenue_total: economicData.revenue_total || 0,
          operating_costs: economicData.operating_costs || 0,
          employee_wages_benefits: economicData.employee_wages_benefits || 0,
          ebitda: economicData.ebitda || 0,
          ebitda_margin: economicData.ebitda_margin || 0,
          net_profit_margin: economicData.net_profit_margin || 0,
          local_procurement_percentage: economicData.local_procurement_percentage || 0,
          climate_related_risks_identified: economicData.climate_related_risks_identified || 0,
          revenue_per_employee: economicData.revenue_per_employee || 0,
        });
        setPeriodStart(economicData.reporting_period_start || '');
        setPeriodEnd(economicData.reporting_period_end || '');
        setCompletionPercentage(economicData.completion_percentage || 0);
      }

      // Calculate metrics automatically
      await handleRecalculate();
    } catch (error) {
      console.error('Error loading economic data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados econômicos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateEconomicMetrics = async () => {
    try {
      // Get company financial data
      const { data: company } = await supabase
        .from('companies')
        .select('annual_revenue, employee_count')
        .eq('id', companyId)
        .single();

      // Get suppliers data
      const { data: suppliers, count: totalSuppliers } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      const localSuppliers = suppliers?.filter(s => 
        s.category?.toLowerCase().includes('local') || 
        s.name?.toLowerCase().includes('local')
      ).length || 0;

      // Get ESG risks
      const { data: esgRisks, count: risksCount } = await supabase
        .from('esg_risks')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      const climateRisks = esgRisks?.filter(r => 
        r.esg_category?.toLowerCase().includes('ambiental') ||
        r.esg_category?.toLowerCase().includes('environmental')
      ).length || 0;

      // Calculate revenue per employee
      const revenuePerEmployee = company?.annual_revenue && company?.employee_count
        ? (company.annual_revenue / company.employee_count)
        : 0;

      // Get social investments
      const { data: socialData } = await supabase
        .from('gri_social_data_collection')
        .select('social_investment_annual')
        .eq('report_id', reportId)
        .maybeSingle();

      return {
        revenue_total: company?.annual_revenue || 0,
        revenue_per_employee: parseFloat(revenuePerEmployee.toFixed(2)),
        local_suppliers_count: localSuppliers,
        total_suppliers_count: totalSuppliers || 0,
        local_procurement_percentage: totalSuppliers ? ((localSuppliers / totalSuppliers) * 100).toFixed(2) : 0,
        climate_related_risks_identified: climateRisks,
        esg_risks_identified: risksCount || 0,
        community_investments: socialData?.social_investment_annual || 0,
      };
    } catch (error) {
      console.error('Error calculating economic metrics:', error);
      return {};
    }
  };

  const handleRecalculate = async () => {
    const metrics = await calculateEconomicMetrics();
    setQuantitativeData(prev => ({ ...prev, ...metrics }));
    toast({
      title: "Métricas calculadas",
      description: "Dados atualizados com sucesso"
    });
  };

  const calculateSustainableInvestmentMetrics = async () => {
    try {
      setCalculatingSustainableInvestment(true);
      
      const { data: report } = await supabase
        .from('gri_reports')
        .select('reporting_period_start, reporting_period_end')
        .eq('id', reportId)
        .single();

      if (!report) {
        toast({
          title: "Erro",
          description: "Relatório não encontrado",
          variant: "destructive"
        });
        return;
      }

      const investmentData = await calculateSustainableInvestments(
        companyId,
        report.reporting_period_start,
        report.reporting_period_end
      );

      setSustainableInvestmentData(investmentData);
      
      // Atualizar campo no quantitativeData
      setQuantitativeData((prev: any) => ({
        ...prev,
        sustainability_investment_annual: investmentData.total_sustainable_investment
      }));

      toast({
        title: "Investimentos Sustentáveis Calculados",
        description: `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investmentData.total_sustainable_investment)}`
      });
    } catch (error) {
      console.error('Error calculating sustainable investments:', error);
      toast({
        title: "Erro",
        description: "Falha ao calcular investimentos sustentáveis",
        variant: "destructive"
      });
    } finally {
      setCalculatingSustainableInvestment(false);
    }
  };

  const calculateSustainableRevenueMetrics = async () => {
    try {
      setCalculatingSustainableRevenue(true);
      
      const { data: report } = await supabase
        .from('gri_reports')
        .select('reporting_period_start, reporting_period_end')
        .eq('id', reportId)
        .single();

      if (!report) return;

      const revenueData = await calculateSustainableRevenue(
        companyId,
        report.reporting_period_start,
        report.reporting_period_end
      );

      setSustainableRevenueData(revenueData);

      toast({
        title: "Receita ESG Calculada",
        description: `Total: R$ ${revenueData.sustainable_revenue_total.toLocaleString('pt-BR')} (${revenueData.sustainable_revenue_percentage.toFixed(2)}% da receita total)`
      });
    } catch (error) {
      console.error('Error calculating sustainable revenue:', error);
      toast({
        title: "Erro",
        description: "Falha ao calcular receita sustentável",
        variant: "destructive"
      });
    } finally {
      setCalculatingSustainableRevenue(false);
    }
  };

  const calculateValueDistributionMetrics = async () => {
    try {
      setCalculatingValueDistribution(true);
      
      const { data: report } = await supabase
        .from('gri_reports')
        .select('reporting_period_start, reporting_period_end')
        .eq('id', reportId)
        .single();

      if (!report) {
        toast({
          title: "Erro",
          description: "Relatório não encontrado",
          variant: "destructive"
        });
        return;
      }

      const valueData = await calculateEconomicValueDistribution(
        companyId,
        report.reporting_period_start,
        report.reporting_period_end
      );

      setValueDistributionData(valueData);

      toast({
        title: "DVA Calculado com Sucesso",
        description: `DEG: R$ ${valueData.generated.total.toLocaleString('pt-BR')} | VER: R$ ${valueData.retained.value.toLocaleString('pt-BR')}`
      });
    } catch (error) {
      console.error('Error calculating value distribution:', error);
      toast({
        title: "Erro",
        description: "Falha ao calcular distribuição de valor",
        variant: "destructive"
      });
    } finally {
      setCalculatingValueDistribution(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const dataToSave = {
        report_id: reportId,
        company_id: companyId,
        ...formData,
        ...quantitativeData,
        reporting_period_start: periodStart,
        reporting_period_end: periodEnd,
        completion_percentage: completionPercentage,
        
        // Add sustainable investment data if available
        ...(sustainableInvestmentData && {
          total_sustainable_investment: sustainableInvestmentData.total_sustainable_investment,
          capex_sustainable: sustainableInvestmentData.capex_sustainable,
          opex_sustainable: sustainableInvestmentData.opex_sustainable,
          capex_percentage: sustainableInvestmentData.capex_percentage,
          opex_percentage: sustainableInvestmentData.opex_percentage,
          environmental_investment: sustainableInvestmentData.environmental_investment,
          social_investment_calculated: sustainableInvestmentData.social_investment,
          governance_investment: sustainableInvestmentData.governance_investment,
          investment_by_project_type: sustainableInvestmentData.by_project_type,
          sustainable_projects_count: sustainableInvestmentData.total_projects_count,
          active_sustainable_projects: sustainableInvestmentData.active_projects_count,
          completed_sustainable_projects: sustainableInvestmentData.completed_projects_count,
          sustainability_investment_percentage_revenue: sustainableInvestmentData.investment_percentage_revenue,
          previous_period_sustainable_investment: sustainableInvestmentData.previous_period_investment,
          investment_growth_percentage: sustainableInvestmentData.investment_growth_percentage,
          estimated_roi_percentage: sustainableInvestmentData.estimated_roi_percentage,
          environmental_benefits: sustainableInvestmentData.environmental_benefits,
          social_benefits: sustainableInvestmentData.social_benefits,
          sector_avg_investment_percentage: sustainableInvestmentData.sector_average_investment_percentage,
          is_above_sector_average: sustainableInvestmentData.is_above_sector_average,
          gri_201_1_compliant: sustainableInvestmentData.gri_201_1_compliant,
          gri_203_1_compliant: sustainableInvestmentData.gri_203_1_compliant,
          sustainable_investment_missing_data: sustainableInvestmentData.missing_data,
          sustainable_investment_calculation_date: sustainableInvestmentData.calculation_date,
        }),
        
        // Add sustainable revenue data if available
        ...(sustainableRevenueData && {
          sustainable_revenue_total: sustainableRevenueData.sustainable_revenue_total,
          sustainable_revenue_percentage: sustainableRevenueData.sustainable_revenue_percentage,
          revenue_clean_energy: sustainableRevenueData.by_category.clean_energy,
          revenue_recycled_products: sustainableRevenueData.by_category.recycled_products,
          revenue_circular_economy: sustainableRevenueData.by_category.circular_economy,
          revenue_social_programs: sustainableRevenueData.by_category.social_programs,
          revenue_sustainable_services: sustainableRevenueData.by_category.sustainable_services,
          revenue_other_esg: sustainableRevenueData.by_category.other_esg,
          sustainable_revenue_breakdown: sustainableRevenueData.detailed_breakdown,
          previous_period_sustainable_revenue: sustainableRevenueData.previous_period_revenue,
          sustainable_revenue_growth_percentage: sustainableRevenueData.growth_percentage,
          is_sustainable_revenue_increasing: sustainableRevenueData.is_increasing,
          sustainable_revenue_roi: sustainableRevenueData.sustainable_revenue_roi,
          environmental_impact_from_revenue: sustainableRevenueData.environmental_benefits,
          social_impact_from_revenue: sustainableRevenueData.social_benefits,
          sector_avg_sustainable_revenue_percentage: sustainableRevenueData.sector_average_percentage,
          is_above_sector_avg_sustainable_revenue: sustainableRevenueData.is_above_sector_average,
          gri_203_2_compliant: sustainableRevenueData.gri_203_2_compliant,
          sustainable_revenue_missing_data: sustainableRevenueData.missing_data,
          sustainable_revenue_calculation_date: sustainableRevenueData.calculation_date,
          sustainable_revenue_data_source: 'manual_input',
        }),
        
        // Add economic value distribution data if available
        ...(valueDistributionData && {
          direct_economic_value_generated: valueDistributionData.generated.total,
          direct_economic_value_distributed: valueDistributionData.distributed.total,
          economic_value_retained: valueDistributionData.retained.value,
          total_operational_costs: valueDistributionData.distributed.operational_costs.total,
          total_employee_compensation: valueDistributionData.distributed.employees.total,
          total_capital_providers_payments: valueDistributionData.distributed.capital_providers.total,
          total_government_payments: valueDistributionData.distributed.government.total,
          total_community_investments: valueDistributionData.distributed.community.total,
          value_distribution_breakdown: {
            operational_costs: valueDistributionData.distributed.operational_costs,
            employees: valueDistributionData.distributed.employees,
            capital_providers: valueDistributionData.distributed.capital_providers,
            government: valueDistributionData.distributed.government,
            community: valueDistributionData.distributed.community,
          },
          value_distribution_percentage: valueDistributionData.distribution_percentage,
          stakeholder_value_per_type: valueDistributionData.stakeholder_ranking,
          previous_period_deg: valueDistributionData.previous_period.deg,
          previous_period_ded: valueDistributionData.previous_period.ded,
          previous_period_ver: valueDistributionData.previous_period.ver,
          deg_growth_percentage: valueDistributionData.growth.deg_percentage,
          ded_growth_percentage: valueDistributionData.growth.ded_percentage,
          ver_growth_percentage: valueDistributionData.growth.ver_percentage,
          gri_201_1_complete_compliant: valueDistributionData.gri_201_1_compliant,
          gri_201_1_missing_fields: valueDistributionData.missing_data,
          value_distribution_calculation_date: valueDistributionData.calculation_date,
          value_distribution_data_source: 'manual_input',
        }),
        
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('gri_economic_data_collection')
        .select('id')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('gri_economic_data_collection')
          .update(dataToSave)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('gri_economic_data_collection')
          .insert(dataToSave);
      }

      toast({
        title: "Salvo com sucesso",
        description: "Dados econômicos salvos"
      });
    } catch (error) {
      console.error('Error saving economic data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);

      const response = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_economic_data',
          report_id: reportId,
          form_data: formData,
          documents: [],
          quantitative_data: quantitativeData,
        }
      });

      if (response.error) throw response.error;

      const analysis = response.data;

      // Save AI analysis
      await supabase
        .from('gri_economic_data_collection')
        .update({
          ai_analysis: analysis,
          ai_generated_text: analysis.generated_text,
          ai_confidence_score: analysis.confidence_score,
          ai_last_analyzed_at: new Date().toISOString(),
        })
        .eq('report_id', reportId);

      toast({
        title: "Análise concluída",
        description: `Confiança: ${analysis.confidence_score}%`
      });

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error analyzing economic data:', error);
      toast({
        title: "Erro",
        description: "Erro ao analisar dados",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando dados econômicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Gestão e Desempenho Econômico
          </CardTitle>
          <CardDescription>
            Coleta de dados econômicos e financeiros para GRI 201, 203, 204, 205
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="mb-2" />
          <p className="text-sm text-muted-foreground">{completionPercentage}% completo</p>
        </CardContent>
      </Card>

      {/* Quantitative Data Dashboard */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Dados Quantitativos Econômicos (GRI 201-205)
              </CardTitle>
              <CardDescription>
                Dados calculados automaticamente. Ajuste o período de referência.
              </CardDescription>
            </div>
            <Button onClick={handleRecalculate} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Período Início</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <Label>Período Fim</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          {/* GRI 201: Economic Performance */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-600" />
              GRI 201: Desempenho Econômico
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold">R$ {(quantitativeData.revenue_total || 0).toLocaleString('pt-BR')}</div>
                <div className="text-xs text-muted-foreground">Receita Total</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-blue-600">{quantitativeData.ebitda_margin || 0}%</div>
                <div className="text-xs text-muted-foreground">Margem EBITDA</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-purple-600">R$ {(quantitativeData.revenue_per_employee || 0).toLocaleString('pt-BR')}</div>
                <div className="text-xs text-muted-foreground">Receita por Funcionário</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Receita Total (R$)</Label>
                <Input
                  type="number"
                  value={quantitativeData.revenue_total || ''}
                  onChange={(e) => setQuantitativeData({ ...quantitativeData, revenue_total: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>EBITDA (R$)</Label>
                <Input
                  type="number"
                  value={quantitativeData.ebitda || ''}
                  onChange={(e) => setQuantitativeData({ ...quantitativeData, ebitda: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* GRI 204: Procurement */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-orange-600" />
              GRI 204: Práticas de Compra
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold">{quantitativeData.total_suppliers_count || 0}</div>
                <div className="text-xs text-muted-foreground">Total Fornecedores</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-green-600">{quantitativeData.local_suppliers_count || 0}</div>
                <div className="text-xs text-muted-foreground">Fornecedores Locais</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-blue-600">{quantitativeData.local_procurement_percentage || 0}%</div>
                <div className="text-xs text-muted-foreground">% Compras Locais</div>
              </div>
            </div>
          </div>

          {/* GRI 201-2: Climate Risks */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              GRI 201-2: Riscos Climáticos e ESG
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold">{quantitativeData.climate_related_risks_identified || 0}</div>
                <div className="text-xs text-muted-foreground">Riscos Climáticos Identificados</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-orange-600">{quantitativeData.esg_risks_identified || 0}</div>
                <div className="text-xs text-muted-foreground">Total Riscos ESG</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRI 201-1, 203-1: Investimentos em Projetos Sustentáveis */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-600" />
                GRI 201-1, 203-1: Investimentos em Projetos Sustentáveis
              </CardTitle>
              <CardDescription>
                Agregação automática de CAPEX + OPEX em projetos ESG
              </CardDescription>
            </div>
            <Button 
              onClick={calculateSustainableInvestmentMetrics} 
              variant="outline" 
              size="sm"
              disabled={calculatingSustainableInvestment}
            >
              {calculatingSustainableInvestment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Calcular Investimentos ESG
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dashboard de Investimentos Sustentáveis */}
          {sustainableInvestmentData && (
            <SustainableInvestmentDashboard
              data={sustainableInvestmentData}
              year={new Date().getFullYear()}
              sector={companySector}
            />
          )}

          {/* Campo editável manual */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Investimento Sustentável Anual (R$)</Label>
                  <Input
                    type="number"
                    value={quantitativeData.sustainability_investment_annual || ''}
                    onChange={(e) => setQuantitativeData({ 
                      ...quantitativeData, 
                      sustainability_investment_annual: parseFloat(e.target.value) 
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Campo calculado automaticamente ou pode ser inserido manualmente
                  </p>
                </div>
                
                <div>
                  <Label>% da Receita</Label>
                  <Input
                    type="number"
                    value={sustainableInvestmentData?.investment_percentage_revenue.toFixed(4) || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculado automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!sustainableInvestmentData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Calcular Investimentos ESG</AlertTitle>
              <AlertDescription>
                Clique em "Calcular Investimentos ESG" para agregar automaticamente:
                <ul className="list-disc ml-4 mt-2 text-xs">
                  <li>Projetos Sociais (invested_amount)</li>
                  <li>Projetos ESG (spent_budget)</li>
                  <li>Projetos de Carbono (investimentos)</li>
                  <li>Separação CAPEX vs OPEX</li>
                  <li>Compliance GRI 201-1, 203-1</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* GRI 201-1, 203-2: Receita de Produtos/Serviços Sustentáveis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-green-600" />
                GRI 201-1, 203-2: Receita de Produtos/Serviços Sustentáveis
              </CardTitle>
              <CardDescription>
                Receita proveniente de produtos/serviços com benefícios ambientais ou sociais
              </CardDescription>
            </div>
            <Button 
              onClick={calculateSustainableRevenueMetrics} 
              variant="outline" 
              size="sm"
              disabled={calculatingSustainableRevenue}
            >
              {calculatingSustainableRevenue ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Calcular Receita ESG
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dashboard de Receita Sustentável */}
          {sustainableRevenueData && (
            <SustainableRevenueDashboard
              data={sustainableRevenueData}
              year={new Date().getFullYear()}
            />
          )}

          {/* Input Manual de Receita ESG */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cadastro de Receita ESG por Categoria</CardTitle>
              <CardDescription className="text-xs">
                Informe a receita proveniente de produtos/serviços com benefícios ambientais ou sociais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Calculado */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total de Receita ESG:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {(
                      (quantitativeData.revenue_clean_energy || 0) +
                      (quantitativeData.revenue_recycled_products || 0) +
                      (quantitativeData.revenue_circular_economy || 0) +
                      (quantitativeData.revenue_social_programs || 0) +
                      (quantitativeData.revenue_sustainable_services || 0) +
                      (quantitativeData.revenue_other_esg || 0)
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {quantitativeData.revenue_total && quantitativeData.revenue_total > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {(((
                      (quantitativeData.revenue_clean_energy || 0) +
                      (quantitativeData.revenue_recycled_products || 0) +
                      (quantitativeData.revenue_circular_economy || 0) +
                      (quantitativeData.revenue_social_programs || 0) +
                      (quantitativeData.revenue_sustainable_services || 0) +
                      (quantitativeData.revenue_other_esg || 0)
                    ) / quantitativeData.revenue_total) * 100).toFixed(2)}% da receita total
                  </p>
                )}
              </div>
              
              {/* Campos por Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Energia Limpa (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ex: energia solar, eólica..."
                    value={quantitativeData.revenue_clean_energy || ''}
                    onChange={(e) => setQuantitativeData({ 
                      ...quantitativeData, 
                      revenue_clean_energy: parseFloat(e.target.value) || 0
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita de produtos/serviços de energia renovável
                  </p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Produtos Reciclados (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ex: materiais reciclados..."
                    value={quantitativeData.revenue_recycled_products || ''}
                    onChange={(e) => setQuantitativeData({ 
                      ...quantitativeData, 
                      revenue_recycled_products: parseFloat(e.target.value) || 0
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita de produtos feitos com materiais reciclados
                  </p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Economia Circular (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ex: remanufatura, upcycling..."
                    value={quantitativeData.revenue_circular_economy || ''}
                    onChange={(e) => setQuantitativeData({ 
                      ...quantitativeData, 
                      revenue_circular_economy: parseFloat(e.target.value) || 0
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita de produtos de economia circular
                  </p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    Programas Sociais (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ex: comércio justo, inclusão..."
                    value={quantitativeData.revenue_social_programs || ''}
                    onChange={(e) => setQuantitativeData({ 
                      ...quantitativeData, 
                      revenue_social_programs: parseFloat(e.target.value) || 0
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita de produtos com impacto social positivo
                  </p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    Serviços Sustentáveis (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ex: consultoria ESG, auditorias..."
                    value={quantitativeData.revenue_sustainable_services || ''}
                    onChange={(e) => setQuantitativeData({ 
                      ...quantitativeData, 
                      revenue_sustainable_services: parseFloat(e.target.value) || 0
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita de serviços de sustentabilidade
                  </p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    Outros ESG (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Outras receitas sustentáveis..."
                    value={quantitativeData.revenue_other_esg || ''}
                    onChange={(e) => setQuantitativeData({ 
                      ...quantitativeData, 
                      revenue_other_esg: parseFloat(e.target.value) || 0
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Outras receitas ESG não categorizadas acima
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!sustainableRevenueData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Calcular Receita ESG</AlertTitle>
              <AlertDescription>
                Preencha os valores acima e clique em "Calcular Receita ESG" para análise automática:
                <ul className="list-disc ml-4 mt-2 text-xs">
                  <li>% da receita total proveniente de ESG</li>
                  <li>ROI de sustentabilidade (Receita ESG vs Investimento ESG)</li>
                  <li>Comparação com benchmarks setoriais</li>
                  <li>Compliance GRI 201-1, 203-2</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* GRI 201-1: Valor Econômico Gerado e Distribuído (DVA) */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                GRI 201-1: Valor Econômico Gerado e Distribuído (DVA)
              </CardTitle>
              <CardDescription>
                Demonstração de como a empresa cria e distribui valor para stakeholders
              </CardDescription>
            </div>
            <Button 
              onClick={calculateValueDistributionMetrics} 
              variant="outline" 
              size="sm"
              disabled={calculatingValueDistribution}
            >
              {calculatingValueDistribution ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Calcular DVA
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dashboard de Distribuição de Valor */}
          {valueDistributionData && (
            <EconomicValueDistributionDashboard
              data={valueDistributionData}
              year={new Date().getFullYear()}
            />
          )}

          {/* Input Manual de Dados DVA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cadastro de Dados para DVA (GRI 201-1)</CardTitle>
              <CardDescription>
                Informe os valores econômicos gerados e distribuídos no período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEÇÃO 1: VALOR ECONÔMICO GERADO (DEG) */}
              <div className="space-y-4">
                <h5 className="font-semibold text-sm flex items-center gap-2 pb-2 border-b">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Valor Econômico Direto Gerado (DEG)
                </h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Receita Bruta (R$) *</Label>
                    <Input
                      type="number"
                      placeholder="Receita total de vendas"
                      value={quantitativeData.gross_revenue || ''}
                      onChange={(e) => setQuantitativeData({ 
                        ...quantitativeData, 
                        gross_revenue: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Receitas Financeiras (R$)</Label>
                    <Input
                      type="number"
                      placeholder="Juros, dividendos recebidos"
                      value={quantitativeData.financial_income || ''}
                      onChange={(e) => setQuantitativeData({ 
                        ...quantitativeData, 
                        financial_income: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Venda de Ativos (R$)</Label>
                    <Input
                      type="number"
                      placeholder="Receita de venda de ativos"
                      value={quantitativeData.asset_sales_income || ''}
                      onChange={(e) => setQuantitativeData({ 
                        ...quantitativeData, 
                        asset_sales_income: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Outras Receitas (R$)</Label>
                    <Input
                      type="number"
                      placeholder="Outras receitas operacionais"
                      value={quantitativeData.other_income || ''}
                      onChange={(e) => setQuantitativeData({ 
                        ...quantitativeData, 
                        other_income: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
                
                {/* Total DEG Calculado */}
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total DEG:</span>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {(
                        (quantitativeData.gross_revenue || 0) +
                        (quantitativeData.financial_income || 0) +
                        (quantitativeData.asset_sales_income || 0) +
                        (quantitativeData.other_income || 0)
                      ).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* SEÇÃO 2: VALOR ECONÔMICO DISTRIBUÍDO (DED) */}
              <div className="space-y-4">
                <h5 className="font-semibold text-sm flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Valor Econômico Distribuído (DED)
                </h5>
                
                {/* 2.1 Custos Operacionais */}
                <div className="space-y-3">
                  <h6 className="text-xs font-semibold text-muted-foreground">CUSTOS OPERACIONAIS</h6>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Matérias-primas (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.raw_materials_costs || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          raw_materials_costs: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Fornecedores (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.supplier_payments || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          supplier_payments: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Outros Custos (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.other_operational_costs || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          other_operational_costs: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2.2 Empregados */}
                <div className="space-y-3">
                  <h6 className="text-xs font-semibold text-muted-foreground">EMPREGADOS</h6>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Salários (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.employee_salaries || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          employee_salaries: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Benefícios (R$)</Label>
                      <Input
                        type="number"
                        placeholder="FGTS, INSS, plano de saúde"
                        value={quantitativeData.employee_benefits || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          employee_benefits: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2.3 Provedores de Capital */}
                <div className="space-y-3">
                  <h6 className="text-xs font-semibold text-muted-foreground">PROVEDORES DE CAPITAL</h6>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Juros (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.interest_payments || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          interest_payments: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Dividendos (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.dividends_paid || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          dividends_paid: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Amortizações (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.loan_repayments || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          loan_repayments: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2.4 Governo */}
                <div className="space-y-3">
                  <h6 className="text-xs font-semibold text-muted-foreground">GOVERNO (TRIBUTOS)</h6>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Imposto de Renda (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.income_taxes || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          income_taxes: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Impostos sobre Vendas (R$)</Label>
                      <Input
                        type="number"
                        placeholder="ICMS, ISS, PIS, COFINS"
                        value={quantitativeData.sales_taxes || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          sales_taxes: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Encargos sobre Folha (R$)</Label>
                      <Input
                        type="number"
                        placeholder="INSS patronal, FGTS"
                        value={quantitativeData.payroll_taxes || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          payroll_taxes: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Outros Impostos (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.other_taxes || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          other_taxes: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2.5 Comunidade */}
                <div className="space-y-3">
                  <h6 className="text-xs font-semibold text-muted-foreground">COMUNIDADE</h6>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Doações (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.voluntary_donations || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          voluntary_donations: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Patrocínios (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.sponsorships || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          sponsorships: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label>Infraestrutura Pública (R$)</Label>
                      <Input
                        type="number"
                        value={quantitativeData.infrastructure_investments || ''}
                        onChange={(e) => setQuantitativeData({ 
                          ...quantitativeData, 
                          infrastructure_investments: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Total DED Calculado */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total DED:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      R$ {(
                        (quantitativeData.raw_materials_costs || 0) +
                        (quantitativeData.supplier_payments || 0) +
                        (quantitativeData.other_operational_costs || 0) +
                        (quantitativeData.employee_salaries || 0) +
                        (quantitativeData.employee_benefits || 0) +
                        (quantitativeData.interest_payments || 0) +
                        (quantitativeData.dividends_paid || 0) +
                        (quantitativeData.loan_repayments || 0) +
                        (quantitativeData.income_taxes || 0) +
                        (quantitativeData.sales_taxes || 0) +
                        (quantitativeData.payroll_taxes || 0) +
                        (quantitativeData.other_taxes || 0) +
                        (quantitativeData.voluntary_donations || 0) +
                        (quantitativeData.sponsorships || 0) +
                        (quantitativeData.infrastructure_investments || 0)
                      ).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* SEÇÃO 3: VALOR ECONÔMICO RETIDO (VER) */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Valor Econômico Retido (VER):</span>
                    <span className="text-2xl font-bold text-purple-600">
                      R$ {(
                        ((quantitativeData.gross_revenue || 0) +
                        (quantitativeData.financial_income || 0) +
                        (quantitativeData.asset_sales_income || 0) +
                        (quantitativeData.other_income || 0)) -
                        ((quantitativeData.raw_materials_costs || 0) +
                        (quantitativeData.supplier_payments || 0) +
                        (quantitativeData.other_operational_costs || 0) +
                        (quantitativeData.employee_salaries || 0) +
                        (quantitativeData.employee_benefits || 0) +
                        (quantitativeData.interest_payments || 0) +
                        (quantitativeData.dividends_paid || 0) +
                        (quantitativeData.loan_repayments || 0) +
                        (quantitativeData.income_taxes || 0) +
                        (quantitativeData.sales_taxes || 0) +
                        (quantitativeData.payroll_taxes || 0) +
                        (quantitativeData.other_taxes || 0) +
                        (quantitativeData.voluntary_donations || 0) +
                        (quantitativeData.sponsorships || 0) +
                        (quantitativeData.infrastructure_investments || 0))
                      ).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fórmula: VER = DEG - DED (valor reinvestido na empresa)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!valueDistributionData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Calcular DVA (GRI 201-1)</AlertTitle>
              <AlertDescription>
                Após preencher os dados acima, clique em "Calcular DVA" para:
                <ul className="list-disc ml-4 mt-2 text-xs">
                  <li>Visualizar distribuição de valor por stakeholder</li>
                  <li>Comparar com período anterior</li>
                  <li>Verificar compliance GRI 201-1</li>
                  <li>Gerar gráficos e análises detalhadas</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Qualitative Questions */}
      {ECONOMIC_QUESTIONS.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <question.icon className="h-5 w-5" />
              {question.title}
            </CardTitle>
            <CardDescription>{question.question}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription className="text-xs">{question.helpText}</AlertDescription>
            </Alert>

            <div className="space-y-4">
              {question.id === 'financial_statements' && (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.has_financial_statements}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_financial_statements: checked })}
                    />
                    <Label>Possui demonstrações financeiras atualizadas</Label>
                  </div>
                  {formData.has_financial_statements && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <Label>Data do Balanço</Label>
                        <Input
                          type="date"
                          value={formData.balance_sheet_date || ''}
                          onChange={(e) => setFormData({ ...formData, balance_sheet_date: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.financial_statements_audited}
                          onCheckedChange={(checked) => setFormData({ ...formData, financial_statements_audited: checked })}
                        />
                        <Label>Auditadas</Label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {question.id === 'sustainable_procurement' && (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.has_sustainable_procurement_policy}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_sustainable_procurement_policy: checked })}
                    />
                    <Label>Possui política de compras sustentáveis</Label>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {question.griStandards.map((standard) => (
                <Badge key={standard} variant="outline">{standard}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Salvando...' : 'Salvar Progresso'}
        </Button>
        <Button onClick={handleAnalyze} disabled={analyzing} variant="default" className="flex-1">
          {analyzing ? 'Analisando...' : 'Analisar com IA'}
        </Button>
      </div>
    </div>
  );
}
