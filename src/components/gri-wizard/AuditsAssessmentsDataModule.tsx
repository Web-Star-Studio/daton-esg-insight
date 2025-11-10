import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, Award, BarChart3, AlertTriangle, Shield, CheckCircle, RefreshCw, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadZone } from './DocumentUploadZone';

interface AuditsAssessmentsDataModuleProps {
  reportId: string;
  onComplete: () => void;
}

const AUDITS_ASSESSMENTS_QUESTIONS = [
  {
    id: 'periodic_audits',
    icon: ClipboardCheck,
    title: 'Auditorias Internas/Externas Periódicas',
    question: 'A organização realiza auditorias internas e externas periódicas?',
    helpText: 'Auditorias de qualidade, meio ambiente, saúde ocupacional, ESG.',
    griStandards: ['GRI 2-5'],
  },
  {
    id: 'certifications',
    icon: Award,
    title: 'Certificações e Selos (ISO, ESG, Selo Verde)',
    question: 'A organização possui certificações ISO ou selos de sustentabilidade?',
    helpText: 'ISO 9001, 14001, 45001, 50001, 26000, Selos Verde, B Corp, LEED.',
    griStandards: ['GRI 2-5'],
  },
  {
    id: 'impact_assessments',
    icon: BarChart3,
    title: 'Avaliações de Impacto Socioambiental',
    question: 'São realizadas avaliações de impacto socioambiental?',
    helpText: 'EIA, SIA, LCA, Pegada de Carbono, Pegada Hídrica, Biodiversidade.',
    griStandards: ['GRI 2-12', 'GRI 2-25'],
  },
  {
    id: 'corrective_actions',
    icon: AlertTriangle,
    title: 'Planos de Ação Corretiva e Não Conformidades',
    question: 'Existem planos de ação para tratar não conformidades identificadas?',
    helpText: 'Não conformidades de auditorias, planos de ação corretiva e preventiva.',
    griStandards: ['GRI 2-5', 'GRI 2-27'],
  },
];

const AUDITS_ASSESSMENTS_DOCUMENTS_CHECKLIST = [
  { category: 'Relatório Auditoria', required: true, griReference: 'GRI 2-5', standards: 'ISAE 3000, AA1000AS' },
  { category: 'Certificado ISO 9001', required: false, griReference: 'GRI 2-5', standards: 'ISO 9001:2015' },
  { category: 'Certificado ISO 14001', required: false, griReference: 'GRI 2-5', standards: 'ISO 14001:2015' },
  { category: 'Certificado ISO 45001', required: false, griReference: 'GRI 2-5', standards: 'ISO 45001:2018' },
  { category: 'Relatório Verificação GEE', required: true, griReference: 'GRI 305', standards: 'GHG Protocol, ISO 14064' },
  { category: 'Avaliação Impacto Ambiental', required: false, griReference: 'GRI 2-12', standards: 'ISO 14040, IFC PS' },
  { category: 'Avaliação Impacto Social', required: false, griReference: 'GRI 413', standards: 'IFC PS, ESIA' },
  { category: 'Planilha Não Conformidades', required: true, griReference: 'GRI 2-27', standards: 'ISO 9001, ISO 14001' },
  { category: 'Plano Ação Corretiva', required: true, griReference: 'GRI 2-27', standards: 'ISO 9001, ISO 14001' },
  { category: 'Carta Verificação', required: false, griReference: 'GRI 2-5', standards: 'ISAE 3000, AA1000AS' },
];

