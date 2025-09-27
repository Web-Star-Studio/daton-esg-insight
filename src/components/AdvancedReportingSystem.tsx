import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Filter,
  Settings,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'esg' | 'emissions' | 'quality' | 'compliance' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  automated: boolean;
  lastGenerated?: Date;
  status: 'active' | 'draft' | 'archived';
}

interface ReportSchedule {
  id: string;
  templateId: string;
  name: string;
  frequency: string;
  nextRun: Date;
  recipients: string[];
  active: boolean;
}

export const AdvancedReportingSystem: React.FC = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [isGenerating, setIsGenerating] = useState(false);

  // Production - templates should be loaded from database
  const reportTemplates: ReportTemplate[] = [];

  const scheduledReports: ReportSchedule[] = [
    {
      id: '1',
      templateId: '1',
      name: 'ESG Mensal - Diretoria',
      frequency: 'Mensal (dia 5)',
      nextRun: new Date('2024-02-05'),
      recipients: ['diretoria@empresa.com', 'esg@empresa.com'],
      active: true
    },
    {
      id: '2',
      templateId: '2',
      name: 'GEE Trimestral - Stakeholders',
      frequency: 'Trimestral',
      nextRun: new Date('2024-03-01'),
      recipients: ['stakeholders@empresa.com', 'sustentabilidade@empresa.com'],
      active: true
    }
  ];

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Erro",
        description: "Selecione um template de relatório",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Relatório Gerado",
        description: "O relatório foi gerado com sucesso e está pronto para download.",
      });
    }, 3000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'esg': return 'bg-accent/10 text-accent';
      case 'emissions': return 'bg-destructive/10 text-destructive';
      case 'quality': return 'bg-success/10 text-success';
      case 'compliance': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'esg': return 'ESG';
      case 'emissions': return 'Emissões';
      case 'quality': return 'Qualidade';
      case 'compliance': return 'Compliance';
      default: return 'Personalizado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Relatórios Avançado</h2>
          <p className="text-muted-foreground">Gere relatórios personalizados e configure automações</p>
        </div>
        <Button className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configurações
        </Button>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Generation Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Geração de Relatório
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros para gerar seu relatório personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Template do Relatório</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period-select">Período</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Último Mês</SelectItem>
                        <SelectItem value="quarterly">Último Trimestre</SelectItem>
                        <SelectItem value="yearly">Último Ano</SelectItem>
                        <SelectItem value="custom">Período Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format-select">Formato</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="powerpoint">PowerPoint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Seções do Relatório</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="executive-summary" defaultChecked />
                      <Label htmlFor="executive-summary" className="text-sm">Resumo Executivo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="kpis" defaultChecked />
                      <Label htmlFor="kpis" className="text-sm">KPIs Principais</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="trends" defaultChecked />
                      <Label htmlFor="trends" className="text-sm">Análise de Tendências</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="recommendations" />
                      <Label htmlFor="recommendations" className="text-sm">Recomendações</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleGenerateReport} 
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar por Email
                  </Button>
                </div>

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gerando relatório...</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Relatórios Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">ESG Janeiro 2024</p>
                    <p className="text-xs text-muted-foreground">15/01/24 - PDF</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">GEE Q4 2023</p>
                    <p className="text-xs text-muted-foreground">10/01/24 - Excel</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Qualidade Dec 2023</p>
                    <p className="text-xs text-muted-foreground">12/01/24 - PDF</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frequência:</span>
                    <span className="capitalize">{template.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Automatizado:</span>
                    <Badge variant={template.automated ? "default" : "outline"}>
                      {template.automated ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  {template.lastGenerated && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Último:</span>
                      <span>{template.lastGenerated.toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      Usar Template
                    </Button>
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          {scheduledReports.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <CardDescription>
                      Próxima execução: {schedule.nextRun.toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Badge variant={schedule.active ? "default" : "outline"}>
                    {schedule.active ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frequência:</span>
                  <span>{schedule.frequency}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Destinatários:</span>
                  <div className="mt-1 space-y-1">
                    {schedule.recipients.map((recipient, index) => (
                      <Badge key={index} variant="outline" className="text-xs mr-2">
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                  <Button size="sm" variant="outline">
                    {schedule.active ? "Pausar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="outline">
                    Executar Agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">+12% este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Automação</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">Relatórios automatizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.5m</div>
                <p className="text-xs text-muted-foreground">Para gerar relatório</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insights de Utilização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg border-l-4 border-accent">
                <h4 className="font-medium">Template Mais Usado</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Relatório ESG Executivo é o template mais gerado (45% do total)
                </p>
              </div>
              <div className="p-4 bg-warning/10 rounded-lg border-l-4 border-warning">
                <h4 className="font-medium">Oportunidade de Melhoria</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  22% dos relatórios são gerados manualmente - considere automatizar
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border-l-4 border-success">
                <h4 className="font-medium">Eficiência Melhorada</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Tempo de geração reduziu 40% nos últimos 3 meses
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};