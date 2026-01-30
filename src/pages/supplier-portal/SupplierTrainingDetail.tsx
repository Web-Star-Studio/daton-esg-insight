import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { SupplierPortalLayout } from '@/components/supplier-portal/SupplierPortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, ExternalLink, FileText, Video, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { updateTrainingProgress } from '@/services/supplierPortalService';
import { useToast } from '@/hooks/use-toast';
import { sanitizeRichText } from '@/utils/sanitize';

export default function SupplierTrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { supplier, isAuthenticated, isLoading: authLoading } = useSupplierAuth();
  
  const [training, setTraining] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/fornecedor/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    async function loadTraining() {
      if (!supplier || !id) return;
      
      try {
        const { data: trainingData, error: trainError } = await supabase
          .from('supplier_training_materials')
          .select('*')
          .eq('id', id)
          .single();

        if (trainError) throw trainError;
        setTraining(trainingData);

        const { data: progressData } = await supabase
          .from('supplier_training_progress')
          .select('*')
          .eq('supplier_id', supplier.id)
          .eq('training_material_id', id)
          .maybeSingle();

        setProgress(progressData);

        // Mark as in progress if not started
        if (!progressData) {
          await updateTrainingProgress(supplier.id, id, 'Em Andamento');
          setProgress({ status: 'Em Andamento', started_at: new Date().toISOString() });
        }
      } catch (error) {
        console.error('Error loading training:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar treinamento',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    if (supplier && id) {
      loadTraining();
    }
  }, [supplier, id, toast]);

  const handleComplete = async () => {
    if (!supplier || !id) return;
    
    setIsCompleting(true);
    try {
      await updateTrainingProgress(supplier.id, id, 'Concluído');
      setProgress({ ...progress, status: 'Concluído', completed_at: new Date().toISOString() });
      toast({
        title: 'Treinamento concluído!',
        description: 'Parabéns por concluir este treinamento.'
      });
    } catch (error) {
      console.error('Error completing training:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar treinamento como concluído',
        variant: 'destructive'
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const renderContent = () => {
    if (!training) return null;

    switch (training.content_type) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {training.content_url?.includes('youtube') || training.content_url?.includes('youtu.be') ? (
              <iframe
                src={training.content_url.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <video 
                src={training.content_url} 
                controls 
                className="w-full h-full"
              />
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">Documento para download</p>
                <p className="text-sm text-muted-foreground">Clique para baixar o material</p>
              </div>
            </div>
            <Button asChild>
              <a href={training.content_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Documento
              </a>
            </Button>
          </div>
        );
      
      case 'link':
        return (
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <ExternalLink className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Link Externo</p>
                <p className="text-sm text-muted-foreground">Este treinamento está em uma plataforma externa</p>
              </div>
            </div>
            <Button asChild>
              <a href={training.content_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Acessar Treinamento
              </a>
            </Button>
          </div>
        );
      
      default:
        if (training.content_text) {
          return (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(training.content_text) }} />
            </div>
          );
        }
        return (
          <Alert>
            <AlertDescription>
              Conteúdo do treinamento não disponível
            </AlertDescription>
          </Alert>
        );
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!training) {
    return (
      <SupplierPortalLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Treinamento não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/fornecedor/treinamentos')}>
            Voltar para Treinamentos
          </Button>
        </div>
      </SupplierPortalLayout>
    );
  }

  const isCompleted = progress?.status === 'Concluído';

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/fornecedor/treinamentos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Treinamentos
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {training.is_mandatory && (
                    <Badge variant="destructive">Obrigatório</Badge>
                  )}
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Concluído
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{training.title}</CardTitle>
                <CardDescription className="mt-2">
                  {training.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderContent()}

            {!isCompleted && (
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleComplete} disabled={isCompleting}>
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Concluído
                    </>
                  )}
                </Button>
              </div>
            )}

            {isCompleted && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Você concluiu este treinamento em {new Date(progress.completed_at).toLocaleDateString('pt-BR')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </SupplierPortalLayout>
  );
}
