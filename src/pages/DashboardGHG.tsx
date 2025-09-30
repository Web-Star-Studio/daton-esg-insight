import { EmissionInsightsDashboard } from '@/components/EmissionInsightsDashboard';
import { useDashboardGHG } from '@/hooks/data/useDashboardGHG';
import { DashboardGHGHeader } from '@/components/dashboard/DashboardGHGHeader';
import { DashboardKPICards } from '@/components/dashboard/DashboardKPICards';
import { EmissionsMonthlyChart } from '@/components/dashboard/EmissionsMonthlyChart';
import { EmissionsCharts } from '@/components/dashboard/EmissionsCharts';

const DashboardGHG = () => {
  const {
    dateRange,
    setDateRange,
    emissionsData,
    isLoading,
    cacheInfo,
    refresh,
    isRefreshing,
    monthlyData,
    escopoData,
    fontesEscopo1Data,
    totals,
  } = useDashboardGHG();

  return (
    <div className="space-y-6">
      <DashboardGHGHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        isCached={cacheInfo.isCached}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

      <DashboardKPICards totals={totals} isLoading={isLoading} />

      <EmissionsMonthlyChart monthlyData={monthlyData} isLoading={isLoading} />

      <EmissionsCharts 
        escopoData={escopoData} 
        fontesEscopo1Data={fontesEscopo1Data} 
        isLoading={isLoading} 
      />

      <EmissionInsightsDashboard 
        dateRange={dateRange?.from && dateRange?.to ? dateRange as { from: Date; to: Date } : undefined}
        emissionData={emissionsData || []}
      />
    </div>
  );
};

export default DashboardGHG;
