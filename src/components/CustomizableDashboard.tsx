import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Plus, 
  Grid3X3, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Target, 
  Zap, 
  Leaf, 
  Users, 
  FileText,
  Move,
  Eye,
  EyeOff,
  Palette,
  Layout
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'alert' | 'progress';
  title: string;
  subtitle?: string;
  icon: any;
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  data?: any;
  config?: {
    color?: string;
    refreshInterval?: number;
    showTrend?: boolean;
    chartType?: string;
  };
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  columns: number;
  theme: 'light' | 'dark' | 'auto';
}

const AVAILABLE_WIDGETS: Omit<DashboardWidget, 'id' | 'visible'>[] = [
  {
    type: 'kpi',
    title: 'Score ESG Geral',
    subtitle: 'Pontuação consolidada',
    icon: Zap,
    size: 'small',
    config: { color: 'accent', showTrend: true }
  },
  {
    type: 'chart',
    title: 'Emissões por Escopo',
    subtitle: 'Distribuição GHG',
    icon: BarChart3,
    size: 'medium',
    config: { chartType: 'bar', color: 'primary' }
  },
  {
    type: 'progress',
    title: 'Metas de Sustentabilidade',
    subtitle: 'Progresso das metas',
    icon: Target,
    size: 'large',
    config: { showTrend: true }
  },
  {
    type: 'chart',
    title: 'Evolução Temporal',
    subtitle: 'Tendências mensais',
    icon: TrendingUp,
    size: 'large',
    config: { chartType: 'line', color: 'success' }
  },
  {
    type: 'table',
    title: 'Licenças Vencendo',
    subtitle: 'Próximos 90 dias',
    icon: FileText,
    size: 'medium',
    config: { refreshInterval: 300000 } // 5 minutes
  },
  {
    type: 'kpi',
    title: 'Taxa de Reciclagem',
    subtitle: 'Resíduos processados',
    icon: Leaf,
    size: 'small',
    config: { color: 'success', showTrend: true }
  },
  {
    type: 'chart',
    title: 'Diversidade & Inclusão',
    subtitle: 'Indicadores sociais',
    icon: Users,
    size: 'medium',
    config: { chartType: 'pie', color: 'secondary' }
  },
  {
    type: 'alert',
    title: 'Alertas Críticos',
    subtitle: 'Requer atenção imediata',
    icon: Zap,
    size: 'small',
    config: { color: 'destructive' }
  }
];

const DEFAULT_LAYOUTS: DashboardLayout[] = [
  {
    id: 'executive',
    name: 'Visão Executiva',
    widgets: [],
    columns: 3,
    theme: 'auto'
  },
  {
    id: 'operational',
    name: 'Operacional',
    widgets: [],
    columns: 4,
    theme: 'auto'
  },
  {
    id: 'compliance',
    name: 'Compliance',
    widgets: [],
    columns: 2,
    theme: 'auto'
  }
];

