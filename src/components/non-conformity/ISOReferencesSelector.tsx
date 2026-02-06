import { useState } from "react";
import { Search, Sparkles, FileText, ChevronDown, ChevronUp, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useISORequirements } from "@/hooks/useISORequirements";
import { ISOStandardType } from "@/services/isoRequirements";
import { ISOAISearchModal } from "./ISOAISearchModal";
import { cn } from "@/lib/utils";

const ISO_STANDARDS = [
  { id: 'ISO_9001' as ISOStandardType, label: 'ISO 9001:2015', description: 'Sistema de Gestão da Qualidade', color: 'bg-blue-500' },
  { id: 'ISO_14001' as ISOStandardType, label: 'ISO 14001:2015', description: 'Sistema de Gestão Ambiental', color: 'bg-green-500' },
  { id: 'ISO_45001' as ISOStandardType, label: 'ISO 45001:2018', description: 'Saúde e Segurança Ocupacional', color: 'bg-orange-500' },
  { id: 'ISO_39001' as ISOStandardType, label: 'ISO 39001:2012', description: 'Segurança Viária', color: 'bg-purple-500' },
];

interface ISOReferencesSelectorProps {
  selectedStandard: string | null;
  selectedClauses: string[];
  onStandardChange: (standard: string | null) => void;
  onClausesChange: (clauses: string[]) => void;
  disabled?: boolean;
  ncContext?: {
    title?: string;
    description?: string;
    category?: string;
    sector?: string;
  };
}

export function ISOReferencesSelector({
  selectedStandard,
  selectedClauses,
  onStandardChange,
  onClausesChange,
  disabled = false,
  ncContext
}: ISOReferencesSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const { requirements, isLoading } = useISORequirements(selectedStandard as ISOStandardType | null);

  const filteredRequirements = (requirements || []).filter(req =>
    req.clause_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.clause_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleClause = (clauseNumber: string) => {
    if (selectedClauses.includes(clauseNumber)) {
      onClausesChange(selectedClauses.filter(c => c !== clauseNumber));
    } else {
      onClausesChange([...selectedClauses, clauseNumber]);
    }
  };

  const handleApplyAISuggestions = (standard: string, clauses: string[]) => {
    onStandardChange(standard);
    onClausesChange(clauses);
    setIsExpanded(true);
  };

  const clearSelection = () => {
    onStandardChange(null);
    onClausesChange([]);
    setSearchTerm("");
  };

  const currentStandard = ISO_STANDARDS.find(s => s.id === selectedStandard);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Referência ISO (opcional)
        </Label>
        {selectedClauses.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedClauses.length} cláusula(s)
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={disabled}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Select
          value={selectedStandard || "none"}
          onValueChange={(v) => {
            onStandardChange(v === "none" ? null : v);
            onClausesChange([]);
            if (v !== "none") setIsExpanded(true);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione a norma ISO..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {ISO_STANDARDS.map((standard) => (
              <SelectItem key={standard.id} value={standard.id}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", standard.color)} />
                  <span>{standard.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAIModalOpen(true)}
          disabled={disabled}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Buscar com IA
        </Button>
      </div>

      {selectedStandard && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", currentStandard?.color)} />
                {currentStandard?.label} - {currentStandard?.description}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cláusulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                disabled={disabled}
              />
            </div>

            <ScrollArea className="h-[200px] rounded-md border p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : filteredRequirements && filteredRequirements.length > 0 ? (
                <div className="space-y-1">
                  {filteredRequirements.map((req) => {
                    const isSelected = selectedClauses.includes(req.clause_number);
                    return (
                      <div
                        key={req.id}
                        onClick={() => !disabled && toggleClause(req.clause_number)}
                        className={cn(
                          "flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors",
                          isSelected
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={disabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">
                              {req.clause_number}
                            </Badge>
                            <span className="font-medium text-sm truncate">
                              {req.clause_title}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {searchTerm ? "Nenhuma cláusula encontrada" : "Nenhuma cláusula disponível"}
                </div>
              )}
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}

      <ISOAISearchModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        ncContext={ncContext}
        onApply={handleApplyAISuggestions}
      />
    </div>
  );
}
