import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { getGeneratedSections, updateGeneratedSection, deleteGeneratedSection, generateReportSection } from '@/services/reportSectionGeneration';
import { VisualRenderer } from './VisualRenderer';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface GeneratedSectionViewerProps {
  reportId: string;
}

export function GeneratedSectionViewer({ reportId }: GeneratedSectionViewerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ['generated-sections', reportId],
    queryFn: () => getGeneratedSections(reportId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      updateGeneratedSection(id, { generated_text: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-sections', reportId] });
      setEditingId(null);
      toast.success('Seção atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar seção');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (templateKey: string) => generateReportSection(reportId, templateKey, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-sections', reportId] });
      toast.success('Seção regenerada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao regenerar seção');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGeneratedSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-sections', reportId] });
      toast.success('Seção removida');
    },
    onError: () => {
      toast.error('Erro ao remover seção');
    },
  });

  const handleEdit = (section: any) => {
    setEditingId(section.id);
    setEditedText(section.generated_text);
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({ id, text: editedText });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedText('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Nenhuma seção gerada ainda. Selecione as seções acima para começar.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section: any) => {
        const isEditing = editingId === section.id;
        const template = section.template;

        return (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template?.template_name || 'Seção'}
                    {section.approved && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprovado
                      </Badge>
                    )}
                    {section.manually_edited && (
                      <Badge variant="secondary">Editado</Badge>
                    )}
                  </CardTitle>
                  {template?.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => handleSave(section.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateMutation.mutate(template?.template_key)}
                        disabled={regenerateMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{section.generated_text}</ReactMarkdown>
                </div>
              )}

              {!isEditing && section.generated_visuals && section.generated_visuals.length > 0 && (
                <div className="space-y-6 pt-4 border-t">
                  {section.generated_visuals.map((visual: any, idx: number) => (
                    <VisualRenderer key={idx} visual={visual} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
