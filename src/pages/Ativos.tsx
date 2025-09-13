import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Building2, 
  Cog, 
  Car, 
  Truck, 
  Server, 
  Network, 
  ChevronRight,
  ChevronDown,
  Plus,
  HardDrive,
  MapPin,
  Activity,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { getAssetsHierarchy, getAssetById, deleteAsset, Asset, AssetWithLinkedData, ASSET_TYPES } from "@/services/assets";
import { AssetFormModal } from "@/components/AssetFormModal";
import { useToast } from "@/hooks/use-toast";

const getAssetTypeIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'Unidade Industrial': Building2,
    'Fonte Fixa de Combustão': Cog,
    'Chaminé/Stack': Network,
    'Sistema de Tratamento': Activity,
    'Depósito de Resíduos': HardDrive,
    'Fonte Móvel': Car,
    'Equipamento de Monitoramento': BarChart3,
    'Sistema de Controle Ambiental': Server,
    'Infraestrutura Auxiliar': Network
  };
  
  const IconComponent = iconMap[type] || HardDrive;
  return <IconComponent className="h-4 w-4" />;
};

interface AssetTreeItemProps {
  asset: Asset;
  level: number;
  selectedAssetId?: string;
  onSelectAsset: (assetId: string) => void;
  expandedNodes: Set<string>;
  onToggleExpanded: (assetId: string) => void;
  searchTerm: string;
  typeFilter: string;
}

