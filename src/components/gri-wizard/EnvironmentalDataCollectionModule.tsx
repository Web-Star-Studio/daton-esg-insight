import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Wind, Zap, Droplets, Recycle, Award, 
  CheckCircle2, AlertCircle, BarChart3, Download,
  FileText, Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocumentUploadZone } from "./DocumentUploadZone";

interface EnvironmentalDataCollectionModuleProps {
  reportId: string;
  onComplete?: () => void;
}

const ENVIRONMENTAL_QUESTIONS = [
  {
    id: 'ghg_inventory',
    icon: Wind,
    title: 'Inventário de Emissões GEE',
    question: 'A organização possui inventário de emissões de gases de efeito estufa atualizado?',
    helpText: 'Inventário seguindo GHG Protocol, ISO 14064 ou metodologia equivalente.',
    griStandards: ['GRI 305-1', 'GRI 305-2', 'GRI 305-3', 'GRI 305-4'],
    requiredDocuments: ['Inventário GEE', 'RAPP/RCA']
  },
  {
    id: 'energy_consumption',
    icon: Zap,
    title: 'Consumo de Energia e Combustíveis',
    question: 'Existem controles de consumo de energia e combustíveis?',
    helpText: 'Monitoramento sistemático de consumo elétrico, diesel, gasolina, GLP, etc.',
    griStandards: ['GRI 302-1', 'GRI 302-2', 'GRI 302-3', 'GRI 302-4'],
    requiredDocuments: ['Planilha Energia', 'Faturas']
  },
  {
    id: 'water_effluents',
    icon: Droplets,
    title: 'Água e Efluentes',
    question: 'Existe monitoramento de consumo de água e geração/tratamento de efluentes?',
    helpText: 'Controle de captação, consumo, descarte e tratamento de água/efluentes.',
    griStandards: ['GRI 303-1', 'GRI 303-2', 'GRI 303-3', 'GRI 303-4', 'GRI 303-5'],
    requiredDocuments: ['Planilha Água', 'Outorga']
  },
  {
    id: 'waste_management',
    icon: Recycle,
    title: 'Gestão de Resíduos',
    question: 'Existem controles de destinação e reciclagem de resíduos?',
    helpText: 'Registro de geração, segregação, armazenamento e destinação final de resíduos.',
    griStandards: ['GRI 306-1', 'GRI 306-2', 'GRI 306-3', 'GRI 306-4', 'GRI 306-5'],
    requiredDocuments: ['MTR', 'PGRS']
  },
  {
    id: 'licenses_certifications',
    icon: Award,
    title: 'Licenças Ambientais e Certificações',
    question: 'A organização possui licenças ambientais válidas e certificações (ISO 14001)?',
    helpText: 'Licenças de operação, instalação e certificações de sistemas de gestão ambiental.',
    griStandards: ['GRI 2-27', 'GRI 307-1'],
    requiredDocuments: ['Licença Ambiental', 'ISO 14001']
  },
];

