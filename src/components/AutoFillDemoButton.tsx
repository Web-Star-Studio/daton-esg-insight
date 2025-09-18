import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle, Bot } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AutoFillDemoButtonProps {
  reportId?: string;
  companyId?: string;
  onUpdate?: () => void;
}

export function AutoFillDemoButton({ reportId, companyId, onUpdate }: AutoFillDemoButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleDemoAutoFill = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      // Simular processo de auto preenchimento
      const indicators = [
        { code: '2-7', name: 'Empregados', confidence: 'high' },
        { code: '2-9', name: 'Estrutura de governança', confidence: 'high' },
        { code: '305-1', name: 'Emissões diretas (Escopo 1)', confidence: 'medium' },
        { code: '305-2', name: 'Emissões indiretas (Escopo 2)', confidence: 'medium' },
        { code: '302-1', name: 'Consumo de energia', confidence: 'high' },
      ];

      let successful = 0;
      let failed = 0;

      for (let i = 0; i < indicators.length; i++) {
        const indicator = indicators[i];
        setProgress(Math.round(((i + 1) / indicators.length) * 100));
        
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
          // Tentar obter sugestão real do banco
          if (companyId) {
            const { data } = await supabase.rpc('get_indicator_suggested_value', {
              p_company_id: companyId,
              p_indicator_code: indicator.code
            });
            
            if (data && Object.keys(data).length > 0) {
              successful++;
              
              const suggestedValue = (data as any).suggested_value || 'N/A';
              const confidence = (data as any).confidence || 'unknown';
              
              toast({
                title: `${indicator.code} Preenchido`,
                description: `Valor sugerido: ${suggestedValue} (${confidence})`,
              });
            } else {
              failed++;
            }
          } else {
            // Demo sem company ID
            successful++;
            toast({
              title: `${indicator.code} Preenchido`,
              description: `Indicador preenchido com dados simulados (${indicator.confidence})`,
            });
          }
        } catch (error) {
          console.error(`Erro ao processar ${indicator.code}:`, error);
          failed++;
        }
      }

      setResults({ successful, failed, total: indicators.length });

      toast({
        title: "Auto Preenchimento Concluído",
        description: `${successful} indicadores preenchidos com sucesso de ${indicators.length} processados.`,
      });

      if (onUpdate) {
        onUpdate();
      }

    } catch (error: any) {
      console.error('Erro no auto preenchimento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro durante o auto preenchimento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setResults(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Auto Preenchimento Inteligente
          </CardTitle>
          <CardDescription>
            Use dados existentes do sistema para preencher automaticamente os indicadores GRI universais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando indicadores...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{results.successful}</p>
                <p className="text-sm text-muted-foreground">Sucessos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                <p className="text-sm text-muted-foreground">Falharam</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{results.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleDemoAutoFill}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Processando...' : 'Iniciar Auto Preenchimento'}
          </Button>

          {/* Info */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Indicadores Suportados:</strong></p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">2-7 Empregados</Badge>
              <Badge variant="outline">2-9 Governança</Badge>
              <Badge variant="outline">305-1 Escopo 1</Badge>
              <Badge variant="outline">305-2 Escopo 2</Badge>
              <Badge variant="outline">302-1 Energia</Badge>
            </div>
            <p className="text-xs">
              * Dados obtidos automaticamente de: funcionários, conselho, emissões calculadas, dados de atividade e políticas corporativas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}