function AssetTreeItem({ 
  asset, 
  level, 
  selectedAssetId, 
  onSelectAsset, 
  expandedNodes, 
  onToggleExpanded,
  searchTerm,
  typeFilter
}: AssetTreeItemProps) {
  const hasChildren = asset.children && asset.children.length > 0;
  const isExpanded = expandedNodes.has(asset.id);
  const isSelected = selectedAssetId === asset.id;
  
  // Filter logic
  const matchesSearch = searchTerm === "" || 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const matchesType = typeFilter === "all" || asset.asset_type === typeFilter;
  
  const isVisible = matchesSearch && matchesType;
  
  // Check if any children match the filter
  const hasMatchingChildren = hasChildren && asset.children?.some(child => 
    (searchTerm === "" || child.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (child.location && child.location.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (typeFilter === "all" || child.asset_type === typeFilter)
  );
  
  // Show if this asset matches OR if it has matching children
  const shouldShow = isVisible || hasMatchingChildren;
  
  if (!shouldShow) return null;

  return (
    <div>
      <div 
        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelectAsset(asset.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(asset.id);
            }}
            className="p-1 hover:bg-muted/50 rounded-sm"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        
        {!hasChildren && <div className="w-5" />}
        
        <span className="text-muted-foreground">
          {getAssetTypeIcon(asset.asset_type)}
        </span>
        
        <span className="text-sm font-medium truncate flex-1">
          {asset.name}
        </span>
        
        <Badge variant="outline" className="text-xs">
          {asset.asset_type}
        </Badge>
      </div>
      
      {hasChildren && isExpanded && asset.children && (
        <div>
          {asset.children.map((child) => (
            <AssetTreeItem
              key={child.id}
              asset={child}
              level={level + 1}
              selectedAssetId={selectedAssetId}
              onSelectAsset={onSelectAsset}
              expandedNodes={expandedNodes}
              onToggleExpanded={onToggleExpanded}
              searchTerm={searchTerm}
              typeFilter={typeFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetDetailsPanel({ 
  assetId, 
  onEdit, 
  onDelete 
}: { 
  assetId: string;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}) {
  const { data: assetDetails, isLoading, error } = useQuery({
    queryKey: ['asset-details', assetId],
    queryFn: () => getAssetById(assetId),
    enabled: !!assetId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !assetDetails) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Erro ao carregar detalhes do ativo
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Ativo */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-primary">
              {getAssetTypeIcon(assetDetails.asset_type)}
            </span>
            <h2 className="text-2xl font-semibold">{assetDetails.name}</h2>
            <Badge variant="secondary">{assetDetails.asset_type}</Badge>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(assetDetails)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Confirmar Exclusão
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o ativo "{assetDetails.name}"? 
                    {(assetDetails.kpis.total_emissions > 0 || 
                      assetDetails.kpis.active_licenses > 0 || 
                      assetDetails.kpis.waste_records > 0) && (
                      <span className="block mt-2 text-destructive font-medium">
                        Atenção: Este ativo possui dados vinculados (emissões, licenças ou resíduos).
                      </span>
                    )}
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(assetDetails.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir Ativo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {assetDetails.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{assetDetails.location}</span>
          </div>
        )}
      </div>

      {/* Abas de Detalhes */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="emissions">
            Emissões ({assetDetails.kpis.total_emissions})
          </TabsTrigger>
          <TabsTrigger value="licenses">
            Licenças ({assetDetails.kpis.active_licenses})
          </TabsTrigger>
          <TabsTrigger value="waste">
            Resíduos ({assetDetails.kpis.waste_records})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPIs Aprimorados */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500" />
                  Fontes de Emissão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {assetDetails.kpis.total_emissions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fontes ativas de GEE
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  Licenças Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {assetDetails.kpis.active_licenses}
                </div>
                <p className="text-xs text-muted-foreground">
                  De {assetDetails.linked_licenses.length} totais
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Registros de Resíduos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {assetDetails.kpis.waste_records}
                </div>
                <p className="text-xs text-muted-foreground">
                  Logs de destinação
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Status Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Licenças</span>
                    <Badge variant={assetDetails.kpis.active_licenses > 0 ? "default" : "destructive"} className="text-xs">
                      {assetDetails.kpis.active_licenses > 0 ? "OK" : "Pendente"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Emissões</span>
                    <Badge variant={assetDetails.kpis.total_emissions > 0 ? "secondary" : "outline"} className="text-xs">
                      {assetDetails.kpis.total_emissions > 0 ? "Monitorado" : "N/A"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Descrição e Informações Ambientais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {assetDetails.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{assetDetails.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informações Ambientais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assetDetails.operational_status && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status Operacional:</span>
                    <Badge variant={assetDetails.operational_status === 'Ativo' ? 'default' : 'secondary'}>
                      {assetDetails.operational_status}
                    </Badge>
                  </div>
                )}
                
                {assetDetails.pollution_potential && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Potencial Poluidor:</span>
                    <Badge variant={
                      assetDetails.pollution_potential === 'Alto' ? 'destructive' : 
                      assetDetails.pollution_potential === 'Médio' ? 'secondary' : 'outline'
                    }>
                      {assetDetails.pollution_potential}
                    </Badge>
                  </div>
                )}

                {assetDetails.productive_capacity && assetDetails.capacity_unit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Capacidade:</span>
                    <span className="text-sm">{assetDetails.productive_capacity} {assetDetails.capacity_unit}</span>
                  </div>
                )}

                {assetDetails.installation_year && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ano de Instalação:</span>
                    <span className="text-sm">{assetDetails.installation_year}</span>
                  </div>
                )}

                {assetDetails.cnae_code && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">CNAE:</span>
                    <span className="text-sm font-mono">{assetDetails.cnae_code}</span>
                  </div>
                )}

                {assetDetails.monitoring_frequency && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Freq. Monitoramento:</span>
                    <span className="text-sm">{assetDetails.monitoring_frequency}</span>
                  </div>
                )}

                {assetDetails.monitoring_responsible && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Responsável:</span>
                    <span className="text-sm">{assetDetails.monitoring_responsible}</span>
                  </div>
                )}

                {assetDetails.critical_parameters && assetDetails.critical_parameters.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Parâmetros Críticos:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assetDetails.critical_parameters.map((param, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fontes de Emissão Vinculadas</CardTitle>
              <CardDescription>
                Fontes de emissão GEE associadas a este ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assetDetails.linked_emission_sources.length > 0 ? (
                <div className="space-y-2">
                  {assetDetails.linked_emission_sources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {source.category} • Escopo {source.scope}
                        </div>
                      </div>
                      <Badge variant={source.status === 'Ativo' ? 'default' : 'secondary'}>
                        {source.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma fonte de emissão vinculada a este ativo
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Licenças Vinculadas</CardTitle>
              <CardDescription>
                Licenças ambientais associadas a este ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assetDetails.linked_licenses.length > 0 ? (
                <div className="space-y-2">
                  {assetDetails.linked_licenses.map((license) => (
                    <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{license.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {license.type} • {license.issuing_body}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vence em: {new Date(license.expiration_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Badge variant={license.status === 'Ativa' ? 'default' : 'secondary'}>
                        {license.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma licença vinculada a este ativo
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Resíduos</CardTitle>
              <CardDescription>
                Registros de resíduos gerados por este ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assetDetails.linked_waste_logs.length > 0 ? (
                <div className="space-y-2">
                  {assetDetails.linked_waste_logs.map((waste) => (
                    <div key={waste.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">MTR: {waste.mtr_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {waste.waste_description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {waste.quantity} {waste.unit} • {new Date(waste.collection_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Badge variant={waste.status === 'Tratado' ? 'default' : 'secondary'}>
                        {waste.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum registro de resíduo vinculado a este ativo
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Ativos() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteAssetMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ativo excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['assets-hierarchy'] });
      setSelectedAssetId(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Erro", 
        description: error.message || "Erro ao excluir ativo",
        variant: "destructive",
      });
    }
  });

  const handleDeleteAsset = (assetId: string) => {
    deleteAssetMutation.mutate(assetId);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
  };

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['assets-hierarchy'],
    queryFn: getAssetsHierarchy
  });

  const handleToggleExpanded = (assetId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedNodes(newExpanded);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Ativos Ambientais</h1>
            <p className="text-muted-foreground">
              Gerencie ativos operacionais com foco em controle ambiental, emissões, licenças e resíduos
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Ativo
          </Button>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* Coluna Esquerda - Hierarquia de Ativos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Hierarquia de Ativos
              </CardTitle>
              <CardDescription>
                Selecione um ativo para ver os detalhes
              </CardDescription>
              
              {/* Filtros */}
              <div className="space-y-3 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ativos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {isLoading && (
                  <div className="space-y-2 p-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                )}
                
                {error && (
                  <div className="text-center text-muted-foreground p-8">
                    Erro ao carregar ativos
                  </div>
                )}
                
                {assets && assets.length > 0 && (
                  <div className="p-2">
                    {assets.map((asset) => (
                      <AssetTreeItem
                        key={asset.id}
                        asset={asset}
                        level={0}
                        selectedAssetId={selectedAssetId}
                        onSelectAsset={setSelectedAssetId}
                        expandedNodes={expandedNodes}
                        onToggleExpanded={handleToggleExpanded}
                        searchTerm={searchTerm}
                        typeFilter={typeFilter}
                      />
                    ))}
                  </div>
                )}
                
                {assets && assets.length === 0 && (
                  <div className="text-center text-muted-foreground p-8">
                    <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ativo encontrado</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Criar primeiro ativo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coluna Direita - Detalhes do Ativo */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {selectedAssetId ? (
                <AssetDetailsPanel 
                  assetId={selectedAssetId} 
                  onEdit={handleEditAsset}
                  onDelete={handleDeleteAsset}
                />
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  <HardDrive className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Selecione um ativo</h3>
                  <p>Escolha um ativo à esquerda para visualizar seus detalhes e dados vinculados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Criação/Edição de Ativo */}
        <AssetFormModal
          open={showCreateModal || !!editingAsset}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAsset(undefined);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingAsset(undefined);
          }}
          editingAsset={editingAsset}
        />
      </div>
    </MainLayout>
  );
}