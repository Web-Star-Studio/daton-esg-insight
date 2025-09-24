import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StakeholderModal } from "@/components/StakeholderModal";
import StakeholderEngagementMatrix from "@/components/StakeholderEngagementMatrix";
import StakeholderAnalyticsDashboard from "@/components/StakeholderAnalyticsDashboard";
import StakeholderCommunicationHub from "@/components/StakeholderCommunicationHub";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  UserPlus, 
  Phone, 
  Mail, 
  Building,
  Edit,
  Trash2,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getStakeholders, 
  getStakeholderEngagementStats, 
  createStakeholder, 
  updateStakeholder, 
  deleteStakeholder,
  Stakeholder,
  STAKEHOLDER_CATEGORIES 
} from "@/services/stakeholders";

export default function GestaoStakeholders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ['stakeholders'],
    queryFn: () => getStakeholders(),
    enabled: !!user,
  });

  const { data: engagementStats } = useQuery({
    queryKey: ['stakeholder-stats'],
    queryFn: () => getStakeholderEngagementStats(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: createStakeholder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-stats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Stakeholder> }) =>
      updateStakeholder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStakeholder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-stats'] });
      toast({
        title: "Sucesso",
        description: "Stakeholder removido com sucesso",
      });
    },
  });

  const handleSave = async (stakeholderData: Omit<Stakeholder, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedStakeholder) {
      await updateMutation.mutateAsync({
        id: selectedStakeholder.id,
        updates: stakeholderData,
      });
    } else {
      await createMutation.mutateAsync(stakeholderData);
    }
    setSelectedStakeholder(null);
  };

  const handleEdit = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
    setIsModalOpen(true);
  };

  const handleDelete = async (stakeholder: Stakeholder) => {
    if (window.confirm(`Tem certeza que deseja remover ${stakeholder.name}?`)) {
      await deleteMutation.mutateAsync(stakeholder.id);
    }
  };

  const filteredStakeholders = stakeholders.filter(stakeholder => {
    const matchesSearch = stakeholder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stakeholder.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stakeholder.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || stakeholder.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getInfluenceBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getCategoryLabel = (category: string) => {
    return STAKEHOLDER_CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  const stakeholderColumns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.organization && (
              <div className="text-sm text-muted-foreground">{row.original.organization}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {getCategoryLabel(row.original.category)}
        </Badge>
      ),
    },
    {
      accessorKey: "position",
      header: "Cargo/Posição",
    },
    {
      accessorKey: "influence_level",
      header: "Influência",
      cell: ({ row }: any) => (
        <Badge variant={getInfluenceBadgeVariant(row.original.influence_level)}>
          {row.original.influence_level === 'high' ? 'Alta' : 
           row.original.influence_level === 'medium' ? 'Média' : 'Baixa'}
        </Badge>
      ),
    },
    {
      accessorKey: "interest_level",
      header: "Interesse",
      cell: ({ row }: any) => (
        <Badge variant={getInfluenceBadgeVariant(row.original.interest_level)}>
          {row.original.interest_level === 'high' ? 'Alto' : 
           row.original.interest_level === 'medium' ? 'Médio' : 'Baixo'}
        </Badge>
      ),
    },
    {
      accessorKey: "engagement_frequency",
      header: "Frequência",
      cell: ({ row }: any) => {
        const freq = row.original.engagement_frequency;
        const labels = {
          monthly: 'Mensal',
          quarterly: 'Trimestral',
          biannual: 'Semestral',
          annual: 'Anual'
        };
        return labels[freq as keyof typeof labels] || freq;
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando stakeholders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Stakeholders</h1>
          <p className="text-muted-foreground">
            Gerencie e engaje com todas as partes interessadas da organização
          </p>
        </div>
          <Button onClick={() => {
            setSelectedStakeholder(null);
            setIsModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Stakeholder
          </Button>
        </div>

        {/* Estatísticas */}
        {engagementStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total de Stakeholders</p>
                    <p className="text-2xl font-bold">{engagementStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Alta Influência/Interesse</p>
                    <p className="text-2xl font-bold">{engagementStats.highInfluenceHighInterest}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Categorias Ativas</p>
                    <p className="text-2xl font-bold">{Object.keys(engagementStats.byCategory).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Engajamento Anual</p>
                    <p className="text-2xl font-bold">{engagementStats.byEngagementFrequency.annual || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, organização ou cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {STAKEHOLDER_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stakeholder Management */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="matrix">Matriz Engajamento</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="communication">Comunicação</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Stakeholders</CardTitle>
                <CardDescription>
                  {filteredStakeholders.length} stakeholder(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Cargo/Posição</TableHead>
                      <TableHead>Influência</TableHead>
                      <TableHead>Interesse</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStakeholders.map((stakeholder) => (
                      <TableRow key={stakeholder.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{stakeholder.name}</div>
                              {stakeholder.organization && (
                                <div className="text-sm text-muted-foreground">{stakeholder.organization}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryLabel(stakeholder.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>{stakeholder.position}</TableCell>
                        <TableCell>
                          <Badge variant={getInfluenceBadgeVariant(stakeholder.influence_level)}>
                            {stakeholder.influence_level === 'high' ? 'Alta' : 
                             stakeholder.influence_level === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getInfluenceBadgeVariant(stakeholder.interest_level)}>
                            {stakeholder.interest_level === 'high' ? 'Alto' : 
                             stakeholder.interest_level === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {stakeholder.engagement_frequency === 'monthly' ? 'Mensal' :
                           stakeholder.engagement_frequency === 'quarterly' ? 'Trimestral' :
                           stakeholder.engagement_frequency === 'biannual' ? 'Semestral' : 'Anual'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(stakeholder)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(stakeholder)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matrix">
            <StakeholderEngagementMatrix />
          </TabsContent>

          <TabsContent value="analytics">
            <StakeholderAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="communication">
            <StakeholderCommunicationHub />
          </TabsContent>
        </Tabs>

        {/* Modal */}
        <StakeholderModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          stakeholder={selectedStakeholder}
          onSave={handleSave}
        />
      </>
    );
  }