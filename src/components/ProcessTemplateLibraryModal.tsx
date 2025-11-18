import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Map, Download, FileText, Settings, Target } from 'lucide-react';

interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

const PROCESS_TEMPLATES: ProcessTemplate[] = [
  {
    id: 'sipoc',
    name: 'SIPOC',
    description: 'Suppliers, Inputs, Process, Outputs, Customers',
    icon: Target,
    category: 'Metodologia'
  },
  {
    id: 'turtle',
    name: 'Diagrama de Tartaruga',
    description: 'Análise completa dos elementos do processo',
    icon: Settings,
    category: 'Metodologia'
  },
  {
    id: 'fluxograma',
    name: 'Fluxograma Básico',
    description: 'Representação visual do fluxo de atividades',
    icon: Map,
    category: 'Diagrama'
  },
  {
    id: 'bpmn',
    name: 'BPMN',
    description: 'Business Process Model and Notation',
    icon: FileText,
    category: 'Diagrama'
  }
];

interface ProcessTemplateLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
}

export const ProcessTemplateLibraryModal = ({ 
  open, 
  onOpenChange,
  onSelectTemplate 
}: ProcessTemplateLibraryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Biblioteca de Templates de Processos
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {PROCESS_TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => onSelectTemplate(template.id)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Usar Template
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
