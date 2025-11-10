import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, XCircle, FileText } from 'lucide-react';
import { generateReportSection } from '@/services/reportSectionGeneration';
import { toast } from 'sonner';

interface SectionGenerationProgressProps {
  reportId: string;
  templateKeys: string[];
  onComplete: () => void;
}

type ProgressStatus = 'pending' | 'generating' | 'completed' | 'error';

export function SectionGenerationProgress({
  reportId,
  templateKeys,
  onComplete,
}: SectionGenerationProgressProps) {
  const [progress, setProgress] = useState<Record<string, ProgressStatus>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    generateSections();
  }, []);

  const generateSections = async () => {
    const initialProgress: Record<string, ProgressStatus> = {};
    templateKeys.forEach(key => {
      initialProgress[key] = 'pending';
    });
    setProgress(initialProgress);

    for (let i = 0; i < templateKeys.length; i++) {
      const templateKey = templateKeys[i];
      setCurrentIndex(i);
      setProgress(prev => ({ ...prev, [templateKey]: 'generating' }));

      try {
        await generateReportSection(reportId, templateKey, false);
        setProgress(prev => ({ ...prev, [templateKey]: 'completed' }));
        toast.success(`Seção "${getTemplateName(templateKey)}" gerada com sucesso`);
      } catch (error) {
        console.error(`Error generating section ${templateKey}:`, error);
        setProgress(prev => ({ ...prev, [templateKey]: 'error' }));
        toast.error(`Erro ao gerar seção "${getTemplateName(templateKey)}"`);
      }

      // Pequena pausa entre gerações
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    onComplete();
  };

  const getTemplateName = (key: string) => {
    const names: Record<string, string> = {
      vision_sustainability_strategy: '1. Visão e Estratégia',
      corporate_governance: '2. Governança Corporativa',
      environmental_management: '3. Gestão Ambiental',
      social_performance: '4. Desempenho Social',
      economic_performance: '5. Desempenho Econômico',
      stakeholder_engagement: '6. Stakeholders',
      innovation_technology: '7. Inovação',
      reporting_standards: '8. Relatórios e Normas',
      communication_transparency: '9. Comunicação',
      audits_assessments: '10. Auditorias',
    };
    return names[key] || key;
  };

  const getStatusIcon = (status: ProgressStatus) => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const completedCount = Object.values(progress).filter(s => s === 'completed').length;
  const progressPercentage = (completedCount / templateKeys.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Gerando Seções do Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-medium">{completedCount} de {templateKeys.length} seções</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {templateKeys.map((key, index) => {
            const status = progress[key] || 'pending';
            return (
              <div
                key={key}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                  index === currentIndex ? 'border-primary bg-primary/5' : ''
                }`}
              >
                {getStatusIcon(status)}
                <div className="flex-1">
                  <div className="font-medium">{getTemplateName(key)}</div>
                  <div className="text-sm text-muted-foreground">
                    {status === 'generating' && 'Gerando conteúdo com IA...'}
                    {status === 'completed' && 'Concluído'}
                    {status === 'error' && 'Erro ao gerar'}
                    {status === 'pending' && 'Aguardando'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
