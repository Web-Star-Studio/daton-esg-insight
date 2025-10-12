import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, CheckSquare, TrendingUp, FolderOpen, Download, Loader2 } from 'lucide-react';
import { REPORT_TEMPLATES, generateLicenseReport, downloadReport } from '@/services/licenseReports';
import { toast } from 'sonner';
import type { LicenseDetail } from '@/services/licenses';
import type { ReportConfig, ReportType, ReportFormat } from '@/types/licenseReport';

interface LicenseReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  license: LicenseDetail;
}

export const LicenseReportGenerator: React.FC<LicenseReportGeneratorProps> = ({
  isOpen,
  onClose,
  license,
}) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    type: 'executive',
    format: 'pdf',
    sections: {
      license_info: true,
      conditions: true,
      alerts: true,
      documents: true,
      history: false,
    },
    options: {
      include_charts: true,
      include_watermark: false,
      digital_signature: false,
    },
  });

  const icons = {
    executive: FileText,
    conditions_detailed: CheckSquare,
    compliance: TrendingUp,
    renewal_dossier: FolderOpen,
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const report = await generateLicenseReport(license.id, license, config);
      
      // Auto-download
      if (config.format === 'pdf' && report.file_path_pdf) {
        await downloadReport(report.file_path_pdf, `relatorio_${config.type}_${license.name}.pdf`);
      } else if (config.format === 'excel' && report.file_path_xlsx) {
        await downloadReport(report.file_path_xlsx, `relatorio_${config.type}_${license.name}.xlsx`);
      }
      
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Gerar Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">1. Tipo de Relatório</Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(REPORT_TEMPLATES).map(([key, template]) => {
                const Icon = icons[key as keyof typeof icons];
                return (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      config.type === key ? 'border-primary border-2' : ''
                    }`}
                    onClick={() => setConfig({ ...config, type: key as ReportType })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{template.title}</h4>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            ~{template.estimatedPages} páginas
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">2. Formato</Label>
            <RadioGroup
              value={config.format}
              onValueChange={(value) => setConfig({ ...config, format: value as ReportFormat })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer">Excel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="cursor-pointer">Ambos (PDF + Excel)</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Sections Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">3. Seções a Incluir</Label>
            <div className="space-y-2">
              {Object.entries(config.sections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        sections: { ...config.sections, [key]: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor={key} className="cursor-pointer capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">4. Opções Avançadas</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_charts"
                  checked={config.options.include_charts}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      options: { ...config.options, include_charts: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="include_charts" className="cursor-pointer">
                  Incluir gráficos e visualizações
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_watermark"
                  checked={config.options.include_watermark}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      options: { ...config.options, include_watermark: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="include_watermark" className="cursor-pointer">
                  Incluir marca d'água "CONFIDENCIAL"
                </Label>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Resumo do Relatório</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Tipo:</span>{' '}
                <span className="font-medium">{REPORT_TEMPLATES[config.type].title}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Formato:</span>{' '}
                <span className="font-medium uppercase">{config.format}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Licença:</span>{' '}
                <span className="font-medium">{license.name}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
