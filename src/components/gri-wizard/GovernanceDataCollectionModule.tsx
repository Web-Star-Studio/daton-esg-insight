import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, AlertCircle, Sparkles, 
  Download, Shield, Network, Scale, Eye, BarChart3, CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadZone } from './DocumentUploadZone';
import { calculateWhistleblowerMetrics, type WhistleblowerAnalysisResult } from '@/services/whistleblowerAnalysis';
import { WhistleblowerAnalysisDashboard } from '@/components/governance/WhistleblowerAnalysisDashboard';

interface GovernanceDataCollectionModuleProps {
  reportId: string;
  onComplete?: () => void;
}

const GOVERNANCE_QUESTIONS = [
  {
    id: 'bylaws_statutes',
    icon: FileText,
    title: 'Estatuto Social e Regimentos Internos',
    question: 'O Estatuto Social e regimentos internos estão atualizados e acessíveis?',
    helpText: 'Estatutos e regimentos são documentos fundamentais para governança. Indique data da última atualização e acessibilidade.',
    fields: ['has_bylaws_updated', 'bylaws_last_update_date', 'bylaws_publicly_accessible', 'bylaws_notes'],
    requiredDocuments: ['Estatuto Social', 'Regimento Interno'],
    griStandards: ['GRI 2-1', 'GRI 2-9']
  },
  {
    id: 'organizational_structure',
    icon: Network,
    title: 'Organograma e Fluxos de Decisão',
    question: 'Existe organograma formal com fluxos de decisão claramente definidos?',
    helpText: 'Organograma atualizado demonstra estrutura de governança e linhas de reporte.',
    fields: ['has_formal_org_chart', 'org_chart_last_update_date', 'decision_flows_documented', 'org_chart_notes'],
    requiredDocuments: ['Organograma', 'Fluxograma de Processos'],
    griStandards: ['GRI 2-9', 'GRI 2-10', 'GRI 2-11']
  },
  {
    id: 'code_of_conduct',
    icon: Shield,
    title: 'Código de Ética e Conduta',
    question: 'Existe Código de Ética/Conduta válido para cooperados, colaboradores e gestores?',
    helpText: 'Código de Conduta estabelece padrões éticos e comportamentais esperados.',
    fields: ['has_code_of_conduct', 'code_of_conduct_approval_date', 'code_applies_to', 'code_training_mandatory', 'code_notes'],
    requiredDocuments: ['Código de Conduta', 'Política de Ética'],
    griStandards: ['GRI 2-23', 'GRI 2-24', 'GRI 2-26'],
    isoStandards: ['ISO 37001 - Seção 5: Liderança']
  },
  {
    id: 'compliance_policies',
    icon: Scale,
    title: 'Compliance e Integridade',
    question: 'Existem políticas de compliance, integridade e anticorrupção implementadas?',
    helpText: 'Políticas de compliance e canal de denúncias são essenciais para prevenção de riscos.',
    fields: ['has_compliance_policies', 'compliance_policies_list', 'has_whistleblower_channel', 'whistleblower_channel_url', 'compliance_notes'],
    requiredDocuments: ['Política Anticorrupção', 'Canal de Denúncias', 'Política de Compliance'],
    griStandards: ['GRI 2-25', 'GRI 2-26', 'GRI 2-27'],
    isoStandards: ['ISO 37001 - Seções 8 e 9'],
    oecdGuidelines: ['OCDE - Capítulo VII: Combate à Corrupção']
  },
  {
    id: 'transparency',
    icon: Eye,
    title: 'Transparência e Prestação de Contas',
    question: 'Existem práticas e normas para transparência e prestação de contas?',
    helpText: 'Mecanismos de transparência fortalecem a confiança dos stakeholders.',
    fields: ['has_transparency_practices', 'transparency_mechanisms', 'transparency_notes'],
    requiredDocuments: ['Relatório de Governança', 'Portal de Transparência'],
    griStandards: ['GRI 2-3', 'GRI 2-5', 'GRI 2-29']
  },
];

