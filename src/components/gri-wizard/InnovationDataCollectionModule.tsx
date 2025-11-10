import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lightbulb, Cog, Zap, Handshake, Award, Beaker, RefreshCw, BarChart3, AlertCircle, FileText, Users, DollarSign, TrendingUp, Leaf } from 'lucide-react';

const INNOVATION_QUESTIONS = [
  {
    id: 'rd_projects',
    icon: Beaker,
    title: 'Projetos de P&D com Foco em Sustentabilidade',
    question: 'A organização desenvolve projetos de P&D focados em sustentabilidade?',
    helpText: 'Pesquisa e desenvolvimento de produtos, processos ou tecnologias sustentáveis.',
    griStandards: ['GRI 203-1'],
  },
  {
    id: 'continuous_improvement',
    icon: Cog,
    title: 'Programas de Melhoria Contínua e Inovação de Processos',
    question: 'Existem programas de melhoria contínua ou inovação de processos ativos?',
    helpText: 'Lean, Six Sigma, Kaizen, Design Thinking, programas de sugestão de melhorias.',
    griStandards: ['GRI 203-2'],
  },
  {
    id: 'efficiency_technologies',
    icon: Zap,
    title: 'Tecnologias de Eficiência Energética/Hídrica/Ambiental',
    question: 'A organização implementou tecnologias para eficiência energética, hídrica ou ambiental?',
    helpText: 'Painéis solares, LED, reúso de água, ETE, sensores inteligentes, automação.',
    griStandards: ['GRI 203-1', 'GRI 203-2'],
  },
  {
    id: 'research_partnerships',
    icon: Handshake,
    title: 'Parcerias com Universidades, Startups e Centros de Pesquisa',
    question: 'A organização mantém parcerias para pesquisa e inovação?',
    helpText: 'Convênios com universidades, colaboração com startups, projetos conjuntos.',
    griStandards: ['GRI 203-1'],
  },
  {
    id: 'innovation_awards',
    icon: Award,
    title: 'Premiações e Certificações em Inovação Sustentável',
    question: 'A organização recebeu premiações ou certificações em inovação sustentável?',
    helpText: 'Prêmios de inovação, certificações ISO 56002, reconhecimentos setoriais.',
    griStandards: ['GRI 203-1'],
  },
];

interface InnovationDataCollectionModuleProps {
  reportId: string;
  onComplete: () => void;
}

