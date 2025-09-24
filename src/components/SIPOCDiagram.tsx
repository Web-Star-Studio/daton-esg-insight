import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  ArrowDown, 
  ArrowRight,
  Factory,
  Package,
  Target,
  UserCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SIPOCElement {
  id: string;
  element_type: 'supplier' | 'input' | 'output' | 'customer';
  name: string;
  description?: string;
  requirements?: string;
  specifications?: string;
  order_index: number;
}

interface SIPOCDiagramProps {
  processMapId: string;
  elements?: SIPOCElement[];
  onSave?: (elements: SIPOCElement[]) => void;
  readOnly?: boolean;
}

export const SIPOCDiagram = ({ 
  processMapId, 
  elements = [], 
  onSave, 
  readOnly = false 
}: SIPOCDiagramProps) => {
  const [sipocElements, setSipocElements] = useState<SIPOCElement[]>(elements);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<SIPOCElement | null>(null);
  const [newElement, setNewElement] = useState<Partial<SIPOCElement>>({
    element_type: 'supplier',
    name: '',
    description: '',
    requirements: '',
    specifications: '',
  });

  useEffect(() => {
    setSipocElements(elements);
  }, [elements]);

  const handleAddElement = () => {
    if (!newElement.name?.trim()) {
      toast.error('Nome do elemento é obrigatório');
      return;
    }

    const element: SIPOCElement = {
      id: crypto.randomUUID(),
      element_type: newElement.element_type as any,
      name: newElement.name,
      description: newElement.description || '',
      requirements: newElement.requirements || '',
      specifications: newElement.specifications || '',
      order_index: sipocElements.filter(e => e.element_type === newElement.element_type).length,
    };

    const updatedElements = [...sipocElements, element];
    setSipocElements(updatedElements);
    onSave?.(updatedElements);
    
    setNewElement({
      element_type: 'supplier',
      name: '',
      description: '',
      requirements: '',
      specifications: '',
    });
    setIsAddDialogOpen(false);
    
    toast.success('Elemento SIPOC adicionado com sucesso');
  };

  const handleEditElement = (element: SIPOCElement) => {
    setEditingElement(element);
    setNewElement(element);
    setIsAddDialogOpen(true);
  };

  const handleUpdateElement = () => {
    if (!editingElement || !newElement.name?.trim()) return;

    const updatedElements = sipocElements.map(el =>
      el.id === editingElement.id ? { ...el, ...newElement } : el
    );
    
    setSipocElements(updatedElements);
    onSave?.(updatedElements);
    
    setEditingElement(null);
    setNewElement({
      element_type: 'supplier',
      name: '',
      description: '',
      requirements: '',
      specifications: '',
    });
    setIsAddDialogOpen(false);
    
    toast.success('Elemento SIPOC atualizado com sucesso');
  };

  const handleDeleteElement = (id: string) => {
    const updatedElements = sipocElements.filter(el => el.id !== id);
    setSipocElements(updatedElements);
    onSave?.(updatedElements);
    toast.success('Elemento SIPOC removido');
  };

  const getElementsByType = (type: SIPOCElement['element_type']) => {
    return sipocElements
      .filter(el => el.element_type === type)
      .sort((a, b) => a.order_index - b.order_index);
  };

  const getElementIcon = (type: SIPOCElement['element_type']) => {
    switch (type) {
      case 'supplier': return Factory;
      case 'input': return ArrowDown;
      case 'output': return ArrowRight;
      case 'customer': return UserCheck;
      default: return Package;
    }
  };

  const getElementColor = (type: SIPOCElement['element_type']) => {
    switch (type) {
      case 'supplier': return 'primary';
      case 'input': return 'secondary';
      case 'output': return 'accent';
      case 'customer': return 'success';
      default: return 'default';
    }
  };

  const sipocSections = [
    { type: 'supplier' as const, title: 'Suppliers (Fornecedores)', description: 'Quem fornece entradas para o processo' },
    { type: 'input' as const, title: 'Inputs (Entradas)', description: 'Recursos necessários para executar o processo' },
    { type: 'output' as const, title: 'Outputs (Saídas)', description: 'Produtos ou resultados do processo' },
    { type: 'customer' as const, title: 'Customers (Clientes)', description: 'Quem recebe as saídas do processo' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Diagrama SIPOC</h3>
          <p className="text-sm text-muted-foreground">
            Suppliers, Inputs, Process, Outputs, Customers
          </p>
        </div>
        {!readOnly && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Elemento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingElement ? 'Editar Elemento SIPOC' : 'Novo Elemento SIPOC'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    value={newElement.element_type}
                    onChange={(e) => setNewElement({
                      ...newElement,
                      element_type: e.target.value as SIPOCElement['element_type']
                    })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  >
                    <option value="supplier">Supplier (Fornecedor)</option>
                    <option value="input">Input (Entrada)</option>
                    <option value="output">Output (Saída)</option>
                    <option value="customer">Customer (Cliente)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={newElement.name}
                    onChange={(e) => setNewElement({ ...newElement, name: e.target.value })}
                    placeholder="Nome do elemento"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={newElement.description}
                    onChange={(e) => setNewElement({ ...newElement, description: e.target.value })}
                    placeholder="Descrição detalhada"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Requisitos</label>
                  <Textarea
                    value={newElement.requirements}
                    onChange={(e) => setNewElement({ ...newElement, requirements: e.target.value })}
                    placeholder="Requisitos específicos"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Especificações</label>
                  <Textarea
                    value={newElement.specifications}
                    onChange={(e) => setNewElement({ ...newElement, specifications: e.target.value })}
                    placeholder="Especificações técnicas"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingElement(null);
                      setNewElement({
                        element_type: 'supplier',
                        name: '',
                        description: '',
                        requirements: '',
                        specifications: '',
                      });
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
        )}
      </div>

      {/* SIPOC Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sipocSections.map((section) => {
          const Icon = getElementIcon(section.type);
          const sectionElements = getElementsByType(section.type);

          return (
            <Card key={section.type}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {sectionElements.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                    Nenhum elemento adicionado
                  </div>
                ) : (
                  sectionElements.map((element) => (
                    <Card key={element.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{element.name}</h4>
                          {element.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {element.description}
                            </p>
                          )}
                          {element.requirements && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Requisitos: {element.requirements}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {!readOnly && (
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditElement(element)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteElement(element.id)}
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
        })}
      </div>

      {/* Process Center */}
      <Card className="bg-primary/10 border-primary">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Target className="h-5 w-5" />
            PROCESS (PROCESSO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            O processo central que transforma as entradas (inputs) em saídas (outputs), 
            utilizando recursos dos fornecedores (suppliers) para atender aos clientes (customers).
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo SIPOC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {sipocSections.map((section) => {
              const count = getElementsByType(section.type).length;
              return (
                <div key={section.type}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">
                    {section.title.split(' ')[0]}s
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SIPOCDiagram;