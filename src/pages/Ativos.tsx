import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  Activity
} from "lucide-react";
import { getAssetsHierarchy, getAssetById, Asset, AssetWithLinkedData } from "@/services/assets";
import { AssetFormModal } from "@/components/AssetFormModal";

const getAssetTypeIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'Edificação': Building2,
    'Equipamento Estacionário': Cog,
    'Veículo': Car,
    'Frota': Truck,
    'Sistema': Server,
    'Infraestrutura': Network
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
}

function AssetTreeItem({ 
  asset, 
  level, 
  selectedAssetId, 
  onSelectAsset, 
  expandedNodes, 
  onToggleExpanded 
}: AssetTreeItemProps) {
  const hasChildren = asset.children && asset.children.length > 0;
  const isExpanded = expandedNodes.has(asset.id);
  const isSelected = selectedAssetId === asset.id;

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
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetDetailsPanel({ assetId }: { assetId: string }) {
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
        <div className="flex items-center gap-3 mb-2">
          <span className="text-primary">
            {getAssetTypeIcon(assetDetails.asset_type)}
          </span>
          <h2 className="text-2xl font-semibold">{assetDetails.name}</h2>
          <Badge variant="secondary">{assetDetails.asset_type}</Badge>
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
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fontes de Emissão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {assetDetails.kpis.total_emissions}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {assetDetails.kpis.active_licenses}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Registros de Resíduos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {assetDetails.kpis.waste_records}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Descrição */}
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
            <h1 className="text-3xl font-bold">Gestão de Ativos Operacionais</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os ativos físicos da empresa
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
                <AssetDetailsPanel assetId={selectedAssetId} />
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

        {/* Modal de Criação de Ativo */}
        <AssetFormModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Recarregar dados será feito automaticamente pelo React Query
          }}
        />
      </div>
    </MainLayout>
  );
}