export function CustomizableDashboard() {
  const [layouts, setLayouts] = useState<DashboardLayout[]>(DEFAULT_LAYOUTS);
  const [activeLayout, setActiveLayout] = useState<string>('executive');
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load layouts from localStorage
  useEffect(() => {
    const savedLayouts = localStorage.getItem('dashboard-layouts');
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (error) {
        console.warn('Failed to load dashboard layouts:', error);
      }
    }
  }, []);

  // Save layouts to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-layouts', JSON.stringify(layouts));
  }, [layouts]);

  const currentLayout = layouts.find(l => l.id === activeLayout);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    setLayouts(prev => prev.map(layout => {
      if (layout.id === activeLayout) {
        const newWidgets = Array.from(layout.widgets);
        const [removed] = newWidgets.splice(sourceIndex, 1);
        newWidgets.splice(destinationIndex, 0, removed);
        return { ...layout, widgets: newWidgets };
      }
      return layout;
    }));
  };

  const addWidget = (widgetTemplate: Omit<DashboardWidget, 'id' | 'visible'>) => {
    const newWidget: DashboardWidget = {
      ...widgetTemplate,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      visible: true
    };

    setLayouts(prev => prev.map(layout => {
      if (layout.id === activeLayout) {
        return {
          ...layout,
          widgets: [...layout.widgets, newWidget]
        };
      }
      return layout;
    }));
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setLayouts(prev => prev.map(layout => {
      if (layout.id === activeLayout) {
        return {
          ...layout,
          widgets: layout.widgets.map(widget => 
            widget.id === widgetId 
              ? { ...widget, visible: !widget.visible }
              : widget
          )
        };
      }
      return layout;
    }));
  };

  const removeWidget = (widgetId: string) => {
    setLayouts(prev => prev.map(layout => {
      if (layout.id === activeLayout) {
        return {
          ...layout,
          widgets: layout.widgets.filter(widget => widget.id !== widgetId)
        };
      }
      return layout;
    }));
  };

  const updateLayoutColumns = (columns: number) => {
    setLayouts(prev => prev.map(layout => {
      if (layout.id === activeLayout) {
        return { ...layout, columns };
      }
      return layout;
    }));
  };

  const getWidgetSizeClass = (size: DashboardWidget['size'], columns: number) => {
    switch (size) {
      case 'small':
        return columns === 2 ? 'col-span-1' : 'col-span-1';
      case 'medium':
        return columns === 2 ? 'col-span-2' : columns === 3 ? 'col-span-2' : 'col-span-2';
      case 'large':
        return columns === 2 ? 'col-span-2' : columns === 3 ? 'col-span-3' : 'col-span-4';
      default:
        return 'col-span-1';
    }
  };

  const renderWidget = (widget: DashboardWidget, index: number) => {
    const IconComponent = widget.icon;
    
    return (
      <Draggable key={widget.id} draggableId={widget.id} index={index} isDragDisabled={!isEditing}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`${getWidgetSizeClass(widget.size, currentLayout?.columns || 3)} ${
              snapshot.isDragging ? 'opacity-50' : ''
            }`}
          >
            <Card className={`h-full transition-all duration-200 ${
              isEditing ? 'ring-2 ring-primary/20 hover:ring-primary/40' : ''
            } ${!widget.visible ? 'opacity-50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className="h-6 w-6 p-0"
                    >
                      {widget.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <div {...provided.dragHandleProps}>
                      <Move className="h-3 w-3 text-muted-foreground cursor-move" />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {widget.subtitle && (
                  <p className="text-xs text-muted-foreground mb-3">{widget.subtitle}</p>
                )}
                
                {/* Widget content based on type */}
                {widget.type === 'kpi' && (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">85.2</div>
                    {widget.config?.showTrend && (
                      <div className="flex items-center gap-1 text-xs text-success">
                        <TrendingUp className="h-3 w-3" />
                        +12% vs mês anterior
                      </div>
                    )}
                  </div>
                )}
                
                {widget.type === 'chart' && (
                  <div className="h-32 bg-muted/20 rounded flex items-center justify-center">
                    <PieChart className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Gráfico {widget.config?.chartType}</span>
                  </div>
                )}
                
                {widget.type === 'progress' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Meta Carbono Neutro</span>
                        <span>68%</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Energia Renovável</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full">
                        <div className="bg-success h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {widget.type === 'table' && (
                  <div className="space-y-2">
                    <div className="text-xs border-b pb-1 font-medium">Licença Ambiental</div>
                    <div className="text-xs">Vence em 45 dias</div>
                    <div className="text-xs border-b pb-1 font-medium">ISO 14001</div>
                    <div className="text-xs">Vence em 120 dias</div>
                  </div>
                )}
                
                {widget.type === 'alert' && (
                  <div className="space-y-2">
                    <Badge variant="destructive" className="text-xs">3 Críticos</Badge>
                    <div className="text-xs text-muted-foreground">
                      2 licenças vencendo, 1 meta atrasada
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Personalizado</h2>
          <p className="text-muted-foreground">Configure sua visão ideal dos dados ESG</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={activeLayout} onValueChange={setActiveLayout}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {layouts.map(layout => (
                <SelectItem key={layout.id} value={layout.id}>
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    {layout.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {isEditing ? 'Salvar' : 'Editar'}
          </Button>
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Configurações do Dashboard</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="widgets" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="widgets">Widgets</TabsTrigger>
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="theme">Tema</TabsTrigger>
                </TabsList>
                
                <TabsContent value="widgets" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_WIDGETS.map((widget, index) => {
                      const IconComponent = widget.icon;
                      return (
                        <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-primary" />
                                <div>
                                  <h4 className="font-medium text-sm">{widget.title}</h4>
                                  <p className="text-xs text-muted-foreground">{widget.subtitle}</p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => addWidget(widget)}
                                className="h-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="layout" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Colunas do Grid</label>
                      <Select 
                        value={currentLayout?.columns.toString()} 
                        onValueChange={(value) => updateLayoutColumns(parseInt(value))}
                      >
                        <SelectTrigger className="w-32 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Colunas</SelectItem>
                          <SelectItem value="3">3 Colunas</SelectItem>
                          <SelectItem value="4">4 Colunas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="theme" className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Configurações de tema em desenvolvimento</span>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Dashboard Grid */}
      {currentLayout && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid gap-6 grid-cols-${currentLayout.columns}`}
                style={{
                  gridTemplateColumns: `repeat(${currentLayout.columns}, minmax(0, 1fr))`
                }}
              >
                {currentLayout.widgets
                  .filter(widget => widget.visible || isEditing)
                  .map((widget, index) => renderWidget(widget, index))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      {currentLayout?.widgets.length === 0 && (
        <div className="text-center py-12">
          <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dashboard Vazio</h3>
          <p className="text-muted-foreground mb-4">
            Adicione widgets para começar a personalizar sua visão
          </p>
          <Button onClick={() => setShowSettings(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Widget
          </Button>
        </div>
      )}
    </div>
  );
}