import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { SupplierPortalLayout } from '@/components/supplier-portal/SupplierPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, FileText, ClipboardList, AlertCircle, ArrowRight } from 'lucide-react';
import { getSupplierTrainingsForPortal, getSupplierReadings, getSupplierSurveysForPortal } from '@/services/supplierPortalService';

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const { supplier, isAuthenticated, mustChangePassword, isLoading: authLoading } = useSupplierAuth();
  
  const [trainings, setTrainings] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/fornecedor/login');
    } else if (!authLoading && mustChangePassword) {
      navigate('/fornecedor/alterar-senha');
    }
  }, [isAuthenticated, mustChangePassword, authLoading, navigate]);

  useEffect(() => {
    async function loadData() {
      if (!supplier) return;
      
      try {
        const [trainingsData, readingsData, surveysData] = await Promise.all([
          getSupplierTrainingsForPortal(supplier.id, supplier.company_id),
          getSupplierReadings(supplier.id, supplier.company_id),
          getSupplierSurveysForPortal(supplier.id, supplier.company_id)
        ]);
        
        setTrainings(trainingsData);
        setReadings(readingsData);
        setSurveys(surveysData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (supplier) {
      loadData();
    }
  }, [supplier]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingTrainings = trainings.filter(t => !t.progress || t.progress.status !== 'Concluído');
  const pendingReadings = readings.filter(r => !r.confirmed);
  const pendingSurveys = surveys.filter(s => !s.response || s.response.status !== 'Concluído');

  const summaryCards = [
    {
      title: 'Treinamentos',
      icon: BookOpen,
      pending: pendingTrainings.length,
      total: trainings.length,
      path: '/fornecedor/treinamentos',
      color: 'text-blue-600'
    },
    {
      title: 'Leituras',
      icon: FileText,
      pending: pendingReadings.length,
      total: readings.length,
      path: '/fornecedor/leituras',
      color: 'text-green-600'
    },
    {
      title: 'Pesquisas',
      icon: ClipboardList,
      pending: pendingSurveys.length,
      total: surveys.length,
      path: '/fornecedor/pesquisas',
      color: 'text-purple-600'
    }
  ];

  const pendingActions = [
    ...pendingReadings.slice(0, 2).map(r => ({
      type: 'reading' as const,
      title: r.title,
      label: 'Leitura obrigatória',
      path: '/fornecedor/leituras'
    })),
    ...pendingTrainings.slice(0, 2).map(t => ({
      type: 'training' as const,
      title: t.title,
      label: 'Treinamento',
      path: '/fornecedor/treinamentos'
    })),
    ...pendingSurveys.slice(0, 2).map(s => ({
      type: 'survey' as const,
      title: s.title,
      label: 'Pesquisa',
      path: '/fornecedor/pesquisas'
    }))
  ].slice(0, 5);

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo, {supplier?.name}</h1>
          <p className="text-muted-foreground">Confira suas atividades pendentes e acesse os recursos disponíveis</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <Card 
                  key={card.title} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(card.path)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-bold">{card.pending}</span>
                          <span className="text-muted-foreground">/ {card.total}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
                      </div>
                      <div className={`p-3 rounded-full bg-muted ${card.color}`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Ações Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingActions.map((action, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {action.label}
                          </Badge>
                          <span className="font-medium">{action.title}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(action.path)}
                        >
                          Acessar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Navigation */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/fornecedor/treinamentos')}
              >
                <CardContent className="pt-6 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                  <h3 className="font-semibold">Treinamentos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Acesse os cursos e materiais de capacitação
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/fornecedor/leituras')}
              >
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-green-600 mb-3" />
                  <h3 className="font-semibold">Leituras Obrigatórias</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Documentos importantes para leitura
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/fornecedor/pesquisas')}
              >
                <CardContent className="pt-6 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-purple-600 mb-3" />
                  <h3 className="font-semibold">Pesquisas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Responda questionários e avaliações
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </SupplierPortalLayout>
  );
}
