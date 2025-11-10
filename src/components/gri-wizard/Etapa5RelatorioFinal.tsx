import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Etapa5Props {
  reportId?: string;
}

export function Etapa5RelatorioFinal({ reportId }: Etapa5Props) {
  const completionItems = [
    { label: 'Informações Organizacionais', completed: true },
    { label: 'Indicadores GRI Universais', completed: true },
    { label: 'Indicadores Ambientais', completed: true },
    { label: 'Indicadores Sociais', completed: false },
    { label: 'Indicadores de Governança', completed: true },
    { label: 'Índice GRI', completed: true },
    { label: 'Glossário', completed: false },
  ];

  const completionPercentage = (completionItems.filter(i => i.completed).length / completionItems.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Completude do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-2xl font-bold">{completionPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="space-y-2 mt-6">
              {completionItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Badge variant={item.completed ? 'default' : 'secondary'}>
                    {item.completed ? 'Completo' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Índice GRI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Índice completo de indicadores GRI utilizados neste relatório
          </p>
          <div className="space-y-2">
            {['GRI 2: Conteúdos Gerais', 'GRI 302: Energia', 'GRI 305: Emissões', 'GRI 403: Saúde e Segurança', 'GRI 405: Diversidade'].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{item}</span>
                <Badge variant="outline">Aplicável</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
