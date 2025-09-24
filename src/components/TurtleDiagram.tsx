import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowDown, 
  ArrowUp, 
  Users, 
  Settings,
  BarChart3,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TurtleElement {
  id: string;
  name: string;
  description?: string;
  type: string;
}

interface TurtleDiagramData {
  id?: string;
  process_map_id: string;
  process_step_id?: string;
  inputs: TurtleElement[];
  outputs: TurtleElement[];
  resources: TurtleElement[];
  methods: TurtleElement[];
  measurements: TurtleElement[];
  risks: TurtleElement[];
}

interface TurtleDiagramProps {
  processMapId: string;
  processStepId?: string;
  initialData?: TurtleDiagramData;
  onSave?: (data: TurtleDiagramData) => void;
  readOnly?: boolean;
}

type ElementType = 'inputs' | 'outputs' | 'resources' | 'methods' | 'measurements' | 'risks';

export const TurtleDiagram = ({ 
  processMapId, 
  processStepId, 
  initialData, 
  onSave, 
  readOnly = false 
}: TurtleDiagramProps) => {
  const [turtleData, setTurtleData] = useState<TurtleDiagramData>(
    initialData || {
      process_map_id: processMapId,
      process_step_id: processStepId,
      inputs: [],
      outputs: [],
      resources: [],
      methods: [],
      measurements: [],
      risks: [],
    }
  );

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentElementType, setCurrentElementType] = useState<ElementType>('inputs');
  const [editingElement, setEditingElement] = useState<TurtleElement | null>(null);
  const [newElement, setNewElement] = useState<Partial<TurtleElement>>({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setTurtleData(initialData);
    }
  }, [initialData]);

  const handleAddElement = () => {
    if (!newElement.name?.trim()) {
      toast.error('Nome do elemento é obrigatório');
      return;
    }

    const element: TurtleElement = {
      id: crypto.randomUUID(),
      name: newElement.name,
      description: newElement.description || '',
      type: currentElementType,
    };

    const updatedData = {
      ...turtleData,
      [currentElementType]: [...turtleData[currentElementType], element],
    };
    
    setTurtleData(updatedData);
    onSave?.(updatedData);
    
    setNewElement({ name: '', description: '' });
    setIsAddDialogOpen(false);
    
    toast.success(`Elemento adicionado à seção ${getSectionTitle(currentElementType)}`);
  };

  const handleEditElement = (elementType: ElementType, element: TurtleElement) => {
    setCurrentElementType(elementType);
    setEditingElement(element);
    setNewElement(element);
    setIsAddDialogOpen(true);
  };

  const handleUpdateElement = () => {
    if (!editingElement || !newElement.name?.trim()) return;

    const updatedData = {
      ...turtleData,
      [currentElementType]: turtleData[currentElementType].map(el =>
        el.id === editingElement.id ? { ...el, ...newElement } : el
      ),
    };
    
    setTurtleData(updatedData);
    onSave?.(updatedData);
    
    setEditingElement(null);
    setNewElement({ name: '', description: '' });
    setIsAddDialogOpen(false);
    
    toast.success('Elemento atualizado com sucesso');
  };

  const handleDeleteElement = (elementType: ElementType, id: string) => {
    const updatedData = {
      ...turtleData,
      [elementType]: turtleData[elementType].filter(el => el.id !== id),
    };
    
    setTurtleData(updatedData);
    onSave?.(updatedData);
    toast.success('Elemento removido');
  };

  const openAddDialog = (elementType: ElementType) => {
    setCurrentElementType(elementType);
    setEditingElement(null);
    setNewElement({ name: '', description: '' });
    setIsAddDialogOpen(true);
  };

  const getSectionTitle = (type: ElementType) => {
    const titles = {
      inputs: 'Entradas',
      outputs: 'Saídas',
      resources: 'Recursos',
      methods: 'Métodos',
      measurements: 'Medições',
      risks: 'Riscos',
    };
    return titles[type];
  };

  const getSectionIcon = (type: ElementType) => {
    const icons = {
      inputs: ArrowDown,
      outputs: ArrowUp,
      resources: Users,
      methods: Settings,
      measurements: BarChart3,
      risks: AlertTriangle,
    };
    return icons[type];
  };

  const getSectionColor = (type: ElementType) => {
    const colors = {
      inputs: 'primary',
      outputs: 'success',
      resources: 'secondary',
      methods: 'accent',
      measurements: 'info',
      risks: 'warning',
    };
    return colors[type];
  };

  const renderSection = (elementType: ElementType, title: string, description: string) => {
    const Icon = getSectionIcon(elementType);
    const elements = turtleData[elementType];

    return (
      <Card key={elementType}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </div>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAddDialog(elementType)}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {elements.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
              Nenhum elemento adicionado
            </div>
          ) : (
            elements.map((element) => (
              <Card key={element.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{element.name}</h4>
                    {element.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {element.description}
                      </p>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditElement(elementType, element)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteElement(elementType, element.id)}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Diagrama de Tartaruga</h3>
          <p className="text-sm text-muted-foreground">
            Análise detalhada do processo com entradas, saídas, recursos e controles
          </p>
        </div>
      </div>

      {/* Turtle Diagram Layout */}
      <div className="space-y-6">
        {/* Top Row - Inputs */}
        <div className="grid grid-cols-1">
          {renderSection('inputs', 'ENTRADAS (INPUTS)', 'O que entra no processo - materiais, informações, requisitos')}
        </div>

        {/* Middle Row - Resources and Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSection('resources', 'RECURSOS (RESOURCES)', 'Pessoas, equipamentos e infraestrutura necessários')}
          {renderSection('methods', 'MÉTODOS (METHODS)', 'Procedimentos, instruções e metodologias utilizadas')}
        </div>

        {/* Process Center */}
        <Card className="bg-primary/10 border-primary">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              PROCESSO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Processo central que transforma entradas em saídas utilizando recursos e seguindo métodos específicos,
              monitorado por medições e controlado quanto aos riscos.
            </p>
          </CardContent>
        </Card>

        {/* Bottom Rows - Measurements and Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSection('measurements', 'MEDIÇÕES (MEASUREMENTS)', 'KPIs, indicadores e métricas de controle')}
          {renderSection('risks', 'RISCOS (RISKS)', 'Potenciais problemas e suas medidas de controle')}
        </div>

        {/* Outputs */}
        <div className="grid grid-cols-1">
          {renderSection('outputs', 'SAÍDAS (OUTPUTS)', 'Produtos, serviços ou resultados gerados pelo processo')}
        </div>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Diagrama</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            {(['inputs', 'outputs', 'resources', 'methods', 'measurements', 'risks'] as ElementType[]).map((type) => {
              const count = turtleData[type].length;
              return (
                <div key={type}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">
                    {getSectionTitle(type)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Element Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingElement 
                ? `Editar ${getSectionTitle(currentElementType)}` 
                : `Adicionar ${getSectionTitle(currentElementType)}`
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={newElement.name}
                onChange={(e) => setNewElement({ ...newElement, name: e.target.value })}
                placeholder={`Nome do elemento de ${getSectionTitle(currentElementType).toLowerCase()}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newElement.description}
                onChange={(e) => setNewElement({ ...newElement, description: e.target.value })}
                placeholder="Descrição detalhada (opcional)"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingElement(null);
                  setNewElement({ name: '', description: '' });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={editingElement ? handleUpdateElement : handleAddElement}>
                {editingElement ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TurtleDiagram;