import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface ProcessMappingHeaderProps {
  isCreateProcessOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newProcessData: {
    name: string;
    description: string;
    process_type: string;
  };
  onDataChange: (data: any) => void;
  onCreateProcess: () => void;
  isCreating: boolean;
}

export function ProcessMappingHeader({
  isCreateProcessOpen,
  onOpenChange,
  newProcessData,
  onDataChange,
  onCreateProcess,
  isCreating,
}: ProcessMappingHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Mapeamento de Processos</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e gerencie todos os processos da sua organização de forma integrada
        </p>
      </div>
      
      <Dialog open={isCreateProcessOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Processo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Processo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Processo</Label>
              <Input
                id="name"
                value={newProcessData.name}
                onChange={(e) => onDataChange({ ...newProcessData, name: e.target.value })}
                placeholder="Ex: Atendimento ao Cliente, Processo de Vendas"
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo de Processo</Label>
              <Select
                value={newProcessData.process_type}
                onValueChange={(value) => onDataChange({ ...newProcessData, process_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estratégico">Estratégico</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Apoio">Apoio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newProcessData.description}
                onChange={(e) => onDataChange({ ...newProcessData, description: e.target.value })}
                placeholder="Descrição detalhada do processo e seus objetivos"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={onCreateProcess} 
                disabled={isCreating}
              >
                {isCreating ? 'Criando...' : 'Criar Processo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
