import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Eye, Calendar, User } from 'lucide-react';
import { customFormsService } from '@/services/customForms';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeFormsTabProps {
  employeeId: string;
  employeeName: string;
}

interface FormSubmission {
  id: string;
  form_id: string;
  submission_data: Record<string, unknown>;
  submitted_at: string;
  form?: {
    id: string;
    title: string;
    description?: string;
  };
  submitted_by?: {
    id?: string;
    full_name: string;
  };
}

export function EmployeeFormsTab({ employeeId, employeeName }: EmployeeFormsTabProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['employee-form-submissions', employeeId],
    queryFn: () => customFormsService.getEmployeeSubmissions(employeeId),
    enabled: !!employeeId,
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const renderSubmissionValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formulários Respondidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formulários Respondidos
          </CardTitle>
          <CardDescription>
            Formulários customizados vinculados a {employeeName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum formulário vinculado</h3>
              <p className="text-muted-foreground">
                Este funcionário ainda não possui formulários respondidos vinculados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission: FormSubmission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{submission.form?.title || 'Formulário'}</h4>
                    {submission.form?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {submission.form.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(submission.submitted_at)}
                      </span>
                      {submission.submitted_by && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {submission.submitted_by.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {Object.keys(submission.submission_data).length} campos
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedSubmission?.form?.title || 'Detalhes do Formulário'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedSubmission && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Enviado em {formatDate(selectedSubmission.submitted_at)}
                  </span>
                  {selectedSubmission.submitted_by && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Por {selectedSubmission.submitted_by.full_name}
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {Object.entries(selectedSubmission.submission_data).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        {key}
                      </label>
                      <p className="text-sm bg-muted/50 p-2 rounded">
                        {renderSubmissionValue(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}