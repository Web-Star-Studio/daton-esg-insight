import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SupplierContract } from "@/services/supplierContracts";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Building2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SupplierContractDetailsModalProps {
  contract: SupplierContract | null;
  isOpen: boolean;
  onClose: () => void;
  suppliers: Array<{ id: string; name: string }>;
}

export function SupplierContractDetailsModal({
  contract,
  isOpen,
  onClose,
  suppliers
}: SupplierContractDetailsModalProps) {
  const { data: responsibleUser } = useQuery({
    queryKey: ["user-profile", contract?.responsible_user_id],
    queryFn: async () => {
      if (!contract?.responsible_user_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', contract.responsible_user_id)
        .single();
      return data;
    },
    enabled: !!contract?.responsible_user_id
  });

  if (!contract) return null;

  const getContractStatus = (endDate: string) => {
    const expiryDate = parseISO(endDate);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    
    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 30) return "expiring";
    if (daysUntilExpiry <= 90) return "warning";
    return "active";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Renovar em breve
          </Badge>
        );
      case "expiring":
        return (
          <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Vencendo
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: contract.currency || 'BRL'
    }).format(value);
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'Fornecedor não encontrado';
  };

  const daysUntilExpiry = differenceInDays(parseISO(contract.end_date), new Date());
  const status = getContractStatus(contract.end_date);

  const handleDownloadFile = async () => {
    if (!contract.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('contract-files')
        .download(contract.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const fileName = contract.file_path.split('/').pop() || 'contrato.pdf';
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Contrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Informações Básicas</span>
                {getStatusBadge(status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Número do Contrato</p>
                  <p className="font-medium">{contract.contract_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de Contrato</p>
                  <p className="font-medium">{contract.contract_type}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Título</p>
                <p className="font-medium">{contract.title}</p>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{getSupplierName(contract.supplier_id)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores e Pagamento */}
          {contract.value && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valores e Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor do Contrato</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(contract.value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Moeda</p>
                    <p className="font-medium">{contract.currency}</p>
                  </div>
                </div>
                {contract.payment_terms && (
                  <div>
                    <p className="text-xs text-muted-foreground">Termos de Pagamento</p>
                    <p className="text-sm">{contract.payment_terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vigência */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vigência do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data de Início</p>
                  <p className="font-medium">
                    {format(parseISO(contract.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data de Término</p>
                  <p className="font-medium">
                    {format(parseISO(contract.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                daysUntilExpiry < 0 
                  ? 'bg-red-50 border border-red-200' 
                  : daysUntilExpiry <= 30
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <p className="text-xs text-muted-foreground">Status de Vigência</p>
                <p className={`font-bold ${
                  daysUntilExpiry < 0 
                    ? 'text-red-600' 
                    : daysUntilExpiry <= 30
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  {daysUntilExpiry < 0 
                    ? `Vencido há ${Math.abs(daysUntilExpiry)} dias`
                    : daysUntilExpiry === 0
                    ? 'Vence hoje'
                    : `Vence em ${daysUntilExpiry} dias`
                  }
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Auto-renovação</p>
                  <p className="font-medium">
                    {contract.auto_renewal ? 'Sim' : 'Não'}
                  </p>
                </div>
                {contract.auto_renewal && (
                  <div>
                    <p className="text-xs text-muted-foreground">Dias de Aviso</p>
                    <p className="font-medium">{contract.renewal_notice_days} dias</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Descrição e Termos */}
          {(contract.description || contract.terms_conditions) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Descrição e Termos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm whitespace-pre-wrap">{contract.description}</p>
                  </div>
                )}
                {contract.terms_conditions && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Termos e Condições</p>
                    <p className="text-sm whitespace-pre-wrap">{contract.terms_conditions}</p>
                  </div>
                )}
                {contract.sla_requirements && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Requisitos de SLA</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {typeof contract.sla_requirements === 'string' 
                        ? contract.sla_requirements 
                        : JSON.stringify(contract.sla_requirements, null, 2)
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gestão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Gestão do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.responsible_user_id && (
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="font-medium">
                    {responsibleUser?.full_name || 'Carregando...'}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data de Criação</p>
                  <p className="text-sm">
                    {format(parseISO(contract.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última Atualização</p>
                  <p className="text-sm">
                    {format(parseISO(contract.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              {contract.file_path && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Anexo do Contrato</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadFile}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo do Contrato
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
