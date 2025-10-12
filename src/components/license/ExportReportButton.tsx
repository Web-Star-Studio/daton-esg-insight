import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { exportAlertsReport, exportObservationsReport, exportComplianceReport } from '@/services/licenseReportExport';

interface ExportReportButtonProps {
  licenseId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ExportReportButton({ licenseId, variant = 'outline', size = 'sm' }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'alerts' | 'observations' | 'compliance', format: 'pdf' | 'excel') => {
    setIsExporting(true);
    toast.info(`Gerando relatório em ${format.toUpperCase()}...`);

    try {
      if (type === 'alerts') {
        await exportAlertsReport(licenseId, format);
      } else if (type === 'observations') {
        await exportObservationsReport(licenseId, format);
      } else {
        await exportComplianceReport(format);
      }
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Relatórios de Alertas</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('alerts', 'pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Alertas (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('alerts', 'excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Alertas (Excel)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Relatórios de Observações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('observations', 'pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Observações (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('observations', 'excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Observações (Excel)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Relatório de Compliance</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('compliance', 'pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Compliance (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('compliance', 'excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Compliance (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
