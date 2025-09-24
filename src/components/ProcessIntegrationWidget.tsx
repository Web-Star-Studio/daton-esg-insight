import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Network, 
  Plus, 
  ArrowRight, 
  Map, 
  Target, 
  Users, 
  CheckCircle,
  AlertCircle,
  Clock,
  Link
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getProcessMaps } from '@/services/processMapping';
import { getOKRs } from '@/services/strategic';
import { supabase } from '@/integrations/supabase/client';

interface ProcessIntegration {
  id: string;
  process_map_id: string;
  strategic_element_id: string;
  element_type: 'okr' | 'bsc_objective' | 'initiative';
  integration_type: 'supports' | 'implements' | 'monitors' | 'enables';
  description?: string;
  created_at: string;
}

interface ProcessIntegrationWidgetProps {
  strategicMapId?: string;
}

export const ProcessIntegrationWidget = ({ strategicMapId }: ProcessIntegrationWidgetProps) => {
  const [isCreateIntegrationOpen, setIsCreateIntegrationOpen] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    process_map_id: '',
    strategic_element_id: '',
    element_type: 'okr' as const,
    integration_type: 'supports' as const,
    description: '',
  });
  const queryClient = useQueryClient();

  // Fetch process maps
  const { data: processMaps } = useQuery({
    queryKey: ['processMaps'],
    queryFn: getProcessMaps,
  });

  // Fetch OKRs
  const { data: okrs } = useQuery({
    queryKey: ['okrs', strategicMapId],
    queryFn: () => getOKRs(strategicMapId),
    enabled: !!strategicMapId,
  });

  // Fetch existing integrations
  const { data: integrations } = useQuery({
    queryKey: ['processIntegrations', strategicMapId],
    queryFn: async () => {
      if (!strategicMapId) return [];
      
      const { data, error } = await supabase
        .from('process_integrations')
        .select(`
          *,
          process_maps(name, process_type),
          okrs(title)
        `)
        .eq('strategic_map_id', strategicMapId);

      if (error) throw error;
      return data as any[];
    },
    enabled: !!strategicMapId,
  });

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: async (integrationData: typeof newIntegration) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('process_integrations')
        .insert({
          ...integrationData,
          strategic_map_id: strategicMapId,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processIntegrations'] });
      setIsCreateIntegrationOpen(false);
      setNewIntegration({
        process_map_id: '',
        strategic_element_id: '',
        element_type: 'okr',
        integration_type: 'supports',
        description: '',
      });
      toast.success('Integração criada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar integração: ${error.message}`);
    },
  });

  const handleCreateIntegration = () => {
    if (!newIntegration.process_map_id || !newIntegration.strategic_element_id) {
      toast.error('Selecione um processo e um elemento estratégico');
      return;
    }
    createIntegrationMutation.mutate(newIntegration);
  };

  const getIntegrationTypeColor = (type: string) => {
    switch (type) {
      case 'supports': return 'secondary';
      case 'implements': return 'default';
      case 'monitors': return 'outline';
      case 'enables': return 'destructive';
      default: return 'secondary';
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'supports': return Users;
      case 'implements': return CheckCircle;
      case 'monitors': return Clock;
      case 'enables': return Target;
      default: return Network;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Integração com Processos
          </CardTitle>
          {strategicMapId && (
            <Dialog open={isCreateIntegrationOpen} onOpenChange={setIsCreateIntegrationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Nova Integração
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Integração Processo-Estratégia</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Processo</Label>
                    <Select
                      value={newIntegration.process_map_id}
                      onValueChange={(value) => setNewIntegration({ ...newIntegration, process_map_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um processo" />
                      </SelectTrigger>
                      <SelectContent>
                        {processMaps?.map((process) => (
                          <SelectItem key={process.id} value={process.id}>
                            {process.name} ({process.process_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Elemento Estratégico</Label>
                    <Select
                      value={newIntegration.strategic_element_id}
                      onValueChange={(value) => setNewIntegration({ ...newIntegration, strategic_element_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um OKR" />
                      </SelectTrigger>
                      <SelectContent>
                        {okrs?.map((okr) => (
                          <SelectItem key={okr.id} value={okr.id}>
                            {okr.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo de Integração</Label>
                    <Select
                      value={newIntegration.integration_type}
                      onValueChange={(value) => setNewIntegration({ 
                        ...newIntegration, 
                        integration_type: value as any 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supports">Suporta</SelectItem>
                        <SelectItem value="implements">Implementa</SelectItem>
                        <SelectItem value="monitors">Monitora</SelectItem>
                        <SelectItem value="enables">Habilita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={newIntegration.description}
                      onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                      placeholder="Como este processo se relaciona com o elemento estratégico?"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsCreateIntegrationOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateIntegration}
                      disabled={createIntegrationMutation.isPending}
                    >
                      {createIntegrationMutation.isPending ? 'Criando...' : 'Criar Integração'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {integrations && integrations.length > 0 ? (
          <div className="space-y-3">
            {integrations.map((integration) => {
              const IntegrationIcon = getIntegrationIcon(integration.integration_type);
              
              return (
                <div key={integration.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">
                        {integration.process_maps?.name}
                      </span>
                    </div>
                    <Badge variant={getIntegrationTypeColor(integration.integration_type)} className="gap-1">
                      <IntegrationIcon className="h-3 w-3" />
                      {integration.integration_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <ArrowRight className="h-3 w-3" />
                    <Target className="h-3 w-3" />
                    <span>{integration.okrs?.title}</span>
                  </div>
                  
                  {integration.description && (
                    <p className="text-xs text-muted-foreground mt-2 pl-4 border-l-2 border-muted">
                      {integration.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhuma integração configurada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte seus processos operacionais com elementos estratégicos para uma visão integrada.
            </p>
            {strategicMapId && (
              <Button 
                variant="outline" 
                onClick={() => setIsCreateIntegrationOpen(true)}
                className="gap-2"
              >
                <Link className="h-4 w-4" />
                Criar Primeira Integração
              </Button>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {integrations && integrations.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{integrations.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.integration_type === 'implements').length}
                </p>
                <p className="text-xs text-muted-foreground">Implementa</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {integrations.filter(i => i.integration_type === 'supports').length}
                </p>
                <p className="text-xs text-muted-foreground">Suporta</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {integrations.filter(i => i.integration_type === 'monitors').length}
                </p>
                <p className="text-xs text-muted-foreground">Monitora</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessIntegrationWidget;