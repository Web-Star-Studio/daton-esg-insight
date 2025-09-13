import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileImage } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportFactors } from "@/services/factorExport";
import { EmissionFactor } from "@/services/emissionFactors";

interface ExportFactorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factors: EmissionFactor[];
  filteredFactors: EmissionFactor[];
}

interface ExportConfig {
  format: "csv" | "xlsx" | "pdf";
  includeSystemFactors: boolean;
  includeCustomFactors: boolean;
  useFilteredData: boolean;
  columns: string[];
  groupBy?: string;
}

const availableColumns = [
  { id: "name", label: "Nome" },
  { id: "category", label: "Categoria" },
  { id: "activity_unit", label: "Unidade" },
  { id: "co2_factor", label: "Fator CO₂" },
  { id: "ch4_factor", label: "Fator CH₄" },
  { id: "n2o_factor", label: "Fator N₂O" },
  { id: "source", label: "Fonte" },
  { id: "year_of_validity", label: "Ano de Validade" },
  { id: "type", label: "Tipo" },
  { id: "created_at", label: "Data de Criação" },
];

export function ExportFactorsModal({ open, onOpenChange, factors, filteredFactors }: ExportFactorsModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const [config, setConfig] = useState<ExportConfig>({
    format: "csv",
    includeSystemFactors: true,
    includeCustomFactors: true,
    useFilteredData: false,
    columns: ["name", "category", "activity_unit", "co2_factor", "ch4_factor", "n2o_factor", "source"],
    groupBy: undefined,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Determine which data to export
      const dataToExport = config.useFilteredData ? filteredFactors : factors;
      
      // Filter by factor types
      const filteredByType = dataToExport.filter(factor => {
        if (!config.includeSystemFactors && factor.type === 'system') return false;
        if (!config.includeCustomFactors && factor.type === 'custom') return false;
        return true;
      });

      if (filteredByType.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Selecione pelo menos um tipo de fator para exportar.",
          variant: "destructive",
        });
        return;
      }

      await exportFactors(filteredByType, config);
      
      toast({
        title: "Exportação Concluída",
        description: `${filteredByType.length} fatores exportados em formato ${config.format.toUpperCase()}.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na Exportação",
        description: "Falha ao gerar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleColumn = (columnId: string) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.includes(columnId) 
        ? prev.columns.filter(id => id !== columnId)
        : [...prev.columns, columnId]
    }));
  };

  const getDataPreview = () => {
    const dataToExport = config.useFilteredData ? filteredFactors : factors;
    return dataToExport.filter(factor => {
      if (!config.includeSystemFactors && factor.type === 'system') return false;
      if (!config.includeCustomFactors && factor.type === 'custom') return false;
      return true;
    });
  };

  const previewData = getDataPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Exportar Biblioteca de Fatores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Formato de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={config.format}
                onValueChange={(value: "csv" | "xlsx" | "pdf") => 
                  setConfig(prev => ({ ...prev, format: value }))
                }
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    CSV
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx" className="flex items-center cursor-pointer">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                    <FileImage className="mr-2 h-4 w-4" />
                    PDF
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Data Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Seleção de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filtered"
                  checked={config.useFilteredData}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, useFilteredData: checked as boolean }))
                  }
                />
                <Label htmlFor="filtered">
                  Usar apenas dados filtrados ({filteredFactors.length} fatores)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="system"
                  checked={config.includeSystemFactors}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeSystemFactors: checked as boolean }))
                  }
                />
                <Label htmlFor="system">Incluir fatores do sistema</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom"
                  checked={config.includeCustomFactors}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeCustomFactors: checked as boolean }))
                  }
                />
                <Label htmlFor="custom">Incluir fatores customizados</Label>
              </div>

              {config.format !== "pdf" && (
                <div className="space-y-2">
                  <Label>Agrupar por categoria:</Label>
                  <Select
                    value={config.groupBy || "none"}
                    onValueChange={(value) => 
                      setConfig(prev => ({ ...prev, groupBy: value === "none" ? undefined : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem agrupamento</SelectItem>
                      <SelectItem value="category">Por categoria</SelectItem>
                      <SelectItem value="type">Por tipo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column Selection */}
          {config.format !== "pdf" && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Colunas para Exportar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {availableColumns.map(column => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={config.columns.includes(column.id)}
                        onCheckedChange={() => toggleColumn(column.id)}
                      />
                      <Label htmlFor={column.id}>{column.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Prévia da Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <span className="font-medium">{previewData.length}</span> fatores serão exportados</p>
                <p>• Sistema: <span className="font-medium">
                  {previewData.filter(f => f.type === 'system').length}
                </span></p>
                <p>• Customizados: <span className="font-medium">
                  {previewData.filter(f => f.type === 'custom').length}
                </span></p>
                {config.format !== "pdf" && (
                  <p>• <span className="font-medium">{config.columns.length}</span> colunas selecionadas</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting || previewData.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}