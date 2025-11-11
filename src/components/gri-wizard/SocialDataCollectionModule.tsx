import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Shield, GraduationCap, Heart, TrendingUp, Gift, 
  CheckCircle2, AlertCircle, BarChart3, RefreshCw, Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocumentUploadZone } from "./DocumentUploadZone";
import { calculateLostTimeAccidentsMetrics, type LostTimeAccidentsResult } from "@/services/lostTimeAccidentsAnalysis";
import { LostTimeAccidentsDashboard } from "@/components/safety/LostTimeAccidentsDashboard";

interface SocialDataCollectionModuleProps {
  reportId: string;
  onComplete?: () => void;
}

const SOCIAL_QUESTIONS = [
  {
    id: 'diversity_inclusion',
    icon: Users,
    title: 'Diversidade, Inclusão e Igualdade',
    question: 'A organização possui políticas de diversidade, inclusão e igualdade formalizadas?',
    helpText: 'Políticas que promovem equidade de gênero, racial, PCD, LGBTQIA+ e outras dimensões.',
    fields: ['has_diversity_policy', 'diversity_policy_approval_date', 'diversity_initiatives', 'diversity_policy_notes'],
    requiredDocuments: ['Política de Diversidade', 'Relatório de Equidade Salarial'],
    griStandards: ['GRI 405-1', 'GRI 405-2', 'GRI 406-1'],
  },
  {
    id: 'health_safety',
    icon: Shield,
    title: 'Saúde e Segurança Ocupacional',
    question: 'Existem programas de saúde e segurança ocupacional ativos?',
    helpText: 'CIPA, SESMT, treinamentos de segurança, exames ocupacionais, certificações ISO 45001.',
    fields: ['has_health_safety_programs', 'has_occupational_health_service', 'has_cipa', 'health_safety_notes'],
    requiredDocuments: ['PCMSO/PPRA', 'Relatório SESMT', 'Certificado ISO 45001'],
    griStandards: ['GRI 403-1', 'GRI 403-2', 'GRI 403-9', 'GRI 403-10'],
  },
  {
    id: 'training_development',
    icon: GraduationCap,
    title: 'Treinamentos e Capacitações',
    question: 'Existem registros de treinamentos e capacitações oferecidos?',
    helpText: 'Treinamentos técnicos, comportamentais, de segurança, liderança e desenvolvimento.',
    fields: ['has_training_records', 'training_types', 'training_notes'],
    requiredDocuments: ['Certificado Treinamento', 'Relatório de Treinamentos'],
    griStandards: ['GRI 404-1', 'GRI 404-2', 'GRI 404-3'],
  },
  {
    id: 'social_projects',
    icon: Heart,
    title: 'Projetos Sociais e Comunitários',
    question: 'A organização desenvolve programas ou projetos sociais/comunitários?',
    helpText: 'Investimento social privado, voluntariado corporativo, projetos de impacto social.',
    fields: ['has_social_projects', 'social_investment_annual', 'beneficiaries_count', 'social_projects_notes'],
    requiredDocuments: ['Relatório Projeto Social'],
    griStandards: ['GRI 413-1', 'GRI 413-2'],
  },
  {
    id: 'social_indicators',
    icon: TrendingUp,
    title: 'Indicadores Sociais',
    question: 'A organização monitora indicadores sociais (absenteísmo, acidentes, rotatividade)?',
    helpText: 'KPIs de RH: turnover, absenteísmo, taxa de acidentes, satisfação, etc.',
    fields: ['tracks_social_indicators', 'indicators_tracked', 'indicators_notes'],
    requiredDocuments: ['Planilha Indicadores', 'Relatório RH'],
    griStandards: ['GRI 401-1', 'GRI 403-9', 'GRI 404-1'],
  },
  {
    id: 'benefits_incentives',
    icon: Gift,
    title: 'Benefícios e Incentivos',
    question: 'Quais benefícios e incentivos são oferecidos aos colaboradores?',
    helpText: 'Vale alimentação, plano de saúde, seguro de vida, bônus, participação nos lucros.',
    fields: ['has_benefits_program', 'benefits_offered', 'benefits_notes'],
    requiredDocuments: ['Política de Benefícios'],
    griStandards: ['GRI 401-2', 'GRI 401-3'],
  },
];

