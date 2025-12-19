import { useState } from "react";
import { Check, Search, GitBranch, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useCauseAnalysis, 
  useCreateCauseAnalysis, 
  useUpdateCauseAnalysis 
} from "@/hooks/useNonConformity";
import { IshikawaDiagram } from "./IshikawaDiagram";
import { FiveWhysAnalysis } from "./FiveWhysAnalysis";
import { toast } from "sonner";

interface NCStage3CauseAnalysisProps {
  ncId: string;
  onComplete?: () => void;
}

export function NCStage3CauseAnalysis({ ncId, onComplete }: NCStage3CauseAnalysisProps) {
  const { data: causeAnalysis, isLoading } = useCauseAnalysis(ncId);
  const createMutation = useCreateCauseAnalysis();
  const updateMutation = useUpdateCauseAnalysis();

  const [analysisMethod, setAnalysisMethod] = useState<string>(causeAnalysis?.analysis_method || "root_cause");
  const [rootCause, setRootCause] = useState(causeAnalysis?.root_cause || "");
  const [ishikawaData, setIshikawaData] = useState(causeAnalysis?.ishikawa_data || {
    metodo: [],
    material: [],
    medida: [],
    maquina: [],
    mao_obra: [],
    meio_ambiente: [],
  });
  const [fiveWhysData, setFiveWhysData] = useState(causeAnalysis?.five_whys_data || []);

  const handleSave = () => {
    if (!rootCause.trim()) {
      toast.error("Defina a causa raiz identificada");
      return;
    }

    const data = {
      non_conformity_id: ncId,
      analysis_method: analysisMethod as any,
      root_cause: rootCause,
      ishikawa_data: ishikawaData,
      five_whys_data: fiveWhysData,
      similar_nc_ids: [],
      attachments: [],
    };

    if (causeAnalysis) {
      updateMutation.mutate({
        id: causeAnalysis.id,
        updates: data,
      });
    } else {
      createMutation.mutate(data as any);
    }
  };

  const handleComplete = () => {
    if (!rootCause.trim()) {
      toast.error("Defina a causa raiz antes de concluir");
      return;
    }
    handleSave();
    onComplete?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
          Análise de Causa
        </CardTitle>
        <CardDescription>
          Identifique a causa raiz do problema utilizando uma das metodologias disponíveis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method Selection */}
        <div className="space-y-3">
          <Label>Metodologia de Análise</Label>
          <RadioGroup
            value={analysisMethod}
            onValueChange={setAnalysisMethod}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="root_cause" id="root_cause" className="peer sr-only" />
              <Label
                htmlFor="root_cause"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Search className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Causa Raiz Simples</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="ishikawa" id="ishikawa" className="peer sr-only" />
              <Label
                htmlFor="ishikawa"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <GitBranch className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Diagrama de Ishikawa</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="5_whys" id="5_whys" className="peer sr-only" />
              <Label
                htmlFor="5_whys"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <HelpCircle className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">5 Porquês</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Analysis Content */}
        <Tabs value={analysisMethod} className="w-full">
          <TabsContent value="root_cause" className="mt-0">
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="root_cause_text">Descreva a causa raiz identificada</Label>
                <Textarea
                  id="root_cause_text"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Após análise, a causa raiz identificada foi..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ishikawa" className="mt-0">
            <IshikawaDiagram
              data={ishikawaData}
              onChange={setIshikawaData}
              rootCause={rootCause}
              onRootCauseChange={setRootCause}
            />
          </TabsContent>

          <TabsContent value="5_whys" className="mt-0">
            <FiveWhysAnalysis
              data={fiveWhysData}
              onChange={setFiveWhysData}
              rootCause={rootCause}
              onRootCauseChange={setRootCause}
            />
          </TabsContent>
        </Tabs>

        {/* Final Root Cause */}
        {analysisMethod !== "root_cause" && (
          <div className="p-4 border rounded-lg bg-primary/5">
            <Label htmlFor="final_root_cause" className="text-primary font-medium">
              Causa Raiz Final Identificada
            </Label>
            <Textarea
              id="final_root_cause"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Baseado na análise, a causa raiz é..."
              rows={2}
              className="mt-2"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Salvar Rascunho
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!rootCause.trim() || createMutation.isPending || updateMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Concluir Etapa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
