import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, ChevronRight, AlertTriangle, Save, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSaveResponse, useItemResponse } from "@/hooks/audit/useExecution";
import { AttachmentManager } from "./AttachmentManager";

interface SessionItem {
  id: string;
  standard_item_id: string;
  display_order: number | null;
  item_snapshot: any;
}

interface ItemResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  companyId: string;
  sessionItems: SessionItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onCreateOccurrence: (sessionItemId: string) => void;
  responseTypeId?: string;
}

export function ItemResponseModal({
  open,
  onOpenChange,
  auditId,
  companyId,
  sessionItems,
  currentIndex,
  onNavigate,
  onCreateOccurrence,
  responseTypeId,
}: ItemResponseModalProps) {
  const currentItem = sessionItems[currentIndex];
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [observations, setObservations] = useState("");

  const saveResponse = useSaveResponse();

  // Get existing response
  const { data: existingResponse } = useItemResponse(currentItem?.id || "");

  // Get response options
  const { data: responseOptions } = useQuery({
    queryKey: ['response-options', responseTypeId],
    queryFn: async () => {
      if (!responseTypeId) return [];
      const { data, error } = await supabase
        .from('audit_response_options')
        .select('*')
        .eq('response_type_id', responseTypeId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!responseTypeId,
  });

  // Load existing response into form
  useEffect(() => {
    if (existingResponse) {
      setSelectedOption(existingResponse.response_option_id || "");
      setJustification(existingResponse.justification || "");
      setStrengths(existingResponse.strengths || "");
      setWeaknesses(existingResponse.weaknesses || "");
      setObservations(existingResponse.observations || "");
    } else {
      setSelectedOption("");
      setJustification("");
      setStrengths("");
      setWeaknesses("");
      setObservations("");
    }
  }, [existingResponse, currentItem?.id]);

  if (!currentItem) return null;

  const itemData = currentItem.item_snapshot || {};
  const requiresJustification = responseOptions?.find(o => o.id === selectedOption)?.triggers_occurrence;

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await saveResponse.mutateAsync({
      session_item_id: currentItem.id,
      audit_id: auditId,
      company_id: companyId,
      response_option_id: selectedOption || null,
      response_value: null,
      justification,
      strengths,
      weaknesses,
      observations,
      responded_by: user?.id || null,
      responded_at: new Date().toISOString(),
    });
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    if (currentIndex < sessionItems.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Item {currentIndex + 1} de {sessionItems.length}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentIndex === 0}
                onClick={() => onNavigate(currentIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={currentIndex === sessionItems.length - 1}
                onClick={() => onNavigate(currentIndex + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Info */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                {itemData.item_number || 'N/A'}
              </span>
              <h3 className="font-medium">{itemData.title || 'Item sem título'}</h3>
            </div>
            {itemData.description && (
              <p className="text-sm text-muted-foreground">{itemData.description}</p>
            )}
            {itemData.guidance_text && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                {itemData.guidance_text}
              </p>
            )}
          </div>

          {/* Response Options */}
          {responseOptions && responseOptions.length > 0 && (
            <div className="space-y-3">
              <Label>Resposta</Label>
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                <div className="grid grid-cols-2 gap-2">
                  {responseOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedOption === option.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedOption(option.id)}
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="cursor-pointer flex items-center gap-2">
                        {option.color_hex && (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: option.color_hex }}
                          />
                        )}
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">
              Justificativa {requiresJustification && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Descreva a justificativa para esta resposta..."
              rows={3}
            />
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strengths">Pontos Fortes</Label>
              <Textarea
                id="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Pontos positivos identificados..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weaknesses">Pontos Fracos</Label>
              <Textarea
                id="weaknesses"
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                placeholder="Pontos de melhoria identificados..."
                rows={3}
              />
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          {/* Attachments */}
          {existingResponse && (
            <AttachmentManager
              responseId={existingResponse.id}
              auditId={auditId}
              companyId={companyId}
            />
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => onCreateOccurrence(currentItem.id)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Registrar Ocorrência
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveResponse.isPending}
          >
            {saveResponse.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
          <Button
            onClick={handleSaveAndNext}
            disabled={saveResponse.isPending || currentIndex === sessionItems.length - 1}
          >
            Salvar e Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
