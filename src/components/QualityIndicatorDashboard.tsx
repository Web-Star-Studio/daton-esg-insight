import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Plus,
  CheckCircle,
  BarChart3
} from 'lucide-react';

const QualityIndicatorDashboard = () => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [newIndicator, setNewIndicator] = useState({
    name: '',
    category: '',
    target: '',
    unit: '',
    frequency: 'monthly'
  });

  // Real data will come from API - no mock data in production
  const indicators: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success bg-success/10 border-success/20';
      case 'good': return 'text-primary bg-primary/10 border-primary/20';
      case 'warning': return 'text-warning bg-warning/10 border-warning/20';
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-success" /> : 
      <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const handleCreateIndicator = () => {
    if (!newIndicator.name || !newIndicator.target) {
      toast({
        title: "Erro de Validação",
        description: "Nome e meta são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Indicador Criado",
      description: `Indicador "${newIndicator.name}" foi criado com sucesso.`,
    });
    setIsModalOpen(false);
    setNewIndicator({ name: '', category: '', target: '', unit: '', frequency: 'monthly' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Indicadores de Qualidade</h2>
          <p className="text-muted-foreground">Monitore o desempenho do sistema de qualidade</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Indicador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Indicador de Qualidade</DialogTitle>
                <DialogDescription>
                  Defina um novo indicador para monitoramento contínuo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="indicator-name">Nome do Indicador</Label>
                    <Input
                      id="indicator-name"
                      placeholder="Ex: Taxa de Defeitos"
                      value={newIndicator.name}
                      onChange={(e) => setNewIndicator({ ...newIndicator, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="indicator-category">Categoria</Label>
                    <Select value={newIndicator.category} onValueChange={(value) => setNewIndicator({ ...newIndicator, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="quality">Qualidade</SelectItem>
                        <SelectItem value="efficiency">Eficiência</SelectItem>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="effectiveness">Eficácia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="indicator-target">Meta</Label>
                    <Input
                      id="indicator-target"
                      type="number"
                      placeholder="Ex: 95"
                      value={newIndicator.target}
                      onChange={(e) => setNewIndicator({ ...newIndicator, target: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="indicator-unit">Unidade</Label>
                    <Input
                      id="indicator-unit"
                      placeholder="Ex: %, dias, pontos"
                      value={newIndicator.unit}
                      onChange={(e) => setNewIndicator({ ...newIndicator, unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="indicator-frequency">Frequência</Label>
                    <Select value={newIndicator.frequency} onValueChange={(value) => setNewIndicator({ ...newIndicator, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateIndicator}>
                    Criar Indicador
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((indicator) => (
          <Card key={indicator.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate">{indicator.name}</CardTitle>
              <div className="flex items-center gap-1">
                {getTrendIcon(indicator.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">
                    {indicator.currentValue}{indicator.unit}
                  </div>
                  <Badge className={`text-xs ${getStatusColor(indicator.status)}`}>
                    Meta: {indicator.targetValue}{indicator.unit}
                  </Badge>
                </div>
                <Progress 
                  value={calculateProgress(indicator.currentValue, indicator.targetValue)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Última medição: {new Date(indicator.lastMeasurement).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {indicators.map((indicator) => (
              <Card key={indicator.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{indicator.name}</CardTitle>
                  <CardDescription>Tendência nos últimos 3 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={indicator.history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`${value}${indicator.unit}`, indicator.name]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Performance</CardTitle>
              <CardDescription>Valores atuais vs metas estabelecidas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={indicators}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="currentValue" fill="hsl(var(--primary))" name="Atual" />
                  <Bar dataKey="targetValue" fill="hsl(var(--muted))" name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {indicators
              .filter(indicator => indicator.status === 'warning' || indicator.status === 'critical')
              .map((indicator) => (
                <Card key={indicator.id} className="border-l-4 border-l-warning">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{indicator.name}</CardTitle>
                      <Badge className={`${getStatusColor(indicator.status)}`}>
                        {indicator.status === 'warning' ? 'Atenção' : 'Crítico'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Valor atual:</span>
                        <span className="font-medium">{indicator.currentValue}{indicator.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Meta:</span>
                        <span className="font-medium">{indicator.targetValue}{indicator.unit}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Target className="h-4 w-4 mr-2" />
                          Criar Ação
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Análise Detalhada
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {indicators.filter(i => i.status === 'warning' || i.status === 'critical').length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-lg font-medium">Excelente!</p>
                  <p className="text-muted-foreground">Todos os indicadores estão dentro dos parâmetros esperados</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityIndicatorDashboard;