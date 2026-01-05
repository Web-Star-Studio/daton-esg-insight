import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { customFormsService, type CustomForm, type FormSubmission } from "@/services/customForms";
import { Download, Users, Calendar, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FormSubmissionsModalProps {
  formId: string;
  open: boolean;
  onClose: () => void;
}

export function FormSubmissionsModal({ formId, open, onClose }: FormSubmissionsModalProps) {
  const [form, setForm] = useState<CustomForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && formId) {
      loadData();
    }
  }, [open, formId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formData, submissionsData] = await Promise.all([
        customFormsService.getForm(formId),
        customFormsService.getFormSubmissions(formId)
      ]);
      
      setForm(formData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do formulário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      setDeletingId(submissionId);
      await customFormsService.deleteSubmission(submissionId);
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({
        title: "Sucesso",
        description: "Resposta excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir resposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir resposta",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportToExcel = async () => {
    if (!form || submissions.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const fields = form.structure_json.fields;
      const headers = ['Data de Submissão', 'Usuário', ...fields.map(f => f.label)];
      
      const csvContent = [
        headers.join(','),
        ...submissions.map(submission => {
          const row = [
            new Date(submission.submitted_at).toLocaleDateString('pt-BR'),
            submission.submitted_by?.full_name || 'Usuário não encontrado',
            ...fields.map(field => {
              const value = submission.submission_data[field.id];
              if (Array.isArray(value)) {
                return `"${value.join(', ')}"`;
              }
              return `"${value || ''}"`;
            })
          ];
          return row.join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${form.title}_respostas.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Sucesso",
        description: "Arquivo exportado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados",
        variant: "destructive",
      });
    }
  };

  const formatValue = (value: any, fieldType: string) => {
    if (value === null || value === undefined) return '-';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (fieldType === 'date' && value) {
      return new Date(value).toLocaleDateString('pt-BR');
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    
    return String(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!form) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Formulário não encontrado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p>Não foi possível carregar os dados do formulário.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Respostas para: {form.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status do Formulário</CardTitle>
                <Badge variant={form.is_published ? "default" : "secondary"}>
                  {form.is_published ? "Publicado" : "Rascunho"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {form.structure_json.fields.length} campos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Última Resposta</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {submissions.length > 0 
                    ? formatDate(submissions[0].submitted_at)
                    : 'Nenhuma resposta'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={handleExportToExcel} disabled={submissions.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar para CSV
            </Button>
          </div>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Respostas Coletadas</CardTitle>
              <CardDescription>
                Visualize todas as respostas enviadas para este formulário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma resposta encontrada</h3>
                  <p className="text-muted-foreground">
                    Este formulário ainda não recebeu nenhuma resposta.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Usuário</TableHead>
                        {form.structure_json.fields.map((field) => (
                          <TableHead key={field.id}>{field.label}</TableHead>
                        ))}
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                          <TableCell>
                            {submission.submitted_by?.full_name || 'Usuário não encontrado'}
                          </TableCell>
                          {form.structure_json.fields.map((field) => (
                            <TableCell key={field.id}>
                              {formatValue(submission.submission_data[field.id], field.type)}
                            </TableCell>
                          ))}
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === submission.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A resposta será permanentemente removida do sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteSubmission(submission.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}