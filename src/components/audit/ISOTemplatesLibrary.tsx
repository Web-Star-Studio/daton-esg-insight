import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ISO_TEMPLATES, ISOTemplate } from "@/data/isoTemplates";
import { FileText, Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ISOTemplatesLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onTemplateImported?: () => void;
}

export function ISOTemplatesLibrary({ open, onOpenChange, companyId, onTemplateImported }: ISOTemplatesLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const filteredTemplates = ISO_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.standard.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const importTemplateMutation = useMutation({
    mutationFn: async (template: ISOTemplate) => {
      const { data, error } = await supabase
        .from('audit_checklists')
        .insert({
          company_id: companyId,
          name: template.name,
          standard: template.standard,
          version: template.version,
          clause_reference: template.clause_reference,
          questions: template.questions,
          is_template: false,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-checklists', companyId] });
      toast.success('Template importado com sucesso');
      onOpenChange(false);
      onTemplateImported?.();
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast.error('Erro ao importar template: ' + (error as Error).message);
    },
  });

  const handleImport = (template: ISOTemplate) => {
    setSelectedTemplate(template.id);
    importTemplateMutation.mutate(template);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Biblioteca de Templates ISO
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates por norma, nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.standard}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Cláusula {template.clause_reference}
                          </Badge>
                        </div>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {template.questions.length} perguntas
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleImport(template)}
                        disabled={importTemplateMutation.isPending && selectedTemplate === template.id}
                      >
                        {importTemplateMutation.isPending && selectedTemplate === template.id ? (
                          <>Importando...</>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Importar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum template encontrado</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
