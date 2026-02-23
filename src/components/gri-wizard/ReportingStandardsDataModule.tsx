import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { FileText, Award, CheckSquare, TrendingUp, BarChart3, RefreshCw, Shield, AlertCircle, BookOpen } from 'lucide-react';

interface ReportingStandardsDataModuleProps {
  reportId: string;
  onComplete?: () => void;
}

const REPORTING_STANDARDS_QUESTIONS = [
  {
    id: 'previous_reports',
    icon: FileText,
    title: 'Relatórios ESG/Sustentabilidade Anteriores',
    question: 'A organização já publicou relatórios de sustentabilidade ou ESG anteriormente?',
    helpText: 'Histórico de relatórios anuais, bienais, relatórios integrados, relatórios GRI.',
    griStandards: ['GRI 2-3'],
  },
  {
    id: 'framework_adherence',
    icon: Award,
    title: 'Aderência a Padrões (GRI, SASB, TCFD, ABNT PR 2030)',
    question: 'A organização adere a frameworks internacionais de reporte ESG?',
    helpText: 'GRI Standards, SASB, TCFD, ABNT PR 2030, CDP, IIRC, ODS.',
    griStandards: ['GRI 2-2', 'GRI 2-3'],
  },
  {
    id: 'aligned_policies',
    icon: CheckSquare,
    title: 'Políticas e Indicadores Alinhados',
    question: 'Existem políticas e KPIs ESG documentados e alinhados aos frameworks?',
    helpText: 'Políticas ESG, KPIs monitorados, matriz de indicadores GRI/SASB/TCFD.',
    griStandards: ['GRI 2-23', 'GRI 2-24'],
  },
  {
    id: 'benchmarking_studies',
    icon: TrendingUp,
    title: 'Estudos de Benchmarking Setorial',
    question: 'A organização realiza benchmarking com pares do setor em práticas ESG?',
    helpText: 'Análise comparativa com concorrentes, rankings setoriais, gap analysis.',
    griStandards: ['GRI 2-2'],
  },
];