const GOVERNANCE_DOCUMENTS_CHECKLIST = [
  { 
    category: 'Estatuto Social', 
    examples: ['Estatuto vigente', 'Atas de alteração'], 
    required: true,
    griReference: 'GRI 2-1, 2-9'
  },
  { 
    category: 'Regimento Interno', 
    examples: ['Regimento do Conselho', 'Regimento de Comitês'], 
    required: true,
    griReference: 'GRI 2-9, 2-12'
  },
  { 
    category: 'Organograma', 
    examples: ['Organograma atualizado', 'Fluxograma de decisão'], 
    required: true,
    griReference: 'GRI 2-9'
  },
  { 
    category: 'Código de Conduta', 
    examples: ['Código de Ética', 'Manual de Conduta'], 
    required: true,
    griReference: 'GRI 2-23, 2-24',
    isoReference: 'ISO 37001'
  },
  { 
    category: 'Política Anticorrupção', 
    examples: ['Política de Integridade', 'Política de Compliance'], 
    required: true,
    griReference: 'GRI 2-25, 2-26, 2-27',
    isoReference: 'ISO 37001'
  },
  { 
    category: 'Canal de Denúncias', 
    examples: ['Print do portal', 'Documento explicativo', 'Estatísticas de uso'], 
    required: false,
    griReference: 'GRI 2-26'
  },
  { 
    category: 'Relatório de Governança', 
    examples: ['Relatório anual', 'Prestação de contas'], 
    required: false,
    griReference: 'GRI 2-5, 2-29'
  },
];

