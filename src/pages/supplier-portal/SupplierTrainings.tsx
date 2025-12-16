import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { SupplierPortalLayout } from '@/components/supplier-portal/SupplierPortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen, Play, CheckCircle, Clock, Search, Video, FileText, Link as LinkIcon } from 'lucide-react';
import { getSupplierTrainingsForPortal } from '@/services/supplierPortalService';

export default function SupplierTrainings() {
  const navigate = useNavigate();
  const { supplier, isAuthenticated, isLoading: authLoading } = useSupplierAuth();
  
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/fornecedor/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    async function loadTrainings() {
      if (!supplier) return;
      
      try {
        const data = await getSupplierTrainingsForPortal(supplier.id, supplier.company_id);
        setTrainings(data);
      } catch (error) {
        console.error('Error loading trainings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (supplier) {
      loadTrainings();
    }
  }, [supplier]);

  const getStatus = (training: any) => {
    if (!training.progress) return 'Pendente';
    return training.progress.status;
  };

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          training.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const status = getStatus(training);
    if (statusFilter === 'pending') return matchesSearch && status === 'Pendente';
    if (statusFilter === 'in_progress') return matchesSearch && status === 'Em Andamento';
    if (statusFilter === 'completed') return matchesSearch && status === 'Concluído';
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'Em Andamento':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

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
          <h1 className="text-2xl font-bold">Treinamentos</h1>
          <p className="text-muted-foreground">Acesse os cursos e materiais de capacitação disponíveis</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar treinamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTrainings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum treinamento encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há treinamentos disponíveis no momento'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrainings.map((training) => {
              const status = getStatus(training);
              return (
                <Card key={training.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getContentIcon(training.content_type)}
                        <span className="text-xs capitalize">{training.content_type || 'Material'}</span>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    <CardTitle className="mt-2">{training.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {training.description || 'Sem descrição'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    {training.is_mandatory && (
                      <Badge variant="destructive" className="w-fit mb-3">Obrigatório</Badge>
                    )}
                    <Button 
                      className="w-full"
                      variant={status === 'Concluído' ? 'outline' : 'default'}
                      onClick={() => navigate(`/fornecedor/treinamento/${training.id}`)}
                    >
                      {status === 'Concluído' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Revisar
                        </>
                      ) : status === 'Em Andamento' ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Continuar
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Iniciar
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SupplierPortalLayout>
  );
}
