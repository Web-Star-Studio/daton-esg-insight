import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { SupplierPortalLayout } from '@/components/supplier-portal/SupplierPortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, FileText, CheckCircle, ExternalLink, Eye } from 'lucide-react';
import { getSupplierReadings, confirmReading } from '@/services/supplierPortalService';
import { useToast } from '@/hooks/use-toast';
import { sanitizeRichText } from '@/utils/sanitize';

export default function SupplierReadings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { supplier, isAuthenticated, isLoading: authLoading } = useSupplierAuth();
  
  const [readings, setReadings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReading, setSelectedReading] = useState<any>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/fornecedor/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    async function loadReadings() {
      if (!supplier) return;
      
      try {
        const data = await getSupplierReadings(supplier.id, supplier.company_id);
        setReadings(data);
      } catch (error) {
        console.error('Error loading readings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (supplier) {
      loadReadings();
    }
  }, [supplier]);

  const handleConfirm = async () => {
    if (!supplier || !selectedReading || !confirmChecked) return;
    
    setIsConfirming(true);
    try {
      await confirmReading(supplier.id, selectedReading.id);
      setReadings(readings.map(r => 
        r.id === selectedReading.id ? { ...r, confirmed: true } : r
      ));
      setSelectedReading(null);
      setConfirmChecked(false);
      toast({
        title: 'Leitura confirmada!',
        description: 'Sua confirmação foi registrada com sucesso.'
      });
    } catch (error) {
      console.error('Error confirming reading:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao confirmar leitura',
        variant: 'destructive'
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const pendingReadings = readings.filter(r => !r.confirmed);
  const confirmedReadings = readings.filter(r => r.confirmed);

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
          <h1 className="text-2xl font-bold">Leituras Obrigatórias</h1>
          <p className="text-muted-foreground">Documentos importantes que requerem sua leitura e confirmação</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : readings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma leitura disponível</h3>
              <p className="text-muted-foreground">
                Não há documentos para leitura no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingReadings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="destructive">{pendingReadings.length}</Badge>
                  Pendentes
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingReadings.map((reading) => (
                    <Card key={reading.id} className="border-orange-200 bg-orange-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-orange-600" />
                          {reading.title}
                        </CardTitle>
                        <CardDescription>{reading.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={() => setSelectedReading(reading)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ler e Confirmar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {confirmedReadings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">{confirmedReadings.length}</Badge>
                  Confirmadas
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {confirmedReadings.map((reading) => (
                    <Card key={reading.id} className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          {reading.title}
                        </CardTitle>
                        <CardDescription>{reading.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" onClick={() => setSelectedReading(reading)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar Novamente
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reading Dialog */}
        <Dialog open={!!selectedReading} onOpenChange={() => { setSelectedReading(null); setConfirmChecked(false); }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedReading?.title}</DialogTitle>
              <DialogDescription>{selectedReading?.description}</DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {selectedReading?.content ? (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(selectedReading.content) }} />
              ) : selectedReading?.file_path ? (
                <div className="border rounded-lg p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <p className="mb-4">Este documento está disponível para download</p>
                  <Button asChild>
                    <a href={selectedReading.file_path} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir Documento
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Conteúdo não disponível
                </p>
              )}
            </div>

            {!selectedReading?.confirmed && selectedReading?.requires_confirmation && (
              <DialogFooter className="flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confirm"
                    checked={confirmChecked}
                    onCheckedChange={(checked) => setConfirmChecked(checked as boolean)}
                  />
                  <label
                    htmlFor="confirm"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Confirmo que li e compreendi o conteúdo deste documento
                  </label>
                </div>
                <Button 
                  onClick={handleConfirm} 
                  disabled={!confirmChecked || isConfirming}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirmar Leitura
                    </>
                  )}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SupplierPortalLayout>
  );
}