export function GovernanceDataCollectionModule({ reportId, onComplete }: GovernanceDataCollectionModuleProps) {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [whistleblowerData, setWhistleblowerData] = useState<WhistleblowerAnalysisResult | null>(null);
  const [calculatingWhistleblower, setCalculatingWhistleblower] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, [reportId]);

  const loadExistingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      const { data: govData } = await supabase
        .from('gri_governance_data_collection')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (govData) {
        setFormData(govData);
        setChecklist((govData.documents_checklist as Record<string, boolean>) || {});
        setAiAnalysis(govData.ai_analysis);
        setCompletionPercentage(govData.completion_percentage || 0);
      } else if (profile?.company_id) {
        setFormData({ company_id: profile.company_id });
      }

      const { data: docs } = await supabase
        .from('gri_document_uploads')
        .select('*')
        .eq('report_id', reportId)
        .in('category', GOVERNANCE_DOCUMENTS_CHECKLIST.map(d => d.category));

      if (docs) {
        setUploadedDocs(docs);
        const newChecklist: Record<string, boolean> = {};
        docs.forEach(doc => {
          if (doc.category) {
            newChecklist[doc.category] = true;
          }
        });
        setChecklist(prev => ({ ...prev, ...newChecklist }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    try {
      const { error } = await supabase
        .from('gri_governance_data_collection')
        .upsert({
          report_id: reportId,
          company_id: formData.company_id,
          ...updatedData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      calculateCompletion(updatedData);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Falha ao salvar dados');
    }
  };

  const calculateCompletion = (data: any) => {
    let total = GOVERNANCE_QUESTIONS.length * 2 + 10; // Questions + docs + quantitative fields
    let completed = 0;

    GOVERNANCE_QUESTIONS.forEach(q => {
      const hasField = q.fields[0];
      if (data[hasField]) completed++;
      
      const hasDocs = q.requiredDocuments.some(doc => 
        uploadedDocs.some(ud => ud.category?.includes(doc.split(' ')[0]))
      );
      if (hasDocs) completed++;
    });

    // Count quantitative fields
    const quantFields = ['board_total_members', 'board_independent_members', 'board_women_percentage', 
                         'ethics_training_hours_total', 'ethics_training_employees_trained'];
    quantFields.forEach(field => {
      if (data[field]) completed++;
    });

    const percentage = Math.round((completed / total) * 100);
    setCompletionPercentage(percentage);

    supabase
      .from('gri_governance_data_collection')
      .update({ completion_percentage: percentage })
      .eq('report_id', reportId)
      .then();
  };

  const calculateWhistleblowerAnalysis = async () => {
    setCalculatingWhistleblower(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data: report } = await supabase
        .from('gri_reports')
        .select('reporting_period_start, reporting_period_end')
        .eq('id', reportId)
        .single();

      if (!report) return;

      const analysisData = await calculateWhistleblowerMetrics(
        profile.company_id,
        report.reporting_period_start,
        report.reporting_period_end
      );

      setWhistleblowerData(analysisData);
      toast.success('Análise de denúncias calculada com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular análise de denúncias:', error);
      toast.error('Falha ao calcular métricas de denúncias');
    } finally {
      setCalculatingWhistleblower(false);
    }
  };

  const saveWhistleblowerAnalysis = async () => {
    if (!whistleblowerData) return;

    try {
      const { error } = await supabase
        .from('gri_governance_data_collection')
        .update({
          wb_total_reports: whistleblowerData.total_reports,
          wb_total_reports_current_year: whistleblowerData.total_reports_current_year,
          wb_open_reports: whistleblowerData.open_reports,
          wb_closed_reports: whistleblowerData.closed_reports,
          wb_anonymous_reports: whistleblowerData.anonymous_reports,
          wb_anonymous_percentage: whistleblowerData.anonymous_percentage,
          wb_by_status: whistleblowerData.by_status,
          wb_by_category: whistleblowerData.by_category,
          wb_by_priority: whistleblowerData.by_priority,
          wb_monthly_trend: whistleblowerData.monthly_trend,
          wb_resolution_rate: whistleblowerData.resolution_metrics.resolution_rate,
          wb_avg_resolution_time_days: whistleblowerData.resolution_metrics.avg_resolution_time_days,
          wb_median_resolution_time_days: whistleblowerData.resolution_metrics.median_resolution_time_days,
          wb_reports_overdue: whistleblowerData.resolution_metrics.reports_overdue,
          wb_reports_under_30_days: whistleblowerData.resolution_metrics.reports_under_30_days,
          wb_reports_30_90_days: whistleblowerData.resolution_metrics.reports_30_90_days,
          wb_reports_over_90_days: whistleblowerData.resolution_metrics.reports_over_90_days,
          wb_previous_period_total: whistleblowerData.comparison.previous_period_total,
          wb_change_percentage: whistleblowerData.comparison.change_percentage,
          wb_previous_resolution_rate: whistleblowerData.comparison.previous_resolution_rate,
          wb_resolution_rate_change: whistleblowerData.comparison.resolution_rate_change,
          wb_top_5_categories: whistleblowerData.top_5_categories,
          wb_systemic_issues: whistleblowerData.recurrence_analysis.categories_with_recurrence,
          wb_systemic_issues_count: whistleblowerData.recurrence_analysis.systemic_issues_count,
          wb_performance_classification: whistleblowerData.performance_classification,
          wb_gri_2_26_compliant: whistleblowerData.compliance_status.gri_2_26_compliant,
          wb_iso_37001_compliant: whistleblowerData.compliance_status.iso_37001_compliant,
          wb_compliance_missing_data: whistleblowerData.compliance_status.missing_data,
          wb_channel_utilization_rate: whistleblowerData.compliance_status.channel_utilization_rate,
        wb_sector_benchmark_reports_per_100: whistleblowerData.sector_benchmark.reports_per_100_employees,
        wb_sector_benchmark_resolution_days: whistleblowerData.sector_benchmark.typical_resolution_time_days,
        wb_sector_benchmark_resolution_rate: whistleblowerData.sector_benchmark.typical_resolution_rate,
        wb_calculation_date: new Date().toISOString(),
        
        // Resolution Effectiveness
        wb_target_resolution_rate: whistleblowerData.resolution_effectiveness.target_resolution_rate,
        wb_is_meeting_target: whistleblowerData.resolution_effectiveness.is_meeting_target,
        wb_gap_to_target: whistleblowerData.resolution_effectiveness.gap_to_target,
        wb_resolved_with_action_taken: whistleblowerData.resolution_effectiveness.resolved_with_action_taken,
        wb_resolved_without_action: whistleblowerData.resolution_effectiveness.resolved_without_action,
        wb_resolved_under_30_days_percentage: whistleblowerData.resolution_effectiveness.resolved_under_30_days_percentage,
        wb_resolution_funnel: whistleblowerData.resolution_effectiveness.resolution_funnel,
        wb_resolution_speed_score: whistleblowerData.resolution_effectiveness.resolution_speed_score,
        wb_backlog_trend: whistleblowerData.resolution_effectiveness.backlog_trend,
        wb_best_resolved_categories: whistleblowerData.resolution_effectiveness.best_resolved_categories,
        wb_worst_resolved_categories: whistleblowerData.resolution_effectiveness.worst_resolved_categories,
          updated_at: new Date().toISOString()
        })
        .eq('report_id', reportId);

      if (error) throw error;
      
      toast.success('Análise de denúncias salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      toast.error('Falha ao salvar análise de denúncias');
    }
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_governance_data',
          report_id: reportId,
          form_data: formData,
          documents: uploadedDocs
        }
      });

      if (error) throw error;

      setAiAnalysis(data);
      toast.success('Análise concluída! Texto descritivo gerado.');

      await supabase
        .from('gri_governance_data_collection')
        .update({
          ai_analysis: data,
          ai_generated_text: data.generated_text,
          ai_confidence_score: data.confidence_score,
          ai_last_analyzed_at: new Date().toISOString()
        })
        .eq('report_id', reportId);

    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast.error(`Falha na análise: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Governança Corporativa</CardTitle>
              <CardDescription>
                Preencha as informações e faça upload dos documentos comprobatórios (GRI 2-9 a 2-27, ISO 37001, OCDE)
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{completionPercentage}%</div>
              <p className="text-sm text-muted-foreground">Completo</p>
            </div>
          </div>
          <Progress value={completionPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Perguntas Orientadoras</h3>
        
        {GOVERNANCE_QUESTIONS.map((question, idx) => (
          <Card key={question.id} className="border-l-4 border-l-primary/50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <question.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{idx + 1}. {question.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{question.question}</p>
                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{question.helpText}</AlertDescription>
                  </Alert>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {question.griStandards?.map(std => (
                      <Badge key={std} variant="outline" className="text-xs">{std}</Badge>
                    ))}
                    {question.isoStandards?.map(std => (
                      <Badge key={std} variant="secondary" className="text-xs">{std}</Badge>
                    ))}
                    {question.oecdGuidelines?.map(std => (
                      <Badge key={std} variant="secondary" className="text-xs">{std}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={question.fields[0]}
                  checked={formData[question.fields[0]] || false}
                  onCheckedChange={(checked) => handleFieldUpdate(question.fields[0], checked)}
                />
                <Label htmlFor={question.fields[0]} className="cursor-pointer">
                  Sim, esta informação está disponível
                </Label>
              </div>

              {formData[question.fields[0]] && (
                <>
                  {question.fields[1] && question.fields[1].includes('date') && (
                    <div>
                      <Label>Data {question.fields[1].includes('update') ? 'de Atualização' : 'de Aprovação'}</Label>
                      <Input
                        type="date"
                        value={formData[question.fields[1]] || ''}
                        onChange={(e) => handleFieldUpdate(question.fields[1], e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  {question.fields[1] === 'decision_flows_documented' && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="decision_flows"
                        checked={formData.decision_flows_documented || false}
                        onCheckedChange={(checked) => handleFieldUpdate('decision_flows_documented', checked)}
                      />
                      <Label htmlFor="decision_flows" className="cursor-pointer">
                        Fluxos de decisão estão documentados
                      </Label>
                    </div>
                  )}

                  {question.fields.includes('code_applies_to') && (
                    <div>
                      <Label>Aplica-se a (separados por vírgula)</Label>
                      <Input
                        type="text"
                        placeholder="Ex: cooperados, colaboradores, gestores, fornecedores"
                        value={(formData.code_applies_to || []).join(', ')}
                        onChange={(e) => handleFieldUpdate('code_applies_to', e.target.value.split(',').map((s: string) => s.trim()))}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {question.fields.includes('code_training_mandatory') && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="training_mandatory"
                        checked={formData.code_training_mandatory || false}
                        onCheckedChange={(checked) => handleFieldUpdate('code_training_mandatory', checked)}
                      />
                      <Label htmlFor="training_mandatory" className="cursor-pointer">
                        Treinamento é obrigatório
                      </Label>
                    </div>
                  )}

                  {question.fields.includes('compliance_policies_list') && (
                    <div>
                      <Label>Políticas Implementadas (separadas por vírgula)</Label>
                      <Input
                        type="text"
                        placeholder="Ex: anticorrupção, antissuborno, conflito de interesses"
                        value={(formData.compliance_policies_list || []).join(', ')}
                        onChange={(e) => handleFieldUpdate('compliance_policies_list', e.target.value.split(',').map((s: string) => s.trim()))}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {question.fields.includes('has_whistleblower_channel') && (
                    <>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="whistleblower"
                          checked={formData.has_whistleblower_channel || false}
                          onCheckedChange={(checked) => handleFieldUpdate('has_whistleblower_channel', checked)}
                        />
                        <Label htmlFor="whistleblower" className="cursor-pointer">
                          Possui canal de denúncias
                        </Label>
                      </div>
                      {formData.has_whistleblower_channel && (
                        <div>
                          <Label>URL do Canal de Denúncias</Label>
                          <Input
                            type="url"
                            placeholder="https://..."
                            value={formData.whistleblower_channel_url || ''}
                            onChange={(e) => handleFieldUpdate('whistleblower_channel_url', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {question.fields.includes('transparency_mechanisms') && (
                    <div>
                      <Label>Mecanismos de Transparência (separados por vírgula)</Label>
                      <Input
                        type="text"
                        placeholder="Ex: relatórios públicos, assembleias, portal de transparência"
                        value={(formData.transparency_mechanisms || []).join(', ')}
                        onChange={(e) => handleFieldUpdate('transparency_mechanisms', e.target.value.split(',').map((s: string) => s.trim()))}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {question.fields.includes('bylaws_publicly_accessible') && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="bylaws_public"
                        checked={formData.bylaws_publicly_accessible || false}
                        onCheckedChange={(checked) => handleFieldUpdate('bylaws_publicly_accessible', checked)}
                      />
                      <Label htmlFor="bylaws_public" className="cursor-pointer">
                        Documentos são publicamente acessíveis
                      </Label>
                    </div>
                  )}

                  <div>
                    <Label>Observações Adicionais</Label>
                    <Textarea
                      value={formData[question.fields[question.fields.length - 1]] || ''}
                      onChange={(e) => handleFieldUpdate(question.fields[question.fields.length - 1], e.target.value)}
                      placeholder="Descreva detalhes relevantes..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Documentos Comprobatórios</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload recomendado: {question.requiredDocuments.join(', ')}
                    </p>
                    <DocumentUploadZone reportId={reportId} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dados Quantitativos de Governança (GRI 2-9 a 2-27)
          </CardTitle>
          <CardDescription>
            Preencha os dados numéricos para indicadores GRI de governança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Composição do Conselho (GRI 2-9, 2-10)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total de Membros</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 7" 
                  value={formData.board_total_members || ''}
                  onChange={(e) => handleFieldUpdate('board_total_members', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Membros Independentes</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 3"
                  value={formData.board_independent_members || ''}
                  onChange={(e) => handleFieldUpdate('board_independent_members', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>% Mulheres no Conselho</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 42.85"
                  value={formData.board_women_percentage || ''}
                  onChange={(e) => handleFieldUpdate('board_women_percentage', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>% Grupos Vulneráveis</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 14.28"
                  value={formData.board_diversity_vulnerable_groups || ''}
                  onChange={(e) => handleFieldUpdate('board_diversity_vulnerable_groups', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div>
              <Label>Distribuição Etária (GRI 2-10)</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="% < 30 anos"
                  value={formData.board_under_30_percentage || ''}
                  onChange={(e) => handleFieldUpdate('board_under_30_percentage', parseFloat(e.target.value))}
                />
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="% 30-50 anos"
                  value={formData.board_30_50_percentage || ''}
                  onChange={(e) => handleFieldUpdate('board_30_50_percentage', parseFloat(e.target.value))}
                />
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="% > 50 anos"
                  value={formData.board_over_50_percentage || ''}
                  onChange={(e) => handleFieldUpdate('board_over_50_percentage', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Treinamentos em Ética (GRI 2-17, ISO 37001)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total de Horas de Treinamento</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  placeholder="Ex: 240"
                  value={formData.ethics_training_hours_total || ''}
                  onChange={(e) => handleFieldUpdate('ethics_training_hours_total', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Número de Pessoas Treinadas</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 120"
                  value={formData.ethics_training_employees_trained || ''}
                  onChange={(e) => handleFieldUpdate('ethics_training_employees_trained', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>Frequência dos Treinamentos</Label>
              <Select 
                value={formData.compliance_training_frequency || ''}
                onValueChange={(value) => handleFieldUpdate('compliance_training_frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="bianual">Bianual</SelectItem>
                  <SelectItem value="admissional">Admissional + Anual</SelectItem>
                  <SelectItem value="on-demand">Sob Demanda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Remuneração (GRI 2-19 a 2-21)</h4>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="remuneration_esg"
                checked={formData.remuneration_linked_to_esg || false}
                onCheckedChange={(checked) => handleFieldUpdate('remuneration_linked_to_esg', checked)}
              />
              <Label htmlFor="remuneration_esg" className="cursor-pointer">
                Remuneração vinculada a metas ESG
              </Label>
            </div>
            <div>
              <Label>Razão Salário Maior/Mediana</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 15.5"
                value={formData.highest_to_median_salary_ratio || ''}
                onChange={(e) => handleFieldUpdate('highest_to_median_salary_ratio', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Razão entre o maior salário e o salário mediano da organização
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard de Análise de Denúncias (GRI 2-26) */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise do Canal de Denúncias (GRI 2-26, ISO 37001)
              </CardTitle>
              <CardDescription>
                Dashboard estratégico com análise de reincidência e compliance
              </CardDescription>
            </div>
            {whistleblowerData && (
              <Button onClick={saveWhistleblowerAnalysis} variant="outline" size="sm">
                Salvar Análise
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!whistleblowerData ? (
            <div className="text-center py-8">
              <Button 
                onClick={calculateWhistleblowerAnalysis}
                disabled={calculatingWhistleblower}
                size="lg"
              >
                {calculatingWhistleblower ? (
                  <>Calculando Análise...</>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Calcular Análise de Denúncias
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Gere análise completa com detecção de problemas sistêmicos e compliance
              </p>
            </div>
          ) : (
            <WhistleblowerAnalysisDashboard 
              data={whistleblowerData}
              year={new Date().getFullYear()}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Checklist de Documentos
          </CardTitle>
          <CardDescription>
            Verifique se todos os documentos necessários foram anexados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {GOVERNANCE_DOCUMENTS_CHECKLIST.map((doc) => (
              <div key={doc.category} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {checklist[doc.category] ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{doc.category}</span>
                    {doc.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                    {checklist[doc.category] && <Badge variant="default" className="text-xs">✓ Anexado</Badge>}
                    <Badge variant="outline" className="text-xs">{doc.griReference}</Badge>
                    {doc.isoReference && <Badge variant="secondary" className="text-xs">{doc.isoReference}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exemplos: {doc.examples.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise com IA
          </CardTitle>
          <CardDescription>
            A IA analisará os dados e documentos para gerar o texto descritivo inicial para o relatório GRI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleAnalyzeWithAI}
            disabled={analyzing || completionPercentage < 60}
            size="lg"
            className="w-full"
          >
            {analyzing ? (
              <>Analisando...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Analisar e Gerar Texto Descritivo
              </>
            )}
          </Button>

          {completionPercentage < 60 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete ao menos 60% das informações antes de solicitar a análise
              </AlertDescription>
            </Alert>
          )}

          {aiAnalysis && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Texto Gerado pela IA</h4>
                <Badge variant="default">
                  Confiança: {aiAnalysis.confidence_score}%
                </Badge>
              </div>
              
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {aiAnalysis.generated_text}
                  </pre>
                </CardContent>
              </Card>

              {aiAnalysis.quantitative_highlights && aiAnalysis.quantitative_highlights.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Destaques Quantitativos:</h5>
                  <div className="space-y-2">
                    {aiAnalysis.quantitative_highlights.map((highlight: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline">{highlight.indicator}</Badge>
                        <span className="font-medium">{highlight.value}</span>
                        <span className="text-muted-foreground">- {highlight.context}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Sugestões de Melhoria:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {aiAnalysis.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Texto
                </Button>
                <Button variant="outline" size="sm" onClick={handleAnalyzeWithAI}>
                  Regenerar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {completionPercentage >= 80 && (
        <div className="flex justify-end">
          <Button
            onClick={onComplete}
            size="lg"
            className="gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            Concluir Captação de Dados
          </Button>
        </div>
      )}
    </div>
  );
}
