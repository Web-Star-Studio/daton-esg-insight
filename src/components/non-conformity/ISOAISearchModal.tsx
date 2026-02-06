import { useState } from "react";
import { Sparkles, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ISOSuggestion {
  standard: string;
  clause_number: string;
  clause_title?: string;
  confidence: number;
}

interface ISOAISearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ncContext?: {
    title?: string;
    description?: string;
    category?: string;
    sector?: string;
  };
  onApply: (standard: string, clauses: string[]) => void;
}

const ISO_STANDARD_LABELS: Record<string, { label: string; color: string }> = {
  'ISO_9001': { label: 'ISO 9001:2015', color: 'bg-blue-500' },
  'ISO_14001': { label: 'ISO 14001:2015', color: 'bg-green-500' },
  'ISO_45001': { label: 'ISO 45001:2018', color: 'bg-orange-500' },
  'ISO_39001': { label: 'ISO 39001:2012', color: 'bg-purple-500' },
};

export function ISOAISearchModal({
  open,
  onOpenChange,
  ncContext,
  onApply
}: ISOAISearchModalProps) {
  const [description, setDescription] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<ISOSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const searchText = description.trim() || 
      [ncContext?.title, ncContext?.description].filter(Boolean).join(". ");

    if (!searchText) {
      toast.error("Por favor, descreva o problema ou preencha o título/descrição da NC");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("nc-iso-suggestions", {
        body: {
          description: searchText,
          context: {
            title: ncContext?.title,
            category: ncContext?.category,
            sector: ncContext?.sector
          }
        }
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        // Auto-select all suggestions by default
        const allKeys = data.suggestions.map((s: ISOSuggestion) => `${s.standard}:${s.clause_number}`);
        setSelectedSuggestions(new Set(allKeys));
      }
      setHasSearched(true);
    } catch (error: any) {
      console.error("Erro ao buscar sugestões ISO:", error);
      if (error.message?.includes("429") || error.message?.includes("Rate limit")) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
      } else if (error.message?.includes("402")) {
        toast.error("Créditos de IA esgotados. Entre em contato com o suporte.");
      } else {
        toast.error("Erro ao buscar sugestões de ISO. Tente novamente.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSuggestion = (standard: string, clauseNumber: string) => {
    const key = `${standard}:${clauseNumber}`;
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleApply = () => {
    if (selectedSuggestions.size === 0) {
      toast.error("Selecione pelo menos uma sugestão");
      return;
    }

    // Get the first selected standard (assuming single standard for simplicity)
    const selectedItems = Array.from(selectedSuggestions).map(key => {
      const [standard, clause] = key.split(":");
      return { standard, clause };
    });

    // Group by standard and get the most common one
    const standardCounts = selectedItems.reduce((acc, item) => {
      acc[item.standard] = (acc[item.standard] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primaryStandard = Object.entries(standardCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    const clauses = selectedItems
      .filter(item => item.standard === primaryStandard)
      .map(item => item.clause);

    onApply(primaryStandard, clauses);
    onOpenChange(false);
    
    // Reset state
    setDescription("");
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setHasSearched(false);
    
    toast.success(`${clauses.length} cláusula(s) aplicada(s)`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setDescription("");
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setHasSearched(false);
  };

  // Group suggestions by standard
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.standard]) {
      acc[suggestion.standard] = [];
    }
    acc[suggestion.standard].push(suggestion);
    return acc;
  }, {} as Record<string, ISOSuggestion[]>);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Buscar Referência ISO com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o problema ou contexto da não conformidade para receber sugestões de cláusulas ISO relevantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nc-description">Descrição do problema</Label>
            <Textarea
              id="nc-description"
              placeholder="Ex: Falta de treinamento documentado para operadores de empilhadeira..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSearching}
            />
            {ncContext?.title && (
              <p className="text-xs text-muted-foreground">
                💡 Se deixar em branco, usaremos o título e descrição já preenchidos na NC.
              </p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Buscar Sugestões
              </>
            )}
          </Button>

          {hasSearched && suggestions.length === 0 && (
            <Alert>
              <AlertDescription>
                Nenhuma sugestão encontrada para a descrição fornecida. Tente ser mais específico sobre o problema.
              </AlertDescription>
            </Alert>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Sugestões encontradas</Label>
                <Badge variant="secondary">
                  {selectedSuggestions.size} selecionada(s)
                </Badge>
              </div>

              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-2 space-y-4">
                  {Object.entries(groupedSuggestions).map(([standard, items]) => {
                    const standardInfo = ISO_STANDARD_LABELS[standard];
                    return (
                      <div key={standard} className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <div className={cn("w-2 h-2 rounded-full", standardInfo?.color || "bg-gray-500")} />
                          <span className="font-medium text-sm">
                            {standardInfo?.label || standard}
                          </span>
                        </div>
                        <div className="space-y-1 ml-4">
                          {items.map((suggestion) => {
                            const key = `${suggestion.standard}:${suggestion.clause_number}`;
                            const isSelected = selectedSuggestions.has(key);
                            return (
                              <div
                                key={key}
                                onClick={() => toggleSuggestion(suggestion.standard, suggestion.clause_number)}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-primary/10 border border-primary/20"
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {suggestion.clause_number}
                                  </Badge>
                                  {suggestion.clause_title && (
                                    <span className="text-sm truncate max-w-[150px]">
                                      {suggestion.clause_title}
                                    </span>
                                  )}
                                </div>
                                <span className={cn("text-xs font-medium", getConfidenceColor(suggestion.confidence))}>
                                  {suggestion.confidence}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleApply}
                  disabled={selectedSuggestions.size === 0}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aplicar Selecionadas
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
