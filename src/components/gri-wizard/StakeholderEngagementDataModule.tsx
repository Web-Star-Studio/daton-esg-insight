import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, ClipboardList, BarChart2, Handshake, 
  RefreshCw, AlertCircle, Award, MessageSquare,
  Save, Sparkles, FileText, CheckCircle
} from 'lucide-react';

const STAKEHOLDER_ENGAGEMENT_QUESTIONS = [
  {
    id: 'stakeholder_mapping',
    icon: Users,
    title: 'Mapeamento e Matriz de Stakeholders',
    question: 'A organização possui mapeamento e matriz de stakeholders atualizada?',
    helpText: 'Matriz de poder x interesse, mapeamento de grupos prioritários e metodologia utilizada.',
    griStandards: ['GRI 2-29'],
  },
  {
    id: 'engagement_records',
    icon: ClipboardList,
    title: 'Registros de Reuniões e Consultas',
    question: 'Existem registros sistemáticos de reuniões, consultas e assembleias com stakeholders?',
    helpText: 'Atas, listas de presença, relatórios de feedback, periodicidade de engajamento.',
    griStandards: ['GRI 2-29'],
  },
  {
    id: 'stakeholder_surveys',
    icon: BarChart2,
    title: 'Pesquisas de Satisfação e Engajamento',
    question: 'São realizadas pesquisas de satisfação ou engajamento com stakeholders?',
    helpText: 'Pesquisas de satisfação, NPS, surveys de materialidade, avaliações de desempenho.',
    griStandards: ['GRI 2-29'],
  },
  {
    id: 'partnerships',
    icon: Handshake,
    title: 'Parcerias, Acordos e Fóruns Setoriais',
    question: 'A organização mantém parcerias ou participa de fóruns setoriais?',
    helpText: 'Participação em associações, pactos setoriais, parcerias com ONGs, academia ou governo.',
    griStandards: ['GRI 2-29'],
  },
];

const STAKEHOLDER_DOCUMENTS_CHECKLIST = [
  { category: 'Matriz de Stakeholders', required: true, griReference: 'GRI 2-29' },
  { category: 'Ata de Reunião', required: true, griReference: 'GRI 2-29' },
  { category: 'Relatório de Consulta', required: false, griReference: 'GRI 2-29' },
  { category: 'Relatório de Pesquisa', required: true, griReference: 'GRI 2-29' },
  { category: 'Termo de Parceria', required: false, griReference: 'GRI 2-29' },
];

interface StakeholderEngagementDataModuleProps {
  reportId: string;
  onComplete?: () => void;
}

