import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { 
  generateLegislationReport, 
  LegislationReportConfig,
  exportLegislationReportToPDF,
  exportLegislationReportToExcel 
} from "@/services/legislationReportExport";
import { toast } from "sonner";

export const useLegislationReports = () => {
  const { selectedCompany } = useCompany();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (config: LegislationReportConfig, branchId?: string, branchName?: string) => {
    if (!selectedCompany?.id) {
      toast.error("Empresa não encontrada");
      return;
    }

    setIsGenerating(true);
    try {
      await generateLegislationReport(
        selectedCompany.id,
        selectedCompany.name || "Empresa",
        config,
        branchId,
        branchName
      );
      
      const formatLabel = config.format === 'both' ? 'PDF e Excel' : config.format.toUpperCase();
      toast.success(`Relatório gerado com sucesso em ${formatLabel}`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = async (config: Omit<LegislationReportConfig, 'format'>) => {
    if (!selectedCompany?.id) {
      toast.error("Empresa não encontrada");
      return;
    }

    setIsGenerating(true);
    try {
      await exportLegislationReportToPDF(
        selectedCompany.id,
        selectedCompany.name || "Empresa",
        { ...config, format: 'pdf' }
      );
      toast.success("Relatório PDF gerado com sucesso");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToExcel = async (config: Omit<LegislationReportConfig, 'format'>) => {
    if (!selectedCompany?.id) {
      toast.error("Empresa não encontrada");
      return;
    }

    setIsGenerating(true);
    try {
      await exportLegislationReportToExcel(
        selectedCompany.id,
        selectedCompany.name || "Empresa",
        { ...config, format: 'excel' }
      );
      toast.success("Relatório Excel gerado com sucesso");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Erro ao gerar Excel");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReport,
    exportToPDF,
    exportToExcel,
    isGenerating,
  };
};
