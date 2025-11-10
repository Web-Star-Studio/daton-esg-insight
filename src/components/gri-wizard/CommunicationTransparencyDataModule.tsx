import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Megaphone, Newspaper, Mic, Globe, Award, BarChart3, 
  RefreshCw, AlertCircle, CheckCircle, TrendingUp, Save, Sparkles 
} from 'lucide-react';

const COMMUNICATION_TRANSPARENCY_QUESTIONS = [
  {
    id: 'formal_strategy',
    icon: Megaphone,
    title: 'Estratégia/Plano de Comunicação ESG Formal',
    question: 'A organização possui estratégia ou plano formal de comunicação ESG?',
    helpText: 'Documento formal com objetivos, públicos-alvo, canais, orçamento e cronograma.',
    griStandards: ['GRI 2-29'],
    aa1000ses: ['Inclusividade', 'Responsividade'],
  },
  {
    id: 'internal_communications',
    icon: Newspaper,
    title: 'Boletins/Campanhas/Relatórios Internos',
    question: 'Há boletins, campanhas ou relatórios internos sobre sustentabilidade?',
    helpText: 'Newsletters internas, campanhas de conscientização, intranet, murais, eventos.',
    griStandards: ['GRI 2-29'],
    aa1000ses: ['Inclusividade'],
  },
  {
    id: 'public_statements',
    icon: Mic,
    title: 'Declarações/Posicionamentos Públicos ESG',
    question: 'A organização faz declarações ou posicionamentos públicos sobre temas ESG?',
    helpText: 'Press releases, manifestos, cartas abertas, posicionamento em redes sociais.',
    griStandards: ['GRI 2-29'],
    aa1000ses: ['Materialidade', 'Responsividade'],
  },
  {
    id: 'public_availability',
    icon: Globe,
    title: 'Relatório ESG Disponibilizado Publicamente',
    question: 'O relatório ESG é disponibilizado publicamente e de forma acessível?',
    helpText: 'Site institucional, portal de RI, formatos acessíveis, múltiplos idiomas.',
    griStandards: ['GRI 2-3', 'GRI 2-29'],
    aa1000ses: ['Inclusividade', 'Impacto'],
  },
];

const COMMUNICATION_CHANNELS = [
  'Site Institucional', 'Redes Sociais', 'Newsletter', 'Relatório Impresso',
  'Eventos', 'Mídia', 'Intranet', 'Webinars'
];

const COMMUNICATION_TRANSPARENCY_DOCUMENTS_CHECKLIST = [
  { 
    category: 'Plano de Comunicação ESG', 
    required: true, 
    griReference: 'GRI 2-29',
    aa1000ses: 'Inclusividade, Responsividade'
  },
  { 
    category: 'Boletim Interno', 
    required: false, 
    griReference: 'GRI 2-29',
    aa1000ses: 'Inclusividade'
  },
  { 
    category: 'Campanha Sustentabilidade', 
    required: false, 
    griReference: 'GRI 2-29',
    aa1000ses: 'Impacto'
  },
  { 
    category: 'Press Release ESG', 
    required: false, 
    griReference: 'GRI 2-29',
    aa1000ses: 'Responsividade'
  },
  { 
    category: 'Relatório Distribuição', 
    required: true, 
    griReference: 'GRI 2-3, 2-29',
    aa1000ses: 'Inclusividade'
  },
  { 
    category: 'Analytics Comunicação', 
    required: false, 
    griReference: 'GRI 2-29',
    aa1000ses: 'Impacto'
  },
];

interface CommunicationTransparencyDataModuleProps {
  reportId: string;
  onComplete?: () => void;
}

