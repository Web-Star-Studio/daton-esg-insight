import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Download, 
  Calendar, 
  Settings, 
  Mail, 
  Clock,
  BarChart3,
  FileImage,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { advancedReportingService, ReportConfig } from '@/services/advancedReportingService';

interface AdvancedReportsModalProps {
  trigger?: React.ReactNode;
  companyId: string;
}

export const AdvancedReportsModal: React.FC<AdvancedReportsModalProps> = ({
  trigger,
  companyId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('templates');
  const [reportTemplates, setReportTemplates] = useState<ReportConfig[]>([]);
  const [customReport, setCustomReport] = useState<Partial<ReportConfig>>({
    type: 'custom',
    format: 'pdf',
    schedule: 'manual',
    filters: {},
    dataSources: [],
    recipients: []
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReportTemplates();
  }, []);

  const loadReportTemplates = async () => {
    try {
      const templates = await advancedReportingService.getReportTemplates();
      setReportTemplates(templates);
    } catch (error) {
      console.error('Error loading report templates:', error);
      toast.error('Erro ao carregar modelos de relatório');
    }
  };

  const generateReport = async (config: ReportConfig) => {
    setIsGenerating(true);
    
    try {
      // Add company filter
      config.filters.companyId = companyId;
      
      toast.info('Gerando relatório...', { description: 'Este processo pode levar alguns minutos' });
      
      const reportData = await advancedReportingService.generateReport(config);
      const blob = await advancedReportingService.exportReport(reportData, config.format);
      
      // Download the report
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}_${new Date().toISOString().split('T')[0]}.${config.format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Relatório gerado com sucesso!');
      
      // Schedule if needed
      if (config.schedule !== 'manual') {
        await advancedReportingService.scheduleReport(config);
        toast.info(`Relatório agendado para execução ${config.schedule}`);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomReportGenerate = async () => {
    if (!customReport.name || !customReport.type) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const config: ReportConfig = {
      id: `custom-${Date.now()}`,
      name: customReport.name!,
      description: customReport.description || '',
      type: customReport.type!,
      format: customReport.format || 'pdf',
      schedule: customReport.schedule || 'manual',
      filters: { ...customReport.filters, companyId },
      recipients: customReport.recipients || [],
      dataSources: customReport.dataSources || []
    };

    await generateReport(config);
  };

  const updateCustomReport = (field: keyof ReportConfig, value: any) => {
    setCustomReport(prev => ({ ...prev, [field]: value }));
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'json': return <FileImage className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getScheduleBadgeColor = (schedule: string) => {
    switch (schedule) {
      case 'daily': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-orange-100 text-orange-800';
      case 'quarterly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableDataSources = [
    'calculated_emissions',
    'activity_data',
    'quality_indicators', 
    'non_conformities',
    'compliance_tasks',
    'esg_risks',
    'goals',
    'licenses',
    'audits',
    'gri_indicator_data'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios Avançados
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios Avançados
          </DialogTitle>
          <DialogDescription>
            Gere relatórios personalizados com dados detalhados e análises avançadas
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Modelos</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              {reportTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getFormatIcon(template.format)}
                          {template.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getScheduleBadgeColor(template.schedule || 'manual')}>
                          {template.schedule === 'manual' ? 'Manual' : template.schedule}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getFormatIcon(template.format)}
                          {template.format.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>Fontes de dados: {template.dataSources.length} tabelas</p>
                        <p>Tipo: {template.type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateReport(template)}
                          disabled={isGenerating}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Gerar
                        </Button>
                        {template.schedule !== 'manual' && (
                          <Button variant="ghost" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Relatório Personalizado</CardTitle>
                <CardDescription>
                  Crie um relatório sob medida com suas configurações específicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportName">Nome do Relatório *</Label>
                    <Input
                      id="reportName"
                      value={customReport.name || ''}
                      onChange={(e) => updateCustomReport('name', e.target.value)}
                      placeholder="Ex: Análise Mensal de Emissões"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportType">Tipo de Relatório</Label>
                    <Select
                      value={customReport.type}
                      onValueChange={(value) => updateCustomReport('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emissions">Emissões</SelectItem>
                        <SelectItem value="quality">Qualidade</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="esg">ESG</SelectItem>
                        <SelectItem value="gri">GRI</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportFormat">Formato</Label>
                    <Select
                      value={customReport.format}
                      onValueChange={(value) => updateCustomReport('format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportSchedule">Agendamento</Label>
                    <Select
                      value={customReport.schedule}
                      onValueChange={(value) => updateCustomReport('schedule', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={customReport.description || ''}
                    onChange={(e) => updateCustomReport('description', e.target.value)}
                    placeholder="Descreva o objetivo e conteúdo do relatório"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fontes de Dados</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableDataSources.map((source) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={source}
                          checked={customReport.dataSources?.includes(source) || false}
                          onCheckedChange={(checked) => {
                            const current = customReport.dataSources || [];
                            const updated = checked
                              ? [...current, source]
                              : current.filter(s => s !== source);
                            updateCustomReport('dataSources', updated);
                          }}
                        />
                        <Label 
                          htmlFor={source} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {source.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCustomReportGenerate}
                    disabled={isGenerating || !customReport.name}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Relatório
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Relatórios Agendados
                </CardTitle>
                <CardDescription>
                  Gerencie relatórios com execução automática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Nenhum relatório agendado encontrado
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure relatórios automáticos nos modelos ou personalizados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};