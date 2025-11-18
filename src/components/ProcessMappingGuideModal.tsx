import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertCircle, Target, Users } from 'lucide-react';

interface ProcessMappingGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProcessMappingGuideModal = ({ open, onOpenChange }: ProcessMappingGuideModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Guia Completo de Mapeamento de Processos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                1. Preparação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Defina o objetivo do mapeamento</p>
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Identifique as partes interessadas</p>
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Determine o nível de detalhe necessário</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                2. Coleta de Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Entreviste os envolvidos no processo</p>
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Observe o processo em execução</p>
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Revise documentação existente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                3. Documentação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Desenhe o fluxo atual (AS-IS)</p>
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Identifique gargalos e desperdícios</p>
              <p><CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> Proponha melhorias (TO-BE)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Boas Práticas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Use símbolos padronizados (BPMN)</p>
              <p>• Mantenha a simplicidade</p>
              <p>• Documente decisões e exceções</p>
              <p>• Valide com os stakeholders</p>
              <p>• Revise periodicamente</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
