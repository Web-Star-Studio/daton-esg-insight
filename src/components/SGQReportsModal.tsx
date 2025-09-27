import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Calendar,
  Filter,
  Settings
} from 'lucide-react';
import { qualityManagementService } from '@/services/qualityManagement';

interface SGQReportsModalProps {
  children: React.ReactNode;
}

const SGQReportsModal: React.FC<SGQReportsModalProps> = ({ children }) => {
  const [reportType, setReportType] = useState('dashboard');
  const [dateRange, setDateRange] = useState('last_month');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => qualityManagementService.getQualityDashboard(),
  });

  const { data: ncStats } = useQuery({
    queryKey: ['nc-stats'],
    queryFn: () => qualityManagementService.getNonConformityStats(),
  });

  const { data: actionPlansProgress } = useQuery({
    queryKey: ['action-plans-progress'],
    queryFn: () => qualityManagementService.getActionPlansProgress(),
  });

  const reportTypes = [
    {
      id: 'dashboard',
      name: 'Dashboard Executivo',
      description: 'Visão geral dos indicadores de qualidade',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      id: 'nc_analysis',
      name: 'Análise de Não Conformidades',
      description: 'Relatório detalhado das NCs por período',
      icon: <PieChart className="h-5 w-5" />
    },
    {
      id: 'action_plans',
      name: 'Progresso dos Planos de Ação',
      description: 'Status e eficácia das ações corretivas',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      id: 'risk_assessment',
      name: 'Avaliação de Riscos',
      description: 'Matriz de riscos e controles implementados',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const dateRanges = [
    { value: 'last_week', label: 'Última semana' },
    { value: 'last_month', label: 'Último mês' },
    { value: 'last_quarter', label: 'Último trimestre' },
    { value: 'last_year', label: 'Último ano' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock PDF download
      const reportName = reportTypes.find(r => r.id === reportType)?.name || 'Relatório SGQ';
      const fileName = `${reportName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      toast.success(`Relatório "${reportName}" gerado com sucesso!`);
      
      // Mock download
      const link = document.createElement('a');
      link.href = '#';
      link.download = fileName;
      link.click();
      
    } catch (error) {
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportPreview = () => {
    switch (reportType) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Indicadores Principais</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Total de NCs: <strong>{dashboard?.metrics.totalNCs || 0}</strong></div>
              <div>NCs Abertas: <strong>{dashboard?.metrics.openNCs || 0}</strong></div>
              <div>Riscos Críticos: <strong>{dashboard?.metrics.criticalRisks || 0}</strong></div>
              <div>Ações em Atraso: <strong>{dashboard?.metrics.overdueActions || 0}</strong></div>
            </div>
          </div>
        );
      
      case 'nc_analysis':
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Distribuição por Severidade</h4>
            <div className="space-y-2 text-sm">
              {ncStats && Object.entries(ncStats.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex justify-between">
                  <span>{severity}:</span>
                  <strong>{count as number}</strong>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'action_plans':
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Planos em Andamento</h4>
            <div className="space-y-2 text-sm">
              {actionPlansProgress?.slice(0, 3).map((plan) => (
                <div key={plan.id} className="flex justify-between items-center">
                  <span className="truncate flex-1">{plan.title}</span>
                  <Badge variant="outline">{plan.avgProgress}%</Badge>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center text-muted-foreground py-4">
            Selecione um tipo de relatório para ver a prévia
          </div>
        );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Relatórios SGQ</span>
          </DialogTitle>
          <DialogDescription>
            Gere relatórios personalizados do Sistema de Gestão da Qualidade
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configure" className="space-y-4">
          <TabsList>
            <TabsTrigger value="configure">Configurar</TabsTrigger>
            <TabsTrigger value="preview">Prévia</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Tipo de Relatório</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTypes.map((type) => (
                  <Card 
                    key={type.id} 
                    className={`cursor-pointer transition-colors ${reportType === type.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => setReportType(type.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        {type.icon}
                        <span>{type.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        {type.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Final</Label>
                    <Input type="date" />
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Additional Options */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Opções Adicionais</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Incluir gráficos</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Incluir dados detalhados</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Incluir recomendações</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Incluir assinaturas</span>
                </label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {reportTypes.find(r => r.id === reportType)?.name}
                </CardTitle>
                <CardDescription>
                  Prévia do conteúdo que será incluído no relatório
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getReportPreview()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isGenerating ? 'Gerando...' : 'Gerar Relatório'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SGQReportsModal;