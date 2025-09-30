import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, FileText, Users, AlertCircle, BarChart3, Map, Settings } from 'lucide-react';

export function ProcessIntegrationTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Integração com Outros Módulos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Gestão de Stakeholders</p>
                <p className="text-sm text-muted-foreground">
                  Vincule partes interessadas aos processos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Gestão de Riscos</p>
                <p className="text-sm text-muted-foreground">
                  Identifique e monitore riscos por processo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Indicadores de Performance</p>
                <p className="text-sm text-muted-foreground">
                  Monitore KPIs específicos por processo
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recursos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Map className="h-4 w-4" />
              Biblioteca de Templates
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <FileText className="h-4 w-4" />
              Guia de Mapeamento
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios de Processo
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Configurações Avançadas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
