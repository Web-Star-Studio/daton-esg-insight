import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Star, FileCheck, Clock, AlertCircle, CheckCircle2, Search, HelpCircle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getManagedSuppliers,
  getDocumentSubmissions,
  getRequiredDocuments,
  getLatestEvaluationForSuppliers,
} from "@/services/supplierManagementService";

export default function SupplierEvaluations() {
  const navigate = useNavigate();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['managed-suppliers'],
    queryFn: getManagedSuppliers,
  });

  const { data: requiredDocs } = useQuery({
    queryKey: ['required-documents'],
    queryFn: getRequiredDocuments,
  });

  const { data: submissions, isLoading: loadingSubmissions, error, refetch } = useQuery({
    queryKey: ['document-submissions'],
    queryFn: () => getDocumentSubmissions(),
  });

  // Fetch latest evaluations for all suppliers to get next_evaluation_date
  const supplierIds = suppliers?.map(s => s.id) || [];
  const { data: latestEvaluations } = useQuery({
    queryKey: ['latest-evaluations', supplierIds],
    queryFn: () => getLatestEvaluationForSuppliers(supplierIds),
    enabled: supplierIds.length > 0,
  });

  const isLoading = loadingSuppliers || loadingSubmissions;

  const getSupplierName = (supplier: any) => {
    if (!supplier) return "Desconhecido";
    return supplier.person_type === 'PJ' 
      ? supplier.company_name 
      : supplier.full_name;
  };

  // Calculate compliance per supplier with next evaluation date
  const supplierCompliance = useMemo(() => {
    return suppliers?.map((supplier) => {
      const supplierSubmissions = submissions?.filter(s => s.supplier_id === supplier.id) || [];
      const totalRequired = requiredDocs?.length || 0;
      const approved = supplierSubmissions.filter(s => s.status === 'Aprovado').length;
      const pending = supplierSubmissions.filter(s => s.status === 'Pendente').length;
      const rejected = supplierSubmissions.filter(s => s.status === 'Rejeitado').length;
      
      const complianceRate = totalRequired > 0 ? Math.round((approved / totalRequired) * 100) : 0;
      
      // Get latest evaluation for this supplier
      const latestEval = latestEvaluations?.find(e => e.supplier_id === supplier.id);
      const nextEvaluationDate = latestEval?.next_evaluation_date;

      return {
        ...supplier,
        approved,
        pending,
        rejected,
        totalRequired,
        complianceRate,
        nextEvaluationDate,
      };
    }) || [];
  }, [suppliers, submissions, requiredDocs, latestEvaluations]);

  // Apply filters
  const filteredSuppliers = useMemo(() => {
    return supplierCompliance.filter(supplier => {
      // Search filter
      const name = getSupplierName(supplier).toLowerCase();
      const nickname = supplier.nickname?.toLowerCase() || '';
      const matchesSearch = searchTerm === '' || 
        name.includes(searchTerm.toLowerCase()) || 
        nickname.includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;

      // Compliance filter
      let matchesCompliance = true;
      if (complianceFilter === 'high') {
        matchesCompliance = supplier.complianceRate >= 80;
      } else if (complianceFilter === 'medium') {
        matchesCompliance = supplier.complianceRate >= 50 && supplier.complianceRate < 80;
      } else if (complianceFilter === 'low') {
        matchesCompliance = supplier.complianceRate < 50;
      }

      return matchesSearch && matchesStatus && matchesCompliance;
    });
  }, [supplierCompliance, searchTerm, statusFilter, complianceFilter]);

  const TooltipHeader = ({ title, tooltip }: { title: string; tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            {title}
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedores/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Avaliações de Fornecedores</h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe a conformidade documental dos fornecedores
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fornecedor por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Conformidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Taxas</SelectItem>
                  <SelectItem value="high">Alta (≥80%)</SelectItem>
                  <SelectItem value="medium">Média (50-79%)</SelectItem>
                  <SelectItem value="low">Baixa (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Conformidade por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              error={error?.message}
              retry={refetch}
              empty={!filteredSuppliers?.length}
              emptyMessage={searchTerm || statusFilter !== 'all' || complianceFilter !== 'all' 
                ? "Nenhum fornecedor encontrado com os filtros aplicados" 
                : "Nenhum fornecedor cadastrado"}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">
                      <TooltipHeader 
                        title="Aprovados" 
                        tooltip="Quantidade de documentos aprovados na última avaliação documental" 
                      />
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipHeader 
                        title="Pendentes" 
                        tooltip="Documentos aguardando análise ou ainda não submetidos" 
                      />
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipHeader 
                        title="Rejeitados" 
                        tooltip="Documentos que foram rejeitados e precisam de reenvio" 
                      />
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipHeader 
                        title="Taxa de Conformidade" 
                        tooltip="Percentual de documentos aprovados em relação ao total exigido" 
                      />
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipHeader 
                        title="Próx. Avaliação" 
                        tooltip="Data programada para a próxima avaliação documental do fornecedor" 
                      />
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers?.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {getSupplierName(supplier)}
                        {supplier.nickname && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({supplier.nickname})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.status === 'Ativo' ? 'default' : 'secondary'}>
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-medium">{supplier.approved}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-yellow-600 font-medium">{supplier.pending}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-red-600 font-medium">{supplier.rejected}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                supplier.complianceRate >= 80 ? 'bg-green-500' :
                                supplier.complianceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${supplier.complianceRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{supplier.complianceRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {supplier.nextEvaluationDate ? (
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(supplier.nextEvaluationDate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/fornecedores/avaliacao-documental/${supplier.id}`)}
                        >
                          <FileCheck className="h-4 w-4 mr-1" />
                          Avaliar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>
    </div>
  );
}