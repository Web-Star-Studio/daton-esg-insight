import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { useAnalyticsData } from '@/hooks/data/useAnalyticsData';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { AnalyticsOverviewTab } from '@/components/analytics/AnalyticsOverviewTab';
import { AnalyticsEmissionsTab } from '@/components/analytics/AnalyticsEmissionsTab';
import { AnalyticsQualityTab } from '@/components/analytics/AnalyticsQualityTab';
import { AnalyticsComplianceTab } from '@/components/analytics/AnalyticsComplianceTab';
import { AnalyticsPerformanceTab } from '@/components/analytics/AnalyticsPerformanceTab';

const AdvancedAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const {
    isLoading,
    emissionsData,
    qualityData,
    complianceData,
    userActivityData,
    systemPerformanceData,
    handleRefresh,
  } = useAnalyticsData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Avançados</h1>
          <p className="text-muted-foreground">
            Análises detalhadas e insights inteligentes do sistema
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <AnalyticsHeader
        emissionsData={emissionsData}
        qualityData={qualityData}
        complianceData={complianceData}
        userActivityData={userActivityData}
      />

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="emissions">Emissões</TabsTrigger>
          <TabsTrigger value="quality">Qualidade</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AnalyticsOverviewTab
            emissionsData={emissionsData}
            qualityData={qualityData}
            complianceData={complianceData}
            userActivityData={userActivityData}
            systemPerformanceData={systemPerformanceData}
          />
        </TabsContent>

        <TabsContent value="emissions">
          <AnalyticsEmissionsTab emissionsData={emissionsData} />
        </TabsContent>

        <TabsContent value="quality">
          <AnalyticsQualityTab qualityData={qualityData} />
        </TabsContent>

        <TabsContent value="compliance">
          <AnalyticsComplianceTab complianceData={complianceData} />
        </TabsContent>

        <TabsContent value="performance">
          <AnalyticsPerformanceTab systemPerformanceData={systemPerformanceData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
