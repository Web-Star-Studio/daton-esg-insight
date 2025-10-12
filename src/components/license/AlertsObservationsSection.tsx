import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, FileText, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { getAllObservations, archiveObservation } from '@/services/licenseObservations';
import { ObservationManager } from './ObservationManager';
import { ObservationCard } from './ObservationCard';
import { CommentThread } from './CommentThread';
import { LicenseActivityTimeline } from './LicenseActivityTimeline';
import { ExportReportButton } from './ExportReportButton';
import { logAction } from '@/services/licenseActivityHistory';

interface AlertsObservationsSectionProps {
  licenseId: string;
  activeAlertsCount: number;
}

export function AlertsObservationsSection({ licenseId, activeAlertsCount }: AlertsObservationsSectionProps) {
  const queryClient = useQueryClient();
  const [showObservationManager, setShowObservationManager] = useState(false);
  const [editingObservation, setEditingObservation] = useState<any>(null);
  const [commentingObservation, setCommentingObservation] = useState<string | null>(null);

  const { data: observations = [], isLoading } = useQuery({
    queryKey: ['license-observations', licenseId],
    queryFn: () => getAllObservations(licenseId, { is_archived: false })
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveObservation(id),
    onSuccess: async (_, id) => {
      const observation = observations.find(o => o.id === id);
      if (observation) {
        await logAction({
          license_id: licenseId,
          action_type: 'observation_archived',
          action_target_type: 'observation',
          action_target_id: id,
          description: `Observação arquivada: ${observation.title}`,
          old_values: observation
        });
      }
      queryClient.invalidateQueries({ queryKey: ['license-observations', licenseId] });
      queryClient.invalidateQueries({ queryKey: ['license-activity', licenseId] });
      toast.success('Observação arquivada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao arquivar observação');
    }
  });

  const handleEditObservation = (id: string) => {
    const obs = observations.find(o => o.id === id);
    if (obs) {
      setEditingObservation(obs);
      setShowObservationManager(true);
    }
  };

  const handleNewObservation = () => {
    setEditingObservation(null);
    setShowObservationManager(true);
  };

  const handleCloseObservationManager = () => {
    setShowObservationManager(false);
    setEditingObservation(null);
  };

  const activeObservations = observations.filter(o => !o.is_archived);
  const followupCount = observations.filter(o => o.requires_followup && !o.is_archived).length;

  return (
    <>
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📊 Monitoramento e Observações
            </CardTitle>
            <div className="flex gap-2">
              <ExportReportButton licenseId={licenseId} />
              <Button onClick={handleNewObservation} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Observação
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{activeAlertsCount}</div>
                <div className="text-sm text-muted-foreground">Alertas Ativos</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{activeObservations.length}</div>
                <div className="text-sm text-muted-foreground">Observações</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{followupCount}</div>
                <div className="text-sm text-muted-foreground">Requerem Followup</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">87%</div>
                <div className="text-sm text-muted-foreground">Taxa Resolução</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="observations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="observations">
                Observações ({activeObservations.length})
              </TabsTrigger>
              <TabsTrigger value="alerts">
                Alertas ({activeAlertsCount})
              </TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="observations" className="space-y-4 mt-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Carregando observações...
                </p>
              ) : activeObservations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhuma observação registrada ainda
                  </p>
                  <Button onClick={handleNewObservation} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira observação
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {activeObservations.map(observation => (
                      <ObservationCard
                        key={observation.id}
                        observation={observation}
                        onEdit={handleEditObservation}
                        onArchive={(id) => archiveMutation.mutate(id)}
                        onComment={(id) => setCommentingObservation(id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="mt-4">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <p className="text-sm text-muted-foreground mb-2">
                  {activeAlertsCount > 0 
                    ? `${activeAlertsCount} alerta${activeAlertsCount > 1 ? 's' : ''} ativo${activeAlertsCount > 1 ? 's' : ''}`
                    : 'Nenhum alerta ativo'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Alertas são gerados automaticamente com base em prazos e condições
                </p>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <LicenseActivityTimeline licenseId={licenseId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Observation Manager Dialog */}
      <ObservationManager
        licenseId={licenseId}
        observation={editingObservation}
        open={showObservationManager}
        onOpenChange={handleCloseObservationManager}
      />

      {/* Comment Thread Dialog */}
      {commentingObservation && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Comentários</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentingObservation(null)}
              >
                Fechar
              </Button>
            </div>
            <div className="p-4">
              <CommentThread
                targetId={commentingObservation}
                targetType="observation"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
