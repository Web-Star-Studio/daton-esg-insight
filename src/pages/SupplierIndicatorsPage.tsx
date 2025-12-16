import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Star, Users, Download, Calendar, BarChart3 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { MainLayout } from '@/components/MainLayout';

import { DocumentComplianceCard } from '@/components/supplier-indicators/DocumentComplianceCard';
import { PerformanceComplianceCard } from '@/components/supplier-indicators/PerformanceComplianceCard';
import { PortalParticipationCard } from '@/components/supplier-indicators/PortalParticipationCard';
import { DocumentEvolutionChart, PerformanceEvolutionChart, ParticipationPieChart } from '@/components/supplier-indicators/ComplianceEvolutionChart';
import { DocumentComplianceTable, PerformanceRankingTable, ParticipationTable } from '@/components/supplier-indicators/SupplierRankingTable';

import * as indicatorsService from '@/services/supplierIndicatorsService';
import * as exportService from '@/services/supplierExportService';
import { toast } from 'sonner';

export default function SupplierIndicatorsPage() {
  const { selectedCompany } = useCompany();
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('ava1');

  const companyId = selectedCompany?.id;

  // AVA1 - Document Compliance Queries
  const { data: docCompliance, isLoading: loadingDocCompliance } = useQuery({
    queryKey: ['supplier-doc-compliance', companyId, period, selectedDate],
    queryFn: () => indicatorsService.getDocumentComplianceIndicators(companyId!, period, selectedDate),
    enabled: !!companyId
  });

  const { data: docEvolution, isLoading: loadingDocEvolution } = useQuery({
    queryKey: ['supplier-doc-evolution', companyId],
    queryFn: () => indicatorsService.getDocumentComplianceEvolution(companyId!, 12),
    enabled: !!companyId
  });

  const { data: docBySupplier, isLoading: loadingDocBySupplier } = useQuery({
    queryKey: ['supplier-doc-by-supplier', companyId, period, selectedDate],
    queryFn: () => indicatorsService.getDocumentComplianceBySupplier(companyId!, period, selectedDate),
    enabled: !!companyId
  });

  // AVA2 - Performance Queries
  const { data: performance, isLoading: loadingPerformance } = useQuery({
    queryKey: ['supplier-performance', companyId, period, selectedDate],
    queryFn: () => indicatorsService.getPerformanceIndicators(companyId!, period, selectedDate),
    enabled: !!companyId
  });

  const { data: perfEvolution, isLoading: loadingPerfEvolution } = useQuery({
    queryKey: ['supplier-perf-evolution', companyId],
    queryFn: () => indicatorsService.getPerformanceEvolution(companyId!, 12),
    enabled: !!companyId
  });

  const { data: topSuppliers, isLoading: loadingTopSuppliers } = useQuery({
    queryKey: ['supplier-top-performers', companyId],
    queryFn: () => indicatorsService.getTopPerformingSuppliers(companyId!, 5),
    enabled: !!companyId
  });

  const { data: lowSuppliers, isLoading: loadingLowSuppliers } = useQuery({
    queryKey: ['supplier-low-performers', companyId],
    queryFn: () => indicatorsService.getLowPerformingSuppliers(companyId!, 5),
    enabled: !!companyId
  });

  // EXT1 - Portal Participation Queries
  const { data: participation, isLoading: loadingParticipation } = useQuery({
    queryKey: ['supplier-participation', companyId, period, selectedDate],
    queryFn: () => indicatorsService.getPortalParticipationIndicators(companyId!, period, selectedDate),
    enabled: !!companyId
  });

  const { data: participationBySupplier, isLoading: loadingPartBySupplier } = useQuery({
    queryKey: ['supplier-participation-by-supplier', companyId],
    queryFn: () => indicatorsService.getParticipationBySupplier(companyId!),
    enabled: !!companyId
  });

  const handleExport = async () => {
    const periodStr = format(selectedDate, period === 'month' ? 'MM/yyyy' : 'yyyy');
    
    try {
      if (activeTab === 'ava1' && docCompliance && docEvolution && docBySupplier) {
        exportService.exportDocumentComplianceReport(docCompliance, docEvolution, docBySupplier, periodStr);
        toast.success('Relatório de Conformidade Documental exportado!');
      } else if (activeTab === 'ava2' && performance && perfEvolution && topSuppliers && lowSuppliers) {
        exportService.exportPerformanceReport(performance, perfEvolution, topSuppliers, lowSuppliers, periodStr);
        toast.success('Relatório de Conformidade de Fornecimento exportado!');
      } else if (activeTab === 'ext1' && participation && participationBySupplier) {
        exportService.exportPortalParticipationReport(participation, participationBySupplier, periodStr);
        toast.success('Relatório de Participação no Portal exportado!');
      }
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return { value: date.toISOString(), label: format(date, 'MMMM yyyy', { locale: ptBR }) };
  });

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Selecione uma empresa para visualizar os indicadores.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              Indicadores de Gestão de Fornecedores
            </h1>
            <p className="text-muted-foreground">
              Análise de conformidade documental, fornecimento e participação no portal
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as 'month' | 'year')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensal</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>

            {period === 'month' ? (
              <Select 
                value={selectedDate.toISOString()} 
                onValueChange={(v) => setSelectedDate(new Date(v))}
              >
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select 
                value={selectedDate.getFullYear().toString()} 
                onValueChange={(v) => setSelectedDate(new Date(parseInt(v), 0, 1))}
              >
                <SelectTrigger className="w-[120px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ava1" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conformidade Documental [AVA1]
            </TabsTrigger>
            <TabsTrigger value="ava2" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Conformidade de Fornecimento [AVA2]
            </TabsTrigger>
            <TabsTrigger value="ext1" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participação no Portal [EXT1]
            </TabsTrigger>
          </TabsList>

          {/* AVA1 - Document Compliance */}
          <TabsContent value="ava1" className="space-y-6">
            <DocumentComplianceCard 
              data={docCompliance || { totalEvaluated: 0, compliant: 0, nonCompliant: 0, complianceRate: 0 }} 
              isLoading={loadingDocCompliance} 
            />
            <DocumentEvolutionChart 
              data={docEvolution || []} 
              isLoading={loadingDocEvolution} 
            />
            <DocumentComplianceTable 
              data={docBySupplier || []} 
              isLoading={loadingDocBySupplier} 
            />
          </TabsContent>

          {/* AVA2 - Performance Compliance */}
          <TabsContent value="ava2" className="space-y-6">
            <PerformanceComplianceCard 
              data={performance || { totalEvaluated: 0, averageScore: 0, qualityScore: 0, deliveryScore: 0, priceScore: 0 }} 
              isLoading={loadingPerformance} 
            />
            <PerformanceEvolutionChart 
              data={perfEvolution || []} 
              isLoading={loadingPerfEvolution} 
            />
            <PerformanceRankingTable 
              topSuppliers={topSuppliers || []} 
              lowSuppliers={lowSuppliers || []} 
              isLoading={loadingTopSuppliers || loadingLowSuppliers} 
            />
          </TabsContent>

          {/* EXT1 - Portal Participation */}
          <TabsContent value="ext1" className="space-y-6">
            <PortalParticipationCard 
              data={participation || { trainings: { total: 0, completed: 0, rate: 0 }, readings: { total: 0, confirmed: 0, rate: 0 }, surveys: { total: 0, responded: 0, rate: 0 } }} 
              isLoading={loadingParticipation} 
            />
            <ParticipationPieChart 
              data={participation || { trainings: { total: 0, completed: 0, rate: 0 }, readings: { total: 0, confirmed: 0, rate: 0 }, surveys: { total: 0, responded: 0, rate: 0 } }} 
              isLoading={loadingParticipation} 
            />
            <ParticipationTable 
              data={participationBySupplier || []} 
              isLoading={loadingPartBySupplier} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