export default function StakeholderEngagementDataModule({ reportId, onComplete }: StakeholderEngagementDataModuleProps) {
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [companyId, setCompanyId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [reportId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        await calculateStakeholderMetrics(profile.company_id);
      }

      const { data: existingData } = await supabase
        .from('gri_stakeholder_engagement_data')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existingData) {
        setFormData(existingData);
        setCompletionPercentage(existingData.completion_percentage || 0);
        if (existingData.total_stakeholders_mapped) {
          setQuantitativeData({
            total_stakeholders_mapped: existingData.total_stakeholders_mapped,
            stakeholders_by_category: existingData.stakeholders_by_category,
            critical_stakeholders: existingData.critical_stakeholders,
            average_engagement_score: existingData.average_engagement_score,
            survey_response_rate_calculated: existingData.survey_response_rate_calculated,
            stakeholders_high_influence: existingData.stakeholders_high_influence,
            stakeholders_medium_influence: existingData.stakeholders_medium_influence,
            stakeholders_low_influence: existingData.stakeholders_low_influence,
            stakeholders_high_interest: existingData.stakeholders_high_interest,
            stakeholders_medium_interest: existingData.stakeholders_medium_interest,
            stakeholders_low_interest: existingData.stakeholders_low_interest,
            stakeholders_monthly_engagement: existingData.stakeholders_monthly_engagement,
            stakeholders_quarterly_engagement: existingData.stakeholders_quarterly_engagement,
            stakeholders_biannual_engagement: existingData.stakeholders_biannual_engagement,
            stakeholders_annual_engagement: existingData.stakeholders_annual_engagement,
            preferred_communication_channels: existingData.preferred_communication_channels,
            surveys_conducted_count: existingData.surveys_conducted_count,
            total_survey_responses: existingData.total_survey_responses,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStakeholderMetrics = async (companyId: string) => {
    try {
      // Buscar stakeholders
      const { data: stakeholders, count: totalStakeholders } = await supabase
        .from('stakeholders')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Distribuição por categoria
      const stakeholdersByCategory: Record<string, number> = {};
      stakeholders?.forEach(sh => {
        stakeholdersByCategory[sh.category] = (stakeholdersByCategory[sh.category] || 0) + 1;
      });

      // Níveis de influência
      const lowInfluence = stakeholders?.filter(sh => sh.influence_level === 'low').length || 0;
      const mediumInfluence = stakeholders?.filter(sh => sh.influence_level === 'medium').length || 0;
      const highInfluence = stakeholders?.filter(sh => sh.influence_level === 'high').length || 0;

      // Níveis de interesse
      const lowInterest = stakeholders?.filter(sh => sh.interest_level === 'low').length || 0;
      const mediumInterest = stakeholders?.filter(sh => sh.interest_level === 'medium').length || 0;
      const highInterest = stakeholders?.filter(sh => sh.interest_level === 'high').length || 0;

      // Stakeholders críticos
      const critical = stakeholders?.filter(sh => 
        sh.influence_level === 'high' && sh.interest_level === 'high'
      ).length || 0;

      // Frequência de engajamento
      const monthlyEngagement = stakeholders?.filter(sh => sh.engagement_frequency === 'monthly').length || 0;
      const quarterlyEngagement = stakeholders?.filter(sh => sh.engagement_frequency === 'quarterly').length || 0;
      const biannualEngagement = stakeholders?.filter(sh => sh.engagement_frequency === 'biannual').length || 0;
      const annualEngagement = stakeholders?.filter(sh => sh.engagement_frequency === 'annual').length || 0;

      // Canais de comunicação
      const preferredChannels: Record<string, number> = {};
      stakeholders?.forEach(sh => {
        if (sh.preferred_communication) {
          preferredChannels[sh.preferred_communication] = (preferredChannels[sh.preferred_communication] || 0) + 1;
        }
      });

      const preferredChannelsPercentage: Record<string, string> = {};
      Object.entries(preferredChannels).forEach(([channel, count]) => {
        preferredChannelsPercentage[channel] = totalStakeholders 
          ? `${((count / totalStakeholders) * 100).toFixed(1)}%` 
          : '0%';
      });

      // Score de engajamento
      const scoreMap: Record<string, number> = {
        'monthly': 90, 'quarterly': 70, 'biannual': 50, 'annual': 30,
      };
      const totalScore = stakeholders?.reduce((sum, sh) => {
        const score = scoreMap[sh.engagement_frequency] || 50;
        return sum + score;
      }, 0) || 0;
      const averageEngagementScore = totalStakeholders ? (totalScore / totalStakeholders).toFixed(2) : 0;

      // Pesquisas
      const { count: totalSurveys } = await supabase
        .from('stakeholder_surveys')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const { count: totalResponses } = await supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const surveyResponseRate = totalSurveys && totalSurveys > 0
        ? ((totalResponses || 0) / totalSurveys * 100).toFixed(2) 
        : 0;

      const metrics = {
        total_stakeholders_mapped: totalStakeholders,
        stakeholders_by_category: stakeholdersByCategory,
        high_influence_stakeholders: highInfluence,
        high_interest_stakeholders: highInterest,
        critical_stakeholders: critical,
        stakeholders_low_influence: lowInfluence,
        stakeholders_medium_influence: mediumInfluence,
        stakeholders_high_influence: highInfluence,
        stakeholders_low_interest: lowInterest,
        stakeholders_medium_interest: mediumInterest,
        stakeholders_high_interest: highInterest,
        stakeholders_monthly_engagement: monthlyEngagement,
        stakeholders_quarterly_engagement: quarterlyEngagement,
        stakeholders_biannual_engagement: biannualEngagement,
        stakeholders_annual_engagement: annualEngagement,
        preferred_communication_channels: preferredChannelsPercentage,
        average_engagement_score: averageEngagementScore,
        surveys_conducted_count: totalSurveys,
        total_survey_responses: totalResponses,
        survey_response_rate_calculated: surveyResponseRate,
      };

      setQuantitativeData(metrics);
      return metrics;
    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast.error('Erro ao calcular métricas');
      return {};
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataToSave = {
        report_id: reportId,
        company_id: companyId,
        ...formData,
        ...quantitativeData,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('gri_stakeholder_engagement_data')
        .select('id')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('gri_stakeholder_engagement_data')
          .update(dataToSave)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('gri_stakeholder_engagement_data')
          .insert(dataToSave);
      }

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    setIsLoading(true);
    try {
      await handleSave();

      const { data, error } = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_stakeholder_engagement_data',
          report_id: reportId,
          form_data: formData,
          quantitative_data: quantitativeData,
          documents: [],
        },
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        ai_analysis: data,
        ai_generated_text: data.generated_text,
        ai_confidence_score: data.confidence_score,
      }));

      await handleSave();
      toast.success('Análise com IA concluída!');
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      toast.error('Erro ao analisar com IA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Relacionamento com Stakeholders (GRI 2-29)
          </CardTitle>
          <CardDescription>
            Mapeamento, engajamento e parcerias com partes interessadas
          </CardDescription>
          <Progress value={completionPercentage} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Dados Quantitativos */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Dados Quantitativos (GRI 2-29)
              </CardTitle>
              <CardDescription>
                Calculados automaticamente do sistema de stakeholders
              </CardDescription>
            </div>
            <Button onClick={() => calculateStakeholderMetrics(companyId)} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo Executivo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl font-bold text-blue-700">{quantitativeData.total_stakeholders_mapped || 0}</div>
              <div className="text-sm text-blue-600 mt-1">Stakeholders Mapeados</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-red-50 to-red-100">
              <div className="text-3xl font-bold text-red-700">{quantitativeData.critical_stakeholders || 0}</div>
              <div className="text-sm text-red-600 mt-1">Stakeholders Críticos</div>
              <div className="text-xs text-muted-foreground">Alta Influência + Alto Interesse</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl font-bold text-green-700">{quantitativeData.average_engagement_score || 0}</div>
              <div className="text-sm text-green-600 mt-1">Score Médio Engajamento</div>
              <div className="text-xs text-muted-foreground">Escala 0-100</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-3xl font-bold text-purple-700">{quantitativeData.survey_response_rate_calculated || 0}%</div>
              <div className="text-sm text-purple-600 mt-1">Taxa de Resposta</div>
              <div className="text-xs text-muted-foreground">Pesquisas</div>
            </div>
          </div>

          {/* Matriz de Stakeholders */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Matriz de Stakeholders
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Nível de Influência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Alta:</span>
                    <Badge variant="destructive">{quantitativeData.stakeholders_high_influence || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Média:</span>
                    <Badge className="bg-orange-500">{quantitativeData.stakeholders_medium_influence || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Baixa:</span>
                    <Badge variant="secondary">{quantitativeData.stakeholders_low_influence || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Nível de Interesse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Alto:</span>
                    <Badge className="bg-blue-600">{quantitativeData.stakeholders_high_interest || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Médio:</span>
                    <Badge className="bg-indigo-500">{quantitativeData.stakeholders_medium_interest || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Baixo:</span>
                    <Badge variant="secondary">{quantitativeData.stakeholders_low_interest || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Frequência de Engajamento */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-green-600" />
              Frequência de Engajamento
            </h4>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-green-600">{quantitativeData.stakeholders_monthly_engagement || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Mensal</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-blue-600">{quantitativeData.stakeholders_quarterly_engagement || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Trimestral</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-orange-600">{quantitativeData.stakeholders_biannual_engagement || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Semestral</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-gray-600">{quantitativeData.stakeholders_annual_engagement || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Anual</div>
              </div>
            </div>
          </div>

          {quantitativeData.critical_stakeholders > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Stakeholders Críticos Identificados</AlertTitle>
              <AlertDescription className="text-xs">
                <strong>{quantitativeData.critical_stakeholders} stakeholders</strong> foram classificados como críticos 
                (alta influência + alto interesse). Recomenda-se engajamento frequente e gestão próxima destes grupos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Perguntas Qualitativas */}
      {STAKEHOLDER_ENGAGEMENT_QUESTIONS.map((q) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <q.icon className="h-5 w-5" />
              {q.title}
            </CardTitle>
            <CardDescription>{q.helpText}</CardDescription>
            <div className="flex gap-2 mt-2">
              {q.griStandards.map(standard => (
                <Badge key={standard} variant="outline">{standard}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={q.id}
                checked={formData[`has_${q.id}`] || false}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, [`has_${q.id}`]: checked }))
                }
              />
              <Label htmlFor={q.id}>{q.question}</Label>
            </div>
            
            <Textarea
              placeholder="Descreva detalhes, metodologias e práticas..."
              value={formData[`${q.id}_notes`] || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, [`${q.id}_notes`]: e.target.value }))}
              rows={4}
            />
          </CardContent>
        </Card>
      ))}

      {/* Checklist de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Checklist de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {STAKEHOLDER_DOCUMENTS_CHECKLIST.map((doc) => (
            <div key={doc.category} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{doc.category}</span>
                {doc.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
              </div>
              <Badge variant="outline" className="text-xs">{doc.griReference}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button onClick={handleSave} disabled={isSaving} variant="outline">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button onClick={handleAnalyzeWithAI} disabled={isLoading}>
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? 'Analisando...' : 'Analisar com IA'}
        </Button>
      </div>
    </div>
  );
}
