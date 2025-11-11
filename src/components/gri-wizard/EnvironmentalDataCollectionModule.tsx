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
import { OperationalMetricsForm } from "@/components/operational/OperationalMetricsForm";
import { EnergyIntensityDashboard } from "@/components/reports/EnergyIntensityDashboard";
import { calculateEnergyIntensity, type EnergyIntensityResult } from "@/services/operationalMetrics";
import { EnergyConsumptionBreakdown } from "@/components/reports/EnergyConsumptionBreakdown";
import { 
  calculateTotalGHGEmissions, 
  generateInventorySummary,
  type EmissionsByScope,
  type GHGInventorySummary 
} from "@/services/ghgInventory";
import { GHGTotalEmissionsDashboard } from "@/components/reports/GHGTotalEmissionsDashboard";
import { calculateTotalWaterConsumption, calculateWaterIntensity, calculateWaterReusePercentage, type WaterConsumptionResult } from "@/services/waterManagement";
import { WaterConsumptionDashboard } from "@/components/water/WaterConsumptionDashboard";
import { WaterConsumptionForm } from "@/components/water/WaterConsumptionForm";
import { WaterIntensityDashboard } from "@/components/water/WaterIntensityDashboard";
import { WaterReusePercentageDashboard } from "@/components/water/WaterReusePercentageDashboard";
import { calculateTotalWasteGeneration, calculateWasteIntensity, type WasteGenerationResult } from "@/services/wasteManagement";
import { WasteTotalGenerationDashboard } from "@/components/waste/WasteTotalGenerationDashboard";

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
  const [companyId, setCompanyId] = useState<string>('');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [intensityData, setIntensityData] = useState<EnergyIntensityResult | null>(null);
  const [energyBreakdown, setEnergyBreakdown] = useState<any>(null);
  const [ghgEmissions, setGhgEmissions] = useState<EmissionsByScope | null>(null);
  const [previousYearEmissions, setPreviousYearEmissions] = useState<EmissionsByScope | null>(null);
  const [inventorySummary, setInventorySummary] = useState<GHGInventorySummary | null>(null);
  const [waterData, setWaterData] = useState<WaterConsumptionResult | null>(null);
  const [previousYearWaterData, setPreviousYearWaterData] = useState<WaterConsumptionResult | null>(null);
  const [waterIntensityData, setWaterIntensityData] = useState<any>(null);
  const [waterReuseData, setWaterReuseData] = useState<any>(null);
  const [wasteData, setWasteData] = useState<WasteGenerationResult | null>(null);
  const [wasteIntensityData, setWasteIntensityData] = useState<any>(null);

  useEffect(() => {
    loadExistingData();
    loadQuantitativeData();
    loadCompanyInfo();
    loadGHGEmissions();
    loadWaterData();
    loadWasteData();
  }, [reportId]);

  const loadCompanyInfo = async () => {
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
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

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

  const loadIntensityData = async () => {
    try {
      const data = await calculateEnergyIntensity(reportYear);
      setIntensityData(data);
    } catch (error) {
      console.error('Error loading intensity:', error);
    }
  };

  const loadGHGEmissions = async () => {
    try {
      const currentYearData = await calculateTotalGHGEmissions(reportYear);
      setGhgEmissions(currentYearData);
      
      try {
        const previousData = await calculateTotalGHGEmissions(reportYear - 1);
        setPreviousYearEmissions(previousData);
      } catch (error) {
        console.log('Dados do ano anterior não disponíveis');
      }
    } catch (error) {
      console.error('Erro ao carregar emissões GEE:', error);
    }
  };

  const loadWaterData = async () => {
    try {
      const currentYearData = await calculateTotalWaterConsumption(reportYear);
      setWaterData(currentYearData);
      
      try {
        const previousData = await calculateTotalWaterConsumption(reportYear - 1);
        setPreviousYearWaterData(previousData);
      } catch (error) {
        console.log('Dados de água do ano anterior não disponíveis');
      }
    } catch (error) {
      console.error('Erro ao carregar dados de água:', error);
    }
  };

  const loadWaterIntensity = async () => {
    try {
      const intensity = await calculateWaterIntensity(reportYear);
      setWaterIntensityData(intensity);
      
      if (intensity.intensity_per_production) {
        toast.success('Intensidade hídrica calculada!', {
          description: `${intensity.intensity_per_production.toFixed(4)} m³/${intensity.production_unit}`
        });
      }
    } catch (error) {
      console.error('Erro ao calcular intensidade hídrica:', error);
    }
  };

  const loadWaterReusePercentage = async () => {
    try {
      const reuse = await calculateWaterReusePercentage(reportYear);
      setWaterReuseData(reuse);
      
      if (reuse.reuse_percentage > 0) {
        toast.success('Percentual de reuso de água calculado!', {
          description: `${reuse.reuse_percentage.toFixed(2)}% de água reutilizada`
        });
      }
    } catch (error) {
      console.error('Erro ao calcular reuso de água:', error);
    }
  };

  const loadWasteData = async () => {
    try {
      const wasteGeneration = await calculateTotalWasteGeneration(reportYear);
      setWasteData(wasteGeneration);
      
      const intensity = await calculateWasteIntensity(reportYear);
      setWasteIntensityData(intensity);
      
      if (wasteGeneration.total_generated_tonnes > 0) {
        toast.success('Dados de resíduos calculados!', {
          description: `${wasteGeneration.total_generated_tonnes.toFixed(2)} toneladas geradas`
        });
      }
    } catch (error) {
      console.error('Erro ao calcular resíduos:', error);
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

      // Calcular consumo total de energia automaticamente
      let energyCalculation;
      try {
        const { calculateTotalEnergyConsumption } = await import('@/services/integratedReportsHelpers');
        energyCalculation = await calculateTotalEnergyConsumption(reportYear);
        
        // Guardar resultado completo para o breakdown
        setEnergyBreakdown(energyCalculation);
        
        // Atualizar dados quantitativos com o cálculo
        setQuantitativeData(prev => ({
          ...prev,
          energy_total_consumption_kwh: energyCalculation.total_kwh,
          energy_renewable_percentage: energyCalculation.renewable_percentage,
          energy_electricity_kwh: energyCalculation.electricity_kwh,
          energy_fuel_kwh: energyCalculation.fuel_kwh,
          energy_thermal_kwh: energyCalculation.thermal_kwh
        }));

        toast.success('Consumo de energia calculado automaticamente!', {
          description: `Total: ${energyCalculation.total_kwh.toLocaleString('pt-BR')} kWh (${energyCalculation.renewable_percentage.toFixed(1)}% renovável)`
        });
      } catch (energyError) {
        console.error('Error calculating energy:', energyError);
        // Continuar mesmo se o cálculo de energia falhar
      }

      // Calcular intensidade energética
      try {
        const intensity = await calculateEnergyIntensity(reportYear);
        setIntensityData(intensity);
        
        if (intensity.intensity_per_production) {
          toast.success('Intensidade energética calculada!', {
            description: `${intensity.intensity_per_production.toFixed(4)} kWh/${intensity.production_unit}`
          });
        }
      } catch (intensityError) {
        console.error('Error calculating intensity:', intensityError);
      }

      // Calcular emissões GEE totais
      let ghgSummary;
      try {
        ghgSummary = await generateInventorySummary(reportYear);
        setInventorySummary(ghgSummary);
        
        await loadGHGEmissions();
        
        toast.success('Inventário GEE calculado!', {
          description: `Total: ${ghgSummary.total_emissions.toLocaleString('pt-BR')} tCO₂e`
        });
      } catch (ghgError) {
        console.error('Error calculating GHG emissions:', ghgError);
      }

      // Calcular consumo total de água
      let waterConsumption;
      try {
        waterConsumption = await calculateTotalWaterConsumption(reportYear);
        setWaterData(waterConsumption);
        
        toast.success('Consumo de água calculado!', {
          description: `Total: ${waterConsumption.total_withdrawal_m3.toLocaleString('pt-BR')} m³`
        });
      } catch (waterError) {
        console.error('Error calculating water consumption:', waterError);
      }

      // Calcular intensidade hídrica
      try {
        await loadWaterIntensity();
      } catch (waterIntensityError) {
        console.error('Error calculating water intensity:', waterIntensityError);
      }

      // Calcular percentual de reuso de água
      try {
        await loadWaterReusePercentage();
      } catch (waterReuseError) {
        console.error('Error calculating water reuse:', waterReuseError);
      }

      // Calcular total de resíduos gerados
      try {
        await loadWasteData();
      } catch (wasteError) {
        console.error('Error calculating waste generation:', wasteError);
      }

      const dataToSave = {
        report_id: reportId,
        company_id: profile.company_id,
        ...formData,
        ...quantitativeData,
        ...(energyCalculation && {
          energy_total_consumption_kwh: energyCalculation.total_kwh,
          energy_renewable_percentage: energyCalculation.renewable_percentage,
          energy_electricity_kwh: energyCalculation.electricity_kwh,
          energy_fuel_kwh: energyCalculation.fuel_kwh,
          energy_thermal_kwh: energyCalculation.thermal_kwh
        }),
        ...(intensityData && {
          energy_intensity_kwh_per_unit: intensityData.intensity_per_production,
          energy_intensity_unit: intensityData.production_unit ? `kWh/${intensityData.production_unit}` : null,
          energy_intensity_kwh_per_revenue: intensityData.intensity_per_revenue,
          energy_intensity_kwh_per_km: intensityData.intensity_per_km,
          energy_intensity_kwh_per_m2: intensityData.intensity_per_m2,
          production_volume_reference: intensityData.production_volume,
          production_unit_reference: intensityData.production_unit
        }),
        ...(ghgSummary && {
          ghg_scope_1_total: ghgSummary.scope_1_total,
          ghg_scope_2_total: ghgSummary.scope_2_total,
          ghg_scope_3_total: ghgSummary.scope_3_total,
          ghg_total_emissions: ghgSummary.total_emissions,
          ghg_biogenic_emissions: ghgSummary.biogenic_emissions,
          ghg_inventory_year: ghgSummary.inventory_year,
          ghg_methodology: ghgSummary.methodology,
          ghg_protocol_seal: ghgSummary.ghg_protocol_seal
        }),
        ...(waterConsumption && {
          water_total_withdrawal_m3: waterConsumption.total_withdrawal_m3,
          water_consumption_m3: waterConsumption.total_consumption_m3,
          water_discharge_total_m3: waterConsumption.total_discharge_m3,
          water_withdrawal_public_network_m3: waterConsumption.by_source.public_network,
          water_withdrawal_well_m3: waterConsumption.by_source.well,
          water_withdrawal_surface_m3: waterConsumption.by_source.surface_water,
          water_withdrawal_reuse_m3: waterConsumption.by_source.reuse,
          water_withdrawal_other_m3: waterConsumption.by_source.other,
          water_stressed_areas_m3: waterConsumption.water_stressed_areas_m3,
          water_calculation_date: new Date().toISOString()
        }),
        ...(waterIntensityData && {
          water_intensity_m3_per_unit: waterIntensityData.intensity_per_production,
          water_intensity_unit: waterIntensityData.production_unit ? `m³/${waterIntensityData.production_unit}` : null,
          water_intensity_m3_per_revenue: waterIntensityData.intensity_per_revenue,
          water_intensity_baseline: waterIntensityData.baseline_intensity,
          water_intensity_improvement_percent: waterIntensityData.improvement_percent
        }),
        ...(waterReuseData && {
          water_reuse_percentage: waterReuseData.reuse_percentage,
          water_reuse_volume_m3: waterReuseData.reuse_volume_m3,
          water_baseline_reuse_percentage: waterReuseData.baseline_reuse_percentage,
          water_reuse_improvement_percent: waterReuseData.improvement_percent,
          water_reuse_calculation_date: new Date().toISOString()
        }),
        ...(wasteData && {
          waste_total_generated_tonnes: wasteData.total_generated_tonnes,
          waste_hazardous_tonnes: wasteData.hazardous_tonnes,
          waste_non_hazardous_tonnes: wasteData.non_hazardous_tonnes,
          waste_recycled_percentage: wasteData.recycling_percentage,
          waste_landfill_percentage: wasteData.landfill_percentage,
          waste_incineration_percentage: wasteData.incineration_percentage,
          waste_by_treatment_recycling_tonnes: wasteData.by_treatment.recycling,
          waste_by_treatment_landfill_tonnes: wasteData.by_treatment.landfill,
          waste_by_treatment_incineration_tonnes: wasteData.by_treatment.incineration,
          waste_by_treatment_composting_tonnes: wasteData.by_treatment.composting,
          waste_by_treatment_other_tonnes: wasteData.by_treatment.other,
          waste_baseline_total_tonnes: wasteData.baseline_total,
          waste_improvement_percent: wasteData.improvement_percent,
          waste_calculation_date: new Date().toISOString()
        }),
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

      {/* Energy Consumption Breakdown */}
      {energyBreakdown && (
        <EnergyConsumptionBreakdown data={energyBreakdown} />
      )}

      {/* Operational Metrics Form */}
      {companyId && (
        <OperationalMetricsForm
          companyId={companyId}
          year={reportYear}
          onSaved={loadIntensityData}
        />
      )}

      {/* Energy Intensity Dashboard */}
      {intensityData && (
        <EnergyIntensityDashboard
          intensityData={intensityData}
          year={reportYear}
        />
      )}

      {/* GHG Total Emissions Dashboard */}
      {ghgEmissions && (
        <GHGTotalEmissionsDashboard
          emissionsData={ghgEmissions}
          year={reportYear}
          previousYearData={previousYearEmissions || undefined}
          inventorySummary={inventorySummary || undefined}
        />
      )}

      {/* Water Consumption Form */}
      <WaterConsumptionForm
        year={reportYear}
        onSaved={loadWaterData}
      />

      {/* Water Consumption Dashboard */}
      {waterData && (
        <WaterConsumptionDashboard
          waterData={waterData}
          year={reportYear}
          previousYearData={previousYearWaterData || undefined}
        />
      )}

      {/* Water Intensity Dashboard */}
      {waterIntensityData && (
        <WaterIntensityDashboard
          intensityData={waterIntensityData}
          year={reportYear}
        />
      )}

      {/* Water Reuse Percentage Dashboard */}
      {waterReuseData && (
        <WaterReusePercentageDashboard
          reuseData={waterReuseData}
          year={reportYear}
        />
      )}

      {/* Waste Total Generation Dashboard */}
      {wasteData && (
        <WasteTotalGenerationDashboard
          wasteData={wasteData}
          year={reportYear}
          intensityData={wasteIntensityData}
        />
      )}

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
