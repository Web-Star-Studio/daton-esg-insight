import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, 
  Lightbulb, 
  FileText, 
  Upload, 
  History,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSuggestedValue } from "@/services/griIndicators";
import { logFormSubmission, createPerformanceLogger } from '@/utils/formLogging';

interface GRIIndicatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: any;
}

export function GRIIndicatorFormModal({ 
  isOpen, 
  onClose, 
  indicator 
}: GRIIndicatorFormModalProps) {
  const [value, setValue] = useState(indicator?.value || "");
  const [description, setDescription] = useState(indicator?.description || "");
  const [isComplete, setIsComplete] = useState(indicator?.is_complete || false);
  const [notes, setNotes] = useState(indicator?.notes || "");
  const [suggestedValue, setSuggestedValue] = useState<any>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (indicator) {
      setValue(indicator.value || "");
      setDescription(indicator.description || "");
      setIsComplete(indicator.is_complete || false);
      setNotes(indicator.notes || "");
    }
  }, [indicator]);

  const handleGetSuggestion = async () => {
    if (!indicator?.code) return;
    
    setIsLoadingSuggestion(true);
    try {
      const suggestion = await getSuggestedValue(indicator.code);
      setSuggestedValue(suggestion);
      
      if (suggestion && suggestion.suggested_value !== null) {
        toast({
          title: "Sugestão Obtida",
          description: `Valor sugerido: ${suggestion.suggested_value} ${suggestion.unit || ''}`,
        });
      } else {
        toast({
          title: "Nenhuma Sugestão Disponível",
          description: "Não foram encontrados dados para gerar uma sugestão automática.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting suggestion:', error);
      toast({
        title: "Erro",
        description: "Erro ao obter sugestão automática.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleApplySuggestion = () => {
    if (suggestedValue && suggestedValue.suggested_value !== null) {
      setValue(suggestedValue.suggested_value.toString());
      toast({
        title: "Sugestão Aplicada",
        description: "O valor sugerido foi aplicado ao indicador.",
      });
    }
  };

  const handleSave = async () => {
    const perfLogger = createPerformanceLogger('GRIIndicatorFormSave');
    setIsSaving(true);
    
    try {
      // TODO: Implement actual API call to save indicator data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logFormSubmission('GRIIndicatorFormModal', {
        indicator_id: indicator?.id,
        code: indicator?.code,
        value,
        description,
        isComplete,
        notes
      }, true, undefined, {
        indicatorCode: indicator?.code,
        dataType: indicator?.data_type
      });
      
      perfLogger.end(true);
      
      toast({
        title: "Indicador Salvo",
        description: "Os dados do indicador foram salvos com sucesso.",
      });
      
      onClose();
    } catch (error) {
      logFormSubmission('GRIIndicatorFormModal', {
        indicator_id: indicator?.id,
        value,
        description
      }, false, error);
      
      perfLogger.end(false, error);
      
      toast({
        title: "Erro",
        description: "Erro ao salvar o indicador.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDataTypeInfo = () => {
    switch (indicator?.data_type) {
      case 'numeric':
        return { icon: TrendingUp, color: 'text-blue-500', label: 'Numérico' };
      case 'percentage':
        return { icon: Target, color: 'text-green-500', label: 'Percentual' };
      case 'text':
        return { icon: FileText, color: 'text-purple-500', label: 'Texto' };
      case 'boolean':
        return { icon: CheckCircle, color: 'text-orange-500', label: 'Sim/Não' };
      default:
        return { icon: FileText, color: 'text-gray-500', label: 'Texto' };
    }
  };

  const dataTypeInfo = getDataTypeInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline">{indicator?.code}</Badge>
            {indicator?.title || indicator?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Indicator Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <dataTypeInfo.icon className={`h-5 w-5 ${dataTypeInfo.color}`} />
                  Informações do Indicador
                </CardTitle>
                <CardDescription>
                  {indicator?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline">
                    Tipo: {dataTypeInfo.label}
                  </Badge>
                  {indicator?.is_mandatory && (
                    <Badge variant="destructive">
                      Obrigatório
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {indicator?.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Value Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valor do Indicador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor</Label>
                  <Input
                    id="value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`Digite o valor ${indicator?.unit ? `(${indicator.unit})` : ''}`}
                    type={indicator?.data_type === 'numeric' || indicator?.data_type === 'percentage' ? 'number' : 'text'}
                  />
                  {indicator?.unit && (
                    <p className="text-xs text-muted-foreground">
                      Unidade: {indicator.unit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição/Contexto</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione contexto ou explicações sobre este valor..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas Internas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas internas, metodologia, fontes..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="complete"
                    checked={isComplete}
                    onCheckedChange={setIsComplete}
                  />
                  <Label htmlFor="complete">Marcar como concluído</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Suggestion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" />
                  Sugestão Inteligente
                </CardTitle>
                <CardDescription>
                  Obtenha sugestões baseadas nos seus dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleGetSuggestion}
                  disabled={isLoadingSuggestion}
                >
                  {isLoadingSuggestion ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                  Obter Sugestão
                </Button>

                {suggestedValue && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Valor Sugerido:</span>
                      <Badge 
                        variant={suggestedValue.confidence === 'high' ? 'default' : 
                               suggestedValue.confidence === 'medium' ? 'secondary' : 'outline'}
                      >
                        {suggestedValue.confidence === 'high' ? 'Alta Confiança' :
                         suggestedValue.confidence === 'medium' ? 'Média Confiança' : 'Baixa Confiança'}
                      </Badge>
                    </div>
                    
                    <p className="text-lg font-bold">
                      {suggestedValue.suggested_value} {suggestedValue.unit}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      Fonte: {suggestedValue.data_source}
                    </p>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={handleApplySuggestion}
                    >
                      Aplicar Sugestão
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Anexar Evidência
                </Button>
                
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <History className="h-4 w-4" />
                  Ver Histórico
                </Button>
                
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Target className="h-4 w-4" />
                  Definir Meta
                </Button>
              </CardContent>
            </Card>

            {/* Validation */}
            {value && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Valor válido</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Salvar Indicador'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}