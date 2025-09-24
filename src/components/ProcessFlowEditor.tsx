import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Text, Triangle, Path, Line } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Circle as CircleIcon, 
  Diamond, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Save,
  Undo,
  Redo,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface ProcessFlowEditorProps {
  processMapId: string;
  initialData?: any;
  onSave?: (canvasData: any) => void;
  readOnly?: boolean;
}

type ToolType = 'select' | 'start' | 'end' | 'activity' | 'decision' | 'connector';

export const ProcessFlowEditor = ({ 
  processMapId, 
  initialData, 
  onSave, 
  readOnly = false 
}: ProcessFlowEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: 'hsl(var(--background))',
      selection: !readOnly,
    });

    // Load initial data if available
    if (initialData && initialData.objects) {
      canvas.loadFromJSON(initialData, () => {
        canvas.renderAll();
      });
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [initialData, readOnly]);

  // Add element to canvas
  const addElement = useCallback((type: ToolType, x = 100, y = 100) => {
    if (!fabricCanvas || readOnly) return;

    let element;
    
    switch (type) {
      case 'start':
        element = new Circle({
          radius: 30,
          fill: 'hsl(var(--primary))',
          stroke: 'hsl(var(--border))',
          strokeWidth: 2,
          left: x,
          top: y,
        });
        break;
      
      case 'end':
        element = new Circle({
          radius: 30,
          fill: 'hsl(var(--destructive))',
          stroke: 'hsl(var(--border))',
          strokeWidth: 2,
          left: x,
          top: y,
        });
        break;
      
      case 'activity':
        element = new Rect({
          width: 120,
          height: 60,
          fill: 'hsl(var(--accent))',
          stroke: 'hsl(var(--border))',
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          left: x,
          top: y,
        });
        break;
      
      case 'decision':
        element = new Rect({
          width: 80,
          height: 80,
          fill: 'hsl(var(--warning))',
          stroke: 'hsl(var(--border))',
          strokeWidth: 2,
          angle: 45,
          left: x,
          top: y,
        });
        break;
    }

    if (element) {
      fabricCanvas.add(element);
      fabricCanvas.setActiveObject(element);
      fabricCanvas.renderAll();
      toast.success(`Elemento ${type} adicionado ao fluxo`);
    }
  }, [fabricCanvas, readOnly]);

  // Canvas event handlers
  const handleCanvasClick = useCallback((e: any) => {
    if (activeTool === 'select' || readOnly) return;
    
    const pointer = fabricCanvas?.getPointer(e.e);
    if (pointer) {
      addElement(activeTool, pointer.x, pointer.y);
      setActiveTool('select');
    }
  }, [activeTool, addElement, fabricCanvas, readOnly]);

  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.on('mouse:down', handleCanvasClick);
      return () => {
        fabricCanvas.off('mouse:down', handleCanvasClick);
      };
    }
  }, [fabricCanvas, handleCanvasClick]);

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.1 : zoom / 1.1;
    const boundedZoom = Math.min(Math.max(newZoom, 0.3), 3);
    
    fabricCanvas.setZoom(boundedZoom);
    fabricCanvas.renderAll();
  };

  // Save canvas data
  const handleSave = () => {
    if (!fabricCanvas || !onSave) return;
    
    const canvasData = fabricCanvas.toJSON();
    onSave(canvasData);
    toast.success('Fluxo de processo salvo com sucesso');
  };

  // Clear canvas
  const handleClear = () => {
    if (!fabricCanvas || readOnly) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'hsl(var(--background))';
    fabricCanvas.renderAll();
    toast.success('Canvas limpo');
  };

  // Delete selected object
  const handleDelete = () => {
    if (!fabricCanvas || readOnly) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
      toast.success('Elemento removido');
    }
  };

  const tools = [
    { type: 'select' as ToolType, icon: Move, label: 'Selecionar', color: 'default' },
    { type: 'start' as ToolType, icon: Play, label: 'Início', color: 'success' },
    { type: 'end' as ToolType, icon: Square, label: 'Fim', color: 'destructive' },
    { type: 'activity' as ToolType, icon: Square, label: 'Atividade', color: 'secondary' },
    { type: 'decision' as ToolType, icon: Diamond, label: 'Decisão', color: 'warning' },
  ];

  return (
    <div className="flex flex-col space-y-4">
      {/* Toolbar */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleIcon className="h-5 w-5" />
              Ferramentas de Edição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {/* Tools */}
              <div className="flex gap-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.type}
                      variant={activeTool === tool.type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool(tool.type)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {tool.label}
                    </Button>
                  );
                })}
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom('in')}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom('out')}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  Limpar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          Ferramenta ativa: {tools.find(t => t.type === activeTool)?.label}
        </Badge>
        {readOnly && (
          <Badge variant="secondary">Modo somente leitura</Badge>
        )}
      </div>

      {/* Canvas */}
      <Card>
        <CardContent className="p-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <canvas 
              ref={canvasRef} 
              className="block max-w-full"
              style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Instruções:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Selecione uma ferramenta e clique no canvas para adicionar elementos</li>
              <li>Use a ferramenta "Selecionar" para mover e modificar elementos</li>
              <li>Use os controles de zoom para ajustar a visualização</li>
              <li>Salve regularmente o seu trabalho</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessFlowEditor;