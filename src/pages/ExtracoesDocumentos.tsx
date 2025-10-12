import { DocumentExtractionApproval } from '@/components/DocumentExtractionApproval';
import { FileCheck } from 'lucide-react';

export default function ExtracoesDocumentos() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <FileCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aprovação de Extrações</h1>
            <p className="text-muted-foreground">
              Revise e aprove os dados extraídos automaticamente dos documentos
            </p>
          </div>
        </div>
      </div>

      <DocumentExtractionApproval />
    </div>
  );
}
