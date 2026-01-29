import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, AlertTriangle, Plus, Trash2, Eye, 
  AlertCircle, ShieldAlert, RotateCcw, TrendingDown, Settings 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getSupplierFailures,
  registerSupplyFailure,
  deleteSupplyFailure,
  getSuppliersAtRisk,
  getAutoInactivatedSuppliers,
  requestReactivation,
  getFailureStats,
  failureTypeLabels,
  severityLabels,
  CreateFailureData
} from "@/services/supplierFailuresService";
import { supabase } from "@/integrations/supabase/client";

async function getActiveSuppliers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
  if (!profile?.company_id) return [];
  const { data } = await supabase.from('supplier_management').select('id, company_name, full_name').eq('company_id', profile.company_id).eq('status', 'Ativo');
  return data || [];
}

export default function SupplierFailuresPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateFailureData>({
    supplier_id: '',
    failure_type: 'delivery',
    failure_date: new Date().toISOString().split('T')[0],
    description: '',
    severity: 'medium'
  });

  const { data: failures, isLoading, error, refetch } = useQuery({
    queryKey: ["supplier-failures"],
    queryFn: getSupplierFailures
  });

  const { data: suppliers } = useQuery({
    queryKey: ["active-suppliers"],
    queryFn: getActiveSuppliers
  });

  const { data: suppliersAtRisk } = useQuery({
    queryKey: ["suppliers-at-risk"],
    queryFn: getSuppliersAtRisk
  });

  const { data: inactivatedSuppliers } = useQuery({
    queryKey: ["auto-inactivated-suppliers"],
    queryFn: getAutoInactivatedSuppliers
  });

  const { data: stats } = useQuery({
    queryKey: ["failure-stats"],
    queryFn: getFailureStats
  });

  const registerMutation = useMutation({
    mutationFn: registerSupplyFailure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-failures"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers-at-risk"] });
      queryClient.invalidateQueries({ queryKey: ["failure-stats"] });
      toast({ title: "Falha registrada com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar falha", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplyFailure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-failures"] });
      queryClient.invalidateQueries({ queryKey: ["failure-stats"] });
      toast({ title: "Falha removida!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover falha", variant: "destructive" });
    }
  });

  const reactivateMutation = useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) =>
      requestReactivation(id, justification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-inactivated-suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers-at-risk"] });
      toast({ title: "Fornecedor reativado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao reativar", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      failure_type: 'delivery',
      failure_date: new Date().toISOString().split('T')[0],
      description: '',
      severity: 'medium'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      toast({ title: "Selecione um fornecedor", variant: "destructive" });
      return;
    }
    registerMutation.mutate(formData);
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800"
    };
    return <Badge className={variants[severity] || ""}>{severityLabels[severity] || severity}</Badge>;
  };

  const getFailureTypeBadge = (type: string) => {
    return <Badge variant="outline">{failureTypeLabels[type] || type}</Badge>;
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Falhas de Fornecimento</h1>
              <p className="text-muted-foreground mt-1">
                Registre e acompanhe falhas. Fornecedores com mais de 3 falhas são automaticamente inativados.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/fornecedores/falhas/configuracao">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Link>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Falha
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Falha de Fornecimento</DialogTitle>
                <DialogDescription>
                  Registre uma ocorrência de falha do fornecedor.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {(suppliers as any[] || []).length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          Nenhum fornecedor ativo
                        </SelectItem>
                      ) : (
                        (suppliers as any[] || []).map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.company_name || s.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {(suppliers as any[] || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      <a href="/fornecedores/cadastro" className="text-primary hover:underline">
                        Cadastre um fornecedor
                      </a>{" "}
                      para continuar.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Falha *</Label>
                    <Select
                      value={formData.failure_type}
                      onValueChange={(value) => setFormData({ ...formData, failure_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(failureTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severidade</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData({ ...formData, severity: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(severityLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data da Falha *</Label>
                  <Input
                    type="date"
                    value={formData.failure_date}
                    onChange={(e) => setFormData({ ...formData, failure_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    placeholder="Descreva a ocorrência..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Salvando..." : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingDown className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats?.total_failures || 0}</div>
                  <p className="text-sm text-muted-foreground">Falhas (12 meses)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-600">{stats?.suppliers_at_risk || 0}</div>
                  <p className="text-sm text-yellow-700">Em Risco (2-3 falhas)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">{stats?.auto_inactivated || 0}</div>
                  <p className="text-sm text-red-700">Inativados Auto.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats?.by_severity?.critical || 0}</div>
                  <p className="text-sm text-muted-foreground">Críticas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="failures" className="space-y-4">
          <TabsList>
            <TabsTrigger value="failures">
              Histórico de Falhas ({failures?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="at-risk" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Em Risco ({suppliersAtRisk?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="inactivated" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Inativados ({inactivatedSuppliers?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Histórico de Falhas */}
          <TabsContent value="failures">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Falhas</CardTitle>
                <CardDescription>Todas as falhas registradas nos últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingState
                  loading={isLoading}
                  error={error?.message}
                  retry={refetch}
                  empty={!failures?.length}
                  emptyMessage="Nenhuma falha registrada"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failures?.map((failure: any) => (
                        <TableRow key={failure.id}>
                          <TableCell className="font-medium">
                            <div>
                              {failure.supplier?.company_name || failure.supplier?.full_name || '-'}
                              {failure.supplier?.supply_failure_count >= 2 && (
                                <Badge variant="destructive" className="ml-2">
                                  {failure.supplier.supply_failure_count} falhas
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getFailureTypeBadge(failure.failure_type)}</TableCell>
                          <TableCell>
                            {format(parseISO(failure.failure_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{getSeverityBadge(failure.severity)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {failure.description || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Remover esta falha?')) {
                                  deleteMutation.mutate(failure.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </LoadingState>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fornecedores em Risco */}
          <TabsContent value="at-risk">
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Fornecedores em Risco de Inativação
                </CardTitle>
                <CardDescription>
                  Fornecedores com 2-3 falhas. Mais uma falha resultará em inativação automática.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!suppliersAtRisk?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum fornecedor em risco no momento
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Falhas</TableHead>
                        <TableHead>Última Falha</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliersAtRisk.map((supplier: any) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">
                            {supplier.company_name || supplier.full_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {supplier.supply_failure_count} falhas
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {supplier.last_failure_date 
                              ? format(parseISO(supplier.last_failure_date), "dd/MM/yyyy", { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              ⚠️ Em Risco
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/fornecedores/cadastro/${supplier.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fornecedores Inativados */}
          <TabsContent value="inactivated">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  Fornecedores Inativados Automaticamente
                </CardTitle>
                <CardDescription>
                  Fornecedores inativados por excesso de falhas ou documentação vencida
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!inactivatedSuppliers?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum fornecedor inativado automaticamente
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Data Inativação</TableHead>
                        <TableHead>Bloqueado Até</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactivatedSuppliers.map((supplier: any) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">
                            {supplier.company_name || supplier.full_name}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm text-red-600">
                              {supplier.auto_inactivation_reason}
                            </span>
                          </TableCell>
                          <TableCell>
                            {supplier.auto_inactivated_at
                              ? format(parseISO(supplier.auto_inactivated_at), "dd/MM/yyyy", { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {supplier.reactivation_blocked_until
                              ? format(parseISO(supplier.reactivation_blocked_until), "dd/MM/yyyy", { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Reativar este fornecedor? O contador de falhas será zerado.')) {
                                  reactivateMutation.mutate({ id: supplier.id, justification: 'Reativação manual' });
                                }
                              }}
                              disabled={
                                supplier.reactivation_blocked_until && 
                                new Date(supplier.reactivation_blocked_until) > new Date()
                              }
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reativar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alert Box */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-amber-800">Regras de Inativação Automática</h4>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• <strong>Mais de 3 falhas</strong> de fornecimento em 12 meses → Inativação por 90 dias</li>
                  <li>• <strong>Documentação obrigatória</strong> vencida há mais de 30 dias → Inativação até regularização</li>
                  <li>• Fornecedores podem ser reativados manualmente após o período de bloqueio</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
