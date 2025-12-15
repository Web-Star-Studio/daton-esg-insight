import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Calendar as CalendarIcon, Building2, Users, Briefcase, GraduationCap, FileSpreadsheet, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTrainingExportData, exportToCSV, exportToExcel, TrainingExportConfig, ExportData } from "@/services/trainingExportService";

interface TrainingHoursExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportTypes = [
  { value: 'total', label: 'Total', icon: FileSpreadsheet, description: 'Resumo consolidado' },
  { value: 'by_location', label: 'Por Filial', icon: Building2, description: 'Agrupado por localização' },
  { value: 'by_department', label: 'Por Setor', icon: Users, description: 'Agrupado por departamento' },
  { value: 'by_position', label: 'Por Função', icon: Briefcase, description: 'Agrupado por cargo' },
  { value: 'by_training', label: 'Por Treinamento', icon: GraduationCap, description: 'Detalhado por programa' },
  { value: 'detailed', label: 'Detalhado', icon: List, description: 'Por funcionário' },
] as const;

export function TrainingHoursExportModal({ open, onOpenChange }: TrainingHoursExportModalProps) {
  const [reportType, setReportType] = useState<TrainingExportConfig['type']>('total');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('excel');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: previewData, isLoading } = useQuery({
    queryKey: ['training-export-preview', reportType, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: () => getTrainingExportData({ type: reportType, format: 'csv', dateFrom, dateTo }),
    enabled: open,
  });

  const handleExport = async () => {
    try {
      const data = await getTrainingExportData({ type: reportType, format: exportFormat, dateFrom, dateTo });
      const filename = `horas-treinamento-${reportType}-${format(new Date(), 'yyyy-MM-dd')}`;
      
      if (exportFormat === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToExcel(data, filename);
      }
      
      toast.success('Relatório exportado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Horas de Treinamento
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de relatório e formato de exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Relatório</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setReportType(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                      reportType === type.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{type.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Período (opcional)</Label>
            <div className="flex flex-wrap gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} />
                </PopoverContent>
              </Popover>

              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'excel')} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer">Excel (.xlsx)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="cursor-pointer">CSV</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Preview</Label>
              {previewData?.summary && (
                <span className="text-xs text-muted-foreground">
                  {previewData.summary.totalHours}h totais • {previewData.summary.totalEmployees} funcionários • {previewData.summary.avgHours}h média
                </span>
              )}
            </div>
            <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : previewData && previewData.rows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.map((header, i) => (
                        <TableHead key={i} className="text-xs">{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-xs py-2">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {previewData.rows.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={previewData.headers.length} className="text-center text-xs text-muted-foreground py-2">
                          ... e mais {previewData.rows.length - 5} registros
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum dado encontrado para o período selecionado
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport} disabled={isLoading || !previewData?.rows.length}>
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
