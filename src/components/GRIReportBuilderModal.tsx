import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Sparkles, 
  Save, 
  RefreshCw, 
  AlertCircle,
  FileText, 
  CheckCircle, 
  Clock, 
  Target, 
  Users, 
  Leaf, 
  Building2,
  Eye,
  Check
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useGRIAutoSave } from "@/hooks/useGRIAutoSave";
import { 
  GRIReport,
  GRIIndicatorData,
  GRIReportSection,
  MaterialityTopic,
  SDGAlignment,
  getGRIIndicatorData, 
  createOrUpdateGRIIndicatorData,
  getGRIReportSections,
  createOrUpdateGRIReportSection,
  getMaterialityTopics,
  getSDGAlignment,
  calculateReportCompletion,
  updateGRIReport
} from "@/services/griReports";
import { GRIReportExportModal } from "./GRIReportExportModal";
import { AIContentGeneratorModal } from "./AIContentGeneratorModal";
import { GRIAutoFillModal } from "./GRIAutoFillModal";

interface GRIReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: GRIReport;
  onUpdate: () => void;
}

export function GRIReportBuilderModal({ 
  isOpen, 
  onClose, 
  report, 
  onUpdate 
}: GRIReportBuilderModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [indicatorData, setIndicatorData] = useState<GRIIndicatorData[]>([]);
  const [sections, setSections] = useState<GRIReportSection[]>([]);
  const [materialityTopics, setMaterialityTopics] = useState<MaterialityTopic[]>([]);
  const [sdgAlignment, setSdgAlignment] = useState<SDGAlignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  
  // Report metadata states
  const [ceoMessage, setCeoMessage] = useState(report.ceo_message || '');
  const [executiveSummary, setExecutiveSummary] = useState(report.executive_summary || '');
  const [methodology, setMethodology] = useState(report.methodology || '');
  
  // AI and Export modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<GRIReportSection | null>(null);

  // Auto-save hook
  const { 
    scheduleAutoSave, 
    forceSave, 
    isSaving: isAutoSaving, 
    lastSaveTime, 
    saveStatus 
  } = useGRIAutoSave({
    report: {
      ...report,
      ceo_message: ceoMessage,
      executive_summary: executiveSummary,
      methodology: methodology,
    },
    onSaveSuccess: () => {
      console.log('Auto-save successful');
    },
    onSaveError: (error) => {
      console.error('Auto-save error:', error);
      toast({
        title: "Erro ao salvar",
        description: "Suas alterações não foram salvas automaticamente",
        variant: "destructive",
      });
    },
  });

  // Trigger auto-save when metadata changes
  useEffect(() => {
    if (!isLoading) {
      scheduleAutoSave({
        ceo_message: ceoMessage,
        executive_summary: executiveSummary,
        methodology: methodology,
      });
    }
  }, [ceoMessage, executiveSummary, methodology, isLoading, scheduleAutoSave]);

  useEffect(() => {
    if (isOpen && report.id) {
      loadReportData();
    }
  }, [isOpen, report.id]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [indicators, reportSections, topics, sdgs] = await Promise.all([
        getGRIIndicatorData(report.id),
        getGRIReportSections(report.id),
        getMaterialityTopics(report.id),
        getSDGAlignment(report.id),
      ]);

      setIndicatorData(indicators);
      setSections(reportSections);
      setMaterialityTopics(topics);
      setSdgAlignment(sdgs);
      
      // Update metadata states when data loads
      setCeoMessage(report.ceo_message || '');
      setExecutiveSummary(report.executive_summary || '');
      setMethodology(report.methodology || '');
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      // Save metadata first
      await updateGRIReport(report.id, {
        ceo_message: ceoMessage,
        executive_summary: executiveSummary,
        methodology: methodology,
      });

      toast({
        title: "Sucesso",
        description: "Metadados salvos com sucesso!",
      });

      // Try to recalculate completion, but don't fail if it doesn't work
      try {
        await calculateReportCompletion(report.id);
        // Reload report data to get updated completion percentage
        await loadReportData();
        onUpdate();
      } catch (completionError) {
        console.warn('Erro ao recalcular progresso (não crítico):', completionError);
        // Show a warning but don't fail the save operation
        toast({
          title: "Aviso",
          description: "Metadados salvos, mas houve erro ao atualizar o progresso.",
        });
      }
    } catch (error: any) {
      console.error('Erro ao salvar metadados:', error);
      
      let errorMessage = "Erro ao salvar metadados. Tente novamente.";
      if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateAIMetadata = async (type: 'ceo_message' | 'executive_summary' | 'methodology') => {
    setGeneratingAI(type);
    try {
      const { data, error } = await supabase.functions.invoke('gri-content-generator', {
        body: {
          reportId: report.id,
          metadataType: type
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.content) {
        switch (type) {
          case 'ceo_message':
            setCeoMessage(data.content);
            break;
          case 'executive_summary':
            setExecutiveSummary(data.content);
            break;
          case 'methodology':
            setMethodology(data.content);
            break;
        }

        toast({
          title: "Sucesso",
          description: "Conteúdo gerado com IA!",
        });
      } else {
        throw new Error('Nenhum conteúdo retornado pela IA');
      }
    } catch (error: any) {
      console.error('Erro ao gerar conteúdo com IA:', error);
      
      let errorMessage = "Erro ao gerar conteúdo. Tente novamente.";
      if (error.message?.includes('404')) {
        errorMessage = "Serviço de IA temporariamente indisponível. Tente novamente em alguns instantes.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGeneratingAI(null);
    }
  };

  const handleIndicatorUpdate = async (indicatorId: string, value: any, dataType: string) => {
    try {
      const updateData: any = { is_complete: true };
      
      switch (dataType) {
        case 'Numérico':
          updateData.numeric_value = parseFloat(value);
          break;
        case 'Percentual':
          updateData.percentage_value = parseFloat(value);
          break;
        case 'Texto':
          updateData.text_value = value;
          break;
        case 'Booleano':
          updateData.boolean_value = value === 'true';
          break;
        case 'Data':
          updateData.date_value = value;
          break;
      }

      await createOrUpdateGRIIndicatorData(report.id, indicatorId, updateData);
      
      // Reload indicator data
      const updated = await getGRIIndicatorData(report.id);
      setIndicatorData(updated);
      
      // Recalculate completion
      await calculateReportCompletion(report.id);
      
      toast({
        title: "Sucesso",
        description: "Indicador atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar indicador",
        variant: "destructive",
      });
    }
  };

  const handleSmartSuggestion = async (indicator: GRIIndicatorData) => {
    try {
      // Look for relevant data in the system based on indicator code/type
      let suggestedValue = null;
      let confidence = 0;
      
      // Map GRI indicators to system data
      const indicatorCode = indicator.indicator?.code;
      
      if (indicatorCode?.includes('305-1') || indicatorCode?.includes('305-2')) {
        // GHG emissions indicators - get from calculated emissions
        const { data: emissions } = await supabase
          .from('calculated_emissions')
          .select('total_co2e')
          .gte('calculation_date', `${report.year}-01-01`)
          .lt('calculation_date', `${report.year + 1}-01-01`)
          .order('calculation_date', { ascending: false });
        
        if (emissions && emissions.length > 0) {
          suggestedValue = emissions.reduce((sum, e) => sum + (e.total_co2e || 0), 0);
          confidence = 85;
        }
      }
      
      if (suggestedValue !== null) {
        const confirmed = window.confirm(
          `Sugestão inteligente encontrada!\n\n` +
          `Indicador: ${indicator.indicator?.title}\n` +
          `Valor sugerido: ${suggestedValue.toFixed(2)} ${indicator.indicator?.unit || ''}\n` +
          `Confiança: ${confidence}%\n\n` +
          `Deseja aplicar este valor?`
        );
        
        if (confirmed) {
          await handleIndicatorUpdate(
            indicator.indicator_id, 
            suggestedValue, 
            indicator.indicator?.data_type || 'Numérico'
          );
          
          toast({
            title: "Sucesso",
            description: `Valor sugerido aplicado com ${confidence}% de confiança!`,
          });
        }
      } else {
        toast({
          title: "Info",
          description: "Nenhuma sugestão encontrada para este indicador. Tente inserir dados manualmente.",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar sugestão:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar sugestão",
        variant: "destructive",
      });
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Auto-save status indicator */}
      {saveStatus !== 'idle' && (
        <Alert className={saveStatus === 'error' ? 'border-destructive' : 'border-success'}>
          <AlertDescription className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando automaticamente...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="h-4 w-4 text-success" />
                Salvo automaticamente há {lastSaveTime ? new Date().getTime() - lastSaveTime.getTime() < 10000 ? 'poucos segundos' : 'alguns instantes' : ''}
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                Erro ao salvar automaticamente
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {report.title} - {report.year}
          </CardTitle>
          <CardDescription>
            Progresso geral do relatório: {Math.round(report.completion_percentage || 0)}% completo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={report.completion_percentage || 0} className="h-3" />
          
          {/* Auto Fill Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoFillModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Auto Preenchimento
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({
                title: "Em breve",
                description: "Funcionalidade de validação em desenvolvimento.",
              })}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Validar Dados
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Prévia
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Section */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas do Relatório</CardTitle>
          <CardDescription>
            Configure as informações principais que aparecerão no relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CEO Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ceo_message">Mensagem da Liderança</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateAIMetadata('ceo_message')}
                disabled={generatingAI === 'ceo_message'}
              >
                {generatingAI === 'ceo_message' ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Gerar com IA
              </Button>
            </div>
            <Textarea
              id="ceo_message"
              value={ceoMessage}
              onChange={(e) => setCeoMessage(e.target.value)}
              placeholder="Mensagem do CEO/Presidente sobre sustentabilidade..."
              rows={4}
            />
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="executive_summary">Resumo Executivo</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateAIMetadata('executive_summary')}
                disabled={generatingAI === 'executive_summary'}
              >
                {generatingAI === 'executive_summary' ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Gerar com IA
              </Button>
            </div>
            <Textarea
              id="executive_summary"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Resumo executivo dos principais pontos do relatório..."
              rows={4}
            />
          </div>

          {/* Methodology */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="methodology">Metodologia</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateAIMetadata('methodology')}
                disabled={generatingAI === 'methodology'}
              >
                {generatingAI === 'methodology' ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Gerar com IA
              </Button>
            </div>
            <Textarea
              id="methodology"
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              placeholder="Metodologia utilizada no relatório (padrões GRI, processo de coleta de dados, etc.)..."
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveMetadata}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Metadados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIndicators = () => {
    if (isLoading) {
      return <div>Carregando indicadores...</div>;
    }

    const indicatorsByType = indicatorData.reduce((acc, ind) => {
      const type = ind.indicator?.indicator_type || 'Outros';
      if (!acc[type]) acc[type] = [];
      acc[type].push(ind);
      return acc;
    }, {} as Record<string, GRIIndicatorData[]>);

    return (
      <div className="space-y-6">
        {Object.entries(indicatorsByType).map(([type, indicators]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {type === 'Universal' && <Building2 className="h-5 w-5" />}
                {type === 'Ambiental' && <Leaf className="h-5 w-5" />}
                {type === 'Social' && <Users className="h-5 w-5" />}
                {type === 'Econômico' && <Target className="h-5 w-5" />}
                {type === 'Governança' && <CheckCircle className="h-5 w-5" />}
                Indicadores {type}
              </CardTitle>
              <CardDescription>
                {indicators.filter(i => i.is_complete).length} de {indicators.length} completos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {indicators.map((indicator) => (
                  <div key={indicator.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{indicator.indicator?.code}</div>
                        <div className="text-sm text-muted-foreground">
                          {indicator.indicator?.title}
                        </div>
                        {indicator.indicator?.is_mandatory && (
                          <Badge variant="destructive">Obrigatório</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {indicator.is_complete && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSmartSuggestion(indicator)}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Sugerir
                        </Button>
                      </div>
                    </div>
                    
                    {indicator.indicator?.guidance_text && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {indicator.indicator.guidance_text}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder={`Valor (${indicator.indicator?.unit || 'sem unidade'})`}
                        value={
                          indicator.numeric_value || 
                          indicator.text_value || 
                          indicator.percentage_value || 
                          indicator.boolean_value?.toString() || 
                          indicator.date_value || 
                          ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          handleIndicatorUpdate(
                            indicator.indicator_id, 
                            value, 
                            indicator.indicator?.data_type || 'Texto'
                          );
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderSections = () => {
    if (isLoading) {
      return <div>Carregando seções...</div>;
    }

    return (
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {section.title}
                </div>
                <div className="flex items-center gap-2">
                  {section.is_complete && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSection(section);
                      setIsAIModalOpen(true);
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Gerar Conteúdo
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={section.content || ''}
                onChange={async (e) => {
                  const content = e.target.value;
                  
                  // Update local state
                  setSections(prev => prev.map(s => 
                    s.id === section.id ? { ...s, content } : s
                  ));
                  
                  // Save to database
                  try {
                    await createOrUpdateGRIReportSection(report.id, section.section_key, {
                      content,
                      is_complete: content.length > 50,
                      completion_percentage: content.length > 50 ? 100 : content.length > 0 ? 50 : 0,
                    });
                    
                    toast({
                      title: "Sucesso",
                      description: "Seção salva automaticamente",
                    });
                  } catch (error) {
                    toast({
                      title: "Erro",
                      description: "Erro ao salvar seção",
                      variant: "destructive",
                    });
                  }
                }}
                placeholder={`Conteúdo da seção ${section.title}...`}
                rows={6}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderExport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Central de Exportação
          </CardTitle>
          <CardDescription>
            Acesse a central completa para prévia, exportação e compartilhamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => setIsExportModalOpen(true)}
              className="w-full gap-2" 
              size="lg"
            >
              <Eye className="h-4 w-4" />
              Abrir Central de Exportação
            </Button>
            
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast({
                  title: "Info",
                  description: "Use a Central de Exportação para acessar a prévia.",
                })}
              >
                Prévia Rápida
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast({
                  title: "Info", 
                  description: "Use a Central de Exportação para download em PDF.",
                })}
              >
                PDF Direto
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast({
                  title: "Info",
                  description: "Use a Central de Exportação para compartilhar.",
                })}
              >
                Compartilhar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Construtor de Relatório GRI - {report.title}
            <Badge variant="outline">
              {Math.round(report.completion_percentage || 0)}% completo
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Construa seu relatório de sustentabilidade GRI preenchendo os indicadores obrigatórios e seções do relatório.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="sections">Seções</TabsTrigger>
            <TabsTrigger value="export">Exportar</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <TabsContent value="overview" className="mt-4">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="indicators" className="mt-4">
              {renderIndicators()}
            </TabsContent>

            <TabsContent value="sections" className="mt-4">
              {renderSections()}
            </TabsContent>

            <TabsContent value="export" className="mt-4">
              {renderExport()}
            </TabsContent>
          </div>
        </Tabs>
        
        {/* AI Content Generator Modal */}
        {isAIModalOpen && selectedSection && (
          <AIContentGeneratorModal
            isOpen={isAIModalOpen}
            onClose={() => {
              setIsAIModalOpen(false);
              setSelectedSection(null);
            }}
            reportId={report.id}
            sectionType={selectedSection.section_key}
            sectionTitle={selectedSection.title}
            currentContent={selectedSection.content || ''}
            onContentGenerated={(content) => {
              const updatedSections = sections.map(s => 
                s.id === selectedSection.id 
                  ? { ...s, content, ai_generated_content: true }
                  : s
              );
              setSections(updatedSections);
              
              // Save to database
              createOrUpdateGRIReportSection(report.id, selectedSection.section_key, {
                content,
                is_complete: content.length > 50,
                completion_percentage: content.length > 50 ? 100 : content.length > 0 ? 50 : 0,
                ai_generated_content: true,
              }).then(() => {
                calculateReportCompletion(report.id);
              });
            }}
          />
        )}

        {/* Export Modal */}
        {isExportModalOpen && (
          <GRIReportExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            report={report}
          />
        )}

        {/* Auto Fill Modal */}
        {isAutoFillModalOpen && (
          <GRIAutoFillModal
            isOpen={isAutoFillModalOpen}
            onClose={() => setIsAutoFillModalOpen(false)}
            reportId={report.id}
            companyId={report.company_id}
            onUpdate={() => {
              loadReportData();
              onUpdate();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}