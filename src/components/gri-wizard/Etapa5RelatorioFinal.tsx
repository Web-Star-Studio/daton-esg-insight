import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, FileText } from 'lucide-react';
import { GRIContentIndexGenerator } from '@/components/gri/GRIContentIndexGenerator';
import { GRIContentIndexTable } from '@/components/gri/GRIContentIndexTable';
import { ReportTemplateSelector } from '@/components/reports/ReportTemplateSelector';
import { SectionGenerationProgress } from '@/components/reports/SectionGenerationProgress';
import { GeneratedSectionViewer } from '@/components/reports/GeneratedSectionViewer';
import { ReportExportDialog } from '@/components/reports/ReportExportDialog';

interface Etapa5Props {
  reportId?: string;
}

export function Etapa5RelatorioFinal({ reportId }: Etapa5Props) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  return (
    <div className="space-y-6">
      {reportId && (
        <>
          <GRIContentIndexGenerator reportId={reportId} />
          <GRIContentIndexTable reportId={reportId} />

          {!isGenerating && !generationComplete && (
            <ReportTemplateSelector
              reportId={reportId}
              onSectionsSelected={(keys) => {
                setSelectedTemplates(keys);
                setIsGenerating(true);
              }}
            />
          )}

          {isGenerating && (
            <SectionGenerationProgress
              reportId={reportId}
              templateKeys={selectedTemplates}
              onComplete={() => {
                setIsGenerating(false);
                setGenerationComplete(true);
              }}
            />
          )}

          {generationComplete && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Seções Geradas</CardTitle>
                  <ReportExportDialog reportId={reportId} />
                </div>
              </CardHeader>
              <CardContent>
                <GeneratedSectionViewer reportId={reportId} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
