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
      toast.error("Erro ao salvar metadados");
    } finally {
      setIsSaving(false);
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
          <div className="space-y-2">
            <Label htmlFor="ceo-message">Mensagem da Liderança</Label>
            <Textarea
              id="ceo-message"
              value={ceoMessage}
              onChange={(e) => setCeoMessage(e.target.value)}
              placeholder="Mensagem do CEO/Presidente sobre os compromissos de sustentabilidade..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="executive-summary">Sumário Executivo</Label>
            <Textarea
              id="executive-summary"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Resumo executivo dos principais temas e resultados..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="methodology">Metodologia</Label>
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
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Metadados"}
          </Button>
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
                          {indicator.indicator?.data_type === 'Numérico' && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Valor"
                                defaultValue={indicator.numeric_value || ''}
                                onBlur={(e) => handleIndicatorUpdate(
                                  indicator.indicator_id, 
                                  e.target.value, 
                                  'Numérico'
                                )}
                                className="max-w-xs"
                              />
                              <span className="text-sm text-muted-foreground">
                                {indicator.indicator?.unit}
                              </span>
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

                          {indicator.indicator?.data_type === 'Percentual' && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                max="100"
                                defaultValue={indicator.percentage_value || ''}
                                onBlur={(e) => handleIndicatorUpdate(
                                  indicator.indicator_id, 
                                  e.target.value, 
                                  'Percentual'
                                )}
                                className="max-w-xs"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
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