import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  GRIReport, 
  GRIIndicatorData,
  GRIReportSection,
  MaterialityTopic,
  SDGAlignment,
  getGRIIndicatorData,
  getGRIReportSections,
  getMaterialityTopics,
  getSDGAlignment,
  createOrUpdateGRIIndicatorData,
  createOrUpdateGRIReportSection,
  updateGRIReport,
  calculateReportCompletion
} from "@/services/griReports";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Target, 
  Users, 
  Leaf, 
  Building2,
  Sparkles,
  Save,
  Eye
} from "lucide-react";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { AIContentGeneratorModal } from "@/components/AIContentGeneratorModal";
import { GRIReportExportModal } from "@/components/GRIReportExportModal";

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
  
  // Report metadata states
  const [ceoMessage, setCeoMessage] = useState(report.ceo_message || '');
  const [executiveSummary, setExecutiveSummary] = useState(report.executive_summary || '');
  const [methodology, setMethodology] = useState(report.methodology || '');
  
  // AI and Export modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<GRIReportSection | null>(null);

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
      toast.error("Erro ao carregar dados do relatório");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      await updateGRIReport(report.id, {
        ceo_message: ceoMessage,
        executive_summary: executiveSummary,
        methodology: methodology,
      });
      
      // Recalculate completion
      await calculateReportCompletion(report.id);
      
      toast.success("Metadados salvos com sucesso!");
      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar metadados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar';
      toast.error(`Erro ao salvar metadados: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateAIMetadata = async (field: 'ceo_message' | 'executive_summary' | 'methodology') => {
    try {
      const { data, error } = await supabase.functions.invoke('gri-content-generator', {
        body: {
          reportId: report.id,
          sectionKey: field,
          contentType: field === 'ceo_message' ? 'Mensagem da Liderança' :
                      field === 'executive_summary' ? 'Sumário Executivo' :
                      'Metodologia',
          context: `Gere conteúdo profissional para ${field === 'ceo_message' ? 'mensagem da liderança' :
                   field === 'executive_summary' ? 'sumário executivo' :
                   'metodologia'} do relatório GRI ${report.year}`,
          regenerate: true
        }
      });

      if (error) throw error;

      const content = data.content;
      
      // Update the appropriate field
      if (field === 'ceo_message') {
        setCeoMessage(content);
      } else if (field === 'executive_summary') {
        setExecutiveSummary(content);
      } else if (field === 'methodology') {
        setMethodology(content);
      }

      // Auto-save the generated content
      const updates = {
        [field]: content,
        updated_at: new Date().toISOString()
      };
      
      await updateGRIReport(report.id, updates);
      onUpdate(); // Refresh parent data
      
      toast.success(`${field === 'ceo_message' ? 'Mensagem da liderança' :
                   field === 'executive_summary' ? 'Sumário executivo' :
                   'Metodologia'} gerado com IA e salvo com sucesso!`);

    } catch (error) {
      console.error('Erro ao gerar conteúdo com IA:', error);
      toast.error('Erro ao gerar conteúdo com IA');
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
      
      toast.success("Indicador atualizado com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error);
      toast.error("Erro ao atualizar indicador");
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
      } else if (indicatorCode?.includes('302-1')) {
        // Energy consumption - could be derived from activity data
        const { data: activities } = await supabase
          .from('activity_data')
          .select('quantity, unit')
          .ilike('unit', '%energy%')
          .gte('created_at', `${report.year}-01-01`)
          .lt('created_at', `${report.year + 1}-01-01`);
        
        if (activities && activities.length > 0) {
          suggestedValue = activities.reduce((sum, a) => sum + (a.quantity || 0), 0);
          confidence = 70;
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
          toast.success(`Valor sugerido aplicado com ${confidence}% de confiança!`);
        }
      } else {
        toast.info("Nenhuma sugestão encontrada para este indicador. Tente inserir dados manualmente.");
      }
    } catch (error) {
      console.error('Erro ao buscar sugestão:', error);
      toast.error("Erro ao gerar sugestão");
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {report.title} - {report.year}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Progresso Geral</span>
            <span className="font-semibold">{report.completion_percentage}%</span>
          </div>
          <Progress value={report.completion_percentage} className="h-3" />
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {indicatorData.filter(i => i.is_complete).length}
              </div>
              <div className="text-sm text-muted-foreground">Indicadores Completos</div>
              <div className="text-xs text-muted-foreground">
                de {indicatorData.length} total
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {sections.filter(s => s.is_complete).length}
              </div>
              <div className="text-sm text-muted-foreground">Seções Completas</div>
              <div className="text-xs text-muted-foreground">
                de {sections.length} total
              </div>
            </div>
          </div>

          <Badge variant="outline" className="w-full justify-center py-2">
            Status: {report.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Metadata Section */}
      <Card>
        <CardHeader>
          <CardTitle>Metadados do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ceo-message">Mensagem da Liderança</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateAIMetadata('ceo_message')}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                id="ceo-message"
                value={ceoMessage}
                onChange={(e) => setCeoMessage(e.target.value)}
                placeholder="Mensagem do CEO/Presidente sobre os compromissos de sustentabilidade..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="executive-summary">Sumário Executivo</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateAIMetadata('executive_summary')}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                id="executive-summary"
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                placeholder="Resumo executivo dos principais temas e resultados..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="methodology">Metodologia</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateAIMetadata('methodology')}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                id="methodology"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="Descreva a metodologia utilizada para coleta e análise dos dados..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSaveMetadata} 
              disabled={isSaving}
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Metadados"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIndicators = () => (
    <div className="space-y-6">
      {isLoading ? (
        <SmartSkeleton variant="dashboard" className="h-64" />
      ) : (
        <>
          {['Universal', 'Ambiental', 'Social', 'Econômico', 'Governança'].map((type) => {
            const typeIndicators = indicatorData.filter(i => i.indicator?.indicator_type === type);
            if (typeIndicators.length === 0) return null;

            return (
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typeIndicators.map((indicator) => (
                      <div key={indicator.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {indicator.indicator?.code}
                              </Badge>
                              {indicator.indicator?.is_mandatory && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                              {indicator.is_complete && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <h4 className="font-medium">{indicator.indicator?.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {indicator.indicator?.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                           {(indicator.indicator?.data_type === 'Numérico' || indicator.indicator?.data_type === 'Percentual') && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder={indicator.indicator?.data_type === 'Percentual' ? '0-100' : 'Valor'}
                                min={indicator.indicator?.data_type === 'Percentual' ? '0' : undefined}
                                max={indicator.indicator?.data_type === 'Percentual' ? '100' : undefined}
                                defaultValue={indicator.indicator?.data_type === 'Percentual' 
                                  ? (indicator.percentage_value || '') 
                                  : (indicator.numeric_value || '')}
                                onBlur={(e) => handleIndicatorUpdate(
                                  indicator.indicator_id, 
                                  e.target.value, 
                                  indicator.indicator?.data_type || 'Numérico'
                                )}
                                className="max-w-xs"
                              />
                              <span className="text-sm text-muted-foreground">
                                {indicator.indicator?.data_type === 'Percentual' ? '%' : indicator.indicator?.unit}
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSmartSuggestion(indicator)}
                                className="ml-2"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Sugerir
                              </Button>
                            </div>
                           )}

                          {indicator.indicator?.data_type === 'Texto' && (
                            <Textarea
                              placeholder="Descrição detalhada..."
                              defaultValue={indicator.text_value || ''}
                              onBlur={(e) => handleIndicatorUpdate(
                                indicator.indicator_id, 
                                e.target.value, 
                                'Texto'
                              )}
                              rows={3}
                            />
                          )}

                        </div>

                        {indicator.indicator?.guidance_text && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">
                              <strong>Orientação:</strong> {indicator.indicator.guidance_text}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );

  const renderSections = () => (
    <div className="space-y-6">
      {isLoading ? (
        <SmartSkeleton variant="dashboard" className="h-64" />
      ) : (
        sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {section.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {section.is_complete && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <Badge variant="outline">
                    {section.completion_percentage}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={section.content || ''}
                onChange={(e) => {
                  const updated = sections.map(s => 
                    s.id === section.id 
                      ? { ...s, content: e.target.value }
                      : s
                  );
                  setSections(updated);
                }}
                onBlur={async (e) => {
                  try {
                    await createOrUpdateGRIReportSection(report.id, section.section_key, {
                      content: e.target.value,
                      is_complete: e.target.value.length > 50,
                      completion_percentage: e.target.value.length > 50 ? 100 : 
                                           e.target.value.length > 0 ? 50 : 0,
                    });
                    await calculateReportCompletion(report.id);
                    toast.success("Seção atualizada!");
                  } catch (error) {
                    console.error('Erro ao salvar seção:', error);
                    toast.error("Erro ao salvar seção");
                  }
                }}
                placeholder={`Escreva o conteúdo para a seção "${section.title}"`}
                rows={8}
                className="min-h-[200px]"
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  {section.ai_generated_content && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {section.content?.length || 0} caracteres
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSection(section);
                    setIsAIModalOpen(true);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar com IA
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {report.title} - {report.year}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{report.status}</Badge>
              <Badge variant="secondary">{report.completion_percentage}%</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="sections">Seções</TabsTrigger>
            <TabsTrigger value="export">Exportar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="indicators" className="space-y-4">
            {renderIndicators()}
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            {renderSections()}
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévia e Exportação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Sistema de Exportação Avançado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gere relatórios completos em diferentes formatos seguindo os padrões GRI. 
                      Inclui prévia online, download em PDF/Word e opções de compartilhamento.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
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
                        onClick={() => toast.info("Use a Central de Exportação para acessar a prévia.")}
                      >
                        Prévia Rápida
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info("Use a Central de Exportação para download em PDF.")}
                      >
                        PDF Direto
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info("Use a Central de Exportação para compartilhar.")}
                      >
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
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
        <GRIReportExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          report={report}
        />
      </DialogContent>
    </Dialog>
  );
}