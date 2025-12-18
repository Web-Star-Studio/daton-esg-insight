import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodDataGrid } from "./PeriodDataGrid";
import { ExtendedQualityIndicator } from "@/services/indicatorManagement";
import { BarChart3 } from "lucide-react";

interface CollectionFormProps {
  indicators: ExtendedQualityIndicator[];
  selectedIndicatorId: string | null;
  onSelectIndicator: (id: string | null) => void;
  year: number;
}

export function CollectionForm({ 
  indicators, 
  selectedIndicatorId, 
  onSelectIndicator,
  year 
}: CollectionFormProps) {
  const selectedIndicator = indicators.find(i => i.id === selectedIndicatorId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Coleta de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="max-w-md">
              <Select 
                value={selectedIndicatorId || ""} 
                onValueChange={v => onSelectIndicator(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um indicador..." />
                </SelectTrigger>
                <SelectContent>
                  {indicators.map(ind => (
                    <SelectItem key={ind.id} value={ind.id}>
                      <div className="flex items-center gap-2">
                        {ind.code && <span className="text-muted-foreground">{ind.code}</span>}
                        <span>{ind.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedIndicator ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedIndicator.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIndicator.description || "Sem descrição"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Meta</div>
                <div className="text-2xl font-bold text-primary">
                  {selectedIndicator.target_value}
                  {selectedIndicator.unit === "percentage" && "%"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PeriodDataGrid 
              indicator={selectedIndicator}
              year={year}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Selecione um indicador acima para registrar os valores
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
