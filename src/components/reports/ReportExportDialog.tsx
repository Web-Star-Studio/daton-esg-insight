import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getGeneratedSections } from '@/services/reportSectionGeneration';
import { exportReportToWord, exportReportToPDF } from '@/services/reportExport';
import { toast } from 'sonner';

interface ReportExportDialogProps {
  reportId: string;
}

interface ExportOptions {
  format: 'word' | 'pdf';
  includeVisuals: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
}

export function ReportExportDialog({ reportId }: ReportExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'word',
    includeVisuals: true,
    includeCoverPage: true,
    includeTableOfContents: true,
  });

  const { data: sections } = useQuery({
    queryKey: ['generated-sections', reportId],
    queryFn: () => getGeneratedSections(reportId),
    enabled: open,
  });

  const handleExport = async () => {
    if (!sections || sections.length === 0) {
      toast.error('Nenhuma seção disponível para exportar');
      return;
    }

    setIsExporting(true);
    try {
      if (options.format === 'word') {
        await exportReportToWord(reportId, sections, options);
        toast.success('Relatório exportado em Word com sucesso!');
      } else {
        await exportReportToPDF(reportId, sections, options);
        toast.success('Relatório exportado em PDF com sucesso!');
      }
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Configure as opções de exportação do seu relatório de sustentabilidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Formato de Exportação</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => setOptions({ ...options, format: value as 'word' | 'pdf' })}
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="word" id="word" />
                <Label htmlFor="word" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Word (.docx)</div>
                    <div className="text-xs text-muted-foreground">Editável - Recomendado</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileSpreadsheet className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium">PDF (.pdf)</div>
                    <div className="text-xs text-muted-foreground">Somente leitura</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Opções de Conteúdo</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visuals"
                  checked={options.includeVisuals}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeVisuals: checked as boolean })
                  }
                />
                <Label htmlFor="visuals" className="cursor-pointer">
                  Incluir gráficos e visuais
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cover"
                  checked={options.includeCoverPage}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeCoverPage: checked as boolean })
                  }
                />
                <Label htmlFor="cover" className="cursor-pointer">
                  Incluir capa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="toc"
                  checked={options.includeTableOfContents}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeTableOfContents: checked as boolean })
                  }
                />
                <Label htmlFor="toc" className="cursor-pointer">
                  Incluir sumário
                </Label>
              </div>
            </div>
          </div>

          {sections && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div className="font-medium mb-1">Resumo da Exportação:</div>
                <div className="text-muted-foreground">
                  • {sections.length} seções serão exportadas
                  {options.includeVisuals && (
                    <>
                      <br />• Aproximadamente {sections.reduce((acc, s) => acc + (s.generated_visuals?.length || 0), 0)} visuais incluídos
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>Exportando...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