export const CommunicationTransparencyDataModule = ({ 
  reportId, 
  onComplete 
}: CommunicationTransparencyDataModuleProps) => {
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [reportId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCompanyId(profile.company_id);
        await calculateMetrics(profile.company_id);
      }

      const { data: existingData } = await supabase
        .from('gri_communication_transparency_data' as any)
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existingData) {
        setFormData(existingData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = async (compId: string) => {
    try {
      const { data: stakeholders, count: totalStakeholders } = await supabase
        .from('stakeholders')
        .select('*', { count: 'exact' })
        .eq('company_id', compId)
        .eq('is_active', true);

      const totalReach = (totalStakeholders || 0) * 100;

      const { data: engagementData } = await supabase
        .from('gri_stakeholder_engagement_data' as any)
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      const surveysCount = (engagementData as any)?.surveys_conducted_count || 0;
      const surveyResponses = (engagementData as any)?.total_survey_responses || 0;

      const { data: documents, count: documentsCount } = await supabase
        .from('gri_documents' as any)
        .select('*', { count: 'exact' })
        .eq('report_id', reportId)
        .in('category', ['Press Release ESG', 'Boletim Interno', 'Campanha Sustentabilidade', 'Declaração Pública']);

      const maturityScore = (
        ((engagementData as any)?.has_stakeholder_mapping ? 20 : 0) +
        ((documentsCount || 0) > 5 ? 20 : 0) +
        (surveysCount > 0 ? 20 : 0) +
        ((totalStakeholders || 0) > 10 ? 20 : 0) +
        (((engagementData as any)?.preferred_communication_channels?.length || 0) > 3 ? 20 : 0)
      );

      let maturityLevel = 'Iniciante';
      if (maturityScore >= 80) maturityLevel = 'Liderança';
      else if (maturityScore >= 60) maturityLevel = 'Estabelecido';
      else if (maturityScore >= 40) maturityLevel = 'Emergente';

      const aa1000ses_inclusivity_score = Math.min(((totalStakeholders || 0) / 15) * 100, 100);
      const aa1000ses_responsiveness_score = surveyResponses > 0 && totalReach > 0 ? 
        ((surveyResponses / totalReach) * 100) : 0;

      setQuantitativeData({
        total_communication_reach: totalReach,
        unique_audience_reached: totalStakeholders || 0,
        communication_channels_count: (engagementData as any)?.preferred_communication_channels?.length || 0,
        total_content_pieces_produced: documentsCount || 0,
        stakeholder_inquiries_received: surveysCount,
        response_rate_percentage: surveyResponses > 0 && totalReach > 0 ? 
          ((surveyResponses / totalReach) * 100) : 0,
        communication_maturity_level: maturityLevel,
        aa1000ses_inclusivity_score: parseFloat(aa1000ses_inclusivity_score.toFixed(1)),
        aa1000ses_responsiveness_score: parseFloat(aa1000ses_responsiveness_score.toFixed(1)),
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const dataToSave = {
        report_id: reportId,
        company_id: companyId,
        ...formData,
        ...quantitativeData,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('gri_communication_transparency_data' as any)
        .select('id')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('gri_communication_transparency_data' as any)
          .update(dataToSave)
          .eq('id', (existing as any).id);
      } else {
        await supabase
          .from('gri_communication_transparency_data' as any)
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
    try {
      setIsAnalyzing(true);
      await handleSave();

      const { data: documents } = await supabase
        .from('gri_documents' as any)
        .select('*')
        .eq('report_id', reportId);

      const response = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_communication_transparency_data',
          report_id: reportId,
          form_data: formData,
          quantitative_data: quantitativeData,
          documents: documents || [],
        }
      });

      if (response.error) throw response.error;

      const analysis = response.data;
      
      await supabase
        .from('gri_communication_transparency_data' as any)
        .update({
          ai_analysis: analysis,
          ai_generated_text: analysis.generated_text,
          ai_confidence_score: analysis.confidence_score,
          ai_last_analyzed_at: new Date().toISOString(),
        })
        .eq('report_id', reportId);

      toast.success(`Análise de IA completa! Confiança: ${analysis.confidence_score}%`);
      
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Error analyzing:', error);
      toast.error(error.message || 'Erro ao analisar com IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentQ = COMMUNICATION_TRANSPARENCY_QUESTIONS[currentQuestion];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentQ.icon className="h-5 w-5" />
            {currentQ.title}
          </CardTitle>
          <CardDescription>
            {currentQ.question}
            <div className="text-xs text-muted-foreground mt-2">
              {currentQ.helpText}
            </div>
            <div className="flex gap-2 mt-2">
              {currentQ.griStandards.map(std => (
                <Badge key={std} variant="outline" className="text-xs">{std}</Badge>
              ))}
              <Badge variant="secondary" className="text-xs">
                AA1000SES: {currentQ.aa1000ses.join(', ')}
              </Badge>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion === 0 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.has_formal_esg_communication_strategy || false}
                  onCheckedChange={(checked) => handleFieldChange('has_formal_esg_communication_strategy', checked)}
                />
                <Label>Possui estratégia formal de comunicação ESG</Label>
              </div>

              {formData.has_formal_esg_communication_strategy && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <Label>Última atualização</Label>
                    <Input 
                      type="date"
                      value={formData.communication_strategy_last_updated || ''}
                      onChange={(e) => handleFieldChange('communication_strategy_last_updated', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Nível de aprovação</Label>
                    <Select 
                      value={formData.communication_strategy_approval_level || ''}
                      onValueChange={(value) => handleFieldChange('communication_strategy_approval_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Conselho">Conselho</SelectItem>
                        <SelectItem value="Diretoria">Diretoria</SelectItem>
                        <SelectItem value="Gerência">Gerência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tamanho da equipe</Label>
                    <Input 
                      type="number"
                      value={formData.communication_team_size || ''}
                      onChange={(e) => handleFieldChange('communication_team_size', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Orçamento anual (R$)</Label>
                    <Input 
                      type="number"
                      value={formData.annual_communication_budget || ''}
                      onChange={(e) => handleFieldChange('annual_communication_budget', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={formData.communication_strategy_notes || ''}
                  onChange={(e) => handleFieldChange('communication_strategy_notes', e.target.value)}
                  placeholder="Descreva a estratégia de comunicação..."
                />
              </div>
            </>
          )}

          {currentQuestion === 1 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.has_internal_esg_communications || false}
                  onCheckedChange={(checked) => handleFieldChange('has_internal_esg_communications', checked)}
                />
                <Label>Possui comunicações internas ESG</Label>
              </div>

              {formData.has_internal_esg_communications && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={formData.internal_newsletter_exists || false}
                      onCheckedChange={(checked) => handleFieldChange('internal_newsletter_exists', checked)}
                    />
                    <Label>Newsletter interna</Label>
                  </div>
                  <div>
                    <Label>Frequência</Label>
                    <Select 
                      value={formData.internal_newsletter_frequency || ''}
                      onValueChange={(value) => handleFieldChange('internal_newsletter_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Semestral">Semestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Campanhas internas (quantidade)</Label>
                    <Input 
                      type="number"
                      value={formData.internal_campaigns_count || ''}
                      onChange={(e) => handleFieldChange('internal_campaigns_count', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Score de conscientização (%)</Label>
                    <Input 
                      type="number"
                      value={formData.employee_awareness_score || ''}
                      onChange={(e) => handleFieldChange('employee_awareness_score', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={formData.internal_communication_notes || ''}
                  onChange={(e) => handleFieldChange('internal_communication_notes', e.target.value)}
                  placeholder="Descreva as comunicações internas..."
                />
              </div>
            </>
          )}

          {currentQuestion === 2 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.has_public_esg_statements || false}
                  onCheckedChange={(checked) => handleFieldChange('has_public_esg_statements', checked)}
                />
                <Label>Faz declarações públicas ESG</Label>
              </div>

              {formData.has_public_esg_statements && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <Label>Declarações públicas (quantidade)</Label>
                    <Input 
                      type="number"
                      value={formData.public_statements_count || ''}
                      onChange={(e) => handleFieldChange('public_statements_count', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Press releases ESG (quantidade)</Label>
                    <Input 
                      type="number"
                      value={formData.press_releases_esg_count || ''}
                      onChange={(e) => handleFieldChange('press_releases_esg_count', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Posts ESG redes sociais</Label>
                    <Input 
                      type="number"
                      value={formData.social_media_esg_posts_count || ''}
                      onChange={(e) => handleFieldChange('social_media_esg_posts_count', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Taxa de engajamento (%)</Label>
                    <Input 
                      type="number"
                      value={formData.social_media_engagement_rate || ''}
                      onChange={(e) => handleFieldChange('social_media_engagement_rate', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={formData.esg_spokesperson_designated || false}
                      onCheckedChange={(checked) => handleFieldChange('esg_spokesperson_designated', checked)}
                    />
                    <Label>Porta-voz designado</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={formData.media_training_provided || false}
                      onCheckedChange={(checked) => handleFieldChange('media_training_provided', checked)}
                    />
                    <Label>Treinamento de mídia</Label>
                  </div>
                </div>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={formData.public_statements_notes || ''}
                  onChange={(e) => handleFieldChange('public_statements_notes', e.target.value)}
                  placeholder="Descreva as declarações públicas..."
                />
              </div>
            </>
          )}

          {currentQuestion === 3 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.has_public_esg_report || false}
                  onCheckedChange={(checked) => handleFieldChange('has_public_esg_report', checked)}
                />
                <Label>Relatório ESG disponibilizado publicamente</Label>
              </div>

              {formData.has_public_esg_report && (
                <div className="space-y-4 ml-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data de publicação</Label>
                      <Input 
                        type="date"
                        value={formData.report_publication_date || ''}
                        onChange={(e) => handleFieldChange('report_publication_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>URL do relatório</Label>
                      <Input 
                        type="url"
                        value={formData.report_public_url || ''}
                        onChange={(e) => handleFieldChange('report_public_url', e.target.value)}
                        placeholder="https://"
                      />
                    </div>
                    <div>
                      <Label>Downloads</Label>
                      <Input 
                        type="number"
                        value={formData.report_download_count || ''}
                        onChange={(e) => handleFieldChange('report_download_count', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Visualizações</Label>
                      <Input 
                        type="number"
                        value={formData.report_page_views || ''}
                        onChange={(e) => handleFieldChange('report_page_views', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Idiomas disponíveis</Label>
                      <Input 
                        type="number"
                        value={formData.languages_available || ''}
                        onChange={(e) => handleFieldChange('languages_available', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <Checkbox 
                        checked={formData.accessibility_compliance || false}
                        onCheckedChange={(checked) => handleFieldChange('accessibility_compliance', checked)}
                      />
                      <Label>Conformidade WCAG 2.1</Label>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={formData.public_report_notes || ''}
                  onChange={(e) => handleFieldChange('public_report_notes', e.target.value)}
                  placeholder="Descreva a disponibilização pública..."
                />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              Anterior
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              {currentQuestion < COMMUNICATION_TRANSPARENCY_QUESTIONS.length - 1 ? (
                <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                  Próxima
                </Button>
              ) : (
                <Button onClick={handleAnalyzeWithAI} disabled={isAnalyzing}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métricas de Comunicação (GRI 2-29, AA1000SES)
              </CardTitle>
              <CardDescription>
                Dados calculados automaticamente
              </CardDescription>
            </div>
            <Button onClick={() => calculateMetrics(companyId)} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl font-bold text-blue-700">
                {((quantitativeData.total_communication_reach || 0) / 1000).toFixed(1)}k
              </div>
              <div className="text-sm text-blue-600 mt-1">Alcance Total</div>
              <div className="text-xs text-muted-foreground">
                {quantitativeData.unique_audience_reached || 0} grupos
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl font-bold text-green-700">
                {quantitativeData.communication_channels_count || 0}
              </div>
              <div className="text-sm text-green-600 mt-1">Canais Ativos</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-3xl font-bold text-purple-700">
                {quantitativeData.total_content_pieces_produced || 0}
              </div>
              <div className="text-sm text-purple-600 mt-1">Conteúdos</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <Badge variant="outline" className="text-lg font-bold">
                {quantitativeData.communication_maturity_level || 'Iniciante'}
              </Badge>
              <div className="text-sm text-orange-600 mt-2">Maturidade</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600" />
              Princípios AA1000SES
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Inclusividade</CardTitle>
                  <CardDescription className="text-xs">
                    Diversidade de stakeholders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-indigo-600">
                        {(quantitativeData.aa1000ses_inclusivity_score || 0).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={quantitativeData.aa1000ses_inclusivity_score || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Responsividade</CardTitle>
                  <CardDescription className="text-xs">
                    Taxa de resposta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        {(quantitativeData.aa1000ses_responsiveness_score || 0).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={quantitativeData.aa1000ses_responsiveness_score || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="text-xs text-muted-foreground">Materialidade (0-100)</Label>
                <Input 
                  type="number" 
                  value={formData.aa1000ses_materiality_score || ''} 
                  onChange={(e) => handleFieldChange('aa1000ses_materiality_score', parseFloat(e.target.value))}
                  placeholder="0-100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Impacto (0-100)</Label>
                <Input 
                  type="number" 
                  value={formData.aa1000ses_impact_score || ''} 
                  onChange={(e) => handleFieldChange('aa1000ses_impact_score', parseFloat(e.target.value))}
                  placeholder="0-100"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Canais de Comunicação ESG
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {COMMUNICATION_CHANNELS.map((channel) => (
                <div key={channel} className="flex items-center gap-2 p-3 border rounded">
                  <Checkbox 
                    checked={formData.communication_channels?.includes(channel)}
                    onCheckedChange={(checked) => {
                      const current = formData.communication_channels || [];
                      const updated = checked 
                        ? [...current, channel]
                        : current.filter((c: string) => c !== channel);
                      handleFieldChange('communication_channels', updated);
                    }}
                  />
                  <Label className="text-sm">{channel}</Label>
                </div>
              ))}
            </div>
          </div>

          {quantitativeData.communication_maturity_level === 'Iniciante' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Comunicação em Estágio Inicial</AlertTitle>
              <AlertDescription className="text-xs">
                Recomenda-se:
                <ul className="list-disc ml-4 mt-2">
                  <li>Formalizar plano de comunicação ESG</li>
                  <li>Ampliar canais de divulgação</li>
                  <li>Coletar feedback sistematicamente</li>
                  <li>Medir alcance e engajamento</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de Documentos</CardTitle>
          <CardDescription>
            Documentos recomendados para comunicação e transparência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {COMMUNICATION_TRANSPARENCY_DOCUMENTS_CHECKLIST.map((doc, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <CheckCircle className={`h-5 w-5 mt-0.5 ${doc.required ? 'text-orange-500' : 'text-green-500'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{doc.category}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.griReference} • AA1000SES: {doc.aa1000ses}
                  </div>
                </div>
                <Badge variant={doc.required ? "default" : "secondary"} className="text-xs">
                  {doc.required ? 'Obrigatório' : 'Opcional'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
