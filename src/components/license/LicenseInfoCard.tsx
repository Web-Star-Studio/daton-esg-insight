import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LicenseDetail } from '@/services/licenses';

interface LicenseInfoCardProps {
  license?: LicenseDetail;
  isLoading: boolean;
}

export function LicenseInfoCard({ license, isLoading }: LicenseInfoCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Ativa": { variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
      "Vencida": { variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
      "Em Renovação": { variant: "secondary" as const, className: "bg-accent/10 text-accent border-accent/20" },
      "Suspensa": { variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap["Ativa"];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileCheck className="h-5 w-5 mr-2" />
          Informações da Licença
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="font-medium">Nome:</span>
              <span>{license?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tipo:</span>
              <span>{license?.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Órgão Emissor:</span>
              <span>{license?.issuing_body}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Nº do Processo:</span>
              <span className="font-mono">{license?.process_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Data de Emissão:</span>
              <span>{license?.issue_date ? formatDate(license.issue_date) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Data de Vencimento:</span>
              <span>{license?.expiration_date ? formatDate(license.expiration_date) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              {getStatusBadge(license?.status || '')}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