export default function EnvironmentalDataCollectionModule({ reportId, onComplete }: EnvironmentalDataCollectionModuleProps) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [quantitativeData, setQuantitativeData] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadExistingData();
    loadQuantitativeData();
  }, [reportId]);

  const loadExistingData = async () => {
    const { data } = await supabase
      .from('gri_environmental_data_collection')
      .select('*')
      .eq('report_id', reportId)
      .single();

    if (data) {
      setFormData(data);
      calculateProgress(data);
    }
  };

  const loadQuantitativeData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Buscar emissões por escopo
      const { data: emissions } = await supabase
        .from('calculated_emissions')
        .select(`
          *,
          activity_data!inner(
            emission_source_id,
            emission_sources!inner(scope, company_id)
          )
        `)
        .eq('activity_data.emission_sources.company_id', profile.company_id);

      const scope1 = emissions?.filter(e => e.activity_data?.emission_sources?.scope === 1)
        .reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0;
      
      const scope2 = emissions?.filter(e => e.activity_data?.emission_sources?.scope === 2)
        .reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0;
      
      const scope3 = emissions?.filter(e => e.activity_data?.emission_sources?.scope === 3)
        .reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0;

      // Buscar resíduos
      const { data: wasteData } = await supabase
        .from('waste_logs')
        .select('*')
        .eq('company_id', profile.company_id);

      const totalWaste = wasteData?.reduce((sum, w) => sum + (w.quantity || 0), 0) || 0;
      const recycled = wasteData?.filter(w => 
        w.final_treatment_type?.toLowerCase().includes('reciclagem') ||
        w.final_treatment_type?.toLowerCase().includes('reutilização')
      ).reduce((sum, w) => sum + (w.quantity || 0), 0) || 0;

      setQuantitativeData({
        emissions_scope1_tco2e: scope1,
        emissions_scope2_tco2e: scope2,
        emissions_scope3_tco2e: scope3,
        emissions_total_tco2e: scope1 + scope2 + scope3,
        waste_total_generated_tonnes: totalWaste,
        waste_recycled_percentage: totalWaste > 0 ? (recycled / totalWaste) * 100 : 0
      });

    } catch (error) {
      console.error('Error loading quantitative data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (data: any) => {
    const totalFields = 15;
    let filledFields = 0;

    if (data.has_ghg_inventory) filledFields++;
    if (data.has_energy_controls) filledFields++;
    if (data.has_water_monitoring) filledFields++;
    if (data.has_waste_controls) filledFields++;
    if (data.has_environmental_licenses) filledFields++;
    if (data.emissions_total_tco2e) filledFields += 3;
    if (data.energy_total_consumption_kwh) filledFields += 2;
    if (data.water_total_withdrawal_m3) filledFields += 2;
    if (data.waste_total_generated_tonnes) filledFields += 2;

    setProgress((filledFields / totalFields) * 100);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const dataToSave = {
        report_id: reportId,
        company_id: profile.company_id,
        ...formData,
        ...quantitativeData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('gri_environmental_data_collection')
        .upsert(dataToSave);

      if (error) throw error;

      toast.success('Dados salvos com sucesso!');
      calculateProgress(dataToSave);
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await handleSave();

      const { data, error } = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'analyze_environmental_data',
          report_id: reportId,
          form_data: formData,
          quantitative_data: quantitativeData,
          documents: documents
        }
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('gri_environmental_data_collection')
        .update({
          ai_generated_text: data.generated_text,
          ai_analysis: data,
          ai_confidence_score: data.confidence_score,
          ai_last_analyzed_at: new Date().toISOString()
        })
        .eq('report_id', reportId);

      if (updateError) throw updateError;

      toast.success('Análise concluída com sucesso!');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error analyzing data:', error);
      toast.error('Erro ao analisar dados');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso de Preenchimento</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Mini Dashboard */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Resumo de Dados Ambientais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <Wind className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{quantitativeData.emissions_total_tco2e?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-muted-foreground">tCO₂e Total</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <Zap className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <div className="text-2xl font-bold">{((quantitativeData.energy_total_consumption_kwh || 0) / 1000).toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">MWh Energia</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <Droplets className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{quantitativeData.water_total_withdrawal_m3?.toFixed(0) || '0'}</div>
              <div className="text-xs text-muted-foreground">m³ Água</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <Recycle className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{quantitativeData.waste_recycled_percentage?.toFixed(1) || '0.0'}%</div>
              <div className="text-xs text-muted-foreground">Reciclagem</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perguntas Orientadoras */}
      {ENVIRONMENTAL_QUESTIONS.map((question) => {
        const Icon = question.icon;
        return (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="h-5 w-5" />
                {question.title}
              </CardTitle>
              <CardDescription>{question.question}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {question.helpText}
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {question.griStandards.map(std => (
                    <Badge key={std} variant="secondary" className="text-xs">
                      {std}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Documentos Sugeridos</Label>
                <div className="flex flex-wrap gap-2">
                  {question.requiredDocuments.map(doc => (
                    <Badge key={doc} variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>

              <DocumentUploadZone
                reportId={reportId}
              />
            </CardContent>
          </Card>
        );
      })}

      {/* Dados Quantitativos */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dados Quantitativos Ambientais (GRI 302, 303, 305, 306)
          </CardTitle>
          <CardDescription>
            Dados preenchidos automaticamente do sistema. Ajuste se necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GRI 305: Emissões */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Wind className="h-4 w-4 text-orange-600" />
              GRI 305: Emissões de GEE
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Escopo 1 (tCO₂e)</Label>
                <Input 
                  type="number" 
                  step="0.001"
                  value={quantitativeData.emissions_scope1_tco2e || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, emissions_scope1_tco2e: parseFloat(e.target.value) || 0})}
                />
                <p className="text-xs text-muted-foreground mt-1">Emissões diretas</p>
              </div>
              <div>
                <Label>Escopo 2 (tCO₂e)</Label>
                <Input 
                  type="number" 
                  step="0.001"
                  value={quantitativeData.emissions_scope2_tco2e || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, emissions_scope2_tco2e: parseFloat(e.target.value) || 0})}
                />
                <p className="text-xs text-muted-foreground mt-1">Energia adquirida</p>
              </div>
              <div>
                <Label>Escopo 3 (tCO₂e)</Label>
                <Input 
                  type="number" 
                  step="0.001"
                  value={quantitativeData.emissions_scope3_tco2e || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, emissions_scope3_tco2e: parseFloat(e.target.value) || 0})}
                />
                <p className="text-xs text-muted-foreground mt-1">Outras indiretas</p>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Total:</strong> {(
                  (quantitativeData.emissions_scope1_tco2e || 0) + 
                  (quantitativeData.emissions_scope2_tco2e || 0) + 
                  (quantitativeData.emissions_scope3_tco2e || 0)
                ).toFixed(3)} tCO₂e
              </AlertDescription>
            </Alert>
          </div>

          {/* GRI 302: Energia */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              GRI 302: Energia
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Consumo Total (kWh)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={quantitativeData.energy_total_consumption_kwh || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, energy_total_consumption_kwh: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>% Energia Renovável</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 35.5"
                  value={quantitativeData.energy_renewable_percentage || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, energy_renewable_percentage: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* GRI 303: Água */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-600" />
              GRI 303: Água e Efluentes
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Captação Total (m³)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 12500"
                  value={quantitativeData.water_total_withdrawal_m3 || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, water_total_withdrawal_m3: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Consumo (m³)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 11800"
                  value={quantitativeData.water_consumption_m3 || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, water_consumption_m3: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* GRI 306: Resíduos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Recycle className="h-4 w-4 text-green-600" />
              GRI 306: Resíduos
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Total Gerado (t)</Label>
                <Input 
                  type="number" 
                  step="0.001"
                  value={quantitativeData.waste_total_generated_tonnes || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, waste_total_generated_tonnes: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>% Reciclado</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={quantitativeData.waste_recycled_percentage || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, waste_recycled_percentage: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>% Aterro</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 15.5"
                  value={quantitativeData.waste_landfill_percentage || ''}
                  onChange={(e) => setQuantitativeData({...quantitativeData, waste_landfill_percentage: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          Salvar Progresso
        </Button>
        <Button 
          onClick={handleAnalyze} 
          disabled={analyzing || progress < 50}
          className="flex-1"
          variant="default"
        >
          {analyzing ? 'Analisando...' : 'Analisar com IA'}
        </Button>
      </div>
    </div>
  );
}
