import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Settings } from 'lucide-react';

export function ProcessMethodologyTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metodologia SIPOC
          </CardTitle>
          <CardDescription>
            Suppliers, Inputs, Process, Outputs, Customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            O SIPOC é uma ferramenta de mapeamento que identifica todos os elementos relevantes 
            de um processo antes de começar o trabalho de melhoria.
          </p>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-primary/10 p-2 rounded">Fornecedores</div>
            <div className="bg-secondary/10 p-2 rounded">Entradas</div>
            <div className="bg-accent/10 p-2 rounded">Processo</div>
            <div className="bg-primary/10 p-2 rounded">Saídas</div>
            <div className="bg-secondary/10 p-2 rounded">Clientes</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Diagrama de Tartaruga
          </CardTitle>
          <CardDescription>
            Análise completa dos elementos do processo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            O Diagrama de Tartaruga oferece uma visão holística do processo, 
            incluindo recursos, métodos, medições e riscos.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex gap-2">
              <div className="bg-primary/10 p-1 px-2 rounded">Entradas</div>
              <div className="bg-secondary/10 p-1 px-2 rounded">Saídas</div>
            </div>
            <div className="flex gap-2">
              <div className="bg-accent/10 p-1 px-2 rounded">Recursos</div>
              <div className="bg-primary/10 p-1 px-2 rounded">Métodos</div>
            </div>
            <div className="flex gap-2">
              <div className="bg-secondary/10 p-1 px-2 rounded">Medições</div>
              <div className="bg-accent/10 p-1 px-2 rounded">Riscos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