export default function InnovationDataCollectionModule({ reportId, onComplete }: InnovationDataCollectionModuleProps) {
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    loadExistingData();
  }, [reportId]);

  const loadExistingData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gri_innovation_data_collection' as any)
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData(data);
        setQuantitativeData({
          total_innovation_investment: (data as any).total_innovation_investment || 0,
          rd_investment_percentage_revenue: (data as any).rd_investment_percentage_revenue || 0,
          total_innovations_implemented: (data as any).total_innovations_implemented || 0,
          total_partnerships: (data as any).total_partnerships || 0,
          innovation_awards_received: (data as any).innovation_awards_received || 0,
          ghg_emissions_avoided_tco2e: (data as any).ghg_emissions_avoided_tco2e || 0,
          waste_reduction_tons: (data as any).waste_reduction_tons || 0,
          innovation_training_hours: (data as any).innovation_training_hours || 0,
          employees_trained_improvement: (data as any).employees_trained_improvement || 0,
          technologies_investment_total: (data as any).technologies_investment_total || 0,
        });
        setCompletionPercentage((data as any).completion_percentage || 0);
      } else {
        await calculateInnovationMetrics();
      }
    } catch (error: any) {
      console.error('Error loading innovation data:', error);
      toast.error('Erro ao carregar dados de inovação');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateInnovationMetrics = async () => {
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

      const periodStart = new Date(report.reporting_period_start);
      const periodEnd = new Date(report.reporting_period_end);

      // Buscar dados de emissões para calcular reduções
      const { data: emissions } = await supabase
        .from('calculated_emissions' as any)
        .select('total_co2e, calculation_date')
        .eq('company_id', profile.company_id)
        .gte('calculation_date', periodStart.toISOString())
        .lte('calculation_date', periodEnd.toISOString())
        .order('calculation_date', { ascending: true });

      let emissionReduction = 0;
      if (emissions && emissions.length >= 2) {
        const firstPeriod = (emissions[0] as any).total_co2e || 0;
        const lastPeriod = (emissions[emissions.length - 1] as any).total_co2e || 0;
        emissionReduction = Math.max(0, firstPeriod - lastPeriod);
      }

      setQuantitativeData({
        total_innovation_investment: 0,
        rd_investment_percentage_revenue: 0,
        total_innovations_implemented: 0,
        total_partnerships: 0,
        innovation_awards_received: 0,
        ghg_emissions_avoided_tco2e: emissionReduction.toFixed(2),
        waste_reduction_tons: 0,
        innovation_training_hours: 0,
        employees_trained_improvement: 0,
        technologies_investment_total: 0,
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    if (field.includes('investment') || field.includes('count') || field.includes('percentage')) {
      handleAutoSave();
    }
  };

  const handleAutoSave = async () => {
    if (isSaving) return;
    
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

      const saveData = {
        ...formData,
        report_id: reportId,
        company_id: profile.company_id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('gri_innovation_data_collection' as any)
        .upsert(saveData, { onConflict: 'report_id' });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error auto-saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculate = async () => {
    await calculateInnovationMetrics();
    toast.success('Métricas recalculadas');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-purple-600" />
            Inovação e Desenvolvimento Tecnológico
          </h2>
          <p className="text-muted-foreground mt-1">
            Projetos de P&D, tecnologias sustentáveis e parcerias para inovação (GRI 203)
          </p>
        </div>
        {isSaving && (
          <Badge variant="secondary" className="animate-pulse">
            Salvando...
          </Badge>
        )}
      </div>

      <Progress value={completionPercentage} className="w-full" />

      {/* Dados Quantitativos */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dados Quantitativos de Inovação (GRI 203)
              </CardTitle>
              <CardDescription>
                Métricas de investimento e impacto da inovação
              </CardDescription>
            </div>
            <Button onClick={handleRecalculate} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo Executivo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <Label className="text-xs text-muted-foreground">Investimento Total</Label>
              <Input 
                type="number" 
                value={formData.total_innovation_investment || ''} 
                onChange={(e) => handleFieldChange('total_innovation_investment', parseFloat(e.target.value))}
                placeholder="R$"
                className="mt-1 font-bold"
              />
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
              <Label className="text-xs text-muted-foreground">Inovações Implementadas</Label>
              <Input 
                type="number" 
                value={formData.total_innovations_implemented || ''} 
                onChange={(e) => handleFieldChange('total_innovations_implemented', parseInt(e.target.value))}
                className="mt-1 font-bold"
              />
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <Label className="text-xs text-muted-foreground">Parcerias Ativas</Label>
              <Input 
                type="number" 
                value={formData.total_partnerships || ''} 
                onChange={(e) => handleFieldChange('total_partnerships', parseInt(e.target.value))}
                className="mt-1 font-bold"
              />
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <Label className="text-xs text-muted-foreground">Prêmios/Certificações</Label>
              <Input 
                type="number" 
                value={formData.innovation_awards_received || ''} 
                onChange={(e) => handleFieldChange('innovation_awards_received', parseInt(e.target.value))}
                className="mt-1 font-bold"
              />
            </div>
          </div>

          {/* GRI 203-1: Investimentos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              GRI 203-1: Investimentos em Inovação
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>P&D Anual (R$)</Label>
                <Input 
                  type="number" 
                  value={formData.rd_annual_investment || ''} 
                  onChange={(e) => handleFieldChange('rd_annual_investment', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tecnologias (R$)</Label>
                <Input 
                  type="number" 
                  value={formData.technologies_investment_total || ''} 
                  onChange={(e) => handleFieldChange('technologies_investment_total', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Parcerias (R$)</Label>
                <Input 
                  type="number" 
                  value={formData.partnerships_investment || ''} 
                  onChange={(e) => handleFieldChange('partnerships_investment', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* GRI 203-2: Impactos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              GRI 203-2: Impactos Econômicos e Ambientais
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Economia Anual (R$)</Label>
                <Input 
                  type="number" 
                  value={formData.cost_savings_annual || ''} 
                  onChange={(e) => handleFieldChange('cost_savings_annual', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Empregos Criados</Label>
                <Input 
                  type="number" 
                  value={formData.jobs_created_innovation || ''} 
                  onChange={(e) => handleFieldChange('jobs_created_innovation', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Redução Energia (kWh)</Label>
                <Input 
                  type="number" 
                  value={formData.energy_consumption_reduction_kwh || ''} 
                  onChange={(e) => handleFieldChange('energy_consumption_reduction_kwh', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Emissões Evitadas (tCO2e)</Label>
                <div className="text-lg font-bold text-green-600 mt-2">
                  {quantitativeData.ghg_emissions_avoided_tco2e}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perguntas Qualitativas */}
      {INNOVATION_QUESTIONS.map((q) => {
        const Icon = q.icon;
        return (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{q.title}</CardTitle>
                  <CardDescription className="mt-1">{q.question}</CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">{q.helpText}</p>
                  <div className="flex gap-2 mt-2">
                    {q.griStandards.map(gri => (
                      <Badge key={gri} variant="secondary" className="text-xs">{gri}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Notas e Observações</Label>
                <Textarea
                  value={formData[`${q.id}_notes`] || ''}
                  onChange={(e) => handleFieldChange(`${q.id}_notes`, e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Descreva os detalhes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Alerta */}
      {parseFloat(formData.rd_investment_percentage_revenue || 0) < 1 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Investimento em P&D</AlertTitle>
          <AlertDescription className="text-xs">
            Considere aumentar os investimentos em P&D para manter a competitividade. A média do setor é de 2-5% da receita.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={onComplete} size="lg">
          Concluir Módulo de Inovação
        </Button>
      </div>
    </div>
  );
}
