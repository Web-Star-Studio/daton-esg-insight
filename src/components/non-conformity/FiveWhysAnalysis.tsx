import { useState } from "react";
import { Plus, Trash2, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface WhyItem {
  pergunta: string;
  resposta: string;
  is_root_cause?: boolean;
}

interface FiveWhysAnalysisProps {
  data: WhyItem[];
  onChange: (data: WhyItem[]) => void;
  rootCause: string;
  onRootCauseChange: (value: string) => void;
}

export function FiveWhysAnalysis({ data, onChange, rootCause, onRootCauseChange }: FiveWhysAnalysisProps) {
  const addWhy = () => {
    if (data.length >= 7) return; // Max 7 whys
    
    // Pegar a resposta do último "por quê" para formar a nova pergunta
    const previousAnswer = data.length > 0 ? data[data.length - 1].resposta : "";
    
    // Formatar a pergunta baseada na resposta anterior
    const formattedQuestion = previousAnswer && previousAnswer.trim() 
      ? `Por que ${previousAnswer.trim().toLowerCase().replace(/\.$/, "")}?`
      : "Por que isso aconteceu?";
    
    onChange([
      ...data,
      {
        pergunta: formattedQuestion,
        resposta: "",
        is_root_cause: false,
      },
    ]);
  };

  const updateWhy = (index: number, field: keyof WhyItem, value: string | boolean) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    
    // Se a resposta mudou, atualizar a pergunta de TODOS os "por quês" subsequentes em cascata
    if (field === "resposta" && typeof value === "string") {
      // Atualizar o próximo baseado nesta resposta
      if (index < newData.length - 1) {
        const nextQuestion = value.trim() 
          ? `Por que ${value.trim().toLowerCase().replace(/\.$/, "")}?`
          : "Por que isso aconteceu?";
        newData[index + 1] = { ...newData[index + 1], pergunta: nextQuestion };
      }
      
      // Propagar cascata: cada item subsequente usa a resposta do anterior
      for (let i = index + 1; i < newData.length - 1; i++) {
        const prevAnswer = newData[i].resposta;
        const cascadeQuestion = prevAnswer && prevAnswer.trim()
          ? `Por que ${prevAnswer.trim().toLowerCase().replace(/\.$/, "")}?`
          : "Por que isso aconteceu?";
        newData[i + 1] = { ...newData[i + 1], pergunta: cascadeQuestion };
      }
    }
    
    // If marking as root cause, update the main root cause field
    if (field === "is_root_cause" && value === true) {
      // Unmark others
      newData.forEach((item, i) => {
        if (i !== index) item.is_root_cause = false;
      });
      onRootCauseChange(newData[index].resposta);
    }
    
    onChange(newData);
  };

  const removeWhy = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const getWhyLabel = (index: number) => {
    const labels = ["1º", "2º", "3º", "4º", "5º", "6º", "7º"];
    return labels[index] || `${index + 1}º`;
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-muted/30">
      <div className="text-center mb-4">
        <h4 className="font-medium text-lg flex items-center justify-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Análise dos 5 Porquês
        </h4>
        <p className="text-sm text-muted-foreground">
          Pergunte "Por quê?" sucessivamente até identificar a causa raiz do problema
        </p>
      </div>

      {/* Why chain */}
      <div className="space-y-4">
        {data.map((item, index) => (
          <Card 
            key={index} 
            className={`p-4 relative ${item.is_root_cause ? "ring-2 ring-primary bg-primary/5" : ""}`}
          >
            {/* Why number badge */}
            <Badge 
              className="absolute -top-2 -left-2"
              variant={item.is_root_cause ? "default" : "secondary"}
            >
              {getWhyLabel(index)} Por quê?
            </Badge>

            {item.is_root_cause && (
              <Badge className="absolute -top-2 right-2 bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Causa Raiz
              </Badge>
            )}

            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-sm">Pergunta</Label>
                <Input
                  value={item.pergunta}
                  onChange={(e) => updateWhy(index, "pergunta", e.target.value)}
                  placeholder="Por que isso aconteceu?"
                  className="mt-1"
                />
              </div>

              {/* Contexto da resposta anterior */}
              {index > 0 && data[index - 1].resposta && (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-medium">Baseado na resposta anterior:</span>
                    <br />
                    <span className="italic break-words">"{data[index - 1].resposta}"</span>
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm">Resposta</Label>
                <Textarea
                  value={item.resposta}
                  onChange={(e) => updateWhy(index, "resposta", e.target.value)}
                  placeholder="Porque..."
                  rows={5}
                  className="mt-1 min-h-[120px] resize-y"
                />
                
                {/* Preview da próxima pergunta */}
                {item.resposta && index < data.length - 1 && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Próxima pergunta será:
                    </span>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 break-words">
                      "Por que {item.resposta.trim().toLowerCase().replace(/\.$/, "")}?"
                    </p>
                  </div>
                )}
                
                {item.resposta && index >= data.length - 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Adicione mais um "Por quê?" para continuar a análise
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`root-cause-${index}`}
                    checked={item.is_root_cause}
                    onCheckedChange={(checked) => updateWhy(index, "is_root_cause", !!checked)}
                  />
                  <Label 
                    htmlFor={`root-cause-${index}`} 
                    className="text-sm cursor-pointer"
                  >
                    Esta é a causa raiz
                  </Label>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeWhy(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Arrow to next */}
            {index < data.length - 1 && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary/30" />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add more */}
      {data.length < 7 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={addWhy}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar mais um "Por quê?"
          </Button>
        </div>
      )}

      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-8">
          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            Comece a análise adicionando o primeiro "Por quê?"
          </p>
          <Button onClick={addWhy} className="gap-2">
            <Plus className="h-4 w-4" />
            Iniciar Análise
          </Button>
        </div>
      )}

      {/* Summary */}
      {data.length > 0 && (
        <div className="p-4 bg-muted rounded-lg">
          <h5 className="font-medium mb-2">Resumo da Análise</h5>
          <div className="flex flex-col gap-2 text-sm">
            <span>
              <strong>{data.length}</strong> níveis de análise
            </span>
            <span className="block">
              Causa raiz identificada:{" "}
              <strong className="text-primary break-words">
                {(() => {
                  const rootCauseAnswer = data.find(d => d.is_root_cause)?.resposta;
                  if (!rootCauseAnswer) return "Não definida";
                  return rootCauseAnswer.length > 150 
                    ? `${rootCauseAnswer.slice(0, 150)}...` 
                    : rootCauseAnswer;
                })()}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
