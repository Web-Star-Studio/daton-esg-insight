import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getWasteLogById } from "@/services/waste";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface WasteLogDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wasteLogId: string;
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'Coletado': 'default',
    'Em Transporte': 'secondary',
    'Destinado': 'outline',
  };
  return variants[status] || 'default';
};

const getClassColor = (wasteClass?: string) => {
  if (wasteClass?.includes('Classe I')) return 'bg-red-100 text-red-800 border-red-300';
  if (wasteClass?.includes('Classe II A')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (wasteClass?.includes('Classe II B')) return 'bg-green-100 text-green-800 border-green-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

export function WasteLogDetailModal({ open, onOpenChange, wasteLogId }: WasteLogDetailModalProps) {
  const { data: wasteLog, isLoading } = useQuery({
    queryKey: ['waste-logs', 'detail', wasteLogId],
    queryFn: () => getWasteLogById(wasteLogId),
    enabled: open && !!wasteLogId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Registro de Resíduo</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : wasteLog ? (
          <div className="space-y-4">
            {/* Identificação */}
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nº MTR/Controle</p>
                  <p className="font-semibold">{wasteLog.mtr_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(wasteLog.status)}>{wasteLog.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Coleta</p>
                  <p className="font-semibold">
                    {format(new Date(wasteLog.collection_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="text-sm">
                    {format(new Date(wasteLog.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Caracterização do Resíduo */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Descrição do Resíduo</p>
                  <p className="font-semibold">{wasteLog.waste_description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Classe</p>
                    <Badge className={getClassColor(wasteLog.waste_class)}>
                      {wasteLog.waste_class || 'Não informada'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className="font-semibold">{wasteLog.quantity} {wasteLog.unit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transportador */}
            {wasteLog.transporter_name && (
              <Card>
                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Transportador</p>
                    <p className="font-semibold">{wasteLog.transporter_name}</p>
                  </div>
                  {wasteLog.transporter_cnpj && (
                    <div>
                      <p className="text-sm text-muted-foreground">CNPJ Transportador</p>
                      <p className="font-mono text-sm">{wasteLog.transporter_cnpj}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Destinador */}
            {wasteLog.destination_name && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Destinador</p>
                      <p className="font-semibold">{wasteLog.destination_name}</p>
                    </div>
                    {wasteLog.destination_cnpj && (
                      <div>
                        <p className="text-sm text-muted-foreground">CNPJ Destinador</p>
                        <p className="font-mono text-sm">{wasteLog.destination_cnpj}</p>
                      </div>
                    )}
                  </div>
                  {wasteLog.final_treatment_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Destinação Final</p>
                      <p className="font-semibold">{wasteLog.final_treatment_type}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Custo */}
            {wasteLog.cost !== undefined && wasteLog.cost !== null && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Custo de Destinação</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wasteLog.cost)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Registro não encontrado</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