export function SocialDataCollectionModule({ reportId, onComplete }: SocialDataCollectionModuleProps) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [lostTimeAccidentsData, setLostTimeAccidentsData] = useState<LostTimeAccidentsResult | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    loadData();
  }, [reportId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");
      setCompanyId(profile.company_id);

      // Set default period (last 12 months)
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 12);
      setPeriodStart(start.toISOString().split('T')[0]);
      setPeriodEnd(end.toISOString().split('T')[0]);

      // Load existing data
      const { data: existingData } = await supabase
        .from('gri_social_data_collection')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existingData) {
        setFormData(existingData);
        setQuantitativeData(existingData);
        setCompletionPercentage(existingData.completion_percentage || 0);
        
        if (existingData.reporting_period_start) {
          setPeriodStart(existingData.reporting_period_start);
        }
        if (existingData.reporting_period_end) {
          setPeriodEnd(existingData.reporting_period_end);
        }
      } else {
        // Calculate initial metrics
        await calculateMetrics(profile.company_id, start, end);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async (compId: string, start: Date, end: Date) => {
    try {
      setCalculating(true);

      // GRI 401: Employees
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', compId)
        .eq('status', 'Ativo');

      const totalEmployees = employees?.length || 0;
      const employeesMen = employees?.filter(e => e.gender === 'Masculino').length || 0;
      const employeesWomen = employees?.filter(e => e.gender === 'Feminino').length || 0;

      // GRI 403: Safety Incidents
      const { data: incidents } = await supabase
        .from('safety_incidents')
        .select('*')
        .eq('company_id', compId)
        .gte('incident_date', start.toISOString())
        .lte('incident_date', end.toISOString());

      const totalIncidents = incidents?.length || 0;
      const lostTimeIncidents = incidents?.filter(i => (i.days_lost || 0) > 0).length || 0;
      const daysLost = incidents?.reduce((sum, i) => sum + (i.days_lost || 0), 0) || 0;

      // GRI 404: Training
      const { data: trainings } = await supabase
        .from('employee_trainings')
        .select('*, training_programs!inner(*)')
        .eq('company_id', compId)
        .gte('completion_date', start.toISOString())
        .lte('completion_date', end.toISOString())
        .eq('status', 'completed');

      const totalTrainingHours = trainings?.reduce((sum, t) => 
        sum + (t.training_programs?.duration_hours || 0), 0
      ) || 0;

      const metrics = {
        total_employees: totalEmployees,
        employees_men: employeesMen,
        employees_women: employeesWomen,
        total_safety_incidents: totalIncidents,
        lost_time_incidents: lostTimeIncidents,
        days_lost: daysLost,
        incident_rate: totalEmployees ? ((totalIncidents / totalEmployees) * 100).toFixed(4) : '0',
        total_training_hours: totalTrainingHours.toFixed(2),
        average_training_hours_per_employee: totalEmployees ? (totalTrainingHours / totalEmployees).toFixed(2) : '0',
      };

      setQuantitativeData(metrics);

      // Calcular métricas de acidentes com afastamento
      const lostTimeData = await calculateLostTimeAccidentsMetrics(
        compId,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );
      setLostTimeAccidentsData(lostTimeData);

      await saveData({ ...formData, ...metrics });
      
      toast.success('Métricas calculadas!');
    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast.error('Erro ao calcular métricas');
    } finally {
      setCalculating(false);
    }
  };

  const handleRecalculate = async () => {
    if (!periodStart || !periodEnd) {
      toast.error('Selecione o período de análise');
      return;
    }
    await calculateMetrics(companyId, new Date(periodStart), new Date(periodEnd));
  };

  const saveData = async (data: any) => {
    try {
      const savePayload = {
        report_id: reportId,
        company_id: companyId,
        reporting_period_start: periodStart,
        reporting_period_end: periodEnd,
        ...data,
        
        // Adicionar dados de acidentes com afastamento (GRI 403-9)
        ...(lostTimeAccidentsData && {
          accidents_with_lost_time: lostTimeAccidentsData.total_accidents_with_lost_time,
          lost_time_accident_rate: lostTimeAccidentsData.lost_time_accident_rate,
          accidents_by_incident_type: lostTimeAccidentsData.by_incident_type,
          accidents_by_severity: lostTimeAccidentsData.by_severity,
          accidents_monthly_trend: lostTimeAccidentsData.monthly_trend,
          previous_period_lost_time_accidents: lostTimeAccidentsData.comparison.previous_period_count,
          lost_time_accidents_change_percent: lostTimeAccidentsData.comparison.change_percentage,
          top_lost_time_accident_types: lostTimeAccidentsData.top_5_types,
          lost_time_accidents_classification: lostTimeAccidentsData.performance_classification,
          lost_time_accidents_calculation_date: new Date().toISOString()
        }),
        
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('gri_social_data_collection')
        .select('id')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('gri_social_data_collection')
          .update(savePayload)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('gri_social_data_collection')
          .insert(savePayload);
      }
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);

      const response = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_social_data',
          report_id: reportId,
          form_data: formData,
          documents: [],
          quantitative_data: quantitativeData,
        }
      });

      if (response.error) throw response.error;

      const analysis = response.data;
      
      await saveData({
        ...formData,
        ai_analysis: analysis,
        ai_generated_text: analysis.generated_text,
        ai_confidence_score: analysis.confidence_score,
        ai_last_analyzed_at: new Date().toISOString(),
      });

      toast.success(`Análise concluída! Confiança: ${analysis.confidence_score}%`);
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error('Erro na análise de IA');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard de Métricas */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Painel de Indicadores Sociais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <div className="text-xl font-bold">{quantitativeData.total_employees || 0}</div>
              <div className="text-xs text-muted-foreground">Funcionários</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <div className="text-xl font-bold">{quantitativeData.turnover_rate || 0}%</div>
              <div className="text-xs text-muted-foreground">Turnover</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <Shield className="h-6 w-6 mx-auto text-red-600 mb-1" />
              <div className="text-xl font-bold">{quantitativeData.total_safety_incidents || 0}</div>
              <div className="text-xs text-muted-foreground">Acidentes</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <GraduationCap className="h-6 w-6 mx-auto text-purple-600 mb-1" />
              <div className="text-xl font-bold">{quantitativeData.average_training_hours_per_employee || 0}h</div>
              <div className="text-xs text-muted-foreground">Média Treinamento</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <Heart className="h-6 w-6 mx-auto text-pink-600 mb-1" />
              <div className="text-xl font-bold">{formData.beneficiaries_count || 0}</div>
              <div className="text-xs text-muted-foreground">Beneficiários Sociais</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Quantitativos */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dados Quantitativos (GRI 401-404, 403)
              </CardTitle>
              <CardDescription>
                Calculados automaticamente. Ajuste o período de referência.
              </CardDescription>
            </div>
            <Button 
              onClick={handleRecalculate} 
              variant="outline" 
              size="sm"
              disabled={calculating}
            >
              {calculating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Período Início</Label>
              <Input 
                type="date" 
                value={periodStart} 
                onChange={(e) => setPeriodStart(e.target.value)} 
              />
            </div>
            <div>
              <Label>Período Fim</Label>
              <Input 
                type="date" 
                value={periodEnd} 
                onChange={(e) => setPeriodEnd(e.target.value)} 
              />
            </div>
          </div>

          {/* GRI 401: Emprego */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              GRI 401: Emprego
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold">{quantitativeData.total_employees || 0}</div>
                <div className="text-xs text-muted-foreground">Total Funcionários</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-blue-600">{quantitativeData.employees_men || 0}</div>
                <div className="text-xs text-muted-foreground">Homens</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-pink-600">{quantitativeData.employees_women || 0}</div>
                <div className="text-xs text-muted-foreground">Mulheres</div>
              </div>
            </div>
          </div>

          {/* GRI 403: Saúde e Segurança */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              GRI 403: Saúde e Segurança
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold">{quantitativeData.total_safety_incidents || 0}</div>
                <div className="text-xs text-muted-foreground">Total Incidentes</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-red-600">{quantitativeData.lost_time_incidents || 0}</div>
                <div className="text-xs text-muted-foreground">Com Afastamento</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold">{quantitativeData.days_lost || 0}</div>
                <div className="text-xs text-muted-foreground">Dias Perdidos</div>
              </div>
            </div>
          </div>

          {/* GRI 404: Treinamento */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              GRI 404: Treinamento
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold">{quantitativeData.total_training_hours || 0}</div>
                <div className="text-xs text-muted-foreground">Horas Totais</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-2xl font-bold text-purple-600">{quantitativeData.average_training_hours_per_employee || 0}h</div>
                <div className="text-xs text-muted-foreground">Média por Funcionário</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard de Acidentes com Afastamento */}
      {lostTimeAccidentsData && (
        <LostTimeAccidentsDashboard
          data={lostTimeAccidentsData}
          year={new Date(periodEnd).getFullYear()}
        />
      )}

      {/* Perguntas Qualitativas */}
      {SOCIAL_QUESTIONS.map((question) => {
        const Icon = question.icon;
        return (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {question.title}
              </CardTitle>
              <CardDescription>{question.question}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-2">
                {question.griStandards.map(gri => (
                  <Badge key={gri} variant="outline" className="text-xs">{gri}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{question.helpText}</AlertDescription>
              </Alert>
              
              <div className="text-sm text-muted-foreground">
                <strong>Documentos necessários:</strong> {question.requiredDocuments.join(', ')}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Ações */}
      <div className="flex gap-4">
        <Button 
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex-1"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Analisar com IA
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
