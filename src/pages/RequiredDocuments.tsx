import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, ArrowLeft, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getRequiredDocuments,
  createRequiredDocument,
  updateRequiredDocument,
  deleteRequiredDocument,
  weightLabels,
  RequiredDocument,
  getSupplierTypes,
  SupplierType,
} from "@/services/supplierManagementService";
import { supabase } from "@/integrations/supabase/client";

export default function RequiredDocuments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RequiredDocument | null>(null);
  const [formData, setFormData] = useState({
    document_name: "",
    weight: 3,
    description: "",
  });
  
  // Modal para ver tipos associados
  const [viewTypesDoc, setViewTypesDoc] = useState<RequiredDocument | null>(null);
  const [associatedTypes, setAssociatedTypes] = useState<SupplierType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['required-documents'],
    queryFn: getRequiredDocuments,
  });

  const { data: allTypes } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: getSupplierTypes,
  });

  const createMutation = useMutation({
    mutationFn: createRequiredDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['required-documents'] });
      toast({ title: "Documento criado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao criar documento", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RequiredDocument> }) =>
      updateRequiredDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['required-documents'] });
      toast({ title: "Documento atualizado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar documento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRequiredDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['required-documents'] });
      toast({ title: "Documento excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir documento", variant: "destructive" });
    },
  });

  const openModal = (doc?: RequiredDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        document_name: doc.document_name,
        weight: doc.weight,
        description: doc.description || "",
      });
    } else {
      setEditingDoc(null);
      setFormData({ document_name: "", weight: 3, description: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
    setFormData({ document_name: "", weight: 3, description: "" });
  };

  const handleSubmit = () => {
    if (!formData.document_name.trim()) {
      toast({ title: "Nome do documento é obrigatório", variant: "destructive" });
      return;
    }

    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getWeightBadgeColor = (weight: number) => {
    switch (weight) {
      case 1: return "bg-red-100 text-red-800";
      case 2: return "bg-orange-100 text-orange-800";
      case 3: return "bg-yellow-100 text-yellow-800";
      case 4: return "bg-blue-100 text-blue-800";
      case 5: return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Função para buscar tipos associados a um documento
  const handleViewTypes = async (doc: RequiredDocument) => {
    setViewTypesDoc(doc);
    setIsLoadingTypes(true);
    setAssociatedTypes([]);
    
    try {
      // Buscar associações na tabela supplier_document_type_requirements
      const { data: links, error } = await supabase
        .from('supplier_document_type_requirements')
        .select('supplier_type_id')
        .eq('required_document_id', doc.id);
      
      if (error) {
        console.error('Erro ao buscar tipos:', error);
        setAssociatedTypes([]);
      } else if (links && links.length > 0 && allTypes) {
        const typeIds = links.map(l => l.supplier_type_id);
        const matchedTypes = allTypes.filter(t => typeIds.includes(t.id));
        setAssociatedTypes(matchedTypes);
      } else {
        setAssociatedTypes([]);
      }
    } catch (err) {
      console.error('Erro:', err);
      setAssociatedTypes([]);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedores/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Documentação Obrigatória</h1>
              <p className="text-muted-foreground mt-1">
                Cadastre os documentos obrigatórios para qualificação de fornecedores
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
        </div>

        {/* Weight Legend */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(weightLabels).map(([weight]) => (
                <Badge key={weight} className={getWeightBadgeColor(Number(weight))}>
                  {weight}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              error={error?.message}
              retry={refetch}
              empty={!documents?.length}
              emptyMessage="Nenhum documento cadastrado"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Documento</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipos Associados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.document_name}</TableCell>
                      <TableCell>
                        <Badge className={getWeightBadgeColor(doc.weight)}>
                          {doc.weight}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {doc.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTypes(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Tipos
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(doc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Deseja excluir este documento?")) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Modal Create/Edit */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? "Editar Documento" : "Novo Documento Obrigatório"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="document_name">Nome do Documento *</Label>
                <Input
                  id="document_name"
                  value={formData.document_name}
                  onChange={(e) =>
                    setFormData({ ...formData, document_name: e.target.value })
                  }
                  placeholder="Ex: Alvará de Funcionamento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (Grau de Necessidade) *</Label>
                <Select
                  value={String(formData.weight)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, weight: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(weightLabels).map(([weight, label]) => (
                      <SelectItem key={weight} value={weight}>
                        {weight} - {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição do documento..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingDoc ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Ver Tipos Associados */}
        <Dialog open={!!viewTypesDoc} onOpenChange={() => setViewTypesDoc(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Tipos Associados ao Documento
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {viewTypesDoc && (
                <p className="text-sm text-muted-foreground mb-4">
                  Documento: <span className="font-medium text-foreground">{viewTypesDoc.document_name}</span>
                </p>
              )}
              
              {isLoadingTypes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : associatedTypes.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">
                    {associatedTypes.length} tipo(s) associado(s):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {associatedTypes.map((type) => (
                      <Badge key={type.id} variant="outline" className="text-sm">
                        {type.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Este documento não está associado a nenhum tipo de fornecedor.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewTypesDoc(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}