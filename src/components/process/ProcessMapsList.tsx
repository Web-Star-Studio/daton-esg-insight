import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Plus, Edit, Eye, Network, GitBranch, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { ProcessMap } from '@/services/processMapping';

interface ProcessMapsListProps {
  processMaps?: ProcessMap[];
  onSelectProcess: (id: string) => void;
  onCreateProcess: () => void;
  getProcessTypeColor: (type: string) => any;
  getStatusColor: (status: string) => any;
  getStatusIcon: (status: string) => string;
}

export function ProcessMapsList({
  processMaps,
  onSelectProcess,
  onCreateProcess,
  getProcessTypeColor,
  getStatusColor,
  getStatusIcon,
}: ProcessMapsListProps) {
  const iconMap: Record<string, any> = {
    'Edit': Edit,
    'Clock': Clock,
    'CheckCircle': CheckCircle,
    'AlertCircle': AlertCircle,
  };

  if (!processMaps || processMaps.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum mapa de processo encontrado</h3>
          <p className="text-muted-foreground mb-6">
            Comece criando seu primeiro mapa de processo para mapear os fluxos da sua organização.
          </p>
          <Button onClick={onCreateProcess} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Processo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {processMaps.map((processMap) => {
        const StatusIcon = iconMap[getStatusIcon(processMap.status)] || Edit;
        
        return (
          <Card key={processMap.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                {processMap.name}
              </CardTitle>
              <CardDescription>
                {processMap.description || 'Sem descrição'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getProcessTypeColor(processMap.process_type)}>
                    {processMap.process_type}
                  </Badge>
                  <Badge variant={getStatusColor(processMap.status)} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {processMap.status}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <GitBranch className="h-3 w-3" />
                    v{processMap.version}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Criado em {new Date(processMap.created_at).toLocaleDateString()}</p>
                  {processMap.approved_at && (
                    <p>Aprovado em {new Date(processMap.approved_at).toLocaleDateString()}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSelectProcess(processMap.id)}
                    className="gap-1 flex-1"
                  >
                    {processMap.status === 'Approved' || processMap.status === 'Archived' ? (
                      <>
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" />
                        Editar
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSelectProcess(processMap.id)}
                    className="gap-1 flex-1"
                  >
                    <Network className="h-4 w-4" />
                    Mapear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
