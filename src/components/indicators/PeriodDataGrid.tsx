import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { ExtendedQualityIndicator, useSavePeriodData } from "@/services/indicatorManagement";
import { useToast } from "@/hooks/use-toast";

interface PeriodDataGridProps {
  indicator: ExtendedQualityIndicator;
  year: number;
}

const MONTHS = [
  { num: 1, label: "JAN", name: "Janeiro" },
  { num: 2, label: "FEV", name: "Fevereiro" },
  { num: 3, label: "MAR", name: "Março" },
  { num: 4, label: "ABR", name: "Abril" },
  { num: 5, label: "MAI", name: "Maio" },
  { num: 6, label: "JUN", name: "Junho" },
  { num: 7, label: "JUL", name: "Julho" },
  { num: 8, label: "AGO", name: "Agosto" },
  { num: 9, label: "SET", name: "Setembro" },
  { num: 10, label: "OUT", name: "Outubro" },
  { num: 11, label: "NOV", name: "Novembro" },
  { num: 12, label: "DEZ", name: "Dezembro" },
];

type PeriodValues = Record<number, { value: string; observation: string }>;

export function PeriodDataGrid({ indicator, year }: PeriodDataGridProps) {
  const { toast } = useToast();
  const savePeriodData = useSavePeriodData();
  
  // Initialize values from existing period_data
  const [values, setValues] = useState<PeriodValues>(() => {
    const initial: PeriodValues = {};
    MONTHS.forEach(m => {
      const existingData = indicator.period_data?.find(pd => pd.month === m.num && pd.year === year);
      initial[m.num] = {
        value: existingData?.measured_value?.toString() || "",
        observation: existingData?.observation || "",
      };
    });
    return initial;
  });

  const [saving, setSaving] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const getStatus = (value: number) => {
    const target = indicator.target_value || 0;
    const tolerance = indicator.tolerance_value || 5;
    const direction = indicator.direction || "higher_better";
    
    const lowerLimit = target * (1 - tolerance / 100);
    const upperLimit = target * (1 + tolerance / 100);

    if (direction === "higher_better") {
      if (value >= target) return "on_target";
      if (value >= lowerLimit) return "warning";
      return "critical";
    } else if (direction === "lower_better") {
      if (value <= target) return "on_target";
      if (value <= upperLimit) return "warning";
      return "critical";
    } else {
      if (value >= lowerLimit && value <= upperLimit) return "on_target";
      return "critical";
    }
  };

  const getStatusBadge = (value: string) => {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    
    const status = getStatus(numValue);
    
    const config = {
      on_target: { label: "No Alvo", icon: CheckCircle2, className: "bg-green-500/10 text-green-600 border-green-500/20" },
      warning: { label: "Atenção", icon: AlertTriangle, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
      critical: { label: "Crítico", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
    }[status];

    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleSave = async (month: number) => {
    const data = values[month];
    if (!data.value) return;

    setSaving(month);
    try {
      const numValue = parseFloat(data.value);
      const status = getStatus(numValue);

      await savePeriodData.mutateAsync({
        indicator_id: indicator.id,
        period_year: year,
        period_month: month,
        measured_value: numValue,
        notes: data.observation,
        status,
      });

      toast({
        title: "Valor salvo",
        description: `Valor de ${MONTHS.find(m => m.num === month)?.name} salvo com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o valor.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const updateValue = (month: number, field: "value" | "observation", val: string) => {
    setValues(prev => ({
      ...prev,
      [month]: { ...prev[month], [field]: val }
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {MONTHS.map(month => {
          const data = values[month.num];
          const existingData = indicator.period_data?.find(pd => pd.month === month.num && pd.year === year);
          
          return (
            <div 
              key={month.num}
              className={`border rounded-lg p-3 transition-all ${
                expandedMonth === month.num ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{month.label}</span>
                {getStatusBadge(data.value)}
              </div>
              
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={data.value}
                  onChange={e => updateValue(month.num, "value", e.target.value)}
                  className="h-8 text-sm"
                />
                
                {expandedMonth === month.num && (
                  <Textarea
                    placeholder="Observação..."
                    value={data.observation}
                    onChange={e => updateValue(month.num, "observation", e.target.value)}
                    className="text-sm resize-none"
                    rows={2}
                  />
                )}
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => setExpandedMonth(expandedMonth === month.num ? null : month.num)}
                  >
                    {expandedMonth === month.num ? "Menos" : "Obs."}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7"
                    onClick={() => handleSave(month.num)}
                    disabled={!data.value || saving === month.num}
                  >
                    {saving === month.num ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <span className="text-sm text-muted-foreground">Meses coletados:</span>
          <span className="font-bold ml-2">
            {Object.values(values).filter(v => v.value).length} / 12
          </span>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Média:</span>
          <span className="font-bold ml-2">
            {(() => {
              const nums = Object.values(values)
                .map(v => parseFloat(v.value))
                .filter(n => !isNaN(n));
              if (nums.length === 0) return "-";
              const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
              return avg.toFixed(2);
            })()}
            {indicator.unit === "percentage" && "%"}
          </span>
        </div>
      </div>
    </div>
  );
}
