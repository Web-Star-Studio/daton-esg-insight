import { useState, useEffect } from "react";
import { Plus, FileText, Users, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { customFormsService, type CustomForm } from "@/services/customForms";
import { FormBuilderModal } from "@/components/FormBuilderModal";
import { FormSubmissionsModal } from "@/components/FormSubmissionsModal";
import { MainLayout } from "@/components/MainLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function FormulariosCustomizados() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [submissionsFormId, setSubmissionsFormId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await customFormsService.getForms();
      setForms(data);
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar formulários customizados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    setEditingForm(null);
    setBuilderOpen(true);
  };

  const handleEditForm = (form: CustomForm) => {
    setEditingForm(form);
    setBuilderOpen(true);
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      await customFormsService.deleteForm(formId);
      toast({
        title: "Sucesso",
        description: "Formulário excluído com sucesso",
      });
      loadForms();
    } catch (error) {
      console.error('Erro ao excluir formulário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir formulário",
        variant: "destructive",
      });
    }
  };

  const handleFormSaved = () => {
    setBuilderOpen(false);
    setEditingForm(null);
    loadForms();
  };

  const handleViewSubmissions = (formId: string) => {
    setSubmissionsFormId(formId);
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
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formulários Customizados</h1>
            <p className="text-muted-foreground">
              Crie, gerencie e colete dados através de formulários personalizados
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formulários Customizados</h1>
          <p className="text-muted-foreground">
            Crie, gerencie e colete dados através de formulários personalizados
          </p>
        </div>
        <Button onClick={handleCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Formulário
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Formulários</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formulários Publicados</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.filter(form => form.is_published).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.reduce((total, form) => total + (form.submission_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Formulários</CardTitle>
          <CardDescription>
            Gerencie seus formulários customizados e visualize suas estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum formulário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro formulário customizado para começar a coletar dados
              </p>
              <Button onClick={handleCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Formulário
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{form.title}</div>
                        {form.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {form.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.is_published ? "default" : "secondary"}>
                        {form.is_published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {form.submission_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(form.updated_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSubmissions(form.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditForm(form)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o formulário "{form.title}"? 
                              Esta ação não pode ser desfeita e todas as respostas serão perdidas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteForm(form.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <FormBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        editingForm={editingForm}
        onFormSaved={handleFormSaved}
      />

      {submissionsFormId && (
        <FormSubmissionsModal
          formId={submissionsFormId}
          open={!!submissionsFormId}
          onClose={() => setSubmissionsFormId(null)}
        />
      )}
      </div>
    </MainLayout>
  );
}