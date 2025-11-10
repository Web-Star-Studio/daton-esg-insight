import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, Upload, CheckCircle, AlertCircle, Sparkles, 
  Download, Target, BookOpen, Award, Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadZone } from './DocumentUploadZone';

interface StrategyDataCollectionModuleProps {
  reportId: string;
  onComplete?: () => void;
}

// Perguntas Orientadoras
const GUIDING_QUESTIONS = [
  {
    id: 'mission_vision_values',
    icon: Target,
    title: 'Missão, Visão e Valores',
    question: 'A organização possui missão, visão e valores definidos e atualizados?',
    helpText: 'Indique se existem documentos formais e quando foram atualizados pela última vez.',
    fields: ['has_mission_vision_values', 'mission_vision_values_updated_date', 'mission_vision_values_notes'],
    requiredDocuments: ['Missão/Visão/Valores'],
  },
  {
    id: 'sustainability_policy',
    icon: BookOpen,
    title: 'Política de Sustentabilidade',
    question: 'Existe política/diretriz formal de sustentabilidade aprovada pela alta direção?',
    helpText: 'Anexe a política oficial e a ata de aprovação pelo conselho ou diretoria.',
    fields: ['has_sustainability_policy', 'sustainability_policy_approval_date', 'sustainability_policy_notes'],
    requiredDocuments: ['Política de Sustentabilidade', 'Ata de Aprovação'],
  },
  {
    id: 'strategic_plan',
    icon: FileText,
    title: 'Plano Estratégico ESG',
    question: 'O plano estratégico contempla metas ambientais, sociais e econômicas de médio/longo prazo?',
    helpText: 'Informe o período do plano estratégico e as metas ESG específicas.',
    fields: ['has_strategic_plan_esg', 'strategic_plan_period', 'strategic_plan_notes'],
    requiredDocuments: ['Plano Estratégico'],
  },
  {
    id: 'public_commitments',
    icon: Award,
    title: 'Compromissos Públicos',
    question: 'Há compromissos públicos com ODS ou pactos setoriais (ex.: Pacto Global, Movimento ODS)?',
    helpText: 'Liste os compromissos assumidos e anexe comunicados oficiais.',
    fields: ['has_public_commitments', 'public_commitments_list', 'public_commitments_notes'],
    requiredDocuments: ['Relatório ODS/Pacto Global'],
  },
  {
    id: 'previous_results',
    icon: Users,
    title: 'Resultados Anteriores',
    question: 'Existem registros de resultados alcançados em metas anteriores?',
    helpText: 'Resuma os principais resultados e anexe relatórios ou dashboards.',
    fields: ['has_previous_results', 'previous_results_summary'],
    requiredDocuments: ['Resultados'],
  },
];

// Checklist de Documentos
const DOCUMENTS_CHECKLIST = [
  { category: 'Missão/Visão/Valores', examples: ['Código de Conduta', 'Apresentação Institucional'], required: true },
  { category: 'Política de Sustentabilidade', examples: ['Política ESG', 'Diretriz Ambiental'], required: true },
  { category: 'Plano Estratégico', examples: ['Plano 2024-2030', 'Planejamento Anual'], required: true },
  { category: 'Ata de Aprovação', examples: ['Ata Conselho', 'Resolução Diretoria'], required: false },
  { category: 'Relatório ODS/Pacto Global', examples: ['Comunicado ODS', 'Relatório Progresso'], required: false },
  { category: 'Resultados', examples: ['Dashboard', 'Relatório Trimestral'], required: false },
];

export function StrategyDataCollectionModule({ reportId, onComplete }: StrategyDataCollectionModuleProps) {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Carregar dados existentes
  useEffect(() => {
    loadExistingData();
  }, [reportId]);

  const loadExistingData = async () => {
    try {
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company não encontrada');
      setCompanyId(profile.company_id);

      // Carregar dados da coleta
      const { data: strategyData } = await supabase
        .from('gri_strategy_data_collection')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (strategyData) {
        setFormData(strategyData);
        setChecklist((strategyData.documents_checklist as Record<string, boolean>) || {});
        setAiAnalysis(strategyData.ai_analysis);
        setCompletionPercentage(strategyData.completion_percentage || 0);
      }

      // Carregar documentos uploaded
      const { data: docs } = await supabase
        .from('gri_document_uploads')
        .select('*')
        .eq('report_id', reportId);

      if (docs) {
        setUploadedDocs(docs);
        // Atualizar checklist baseado nos docs
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
      toast.error('Erro ao carregar dados existentes');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = useCallback((data: any, docs: any[]) => {
    let total = GUIDING_QUESTIONS.length * 2;
    let completed = 0;

    GUIDING_QUESTIONS.forEach(q => {
      const hasField = q.fields[0];
      if (data[hasField]) completed++;
      
      const hasDocs = q.requiredDocuments.some(doc => 
        docs.some(ud => ud.category?.includes(doc.split(' ')[0]))
      );
      if (hasDocs) completed++;
    });

    return Math.round((completed / total) * 100);
  }, []);

  const handleFieldUpdate = async (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    if (!companyId) return;

    try {
      const { error } = await supabase
        .from('gri_strategy_data_collection')
        .upsert({
          report_id: reportId,
          company_id: companyId,
          ...updatedData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      const percentage = calculateCompletion(updatedData, uploadedDocs);
      setCompletionPercentage(percentage);

      await supabase
        .from('gri_strategy_data_collection')
        .update({ completion_percentage: percentage })
        .eq('report_id', reportId);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Falha ao salvar dados');
    }
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_strategy_data',
          report_id: reportId,
          form_data: formData,
          documents: uploadedDocs
        }
      });

      if (error) throw error;

      setAiAnalysis(data);
      toast.success('Análise concluída! Texto descritivo gerado.');

      await supabase
        .from('gri_strategy_data_collection')
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
      {/* Header com progresso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Visão e Estratégia de Sustentabilidade</CardTitle>
              <CardDescription>
                Preencha as informações e faça upload dos documentos comprobatórios (GRI 2-22 a 2-29)
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

      {/* Seção de Perguntas Orientadoras */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Perguntas Orientadoras</h3>
        
        {GUIDING_QUESTIONS.map((question, idx) => (
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
                      <Label>Data {question.fields[1].includes('updated') ? 'de Atualização' : 'de Aprovação'}</Label>
                      <Input
                        type="date"
                        value={formData[question.fields[1]] || ''}
                        onChange={(e) => handleFieldUpdate(question.fields[1], e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  {question.fields[1] && question.fields[1].includes('period') && (
                    <div>
                      <Label>Período do Plano Estratégico</Label>
                      <Input
                        type="text"
                        placeholder="Ex: 2024-2030"
                        value={formData[question.fields[1]] || ''}
                        onChange={(e) => handleFieldUpdate(question.fields[1], e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {question.fields[1] && question.fields[1].includes('list') && (
                    <div>
                      <Label>Compromissos Assumidos (separados por vírgula)</Label>
                      <Input
                        type="text"
                        placeholder="Ex: ODS, Pacto Global, Movimento ODS"
                        value={(formData[question.fields[1]] || []).join(', ')}
                        onChange={(e) => handleFieldUpdate(question.fields[1], e.target.value.split(',').map((s: string) => s.trim()))}
                        className="mt-1"
                      />
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
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist de Documentos */}
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
            {DOCUMENTS_CHECKLIST.map((doc) => (
              <div key={doc.category} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {checklist[doc.category] ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{doc.category}</span>
                    {doc.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                    {checklist[doc.category] && <Badge variant="default" className="text-xs">✓ Anexado</Badge>}
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

      {/* Botão de Análise com IA */}
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