export function ReportingStandardsDataModule({ reportId, onComplete }: ReportingStandardsDataModuleProps) {
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const formDataRef = useRef<any>({});

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gri_reporting_standards_data' as any)
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData(data);
        setCompletionPercentage((data as any).completion_percentage || 0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [reportId]);

  const calculateCompletion = useCallback((data: any) => {
    const fields = [
      'has_previous_reports',
      'has_framework_adherence',
      'has_aligned_policies',
      'has_benchmarking_studies',
      'frameworks_adopted',
      'assurance_provider',
    ];
    
    const completed = fields.filter(f => data[f] && (Array.isArray(data[f]) ? data[f].length > 0 : true)).length;
    return Math.round((completed / fields.length) * 100);
  }, []);

  const handleSave = useCallback(async (data: any, metrics: any) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const completion = calculateCompletion(data);

      const payload = {
        report_id: reportId,
        company_id: profile.company_id,
        ...data,
        ...metrics,
        completion_percentage: completion,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('gri_reporting_standards_data' as any)
        .upsert(payload, { onConflict: 'report_id' });

      if (error) throw error;
      setCompletionPercentage(completion);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }, [calculateCompletion, reportId]);

  const calculateQuantitativeMetrics = useCallback(async (dataToSave = formDataRef.current) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Buscar histórico de relatórios
      const { data: previousReports, count: totalReports } = await supabase
        .from('gri_reports')
        .select('*', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .eq('status', 'Publicado')
        .order('year', { ascending: true });

      const firstReportYear = previousReports?.[0]?.year || null;
      const yearsOfReporting = firstReportYear ? new Date().getFullYear() - firstReportYear : 0;
      
      let reportFrequency = 'Irregular';
      if (totalReports && totalReports >= 3) {
        const years = previousReports?.map(r => r.year) || [];
        const gaps = years.slice(1).map((year, i) => year - years[i]);
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        reportFrequency = avgGap <= 1.2 ? 'Anual' : avgGap <= 2.5 ? 'Bienal' : 'Irregular';
      }

      // Buscar indicadores GRI reportados
      const { data: indicatorData, count: totalIndicators } = await supabase
        .from('gri_indicator_data' as any)
        .select('*, gri_indicators_library!inner(*)', { count: 'exact' })
        .eq('company_id', profile.company_id);

      const mandatoryIndicators = indicatorData?.filter((ind: any) => 
        ind.gri_indicators_library?.is_mandatory
      ).length || 0;

      const optionalIndicators = (totalIndicators || 0) - mandatoryIndicators;

      const universalIndicators = indicatorData?.filter((ind: any) => 
        ind.gri_indicators_library?.code?.startsWith('2-')
      ).length || 0;
      const griUniversalCoverage = ((universalIndicators / 30) * 100).toFixed(1);

      let maturityLevel = 'Iniciante';
      if (yearsOfReporting >= 10 && (totalReports || 0) >= 8) {
        maturityLevel = 'Liderança';
      } else if (yearsOfReporting >= 5 && (totalReports || 0) >= 4) {
        maturityLevel = 'Estabelecido';
      } else if (yearsOfReporting >= 2 && (totalReports || 0) >= 2) {
        maturityLevel = 'Emergente';
      }

      const previousReportsList = previousReports?.map(report => ({
        year: report.year,
        title: report.title,
        framework: 'GRI Standards',
        pages: 0,
        verified: false,
      })) || [];

      const metrics = {
        total_reports_published: totalReports || 0,
        first_report_year: firstReportYear,
        years_of_reporting: yearsOfReporting,
        report_frequency: reportFrequency,
        previous_reports_list: previousReportsList,
        total_gri_indicators_reported: totalIndicators || 0,
        mandatory_indicators_reported: mandatoryIndicators,
        optional_indicators_reported: optionalIndicators,
        gri_universal_standards_coverage: parseFloat(griUniversalCoverage),
        reporting_maturity_level: maturityLevel,
      };

      setQuantitativeData(metrics);

      // Auto-save quantitative data
      await handleSave(dataToSave, metrics);
    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast.error('Erro ao calcular métricas');
    } finally {
      setIsLoading(false);
    }
  }, [handleSave]);

  useEffect(() => {
    void loadData();
    void calculateQuantitativeMetrics();
  }, [loadData, calculateQuantitativeMetrics]);

  const handleFieldChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    handleSave(updated, quantitativeData);
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const { data: documents } = await supabase
        .from('documents' as any)
        .select('*')
        .eq('report_id', reportId)
        .in('category', [
          'Relatório de Sustentabilidade',
          'Relatório ESG',
          'GRI Content Index',
          'Matriz de Materialidade'
        ]);

      const response = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_reporting_standards_data',
          report_id: reportId,
          form_data: formData,
          documents: documents || [],
          quantitative_data: quantitativeData,
        }
      });

      if (response.error) throw response.error;

      const analysis = response.data;

      await supabase
        .from('gri_reporting_standards_data' as any)
        .update({
          ai_analysis: analysis,
          ai_generated_text: analysis.generated_text,
          ai_confidence_score: analysis.confidence_score,
          ai_last_analyzed_at: new Date().toISOString(),
        })
        .eq('report_id', reportId);

      toast.success('Análise de IA concluída!');
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Error analyzing:', error);
      toast.error('Erro ao analisar dados: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BookOpen className="h-6 w-6 text-primary" />
                Relatórios e Normas (GRI 2-3, 2-4, 2-5)
              </CardTitle>
              <CardDescription className="mt-2">
                Histórico de reporte ESG, aderência a frameworks internacionais e verificação externa
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {completionPercentage}% completo
            </Badge>
          </div>
          <Progress value={completionPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Métricas Quantitativas */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métricas de Reporte ESG
              </CardTitle>
              <CardDescription>
                Dados calculados automaticamente do histórico de relatórios
              </CardDescription>
            </div>
            <Button onClick={() => calculateQuantitativeMetrics(formData)} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo Executivo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl font-bold text-blue-700">{quantitativeData.years_of_reporting || 0}</div>
              <div className="text-sm text-blue-600 mt-1">Anos de Reporte</div>
              <div className="text-xs text-muted-foreground">Desde {quantitativeData.first_report_year || 'N/A'}</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl font-bold text-green-700">{quantitativeData.total_reports_published || 0}</div>
              <div className="text-sm text-green-600 mt-1">Relatórios Publicados</div>
              <div className="text-xs text-muted-foreground">{quantitativeData.report_frequency || 'N/A'}</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-3xl font-bold text-purple-700">{quantitativeData.total_gri_indicators_reported || 0}</div>
              <div className="text-sm text-purple-600 mt-1">Indicadores GRI</div>
              <div className="text-xs text-muted-foreground">{quantitativeData.gri_universal_standards_coverage || 0}% cobertura</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <Badge variant="outline" className="text-lg font-bold">
                {quantitativeData.reporting_maturity_level || 'N/A'}
              </Badge>
              <div className="text-sm text-orange-600 mt-2">Nível de Maturidade</div>
            </div>
          </div>

          {/* Timeline de Relatórios */}
          {quantitativeData.previous_reports_list?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Histórico de Relatórios Publicados
              </h4>
              
              <div className="space-y-2">
                {quantitativeData.previous_reports_list.map((report: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Badge variant="outline" className="min-w-[60px] justify-center">{report.year}</Badge>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{report.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.framework} • {report.pages} páginas
                        {report.verified && <Badge variant="secondary" className="ml-2">✓ Verificado</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerta de Maturidade */}
          {quantitativeData.reporting_maturity_level === 'Iniciante' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Reporte em Estágio Inicial</AlertTitle>
              <AlertDescription className="text-xs">
                A organização está em estágio inicial de reporte ESG. Recomenda-se:
                <ul className="list-disc ml-4 mt-2">
                  <li>Estabelecer ciclo de reporte anual</li>
                  <li>Adotar GRI Standards como framework principal</li>
                  <li>Aumentar cobertura de indicadores obrigatórios</li>
                  <li>Considerar verificação externa</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Perguntas Guiadas */}
      {REPORTING_STANDARDS_QUESTIONS.map((q) => {
        const Icon = q.icon;
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {q.title}
              </CardTitle>
              <CardDescription>
                {q.question}
                <div className="text-xs text-muted-foreground mt-2">
                  💡 {q.helpText}
                </div>
                <div className="flex gap-1 mt-2">
                  {q.griStandards.map(std => (
                    <Badge key={std} variant="secondary" className="text-xs">{std}</Badge>
                  ))}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`Descreva ${q.title.toLowerCase()}...`}
                value={formData[`${q.id}_notes`] || ''}
                onChange={(e) => handleFieldChange(`${q.id}_notes`, e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        );
      })}

      {/* Frameworks Adotados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Frameworks e Padrões Adotados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {['GRI Standards', 'SASB', 'TCFD', 'ABNT PR 2030', 'CDP', 'ODS'].map((framework) => (
              <div key={framework} className="flex items-center gap-2 p-3 border rounded">
                <Checkbox 
                  checked={formData.frameworks_adopted?.includes(framework)}
                  onCheckedChange={(checked) => {
                    const current = formData.frameworks_adopted || [];
                    const updated = checked 
                      ? [...current, framework]
                      : current.filter((f: string) => f !== framework);
                    handleFieldChange('frameworks_adopted', updated);
                  }}
                />
                <Label className="text-sm">{framework}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GRI 2-5: Verificação Externa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            GRI 2-5: Verificação Externa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Empresa Verificadora</Label>
              <Input 
                value={formData.assurance_provider || ''} 
                onChange={(e) => handleFieldChange('assurance_provider', e.target.value)}
                placeholder="Ex: KPMG, PwC, Bureau Veritas"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nível de Asseguração</Label>
              <Select 
                value={formData.assurance_level || ''} 
                onValueChange={(value) => handleFieldChange('assurance_level', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Limited">Limited (Limitada)</SelectItem>
                  <SelectItem value="Reasonable">Reasonable (Razoável)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Escopo</Label>
              <Select 
                value={formData.assurance_scope || ''} 
                onValueChange={(value) => handleFieldChange('assurance_scope', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Total">Total</SelectItem>
                  <SelectItem value="Parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cobertura (%)</Label>
              <Input 
                type="number" 
                value={formData.assurance_coverage_percentage || ''} 
                onChange={(e) => handleFieldChange('assurance_coverage_percentage', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benchmarking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Benchmarking Setorial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 border rounded text-center">
              <Input 
                type="number" 
                value={formData.company_score || ''} 
                onChange={(e) => handleFieldChange('company_score', parseFloat(e.target.value))}
                className="text-center font-bold mb-1"
                placeholder="Score"
              />
              <div className="text-xs text-muted-foreground">Score da Empresa</div>
            </div>
            <div className="p-3 border rounded text-center">
              <Input 
                type="number" 
                value={formData.sector_average_score || ''} 
                onChange={(e) => handleFieldChange('sector_average_score', parseFloat(e.target.value))}
                className="text-center font-bold mb-1"
                placeholder="Score"
              />
              <div className="text-xs text-muted-foreground">Média do Setor</div>
            </div>
            <div className="p-3 border rounded text-center">
              <Input 
                type="number" 
                value={formData.top_performer_score || ''} 
                onChange={(e) => handleFieldChange('top_performer_score', parseFloat(e.target.value))}
                className="text-center font-bold mb-1"
                placeholder="Score"
              />
              <div className="text-xs text-muted-foreground">Líder Setorial</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end gap-3">
        <Button 
          onClick={handleAnalyzeWithAI} 
          disabled={isAnalyzing || completionPercentage < 50}
          size="lg"
          className="min-w-[200px]"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            'Gerar Análise com IA'
          )}
        </Button>
      </div>
    </div>
  );
}
