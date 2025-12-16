import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Star, FileCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getManagedSuppliers,
  getDocumentSubmissions,
  getRequiredDocuments,
} from "@/services/supplierManagementService";

export default function SupplierEvaluations() {
  const navigate = useNavigate();

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

  const isLoading = loadingSuppliers || loadingSubmissions;

  const getSupplierName = (supplier: any) => {
    if (!supplier) return "Desconhecido";
    return supplier.person_type === 'PJ' 
      ? supplier.company_name 
      : supplier.full_name;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprovado': 
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'Rejeitado': 
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default: 
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  // Calculate compliance per supplier
  const supplierCompliance = suppliers?.map((supplier) => {
    const supplierSubmissions = submissions?.filter(s => s.supplier_id === supplier.id) || [];
    const totalRequired = requiredDocs?.length || 0;
    const approved = supplierSubmissions.filter(s => s.status === 'Aprovado').length;
    const pending = supplierSubmissions.filter(s => s.status === 'Pendente').length;
    const rejected = supplierSubmissions.filter(s => s.status === 'Rejeitado').length;
    
    const complianceRate = totalRequired > 0 ? Math.round((approved / totalRequired) * 100) : 0;

    return {
      ...supplier,
      approved,
      pending,
      rejected,
      totalRequired,
      complianceRate,
    };
  });

  return (
    <MainLayout>
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Documentos Obrigatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requiredDocs?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Submissões Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {submissions?.filter(s => s.status === 'Aprovado').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pendentes de Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {submissions?.filter(s => s.status === 'Pendente').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Rejeitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {submissions?.filter(s => s.status === 'Rejeitado').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

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
              empty={!supplierCompliance?.length}
              emptyMessage="Nenhum fornecedor cadastrado"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aprovados</TableHead>
                    <TableHead className="text-center">Pendentes</TableHead>
                    <TableHead className="text-center">Rejeitados</TableHead>
                    <TableHead className="text-center">Taxa de Conformidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierCompliance?.map((supplier) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        {submissions && submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Submissões Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Data Submissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pontuação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.slice(0, 10).map((submission) => {
                    const supplier = suppliers?.find(s => s.id === submission.supplier_id);
                    return (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {getSupplierName(supplier)}
                        </TableCell>
                        <TableCell>
                          {submission.required_document?.document_name || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(submission.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          {submission.score ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span>{submission.score}/5</span>
                            </div>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
