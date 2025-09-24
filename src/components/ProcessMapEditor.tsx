import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  GitBranch, 
  Save, 
  Eye, 
  Edit, 
  CheckCircle,
  Clock,
  AlertCircle,
  Map,
  Network,
  Turtle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProcessFlowEditor from './ProcessFlowEditor';
import SIPOCDiagram from './SIPOCDiagram';
import TurtleDiagram from './TurtleDiagram';
import {
  getProcessMapById,
  updateProcessMap,
  getSIPOCElements,
  saveSIPOCElements,
  getTurtleDiagram,
  saveTurtleDiagram,
  saveCanvasData,
  createProcessMapVersion,
  approveProcessMapVersion,
} from '@/services/processMapping';

interface ProcessMapEditorProps {
  processMapId: string;
  onClose?: () => void;
}

export const ProcessMapEditor = ({ processMapId, onClose }: ProcessMapEditorProps) => {
  const [activeTab, setActiveTab] = useState('flow');
  const queryClient = useQueryClient();

  // Fetch process map data
  const { data: processMap, isLoading } = useQuery({
    queryKey: ['processMap', processMapId],
    queryFn: () => getProcessMapById(processMapId),
  });

  // Fetch SIPOC elements
  const { data: sipocElements } = useQuery({
    queryKey: ['sipocElements', processMapId],
    queryFn: () => getSIPOCElements(processMapId),
    enabled: !!processMapId,
  });

  // Fetch turtle diagram
  const { data: turtleDiagram } = useQuery({
    queryKey: ['turtleDiagram', processMapId],
    queryFn: () => getTurtleDiagram(processMapId),
    enabled: !!processMapId,
  });

  // Mutations
  const updateProcessMapMutation = useMutation({
    mutationFn: (data: any) => updateProcessMap(processMapId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processMap', processMapId] });
      toast.success('Processo atualizado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar processo: ${error.message}`);
    },
  });

  const saveSIPOCMutation = useMutation({
    mutationFn: (elements: any[]) => saveSIPOCElements(processMapId, elements),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sipocElements', processMapId] });
      toast.success('Diagrama SIPOC salvo com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao salvar SIPOC: ${error.message}`);
    },
  });

  const saveTurtleMutation = useMutation({
    mutationFn: (data: any) => saveTurtleDiagram({ ...data, process_map_id: processMapId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turtleDiagram', processMapId] });
      toast.success('Diagrama de Tartaruga salvo com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao salvar Diagrama de Tartaruga: ${error.message}`);
    },
  });

  const saveCanvasMutation = useMutation({
    mutationFn: (canvasData: any) => saveCanvasData(processMapId, canvasData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processMap', processMapId] });
      toast.success('Fluxo de processo salvo com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao salvar fluxo: ${error.message}`);
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: () => createProcessMapVersion(processMapId),
    onSuccess: (newVersion) => {
      queryClient.invalidateQueries({ queryKey: ['processMaps'] });
      toast.success(`Nova versão ${newVersion.version} criada com sucesso`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar versão: ${error.message}`);
    },
  });

  const approveVersionMutation = useMutation({
    mutationFn: (approvedByUserId: string) => approveProcessMapVersion(processMapId, approvedByUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processMap', processMapId] });
      toast.success('Versão aprovada com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar versão: ${error.message}`);
    },
  });

  // Handle canvas save
  const handleCanvasSave = (canvasData: any) => {
    saveCanvasMutation.mutate(canvasData);
  };

  // Handle SIPOC save
  const handleSIPOCSave = (elements: any[]) => {
    saveSIPOCMutation.mutate(elements);
  };

  // Handle turtle save
  const handleTurtleSave = (data: any) => {
    saveTurtleMutation.mutate(data);
  };

  // Handle version creation
  const handleCreateVersion = () => {
    createVersionMutation.mutate();
  };

  // Handle version approval
  const handleApproveVersion = () => {
    // Get current user ID from auth
    approveVersionMutation.mutate('current-user-id'); // This would need to get actual user ID
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Review': return 'destructive';
      case 'Approved': return 'default';
      case 'Archived': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return Edit;
      case 'Review': return Clock;
      case 'Approved': return CheckCircle;
      case 'Archived': return AlertCircle;
      default: return Edit;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!processMap) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Processo não encontrado</p>
          {onClose && (
            <Button onClick={onClose} className="mt-4">
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getStatusIcon(processMap.status);
  const readOnly = processMap.status === 'Approved' || processMap.status === 'Archived';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-6 w-6" />
                {processMap.name}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={getStatusColor(processMap.status)} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {processMap.status}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <GitBranch className="h-3 w-3" />
                  Versão {processMap.version}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Tipo: {processMap.process_type}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!readOnly && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateVersion}
                    disabled={createVersionMutation.isPending}
                    className="gap-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    Nova Versão
                  </Button>
                  {processMap.status === 'Review' && (
                    <Button
                      size="sm"
                      onClick={handleApproveVersion}
                      disabled={approveVersionMutation.isPending}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </Button>
                  )}
                </>
              )}
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Voltar
                </Button>
              )}
            </div>
          </div>
          {processMap.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {processMap.description}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flow" className="gap-2">
            <Network className="h-4 w-4" />
            Fluxo do Processo
          </TabsTrigger>
          <TabsTrigger value="sipoc" className="gap-2">
            <Map className="h-4 w-4" />
            Diagrama SIPOC
          </TabsTrigger>
          <TabsTrigger value="turtle" className="gap-2">
            <Turtle className="h-4 w-4" />
            Diagrama Tartaruga
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="gap-2">
            <Users className="h-4 w-4" />
            Partes Interessadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-6">
          <ProcessFlowEditor
            processMapId={processMapId}
            initialData={processMap.canvas_data}
            onSave={handleCanvasSave}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="sipoc" className="mt-6">
          <SIPOCDiagram
            processMapId={processMapId}
            elements={sipocElements || []}
            onSave={handleSIPOCSave}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="turtle" className="mt-6">
          <TurtleDiagram
            processMapId={processMapId}
            initialData={turtleDiagram}
            onSave={handleTurtleSave}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="stakeholders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Partes Interessadas do Processo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Em breve você poderá gerenciar as partes interessadas do processo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      {readOnly && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Modo somente leitura</span>
              <span className="text-sm text-muted-foreground">
                - Este processo está {processMap.status === 'Approved' ? 'aprovado' : 'arquivado'} 
                e não pode ser editado. Crie uma nova versão para fazer alterações.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProcessMapEditor;