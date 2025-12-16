import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { SupplierPortalLayout } from '@/components/supplier-portal/SupplierPortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList, CheckCircle, Clock, Play, Calendar } from 'lucide-react';
import { getSupplierSurveysForPortal, startSurveyResponse, completeSurveyResponse } from '@/services/supplierPortalService';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SupplierSurveys() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { supplier, isAuthenticated, isLoading: authLoading } = useSupplierAuth();
  
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/fornecedor/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    async function loadSurveys() {
      if (!supplier) return;
      
      try {
        const data = await getSupplierSurveysForPortal(supplier.id, supplier.company_id);
        setSurveys(data);
      } catch (error) {
        console.error('Error loading surveys:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (supplier) {
      loadSurveys();
    }
  }, [supplier]);

  const getStatus = (survey: any) => {
    if (!survey.response) return 'Pendente';
    return survey.response.status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Concluído</Badge>;
      case 'Em Andamento':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" />Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getDueDate = (survey: any) => {
    if (survey.end_date) {
      return new Date(survey.end_date);
    }
    if (survey.due_days && survey.response?.started_at) {
      return addDays(new Date(survey.response.started_at), survey.due_days);
    }
    return null;
  };

  const isOverdue = (survey: any) => {
    const dueDate = getDueDate(survey);
    if (!dueDate) return false;
    return isAfter(new Date(), dueDate) && getStatus(survey) !== 'Concluído';
  };

  const handleStart = async (survey: any) => {
    if (!supplier) return;
    
    setActionLoading(survey.id);
    try {
      await startSurveyResponse(supplier.id, survey.id);
      setSurveys(surveys.map(s => 
        s.id === survey.id 
          ? { ...s, response: { status: 'Em Andamento', started_at: new Date().toISOString() } }
          : s
      ));
      toast({
        title: 'Pesquisa iniciada',
        description: 'Você pode responder a pesquisa agora.'
      });
      
      // If has custom form, redirect to it
      if (survey.custom_form_id) {
        window.open(`/formulario/${survey.custom_form_id}`, '_blank');
      }
    } catch (error) {
      console.error('Error starting survey:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar pesquisa',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (survey: any) => {
    if (!supplier) return;
    
    setActionLoading(survey.id);
    try {
      await completeSurveyResponse(supplier.id, survey.id);
      setSurveys(surveys.map(s => 
        s.id === survey.id 
          ? { ...s, response: { ...s.response, status: 'Concluído', completed_at: new Date().toISOString() } }
          : s
      ));
      toast({
        title: 'Pesquisa concluída!',
        description: 'Obrigado por responder.'
      });
    } catch (error) {
      console.error('Error completing survey:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao concluir pesquisa',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingSurveys = surveys.filter(s => getStatus(s) !== 'Concluído');
  const completedSurveys = surveys.filter(s => getStatus(s) === 'Concluído');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pesquisas e Questionários</h1>
          <p className="text-muted-foreground">Responda às pesquisas e avaliações disponíveis</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : surveys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma pesquisa disponível</h3>
              <p className="text-muted-foreground">
                Não há pesquisas para responder no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingSurveys.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="destructive">{pendingSurveys.length}</Badge>
                  Pendentes
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingSurveys.map((survey) => {
                    const status = getStatus(survey);
                    const dueDate = getDueDate(survey);
                    const overdue = isOverdue(survey);
                    
                    return (
                      <Card 
                        key={survey.id} 
                        className={overdue ? 'border-red-300 bg-red-50/50' : 'border-orange-200 bg-orange-50/50'}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-purple-600" />
                                {survey.title}
                              </CardTitle>
                              <CardDescription className="mt-1">{survey.description}</CardDescription>
                            </div>
                            {getStatusBadge(status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4 text-sm">
                            {survey.is_mandatory && (
                              <Badge variant="destructive">Obrigatório</Badge>
                            )}
                            {dueDate && (
                              <div className={`flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                                <Calendar className="h-4 w-4" />
                                {overdue ? 'Vencido em ' : 'Prazo: '}
                                {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {status === 'Pendente' && (
                              <Button 
                                onClick={() => handleStart(survey)}
                                disabled={actionLoading === survey.id}
                              >
                                {actionLoading === survey.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="mr-2 h-4 w-4" />
                                )}
                                Iniciar
                              </Button>
                            )}
                            {status === 'Em Andamento' && (
                              <>
                                {survey.custom_form_id && (
                                  <Button variant="outline" asChild>
                                    <a href={`/formulario/${survey.custom_form_id}`} target="_blank" rel="noopener noreferrer">
                                      Continuar Respondendo
                                    </a>
                                  </Button>
                                )}
                                <Button 
                                  onClick={() => handleComplete(survey)}
                                  disabled={actionLoading === survey.id}
                                >
                                  {actionLoading === survey.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Marcar como Concluído
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {completedSurveys.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">{completedSurveys.length}</Badge>
                  Concluídas
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {completedSurveys.map((survey) => (
                    <Card key={survey.id} className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              {survey.title}
                            </CardTitle>
                            <CardDescription className="mt-1">{survey.description}</CardDescription>
                          </div>
                          {getStatusBadge('Concluído')}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Concluída em {format(new Date(survey.response.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SupplierPortalLayout>
  );
}