export function AuditsAssessmentsDataModule({ reportId, onComplete }: AuditsAssessmentsDataModuleProps) {
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataId, setDataId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [reportId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Load existing data
      const { data: existingData, error: existingError } = await supabase
        .from('gri_audits_assessments_data' as any)
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (existingData && !existingError) {
        setFormData(existingData);
        setDataId((existingData as any).id);
      }

      // Calculate quantitative metrics
      await calculateMetrics(profile.company_id);

      // Load documents
      const { data: docs, error: docsError } = await supabase
        .from('documents' as any)
        .select('*')
        .eq('report_id', reportId);

      if (docs && !docsError) {
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = async (companyId: string) => {
    try {
      // Fetch audits from existing system
      const currentYear = new Date().getFullYear();
      const { data: audits } = await supabase
        .from('audits')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', `${currentYear - 1}-01-01`);

      const internalAudits = audits?.filter(a => a.audit_type?.includes('Interna')).length || 0;
      const externalAudits = audits?.filter(a => a.audit_type?.includes('Externa')).length || 0;

      const lastInternalAudit = audits?.filter(a => a.audit_type?.includes('Interna'))
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
      
      const lastExternalAudit = audits?.filter(a => a.audit_type?.includes('Externa'))
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];

      // Fetch audit findings (non-conformities)
      const auditIds = audits?.map(a => a.id) || [];
      const { data: findings } = await supabase
        .from('audit_findings')
        .select('*')
        .in('audit_id', auditIds);

      const totalFindings = findings?.length || 0;
      const openNonConformities = findings?.filter(f => f.status === 'Aberta').length || 0;
      const closedNonConformities = findings?.filter(f => f.status === 'Resolvida' || f.status === 'Fechada').length || 0;
      
      const closureRate = totalFindings > 0 ? ((closedNonConformities / totalFindings) * 100) : 0;

      const nonConformitiesBySeverity = {
        critical: findings?.filter(f => f.severity === 'Crítica' || f.severity === 'Alta').length || 0,
        major: findings?.filter(f => f.severity === 'Média').length || 0,
        minor: findings?.filter(f => f.severity === 'Baixa').length || 0,
      };

      // Calculate maturity level
      let auditMaturityLevel = 'Inicial';
      const totalAuditsCount = (audits?.length || 0);
      const maturityScore = (
        (totalAuditsCount >= 4 ? 25 : 0) +
        (externalAudits > 0 ? 25 : 0) +
        (closureRate >= 70 ? 25 : 0) +
        (openNonConformities < 5 ? 25 : 0)
      );

      if (maturityScore >= 80) auditMaturityLevel = 'Otimizado';
      else if (maturityScore >= 60) auditMaturityLevel = 'Gerenciado';
      else if (maturityScore >= 40) auditMaturityLevel = 'Definido';

      setQuantitativeData({
        internal_audits_count: internalAudits,
        external_audits_count: externalAudits,
        last_internal_audit_date: lastInternalAudit?.start_date || null,
        last_external_audit_date: lastExternalAudit?.start_date || null,
        total_non_conformities: totalFindings,
        open_non_conformities: openNonConformities,
        closed_non_conformities: closedNonConformities,
        non_conformities_closure_rate: closureRate,
        non_conformities_by_severity: nonConformitiesBySeverity,
        audit_maturity_level: auditMaturityLevel,
        linked_audits: auditIds,
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleRecalculate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      await calculateMetrics(profile.company_id);
      toast.success('Métricas recalculadas com sucesso!');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const dataToSave = {
        report_id: reportId,
        company_id: profile.company_id,
        ...formData,
        ...quantitativeData,
        updated_at: new Date().toISOString(),
      };

      if (dataId) {
        await supabase
          .from('gri_audits_assessments_data' as any)
          .update(dataToSave)
          .eq('id', dataId);
      } else {
        const { data: newData, error: insertError } = await supabase
          .from('gri_audits_assessments_data' as any)
          .insert(dataToSave)
          .select()
          .single();
        
        if (newData && !insertError) {
          setDataId((newData as any).id);
        }
      }

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!dataId) {
      toast.error('Salve os dados primeiro');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_audits_assessments_data',
          report_id: reportId,
          form_data: formData,
          documents: documents,
          quantitative_data: quantitativeData,
        }
      });

      if (error) throw error;

      // Update with AI analysis
      await supabase
        .from('gri_audits_assessments_data' as any)
        .update({
          ai_analysis: data,
          ai_generated_text: data.generated_text,
          ai_confidence_score: data.confidence_score,
          ai_last_analyzed_at: new Date().toISOString(),
        })
        .eq('id', dataId);

      toast.success('Análise concluída com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error('Erro ao analisar dados');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  const certCount = [
    formData.iso_9001_certified,
    formData.iso_14001_certified,
    formData.iso_45001_certified,
    formData.iso_50001_certified,
    formData.iso_27001_certified,
    formData.iso_37001_certified,
    formData.sa_8000_certified,
    formData.leed_certified,
    formData.fsc_certified,
    formData.b_corp_certified,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Auditorias e Avaliações</h2>
        <p className="text-muted-foreground">
          Documente auditorias, certificações, verificações externas e avaliações de impacto
        </p>
      </div>

      {/* Questions Guide */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Perguntas Orientadoras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUDITS_ASSESSMENTS_QUESTIONS.map((q) => {
              const Icon = q.icon;
              return (
                <div key={q.id} className="p-4 border rounded-lg bg-background">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="font-semibold">{q.title}</div>
                      <div className="text-sm text-muted-foreground">{q.question}</div>
                      <div className="text-xs text-muted-foreground italic">{q.helpText}</div>
                      <div className="flex gap-1">
                        {q.griStandards.map(std => (
                          <Badge key={std} variant="secondary" className="text-xs">{std}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quantitative Metrics */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métricas de Auditorias e Avaliações (GRI 2-5)
              </CardTitle>
              <CardDescription>
                Dados calculados automaticamente do sistema de auditorias.
              </CardDescription>
            </div>
            <Button onClick={handleRecalculate} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Executive Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {quantitativeData.internal_audits_count + quantitativeData.external_audits_count}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">Auditorias Realizadas</div>
              <div className="text-xs text-muted-foreground">
                {quantitativeData.internal_audits_count} internas, {quantitativeData.external_audits_count} externas
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">{certCount}</div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">Certificações Ativas</div>
              <div className="text-xs text-muted-foreground">ISO, Selos, ESG</div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                {quantitativeData.open_non_conformities}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">NCs Abertas</div>
              <div className="text-xs text-muted-foreground">
                {quantitativeData.non_conformities_closure_rate?.toFixed(1)}% fechadas
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <Badge variant="outline" className="text-lg font-bold">
                {quantitativeData.audit_maturity_level}
              </Badge>
              <div className="text-sm text-purple-600 dark:text-purple-400 mt-2">Maturidade de Auditoria</div>
            </div>
          </div>

          {/* ISO Certifications */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600" />
              Certificações ISO e Selos de Sustentabilidade
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'ISO 9001', field: 'iso_9001_certified', label: 'Qualidade' },
                { name: 'ISO 14001', field: 'iso_14001_certified', label: 'Meio Ambiente' },
                { name: 'ISO 45001', field: 'iso_45001_certified', label: 'Saúde e Segurança' },
                { name: 'ISO 50001', field: 'iso_50001_certified', label: 'Gestão de Energia' },
                { name: 'ISO 27001', field: 'iso_27001_certified', label: 'Segurança da Informação' },
                { name: 'ISO 37001', field: 'iso_37001_certified', label: 'Anti-corrupção' },
                { name: 'SA 8000', field: 'sa_8000_certified', label: 'Responsabilidade Social' },
                { name: 'LEED', field: 'leed_certified', label: 'Construção Sustentável' },
                { name: 'FSC', field: 'fsc_certified', label: 'Manejo Florestal' },
                { name: 'B Corp', field: 'b_corp_certified', label: 'Impacto Social' },
              ].map((cert) => (
                <div key={cert.field} className="flex items-center gap-2 p-3 border rounded hover:bg-muted/50">
                  <Checkbox 
                    checked={formData[cert.field] || false}
                    onCheckedChange={(checked) => handleFieldChange(cert.field, checked)}
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{cert.name}</Label>
                    <div className="text-xs text-muted-foreground">{cert.label}</div>
                  </div>
                  {formData[cert.field] && (
                    <Badge variant="secondary" className="text-xs">✓</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* GRI 2-5: External Verification */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              GRI 2-5: Verificação Externa do Relatório ESG
            </h4>
            
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Padrões de Verificação Reconhecidos</AlertTitle>
              <AlertDescription className="text-xs">
                ISAE 3000 (Revised), AA1000AS, ISSA 5000 são padrões internacionais aceitos para verificação de relatórios de sustentabilidade.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2 mb-4">
              <Checkbox 
                checked={formData.has_external_verification || false}
                onCheckedChange={(checked) => handleFieldChange('has_external_verification', checked)}
              />
              <Label className="text-sm font-medium">O relatório possui verificação externa?</Label>
            </div>

            {formData.has_external_verification && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Empresa Verificadora</Label>
                  <Input 
                    value={formData.verification_provider || ''} 
                    onChange={(e) => handleFieldChange('verification_provider', e.target.value)}
                    placeholder="Ex: KPMG, PwC, Bureau Veritas"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Padrão de Verificação</Label>
                  <Select 
                    value={formData.verification_standard || ''} 
                    onValueChange={(value) => handleFieldChange('verification_standard', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISAE 3000">ISAE 3000 (Revised)</SelectItem>
                      <SelectItem value="AA1000AS">AA1000AS</SelectItem>
                      <SelectItem value="ISSA 5000">ISSA 5000</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nível de Asseguração</Label>
                  <Select 
                    value={formData.verification_level || ''} 
                    onValueChange={(value) => handleFieldChange('verification_level', value)}
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
                  <Label className="text-xs text-muted-foreground">Cobertura (%)</Label>
                  <Input 
                    type="number" 
                    value={formData.verification_coverage_percentage || ''} 
                    onChange={(e) => handleFieldChange('verification_coverage_percentage', parseFloat(e.target.value))}
                    placeholder="0-100"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {formData.has_external_verification && (
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.governance_involvement || false}
                  onCheckedChange={(checked) => handleFieldChange('governance_involvement', checked)}
                />
                <Label className="text-sm">
                  O Conselho de Administração ou Alta Direção está envolvido no processo de verificação externa?
                </Label>
              </div>
            )}
          </div>

          {/* Non-Conformities */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Não Conformidades e Planos de Ação
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Críticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {quantitativeData.non_conformities_by_severity?.critical || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Moderadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {quantitativeData.non_conformities_by_severity?.major || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Menores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {quantitativeData.non_conformities_by_severity?.minor || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Taxa de Fechamento de Não Conformidades</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {quantitativeData.non_conformities_closure_rate?.toFixed(1)}%
                </span>
              </div>
              <Progress value={quantitativeData.non_conformities_closure_rate} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                {quantitativeData.closed_non_conformities} fechadas de {quantitativeData.total_non_conformities} totais
              </div>
            </div>
          </div>

          {/* Impact Assessments */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Avaliações de Impacto Realizadas
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Avaliação de Impacto Ambiental (EIA)', field: 'environmental_impact_assessment_done' },
                { label: 'Avaliação de Impacto Social (SIA)', field: 'social_impact_assessment_done' },
                { label: 'Avaliação de Direitos Humanos (HRIA)', field: 'human_rights_impact_assessment_done' },
                { label: 'Análise de Ciclo de Vida (LCA)', field: 'lifecycle_assessment_done' },
                { label: 'Pegada de Carbono', field: 'carbon_footprint_calculated' },
                { label: 'Pegada Hídrica', field: 'water_footprint_calculated' },
                { label: 'Avaliação de Biodiversidade', field: 'biodiversity_assessment_done' },
              ].map((assessment) => (
                <div key={assessment.field} className="flex items-center gap-2 p-2 border rounded">
                  <Checkbox 
                    checked={formData[assessment.field] || false}
                    onCheckedChange={(checked) => handleFieldChange(assessment.field, checked)}
                  />
                  <Label className="text-xs">{assessment.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Maturity Alert */}
          {quantitativeData.audit_maturity_level === 'Inicial' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sistema de Auditorias em Estágio Inicial</AlertTitle>
              <AlertDescription className="text-xs">
                O sistema de auditorias está em desenvolvimento. Recomenda-se:
                <ul className="list-disc ml-4 mt-2">
                  <li>Estabelecer cronograma de auditorias internas regulares</li>
                  <li>Contratar auditoria externa independente</li>
                  <li>Implementar sistema de gestão de não conformidades</li>
                  <li>Buscar certificações ISO relevantes ao setor</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Comprobatórios</CardTitle>
          <CardDescription>
            Faça upload dos documentos relacionados a auditorias, certificações e avaliações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <Label>Documentos Recomendados:</Label>
            <div className="flex flex-wrap gap-2">
              {AUDITS_ASSESSMENTS_DOCUMENTS_CHECKLIST.map(doc => (
                <Badge key={doc.category} variant={doc.required ? 'default' : 'secondary'}>
                  {doc.category}
                </Badge>
              ))}
            </div>
          </div>
          <DocumentUploadZone reportId={reportId} />
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notas sobre Auditorias</Label>
            <Textarea
              value={formData.audits_notes || ''}
              onChange={(e) => handleFieldChange('audits_notes', e.target.value)}
              placeholder="Informações adicionais sobre auditorias..."
              rows={3}
            />
          </div>
          <div>
            <Label>Notas sobre Certificações</Label>
            <Textarea
              value={formData.certifications_notes || ''}
              onChange={(e) => handleFieldChange('certifications_notes', e.target.value)}
              placeholder="Informações adicionais sobre certificações..."
              rows={3}
            />
          </div>
          <div>
            <Label>Notas sobre Avaliações de Impacto</Label>
            <Textarea
              value={formData.impact_assessments_notes || ''}
              onChange={(e) => handleFieldChange('impact_assessments_notes', e.target.value)}
              placeholder="Informações adicionais sobre avaliações de impacto..."
              rows={3}
            />
          </div>
          <div>
            <Label>Notas sobre Ações Corretivas</Label>
            <Textarea
              value={formData.corrective_action_notes || ''}
              onChange={(e) => handleFieldChange('corrective_action_notes', e.target.value)}
              placeholder="Informações adicionais sobre ações corretivas..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? 'Salvando...' : 'Salvar Dados'}
        </Button>
        <Button onClick={handleAnalyze} disabled={isAnalyzing || !dataId} variant="secondary" size="lg">
          <Sparkles className="h-4 w-4 mr-2" />
          {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
        </Button>
        <Button onClick={onComplete} variant="outline" size="lg">
          Continuar
        </Button>
      </div>
    </div>
  );
}
