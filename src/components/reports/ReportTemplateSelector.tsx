import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2 } from 'lucide-react';
import { getReportTemplates, ReportSectionTemplate } from '@/services/reportSectionGeneration';

interface ReportTemplateSelectorProps {
  reportId: string;
  onSectionsSelected: (templateKeys: string[]) => void;
}

export function ReportTemplateSelector({ reportId, onSectionsSelected }: ReportTemplateSelectorProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  const { data: templates, isLoading } = useQuery({
    queryKey: ['report-templates'],
    queryFn: getReportTemplates,
  });

  const toggleTemplate = (templateKey: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateKey)) {
        newSet.delete(templateKey);
      } else {
        newSet.add(templateKey);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (templates) {
      setSelectedTemplates(new Set(templates.map(t => t.template_key)));
    }
  };

  const clearAll = () => {
    setSelectedTemplates(new Set());
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      strategy: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      governance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      environmental: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      social: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      economic: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      stakeholders: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      innovation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      reporting: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      communication: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      audits: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Selecione as Seções do Relatório
            </CardTitle>
            <CardDescription>
              Escolha quais seções você deseja incluir no seu relatório de sustentabilidade
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Selecionar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {templates?.map((template: ReportSectionTemplate) => {
            const isSelected = selectedTemplates.has(template.template_key);
            return (
              <div
                key={template.id}
                className={`flex items-start gap-3 p-4 border rounded-lg transition-all cursor-pointer hover:border-primary ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleTemplate(template.template_key)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleTemplate(template.template_key)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{template.template_name}</h4>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.visual_types.length} tipos de visuais
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedTemplates.size} de {templates?.length} seções selecionadas
          </div>
          <Button
            onClick={() => onSectionsSelected(Array.from(selectedTemplates))}
            disabled={selectedTemplates.size === 0}
            size="lg"
          >
            Gerar {selectedTemplates.size} Seções
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
