import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExtendedQualityIndicator } from "@/services/indicatorManagement";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface IndicatorExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicator: ExtendedQualityIndicator;
  year: number;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function IndicatorExportModal({ open, onOpenChange, indicator, year }: IndicatorExportModalProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [includeChart, setIncludeChart] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(year.toString());

  const prepareData = () => {
    const data = MONTHS.map((monthName, index) => {
      const monthData = indicator.period_data?.find(pd => pd.month === index + 1);
      const deviation = monthData?.measured_value && indicator.target_value
        ? ((monthData.measured_value - indicator.target_value) / indicator.target_value) * 100
        : null;
      
      return {
        Mês: monthName,
        'Valor Medido': monthData?.measured_value ?? '',
        Meta: indicator.target_value ?? '',
        'Desvio (%)': deviation !== null ? `${deviation.toFixed(1)}%` : '',
        Status: monthData?.status ? translateStatus(monthData.status) : 'Pendente',
        Observação: monthData?.observation || ''
      };
    });

    return data;
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'on_target': 'Na Meta',
      'warning': 'Atenção',
      'critical': 'Crítico',
      'pending': 'Pendente'
    };
    return translations[status] || status;
  };

  const calculateStats = () => {
    const collectedMonths = indicator.period_data?.filter(pd => pd.measured_value !== null) || [];
    const values = collectedMonths.map(pd => pd.measured_value!);
    
    return {
      'Total de Meses Coletados': collectedMonths.length,
      'Percentual de Coleta': `${Math.round((collectedMonths.length / 12) * 100)}%`,
      'Média': values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '-',
      'Mínimo': values.length > 0 ? Math.min(...values).toFixed(2) : '-',
      'Máximo': values.length > 0 ? Math.max(...values).toFixed(2) : '-',
      'Na Meta': collectedMonths.filter(pd => pd.status === 'on_target').length,
      'Atenção': collectedMonths.filter(pd => pd.status === 'warning').length,
      'Crítico': collectedMonths.filter(pd => pd.status === 'critical').length
    };
  };

  const exportToExcel = async () => {
    const wb = XLSX.utils.book_new();
    
    // Main data sheet
    const data = prepareData();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Mês
      { wch: 15 }, // Valor Medido
      { wch: 10 }, // Meta
      { wch: 12 }, // Desvio
      { wch: 12 }, // Status
      { wch: 30 }, // Observação
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Dados Mensais');
    
    // Stats sheet
    if (includeStats) {
      const stats = calculateStats();
      const statsData = Object.entries(stats).map(([key, value]) => ({ Métrica: key, Valor: value }));
      const wsStats = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas');
    }
    
    // Info sheet
    const infoData = [
      { Campo: 'Código', Valor: indicator.code || '-' },
      { Campo: 'Nome', Valor: indicator.name },
      { Campo: 'Categoria', Valor: indicator.category },
      { Campo: 'Unidade', Valor: indicator.unit },
      { Campo: 'Meta', Valor: indicator.target_value?.toString() || '-' },
      { Campo: 'Tolerância', Valor: indicator.tolerance_value ? `±${indicator.tolerance_value}` : '-' },
      { Campo: 'Direção', Valor: indicator.direction === 'higher_better' ? 'Maior é Melhor' : indicator.direction === 'lower_better' ? 'Menor é Melhor' : 'Igual é Melhor' },
      { Campo: 'Frequência', Valor: indicator.frequency },
      { Campo: 'Ano', Valor: selectedYear }
    ];
    const wsInfo = XLSX.utils.json_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informações');
    
    XLSX.writeFile(wb, `indicador_${indicator.code || indicator.id}_${selectedYear}.xlsx`);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(16);
    doc.text(`Relatório do Indicador - ${selectedYear}`, pageWidth / 2, 20, { align: 'center' });
    
    // Indicator Info
    doc.setFontSize(12);
    doc.text(`${indicator.code ? `[${indicator.code}] ` : ''}${indicator.name}`, 14, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Categoria: ${indicator.category} | Unidade: ${indicator.unit} | Meta: ${indicator.target_value ?? '-'}`, 14, 42);
    doc.setTextColor(0);
    
    // Stats
    if (includeStats) {
      const stats = calculateStats();
      doc.setFontSize(11);
      doc.text('Resumo Estatístico', 14, 55);
      
      const statsRows = Object.entries(stats).map(([key, value]) => [key, value.toString()]);
      
      autoTable(doc, {
        startY: 60,
        head: [['Métrica', 'Valor']],
        body: statsRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto'
      });
    }
    
    // Monthly Data
    const currentY = (doc as any).lastAutoTable?.finalY || 60;
    doc.setFontSize(11);
    doc.text('Dados Mensais', 14, currentY + 15);
    
    const data = prepareData();
    const tableData = data.map(row => [
      row.Mês,
      row['Valor Medido']?.toString() || '-',
      row.Meta?.toString() || '-',
      row['Desvio (%)'] || '-',
      row.Status
    ]);
    
    autoTable(doc, {
      startY: currentY + 20,
      head: [['Mês', 'Valor', 'Meta', 'Desvio', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 }
    });
    
    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, finalY + 15);
    
    doc.save(`indicador_${indicator.code || indicator.id}_${selectedYear}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (format === 'excel') {
        await exportToExcel();
      } else {
        await exportToPDF();
      }
      
      toast({ title: "Exportado", description: `Relatório exportado com sucesso em formato ${format.toUpperCase()}` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Indicador</DialogTitle>
          <DialogDescription>
            Escolha o formato e as opções de exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Year Selection */}
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Formato</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'excel' | 'pdf')}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                   onClick={() => setFormat('excel')}>
                <RadioGroupItem value="excel" id="excel" />
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <Label htmlFor="excel" className="cursor-pointer font-medium">Excel (.xlsx)</Label>
                  <p className="text-xs text-muted-foreground">Planilha editável com múltiplas abas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                   onClick={() => setFormat('pdf')}>
                <RadioGroupItem value="pdf" id="pdf" />
                <FileText className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <Label htmlFor="pdf" className="cursor-pointer font-medium">PDF</Label>
                  <p className="text-xs text-muted-foreground">Relatório formatado para impressão</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Opções</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeStats" 
                  checked={includeStats}
                  onCheckedChange={(checked) => setIncludeStats(!!checked)}
                />
                <Label htmlFor="includeStats" className="cursor-pointer text-sm">
                  Incluir estatísticas (média, mín, máx)
                </Label>
              </div>
              {format === 'pdf' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeChart" 
                    checked={includeChart}
                    onCheckedChange={(checked) => setIncludeChart(!!checked)}
                    disabled
                  />
                  <Label htmlFor="includeChart" className="cursor-pointer text-sm text-muted-foreground">
                    Incluir gráfico (em breve)
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>Exportar</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
