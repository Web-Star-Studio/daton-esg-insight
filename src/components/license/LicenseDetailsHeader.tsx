import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Paperclip, Pencil } from 'lucide-react';

interface LicenseDetailsHeaderProps {
  isLoading: boolean;
  licenseName?: string;
  licenseType?: string;
  processNumber?: string;
  licenseId?: string;
  onBack: () => void;
  onUpload: () => void;
  onEdit: () => void;
}

export function LicenseDetailsHeader({
  isLoading,
  licenseName,
  licenseType,
  processNumber,
  licenseId,
  onBack,
  onUpload,
  onEdit,
}: LicenseDetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-64" /> : licenseName}
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? <Skeleton className="h-4 w-48" /> : `Licença ${licenseType} - ${processNumber}`}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={onUpload}>
          <Paperclip className="h-4 w-4 mr-2" />
          Anexar Documento
        </Button>
        <Button onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>
    </div>
  );
}
