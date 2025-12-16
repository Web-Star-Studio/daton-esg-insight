import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Building2, Tags, FolderTree, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getManagedSupplierById,
  getSupplierTypes,
  getSupplierCategories,
  getBusinessUnits,
  getSupplierAssignments,
  updateSupplierAssignments,
  ManagedSupplier,
  SupplierType,
  SupplierCategory,
} from "@/services/supplierManagementService";

interface BusinessUnit {
  id: string;
  name: string;
}

export default function SupplierAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCorporate, setIsCorporate] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Queries
  const { data: supplier, isLoading: loadingSupplier } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getManagedSupplierById(id!),
    enabled: !!id,
  });

  const { data: types = [] } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: getSupplierTypes,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['supplier-categories'],
    queryFn: getSupplierCategories,
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: getBusinessUnits,
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['supplier-assignments', id],
    queryFn: () => getSupplierAssignments(id!),
    enabled: !!id,
  });

  // Carregar dados existentes
  useEffect(() => {
    if (assignments) {
      setSelectedUnits(assignments.units.map(u => u.business_unit_id));
      setSelectedTypes(assignments.types.map(t => t.supplier_type_id));
      setSelectedCategories(assignments.categories.map(c => c.category_id));
      setIsCorporate(assignments.units.some(u => u.is_corporate));
    }
  }, [assignments]);

  // Auto-preencher categorias baseado nos tipos selecionados
  useEffect(() => {
    const categoriesFromTypes = types
      .filter(t => selectedTypes.includes(t.id) && t.category_id)
      .map(t => t.category_id!)
      .filter((c, i, arr) => arr.indexOf(c) === i);
    
    // Manter categorias manuais + adicionar inferidas
    setSelectedCategories(prev => {
      const newSet = new Set([...prev, ...categoriesFromTypes]);
      return Array.from(newSet);
    });
  }, [selectedTypes, types]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: () => updateSupplierAssignments(id!, {
      units: selectedUnits,
      types: selectedTypes,
      categories: selectedCategories,
      isCorporate
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-assignments', id] });
      toast({ title: "Vinculações salvas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar vinculações", variant: "destructive" });
    },
  });

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(u => u !== unitId)
        : [...prev, unitId]
    );
  };

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCorporateToggle = (checked: boolean) => {
    setIsCorporate(checked);
    if (checked) {
      setSelectedUnits(businessUnits.map(u => u.id));
    }
  };

  const getSupplierName = () => {
    if (!supplier) return "";
    return supplier.person_type === 'PJ' 
      ? supplier.company_name 
      : supplier.full_name;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "";
  };

  // Inferir categorias dos tipos selecionados
  const inferredCategoryIds = types
    .filter(t => selectedTypes.includes(t.id) && t.category_id)
    .map(t => t.category_id!)
    .filter((c, i, arr) => arr.indexOf(c) === i);

  if (loadingSupplier || loadingAssignments) {
    return (
      <MainLayout>
        <LoadingState loading={true}>
          <div />
        </LoadingState>
      </MainLayout>
    );
  }

  if (!supplier) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">Fornecedor não encontrado</p>
          <Button variant="ghost" onClick={() => navigate('/fornecedores/cadastro')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedores/cadastro')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Vinculação de Cadastro</h1>
              <p className="text-muted-foreground mt-1">
                {getSupplierName()}
                {supplier.nickname && <span className="ml-2">({supplier.nickname})</span>}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Vinculações
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Unidades de Atuação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Unidades de Atuação</CardTitle>
              </div>
              <CardDescription>
                Selecione as unidades onde este fornecedor atua
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Switch
                  id="corporate"
                  checked={isCorporate}
                  onCheckedChange={handleCorporateToggle}
                />
                <Label htmlFor="corporate" className="font-medium cursor-pointer">
                  Nível Corporativo (atende todas as unidades)
                </Label>
              </div>

              <Separator />

              {businessUnits.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhuma unidade de negócio cadastrada
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {businessUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                        selectedUnits.includes(unit.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        id={`unit-${unit.id}`}
                        checked={selectedUnits.includes(unit.id)}
                        onCheckedChange={() => handleUnitToggle(unit.id)}
                        disabled={isCorporate}
                      />
                      <Label htmlFor={`unit-${unit.id}`} className="flex-1 cursor-pointer">
                        {unit.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-sm text-muted-foreground">
                {isCorporate 
                  ? "✓ Atende todas as unidades (nível corporativo)"
                  : `${selectedUnits.length} unidade(s) selecionada(s)`
                }
              </div>
            </CardContent>
          </Card>

          {/* Tipagens */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-primary" />
                <CardTitle>Tipagens [TIP]</CardTitle>
              </div>
              <CardDescription>
                Selecione os tipos de fornecedor (permite múltiplos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {types.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhum tipo de fornecedor cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {types.filter(t => t.is_active).map((type) => (
                    <div
                      key={type.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        selectedTypes.includes(type.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={selectedTypes.includes(type.id)}
                          onCheckedChange={() => handleTypeToggle(type.id)}
                        />
                        <Label htmlFor={`type-${type.id}`} className="cursor-pointer">
                          {type.name}
                        </Label>
                      </div>
                      {type.category_id && (
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(type.category_id)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 text-sm text-muted-foreground">
                {selectedTypes.length} tipo(s) selecionado(s)
              </div>
            </CardContent>
          </Card>

          {/* Categorias */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                <CardTitle>Categorias [CAT]</CardTitle>
              </div>
              <CardDescription>
                Categorias inferidas automaticamente pelos tipos, mas você pode adicionar extras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhuma categoria cadastrada
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.filter(c => c.is_active).map((category) => {
                    const isInferred = inferredCategoryIds.includes(category.id);
                    const isSelected = selectedCategories.includes(category.id);
                    
                    return (
                      <div
                        key={category.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                          isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={`cat-${category.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label htmlFor={`cat-${category.id}`} className="flex-1 cursor-pointer text-sm">
                          {category.name}
                          {isInferred && (
                            <span className="block text-xs text-muted-foreground">
                              (inferido)
                            </span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 text-sm text-muted-foreground">
                {selectedCategories.length} categoria(s) selecionada(s)
                {inferredCategoryIds.length > 0 && (
                  <span className="ml-1">
                    ({inferredCategoryIds.length} inferida(s) dos tipos)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
