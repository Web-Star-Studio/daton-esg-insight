import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, FileText, Plus, Calendar, DollarSign } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SupplierContractModal } from "./SupplierContractModal";
import { SupplierContractDetailsModal } from "./SupplierContractDetailsModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupplierContracts, SupplierContract } from "@/services/supplierContracts";
import { getSuppliers } from "@/services/supplierService";
import { toast } from "sonner";

export function SupplierContractsTab() {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<SupplierContract | null>(null);
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["supplier-contracts"],
    queryFn: () => getSupplierContracts(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

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
            Ativo
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Renovar em breve
          </Badge>
        );
      case "expiring":
        return (
          <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-300">
            Vencendo
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
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
      currency: 'BRL'
    }).format(value);
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'Fornecedor não encontrado';
  };

  const handleContractSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["supplier-contracts"] });
    setIsContractModalOpen(false);
  };

  const handleViewDetails = (contract: SupplierContract) => {
    setSelectedContract(contract);
    setIsDetailsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Contratos de Fornecedores</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie contratos, prazos e renovações
            </p>
          </div>
          <Button onClick={() => setIsContractModalOpen(true)} disabled={suppliers.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>

        {suppliers.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Você precisa cadastrar fornecedores antes de criar contratos
              </p>
              <p className="text-sm text-muted-foreground">
                Vá para a aba "Fornecedores" e cadastre pelo menos um fornecedor
              </p>
            </CardContent>
          </Card>
        )}

        {suppliers.length > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{contracts.length}</p>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                      <p className="text-2xl font-bold text-green-600">
                        {contracts.filter(c => getContractStatus(c.end_date) === "active").length}
                      </p>
                    </div>
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vencendo</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {contracts.filter(c => ["expiring", "warning"].includes(getContractStatus(c.end_date))).length}
                      </p>
                    </div>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(contracts.reduce((sum, c) => sum + (c.value || 0), 0))}
                      </p>
                    </div>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contracts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Contratos</CardTitle>
              </CardHeader>
              <CardContent>
                {contracts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vigência</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => {
                        const status = getContractStatus(contract.end_date);
                        return (
                          <TableRow key={contract.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{contract.contract_number}</div>
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {contract.title}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{getSupplierName(contract.supplier_id)}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{contract.contract_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {contract.value ? formatCurrency(contract.value) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(contract.start_date), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                                <div className="text-muted-foreground">
                                  até {format(parseISO(contract.end_date), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(contract)}
                              >
                                Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhum contrato cadastrado para este fornecedor
                    </p>
                    <Button onClick={() => setIsContractModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeiro Contrato
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <SupplierContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        onSuccess={handleContractSuccess}
      />

      <SupplierContractDetailsModal
        contract={selectedContract}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedContract(null);
        }}
        suppliers={suppliers}
      />
    </>
  );
}