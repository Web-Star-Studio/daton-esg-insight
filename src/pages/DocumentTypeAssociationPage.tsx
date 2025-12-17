import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link2, Save, FileText, Weight, Loader2 } from "lucide-react";
import { 
  getSupplierTypes, 
  getRequiredDocuments,
  getDocumentsForType,
  updateTypeDocuments,
  type SupplierType,
  type RequiredDocument
} from "@/services/supplierManagementService";

export default function DocumentTypeAssociationPage() {
  const queryClient = useQueryClient();
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch supplier types
  const { data: types = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: getSupplierTypes
  });

  // Fetch all required documents
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['required-documents'],
    queryFn: getRequiredDocuments
  });

  // Fetch current associations for selected type
  const { data: currentAssociations = [], isLoading: loadingAssociations } = useQuery({
    queryKey: ['type-documents', selectedTypeId],
    queryFn: () => getDocumentsForType(selectedTypeId),
    enabled: !!selectedTypeId
  });

  // Update selected docs when associations change
  useEffect(() => {
    if (currentAssociations.length > 0) {
      setSelectedDocIds(currentAssociations.map(a => a.required_document_id));
    } else if (selectedTypeId) {
      setSelectedDocIds([]);
    }
    setHasChanges(false);
  }, [currentAssociations, selectedTypeId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => updateTypeDocuments(selectedTypeId, selectedDocIds),
    onSuccess: () => {
      toast.success("Associações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['type-documents', selectedTypeId] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar associações: " + (error as Error).message);
    }
  });

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
  };

  const handleDocToggle = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocIds(prev => [...prev, docId]);
    } else {
      setSelectedDocIds(prev => prev.filter(id => id !== docId));
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedTypeId) {
      toast.error("Selecione um tipo de fornecedor");
      return;
    }
    saveMutation.mutate();
  };

  const activeTypes = types.filter(t => t.is_active);
  const activeDocuments = documents.filter(d => d.is_active);

  // Calculate total weight of selected documents
  const totalWeight = activeDocuments
    .filter(d => selectedDocIds.includes(d.id))
    .reduce((sum, d) => sum + d.weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Associação de Documentos por Tipo
          </h1>
          <p className="text-muted-foreground">
            Vincule quais documentos obrigatórios cada tipo de fornecedor deve apresentar
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Selector Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione um Tipo de Fornecedor</CardTitle>
            <CardDescription>
              Escolha o tipo para configurar os documentos obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTypeId} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um tipo..." />
              </SelectTrigger>
              <SelectContent>
                {loadingTypes ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : activeTypes.length === 0 ? (
                  <SelectItem value="empty" disabled>Nenhum tipo cadastrado</SelectItem>
                ) : (
                  activeTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                      {type.description && (
                        <span className="text-muted-foreground ml-2">
                          ({type.description})
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedTypeId && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Documentos selecionados:
                  </span>
                  <Badge variant="secondary">
                    {selectedDocIds.length} de {activeDocuments.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Weight className="h-4 w-4" />
                    Peso total:
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {totalWeight} pontos
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações</CardTitle>
            <CardDescription>
              Salve as alterações após configurar os documentos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button 
              onClick={handleSave} 
              disabled={!selectedTypeId || saveMutation.isPending || !hasChanges}
              className="w-full"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Associações
            </Button>

            {hasChanges && (
              <p className="text-sm text-amber-600 text-center">
                * Existem alterações não salvas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Obrigatórios
          </CardTitle>
          <CardDescription>
            Marque os documentos que este tipo de fornecedor deve apresentar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedTypeId ? (
            <div className="text-center py-8 text-muted-foreground">
              Selecione um tipo de fornecedor para ver os documentos disponíveis
            </div>
          ) : loadingDocs || loadingAssociations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum documento obrigatório cadastrado.
              <br />
              <a href="/fornecedores/documentos" className="text-primary hover:underline">
                Cadastrar documentos
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {activeDocuments.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDocIds.includes(doc.id)}
                      onCheckedChange={(checked) => handleDocToggle(doc.id, !!checked)}
                    />
                    <div>
                      <span className="font-medium">{doc.document_name}</span>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    Peso: {doc.weight}
                  </Badge>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
