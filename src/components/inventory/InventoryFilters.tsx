import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Download, 
  BarChart3,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InventoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPeriod: string;
  onPeriodChange: (value: string) => void;
  showCharts: boolean;
  onShowChartsChange: (value: boolean) => void;
  comparisonEnabled: boolean;
  onComparisonChange: (value: boolean) => void;
  selectedSources: string[];
  onBulkDelete: () => void;
  onExportReport: () => void;
  onOpenAnalytics: () => void;
}

export function InventoryFilters({
  searchTerm,
  onSearchChange,
  selectedPeriod,
  onPeriodChange,
  showCharts,
  onShowChartsChange,
  comparisonEnabled,
  onComparisonChange,
  selectedSources,
  onBulkDelete,
  onExportReport,
  onOpenAnalytics,
}: InventoryFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fontes de emissão..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAnalytics}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExportReport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Período:</span>
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="show-charts"
            checked={showCharts}
            onCheckedChange={onShowChartsChange}
          />
          <label htmlFor="show-charts" className="text-sm cursor-pointer">
            Mostrar gráficos
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="comparison"
            checked={comparisonEnabled}
            onCheckedChange={onComparisonChange}
          />
          <label htmlFor="comparison" className="text-sm cursor-pointer">
            Comparação temporal
          </label>
        </div>

        {selectedSources.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir ({selectedSources.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir {selectedSources.length} fonte(s) de emissão selecionada(s)? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir Todas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
