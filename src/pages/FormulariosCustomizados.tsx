import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Users, Edit, Trash2, BarChart3, QrCode, Eye, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { customFormsService, type CustomForm } from "@/services/customForms";
import { FormBuilderModal } from "@/components/FormBuilderModal";
import { FormShareModal } from "@/components/FormShareModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ROUTE_PATHS } from "@/constants/routePaths";


export default function FormulariosCustomizados() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [shareForm, setShareForm] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  // SEO
  useEffect(() => {
    document.title = 'Formulários Customizados | Criação e Gestão de Formulários';
    const desc = 'Crie, gerencie e colete dados através de formulários personalizados com interface drag-and-drop.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/formularios-customizados`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, []);

  // Load forms on mount - ProtectedRoute guarantees auth
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await customFormsService.getForms();
      setForms(data);
    } catch (error: any) {
      console.error('Erro ao carregar formulários:', error);
      
      const isConnectionError = error?.message?.includes('Failed to fetch') || 
                                error?.message?.includes('502') ||
                                error?.message?.includes('timeout') ||
                                error?.message?.includes('múltiplas tentativas');
      
      setLoadError(isConnectionError 
        ? 'Erro de conexão. Verifique sua internet e tente novamente.'
        : 'Erro ao carregar formulários customizados');
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

  const handleOpenDashboard = (formId: string) => {
    navigate(ROUTE_PATHS.DATA.FORM_DASHBOARD(formId));
  };

  const handleShareForm = (form: CustomForm) => {
    setShareForm({ id: form.id, title: form.title });
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
      <>
        <div className="flex items-center justify-between mb-6">
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
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formulários Customizados</h1>
            <p className="text-muted-foreground">
              Crie, gerencie e colete dados através de formulários personalizados
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar</h3>
            <p className="text-muted-foreground mb-4">{loadError}</p>
            <Button onClick={loadForms} disabled={loading}>
              <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formulários Customizados</h1>
          <p className="text-muted-foreground">
            Crie, gerencie e colete dados através de formulários personalizados
          </p>
        </div>
        <Button onClick={handleCreateForm} className="shrink-0 w-full sm:w-auto justify-center whitespace-nowrap">
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
                      <div className="flex items-center gap-2">
                        <Badge variant={form.is_published ? "default" : "secondary"}>
                          {form.is_published ? "Publicado" : "Rascunho"}
                        </Badge>
                        {form.is_published && (
                          <Badge variant={(form as any).is_public ? "outline" : "secondary"}>
                            {(form as any).is_public ? "Público" : "Interno"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {form.submission_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(form.updated_at)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {form.is_published && (form as any).is_public && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareForm(form)}
                          title="Compartilhar formulário (QR Code e Link)"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDashboard(form.id)}
                        title="Ver dashboard de respostas"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditForm(form)}
                        title="Editar formulário"
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


      {shareForm && (
        <FormShareModal
          open={!!shareForm}
          onClose={() => setShareForm(null)}
          formId={shareForm.id}
          formTitle={shareForm.title}
        />
      )}
    </>
  );
}