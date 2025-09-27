import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Shield, 
  Target, 
  Eye, 
  Plus, 
  TrendingUp,
  Activity,
  Users,
  FileText,
  Grid3x3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RiskManagementDashboard } from "@/components/RiskManagementDashboard";
import { ESGRisksMatrix } from "@/components/ESGRisksMatrix";
import { RiskOccurrencesList } from "@/components/RiskOccurrencesList";  
import { OpportunityMapWidget } from "@/components/OpportunityMapWidget";
import SWOTMatrix from "@/components/SWOTMatrix";
import { ESGRiskModal } from "@/components/ESGRiskModal";
import { RiskDetailsModal } from "@/components/RiskDetailsModal";
import { RiskMatrixModal } from "@/components/RiskMatrixModal";
import { ESGRisk } from "@/services/esgRisks";

// Interfaces
interface RiskMatrix {
  id: string;
  name: string;
  description: string;
  matrix_type: string;
  created_at: string;
}

interface RiskAssessment {
  id: string;
  risk_title: string;
  risk_description: string;
  category: string;
  probability: string;
  impact: string;
  risk_level: string;
  status: string;
}

export default function GestaoRiscos() {
  const { toast } = useToast();
  
  // Estado dos modais e formulários
  const [isCreateMatrixOpen, setIsCreateMatrixOpen] = useState(false);
  const [isCreateRiskOpen, setIsCreateRiskOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isRiskDetailsOpen, setIsRiskDetailsOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<ESGRisk | null>(null);
  const [selectedMatrix, setSelectedMatrix] = useState<any>(null);
  const [riskModalMode, setRiskModalMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const [newMatrixData, setNewMatrixData] = useState({
    name: '',
    description: '',
    type: 'probability_impact'
  });
  const [newRiskData, setNewRiskData] = useState({
    title: '',
    description: '',
    category: '',
    probability: '',
    impact: '',
    level: '',
    status: 'Identificado'
  });

  // Query para matrizes de risco
  const { data: riskMatrices, isLoading: matricesLoading, refetch } = useQuery({
    queryKey: ['risk-matrices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risk_matrices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RiskMatrix[];
    },
  });

  // Handlers dos modais
  const handleCreateMatrix = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Get company_id from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        toast({
          title: "Erro",
          description: "Company ID não encontrado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('risk_matrices')
        .insert([{
          name: newMatrixData.name,
          description: newMatrixData.description,
          matrix_type: newMatrixData.type,
          company_id: profile.company_id
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Matriz de risco criada com sucesso",
      });

      setIsCreateMatrixOpen(false);
      setNewMatrixData({
        name: '',
        description: '',
        type: 'probability_impact'
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar matriz de risco",
        variant: "destructive",
      });
      console.error('Error creating matrix:', error);
    }
  };

  // Handlers para ESG Risk Modal
  const handleCreateRisk = () => {
    setSelectedRisk(null);
    setRiskModalMode('create');
    setIsRiskModalOpen(true);
  };

  const handleEditRisk = (risk: ESGRisk) => {
    setSelectedRisk(risk);
    setRiskModalMode('edit');
    setIsRiskModalOpen(true);
  };

  const handleViewRisk = (risk: ESGRisk) => {
    setSelectedRisk(risk);
    setIsRiskDetailsOpen(true);
  };

  const handleViewMatrix = (matrix: any) => {
    setSelectedMatrix(matrix);
    setIsMatrixModalOpen(true);
  };

  const handleCloseRiskModal = () => {
    setIsRiskModalOpen(false);
    setSelectedRisk(null);
  };

  const handleCloseDetailsModal = () => {
    setIsRiskDetailsOpen(false);
    setSelectedRisk(null);
  };

  const handleCloseMatrixModal = () => {
    setIsMatrixModalOpen(false);
    setSelectedMatrix(null);
  };

  const handleEditFromDetails = () => {
    setIsRiskDetailsOpen(false);
    setRiskModalMode('edit');
    setIsRiskModalOpen(true);
  };

  // Funções utilitárias
  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'crítico': return 'bg-red-100 text-red-800 border-red-200';
      case 'alto': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'médio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixo': return 'bg-green-100 text-green-800 border-green-200';
      case 'muito baixo': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatrixTypeIcon = (type: string) => {
    switch (type) {
      case 'Estratégico': return <TrendingUp className="h-4 w-4" />;
      case 'Operacional': return <Shield className="h-4 w-4" />;
      case 'Financeiro': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (matricesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Riscos</h1>
          <p className="text-muted-foreground mt-2">
            Identifique, avalie e gerencie os riscos da sua organização
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateMatrixOpen} onOpenChange={setIsCreateMatrixOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Matriz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Matriz de Risco</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="matrix-name">Nome da Matriz</Label>
                  <Input
                    id="matrix-name"
                    value={newMatrixData.name}
                    onChange={(e) => setNewMatrixData({...newMatrixData, name: e.target.value})}
                    placeholder="Ex: Riscos Operacionais 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="matrix-type">Tipo da Matriz</Label>
                  <Select
                    value={newMatrixData.type}
                    onValueChange={(value) => setNewMatrixData({...newMatrixData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Estratégico">Estratégico</SelectItem>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="matrix-description">Descrição</Label>
                  <Textarea
                    id="matrix-description"
                    value={newMatrixData.description}
                    onChange={(e) => setNewMatrixData({...newMatrixData, description: e.target.value})}
                    placeholder="Descrição da matriz de risco"
                  />
                </div>
                <Button onClick={handleCreateMatrix} className="w-full">
                  Criar Matriz
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleCreateRisk}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Risco
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="matrices">Matrizes de Risco</TabsTrigger>
          <TabsTrigger value="risks">Riscos Identificados</TabsTrigger>
          <TabsTrigger value="occurrences">Ocorrências</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="swot">Análise SWOT</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <RiskManagementDashboard />
        </TabsContent>

        <TabsContent value="matrices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {riskMatrices?.map((matrix) => (
              <Card key={matrix.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getMatrixTypeIcon(matrix.matrix_type)}
                    {matrix.name}
                  </CardTitle>
                  <CardDescription>{matrix.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="secondary">
                      {matrix.matrix_type}
                    </Badge>
                    <Badge variant="default">
                      Ativa
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMatrix(matrix)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Riscos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!riskMatrices?.length && (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma matriz de risco</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira matriz para começar a gestão de riscos
                  </p>
                  <Button onClick={() => setIsCreateMatrixOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Matriz
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <ESGRisksMatrix 
            onEditRisk={handleEditRisk}
            onCreateRisk={handleCreateRisk}
            onViewRisk={handleViewRisk}
          />
        </TabsContent>

        <TabsContent value="occurrences" className="space-y-6">
          <RiskOccurrencesList />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <OpportunityMapWidget />
        </TabsContent>

        <TabsContent value="swot" className="space-y-6">
          <SWOTMatrix />
        </TabsContent>
      </Tabs>

      {/* ESG Risk Modal */}
      <ESGRiskModal
        isOpen={isRiskModalOpen}
        onClose={handleCloseRiskModal}
        risk={selectedRisk}
        mode={riskModalMode}
      />

      {/* Risk Details Modal */}
      <RiskDetailsModal
        isOpen={isRiskDetailsOpen}
        onClose={handleCloseDetailsModal}
        risk={selectedRisk}
        onEdit={handleEditFromDetails}
      />

      {/* Risk Matrix Modal */}
      <RiskMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={handleCloseMatrixModal}
        matrixId={selectedMatrix?.id}
        matrixName={selectedMatrix?.name}
        onViewRisk={handleViewRisk}
      />

      {/* Modal para Identificar Novo Risco - Mantido para compatibilidade */}
      <Dialog open={isCreateRiskOpen} onOpenChange={setIsCreateRiskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Identificar Novo Risco</DialogTitle>
            <DialogDescription>
              Use o modal completo para criar riscos ESG detalhados
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Para criar riscos ESG com todos os detalhes necessários, use o novo modal completo.
            </p>
            <Button onClick={() => {
              setIsCreateRiskOpen(false);
              handleCreateRisk();
            }}>
              Abrir Modal Completo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}