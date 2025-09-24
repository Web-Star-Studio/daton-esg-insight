import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Calendar,
  Target,
  BarChart3,
  Plus,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stakeholder {
  id: string;
  name: string;
  category: string;
  influence_level: 'low' | 'medium' | 'high';
  interest_level: 'low' | 'medium' | 'high';
  organization?: string;
  position?: string;
  contact_email?: string;
  contact_phone?: string;
  engagement_frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  last_contact_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company_id: string;
}

const StakeholderEngagementMatrix = () => {
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterInfluence, setFilterInfluence] = useState<string>('all');

  const { data: stakeholders, isLoading, refetch } = useQuery({
    queryKey: ['stakeholders-matrix'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*')
        .order('priority_level', { ascending: false });
      
      if (error) throw error;
      return data as Stakeholder[];
    },
  });

  const categories = [
    'Investidores',
    'Clientes',
    'Funcionários',
    'Comunidade',
    'Fornecedores',
    'Governo',
    'ONGs',
    'Mídia'
  ];

  const getInfluenceColor = (influence_level: string) => {
    switch (influence_level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getInterestColor = (interest_level: string) => {
    switch (interest_level) {
      case 'high': return 'bg-blue-500';
      case 'medium': return 'bg-purple-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getEngagementScoreColor = (lastContact: string | undefined) => {
    if (!lastContact) return 'text-red-600 bg-red-50';
    const daysSinceContact = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 30) return 'text-green-600 bg-green-50';
    if (daysSinceContact <= 90) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const calculateEngagementScore = (lastContact: string | undefined, frequency: string) => {
    if (!lastContact) return 0;
    const daysSinceContact = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
    const expectedDays = {
      'monthly': 30,
      'quarterly': 90,
      'biannual': 180,
      'annual': 365
    };
    const expected = expectedDays[frequency as keyof typeof expectedDays] || 90;
    return Math.max(0, Math.min(100, 100 - (daysSinceContact / expected * 100)));
  };

  const getMatrixPosition = (influence_level: string, interest_level: string) => {
    const influenceMap = { 'low': 0, 'medium': 1, 'high': 2 };
    const interestMap = { 'low': 0, 'medium': 1, 'high': 2 };
    return {
      x: influenceMap[influence_level as keyof typeof influenceMap],
      y: 2 - interestMap[interest_level as keyof typeof interestMap] // Inverted Y for visual representation
    };
  };

  const getMatrixStrategy = (influence_level: string, interest_level: string) => {
    if (influence_level === 'high' && interest_level === 'high') return 'Gerenciar de Perto';
    if (influence_level === 'high' && interest_level === 'medium') return 'Manter Satisfeito';
    if (influence_level === 'high' && interest_level === 'low') return 'Manter Satisfeito';
    if (influence_level === 'medium' && interest_level === 'high') return 'Manter Informado';
    if (influence_level === 'medium' && interest_level === 'medium') return 'Monitorar';
    if (influence_level === 'low' && interest_level === 'high') return 'Manter Informado';
    return 'Monitorar';
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'Gerenciar de Perto': return 'bg-red-100 text-red-800';
      case 'Manter Satisfeito': return 'bg-orange-100 text-orange-800';
      case 'Manter Informado': return 'bg-blue-100 text-blue-800';
      case 'Monitorar': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStakeholders = stakeholders?.filter(stakeholder => {
    const categoryMatch = filterCategory === 'all' || stakeholder.category === filterCategory;
    const influenceMatch = filterInfluence === 'all' || stakeholder.influence_level === filterInfluence.toLowerCase();
    return categoryMatch && influenceMatch;
  });

  const groupedByMatrix = filteredStakeholders?.reduce((acc, stakeholder) => {
    const key = `${stakeholder.influence_level}-${stakeholder.interest_level}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(stakeholder);
    return acc;
  }, {} as Record<string, Stakeholder[]>);

  const handleRecordInteraction = async (stakeholderId: string, interactionType: string, notes: string) => {
    // This would typically call an API to record the interaction
    toast.success('Interação registrada com sucesso!');
    setIsEngagementModalOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Matriz de Stakeholders</h2>
          <p className="text-muted-foreground">
            Analise a influência e interesse dos stakeholders para definir estratégias de engajamento
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterInfluence} onValueChange={setFilterInfluence}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Influência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stakeholders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStakeholders?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredStakeholders?.filter(s => s.influence_level === 'high' && s.interest_level === 'high').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStakeholders?.length > 0 
                ? Math.round(filteredStakeholders.reduce((sum, s) => sum + calculateEngagementScore(s.last_contact_date, s.engagement_frequency), 0) / filteredStakeholders.length)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Necessitam Atenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredStakeholders?.filter(s => calculateEngagementScore(s.last_contact_date, s.engagement_frequency) < 60).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stakeholder Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz Influência x Interesse</CardTitle>
          <CardDescription>
            Posicionamento dos stakeholders baseado em sua influência e interesse no projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Matrix Grid */}
            <div className="grid grid-cols-3 gap-4 min-h-[400px]">
              {/* Y-axis labels */}
              <div className="absolute -left-20 top-0 h-full flex flex-col justify-between text-sm font-medium">
                <span>Alto</span>
                <span>Médio</span>
                <span>Baixo</span>
              </div>
              
              {/* X-axis labels */}
              <div className="absolute -bottom-8 left-0 w-full flex justify-between text-sm font-medium">
                <span>Baixa</span>
                <span>Média</span>
                <span>Alta</span>
              </div>

              {/* Matrix Cells */}
              {['high', 'medium', 'low'].map((interest, yIndex) => (
                ['low', 'medium', 'high'].map((influence, xIndex) => {
                  const key = `${influence}-${interest}`;
                  const cellStakeholders = groupedByMatrix?.[key] || [];
                  const strategy = getMatrixStrategy(influence, interest);
                  
                  return (
                    <div
                      key={key}
                      className={`border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[120px] ${
                        strategy === 'Gerenciar de Perto' ? 'bg-red-50' :
                        strategy === 'Manter Satisfeito' ? 'bg-orange-50' :
                        strategy === 'Manter Informado' ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-xs font-medium mb-2">
                        <Badge variant="outline" className={getStrategyColor(strategy)}>
                          {strategy}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {cellStakeholders.map((stakeholder) => {
                          const engagementScore = calculateEngagementScore(stakeholder.last_contact_date, stakeholder.engagement_frequency);
                          return (
                            <div
                              key={stakeholder.id}
                              className="bg-white rounded p-2 border cursor-pointer hover:shadow-sm transition-shadow"
                              onClick={() => setSelectedStakeholder(stakeholder)}
                            >
                              <div className="font-medium text-xs truncate">{stakeholder.name}</div>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {stakeholder.category}
                                </Badge>
                                <div className={`text-xs px-1 rounded ${getEngagementScoreColor(stakeholder.last_contact_date)}`}>
                                  {Math.round(engagementScore)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholder Details Modal */}
      {selectedStakeholder && (
        <Dialog open={!!selectedStakeholder} onOpenChange={() => setSelectedStakeholder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedStakeholder.name}</span>
                <Badge variant="outline">{selectedStakeholder.category}</Badge>
              </DialogTitle>
              <DialogDescription>
                Detalhes e histórico de engajamento do stakeholder
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Influência</Label>
                  <div className={`inline-block px-2 py-1 rounded text-white text-sm ${getInfluenceColor(selectedStakeholder.influence_level)}`}>
                    {selectedStakeholder.influence_level === 'high' ? 'Alta' : 
                     selectedStakeholder.influence_level === 'medium' ? 'Média' : 'Baixa'}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Interesse</Label>
                  <div className={`inline-block px-2 py-1 rounded text-white text-sm ${getInterestColor(selectedStakeholder.interest_level)}`}>
                    {selectedStakeholder.interest_level === 'high' ? 'Alto' : 
                     selectedStakeholder.interest_level === 'medium' ? 'Médio' : 'Baixo'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Score de Engajamento</Label>
                  <div className={`text-lg font-bold ${getEngagementScoreColor(selectedStakeholder.last_contact_date)}`}>
                    {Math.round(calculateEngagementScore(selectedStakeholder.last_contact_date, selectedStakeholder.engagement_frequency))}%
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="default">
                    Ativo
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium">Frequência de Contato</Label>
                  <div className="text-sm">
                    {selectedStakeholder.engagement_frequency === 'monthly' ? 'Mensal' :
                     selectedStakeholder.engagement_frequency === 'quarterly' ? 'Trimestral' :
                     selectedStakeholder.engagement_frequency === 'biannual' ? 'Semestral' : 'Anual'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Última Interação</Label>
                  <div className="text-sm">
                    {selectedStakeholder.last_contact_date ? 
                      new Date(selectedStakeholder.last_contact_date).toLocaleDateString('pt-BR') : 
                      'Nenhum contato registrado'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-sm font-medium">Estratégia Recomendada</Label>
              <Badge className={getStrategyColor(getMatrixStrategy(selectedStakeholder.influence_level, selectedStakeholder.interest_level))}>
                {getMatrixStrategy(selectedStakeholder.influence_level, selectedStakeholder.interest_level)}
              </Badge>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsEngagementModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Registrar Interação</span>
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Reunião
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Engagement Recording Modal */}
      <Dialog open={isEngagementModalOpen} onOpenChange={setIsEngagementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Interação</DialogTitle>
            <DialogDescription>
              Documente a interação com {selectedStakeholder?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tipo de Interação</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Ligação</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="survey">Pesquisa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notas da Interação</Label>
              <Textarea 
                placeholder="Descreva os pontos principais discutidos..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Próximos Passos</Label>
              <Input placeholder="Ações de follow-up..." />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEngagementModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleRecordInteraction(selectedStakeholder?.id || '', 'meeting', 'test')}>
              Salvar Interação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StakeholderEngagementMatrix;