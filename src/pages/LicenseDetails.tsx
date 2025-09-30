import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLicenseDetails } from '@/hooks/data/useLicenseDetails';
import { LicenseDetailsHeader } from '@/components/license/LicenseDetailsHeader';
import { LicenseInfoCard } from '@/components/license/LicenseInfoCard';
import { LicenseConditionsCard } from '@/components/license/LicenseConditionsCard';
import { LicenseAlertsCard } from '@/components/license/LicenseAlertsCard';
import { LicenseDocumentsCard } from '@/components/license/LicenseDocumentsCard';
import { LicenseSidebar } from '@/components/license/LicenseSidebar';
import { LicenseDocumentUploadModal } from '@/components/LicenseDocumentUploadModal';

const LicenseDetails = () => {
  const { id } = useParams<{ id: string }>();
  
  const {
    license,
    isLoading,
    error,
    conditions,
    conditionsLoading,
    alerts,
    alertsLoading,
    showUploadModal,
    setShowUploadModal,
    handleUpdateConditionStatus,
    handleResolveAlert,
    handleDownloadDocument,
    handleViewDocument,
    refetchAll,
    navigate,
  } = useLicenseDetails(id);

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
          <div>
            <h2 className="text-lg font-semibold">ID da licença não fornecido</h2>
            <p className="text-muted-foreground">
              Não foi possível identificar qual licença exibir.
            </p>
            <Button 
              onClick={() => navigate('/licenciamento')} 
              className="mt-4"
            >
              Voltar ao Licenciamento
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Erro ao carregar licença</h2>
            <p className="text-muted-foreground mt-2">
              {error.message.includes('No rows') 
                ? 'Licença não encontrada ou você não tem permissão para acessá-la.'
                : 'Ocorreu um erro ao carregar os detalhes da licença.'
              }
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" onClick={() => navigate('/licenciamento')}>
                Voltar ao Licenciamento
              </Button>
              <Button onClick={() => refetchAll()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LicenseDetailsHeader
        isLoading={isLoading}
        licenseName={license?.name}
        licenseType={license?.type}
        processNumber={license?.process_number}
        licenseId={id}
        onBack={() => navigate('/licenciamento')}
        onUpload={() => setShowUploadModal(true)}
        onEdit={() => navigate(`/licenciamento/${id}/editar`)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LicenseInfoCard license={license} isLoading={isLoading} />
          
          <div id="condicionantes">
            <LicenseConditionsCard
              conditions={conditions}
              isLoading={conditionsLoading}
              onUpdateStatus={handleUpdateConditionStatus}
            />
          </div>

          <LicenseAlertsCard
            alerts={alerts}
            isLoading={alertsLoading}
            onResolve={handleResolveAlert}
          />

          <LicenseDocumentsCard
            documents={license?.documents}
            isLoading={isLoading}
            onUpload={() => setShowUploadModal(true)}
            onView={handleViewDocument}
            onDownload={handleDownloadDocument}
          />
        </div>

        <LicenseSidebar
          license={license}
          isLoading={isLoading}
          conditionsCount={conditions?.length || 0}
          onNavigateToAnalysis={() => navigate('/licenciamento/processar')}
        />
      </div>

      {license && (
        <LicenseDocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            refetchAll();
            setShowUploadModal(false);
          }}
          licenseId={license.id}
          licenseName={license.name}
        />
      )}
    </div>
  );
};

export default LicenseDetails;
