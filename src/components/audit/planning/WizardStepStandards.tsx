import { useState } from "react";
import { Search, Plus, X, FileText, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useStandards } from "@/hooks/audit/useStandards";
import { AuditFormData } from "./AuditCreationWizard";

interface WizardStepStandardsProps {
  formData: AuditFormData;
  onUpdate: (data: Partial<AuditFormData>) => void;
}

export function WizardStepStandards({ formData, onUpdate }: WizardStepStandardsProps) {
  const { data: standards, isLoading } = useStandards();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStandards = standards?.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStandards = standards?.filter((s) =>
    formData.standard_ids.includes(s.id)
  );

  const toggleStandard = (standardId: string) => {
    const isSelected = formData.standard_ids.includes(standardId);
    if (isSelected) {
      onUpdate({
        standard_ids: formData.standard_ids.filter((id) => id !== standardId),
      });
    } else {
      onUpdate({
        standard_ids: [...formData.standard_ids, standardId],
      });
    }
  };

  const removeStandard = (standardId: string) => {
    onUpdate({
      standard_ids: formData.standard_ids.filter((id) => id !== standardId),
    });
  };

  return (
    <div className="space-y-4">
      {/* Selected Standards */}
      {selectedStandards && selectedStandards.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Normas Selecionadas ({selectedStandards.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedStandards.map((standard) => (
              <Badge
                key={standard.id}
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-1"
              >
                <span>{standard.code}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-destructive/20"
                  onClick={() => removeStandard(standard.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar normas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Standards List */}
      <ScrollArea className="h-[350px] pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Carregando normas...</p>
          </div>
        ) : filteredStandards?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhuma norma encontrada" : "Nenhuma norma cadastrada"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStandards?.map((standard) => {
              const isSelected = formData.standard_ids.includes(standard.id);
              return (
                <Card
                  key={standard.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => toggleStandard(standard.id)}
                >
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {standard.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {standard.code}
                            {standard.version && ` • v${standard.version}`}
                          </CardDescription>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {formData.standard_ids.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Selecione pelo menos uma norma para continuar
        </p>
      )}
    </div>
  );
}
