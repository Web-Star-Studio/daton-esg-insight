/**
 * Hooks para Relatórios de Auditoria
 */

import { useQuery } from "@tanstack/react-query";
import { ReportsService, AuditReportData } from "@/services/audit/reports";

export const reportsKeys = {
  all: ['audit-reports'] as const,
  report: (auditId: string) => [...reportsKeys.all, 'report', auditId] as const,
};

export function useAuditReport(auditId: string) {
  return useQuery({
    queryKey: reportsKeys.report(auditId),
    queryFn: () => ReportsService.getAuditReportData(auditId),
    enabled: !!auditId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
