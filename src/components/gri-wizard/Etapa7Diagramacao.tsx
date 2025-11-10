import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Globe } from 'lucide-react';
import { toast } from 'sonner';

export function Etapa7Diagramacao() {
  const handleExport = (format: string) => {
    toast.success(`Exportando relatório em formato ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Logo da Empresa</Label>
            <Input type="file" accept="image/*" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor Primária</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" className="w-16 h-10" defaultValue="#0066cc" />
                <Input value="#0066cc" readOnly />
              </div>
            </div>
            <div>
              <Label>Cor Secundária</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" className="w-16 h-10" defaultValue="#00cc66" />
                <Input value="#00cc66" readOnly />
              </div>
            </div>
          </div>

          <div>
            <Label>Fonte Principal</Label>
            <Select defaultValue="inter">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="opensans">Open Sans</SelectItem>
                <SelectItem value="lato">Lato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Template de Layout</Label>
            <Select defaultValue="corporativo">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimalista">Minimalista</SelectItem>
                <SelectItem value="corporativo">Corporativo</SelectItem>
                <SelectItem value="criativo">Criativo</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => handleExport('pdf')} className="h-20">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>PDF (Impressão)</span>
              </div>
            </Button>

            <Button onClick={() => handleExport('pdf-a')} variant="outline" className="h-20">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>PDF/A (Arquivo)</span>
              </div>
            </Button>

            <Button onClick={() => handleExport('html')} variant="outline" className="h-20">
              <div className="flex flex-col items-center gap-2">
                <Globe className="h-6 w-6" />
                <span>HTML (Web)</span>
              </div>
            </Button>

            <Button onClick={() => handleExport('docx')} variant="outline" className="h-20">
              <div className="flex flex-col items-center gap-2">
                <Download className="h-6 w-6" />
                <span>Word (Edição)</span>
              </div>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              O relatório final incluirá: capa personalizada, índice interativo, numeração automática,
              gráficos integrados, tabelas de indicadores GRI e contracapa com QR Code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
