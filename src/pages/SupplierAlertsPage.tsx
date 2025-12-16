import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, AlertTriangle, FileText, GraduationCap, 
  ClipboardCheck, Eye, CheckCircle, Bell 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getSupplierExpirationAlerts,
  updateExpirationAlertStatus,
  SupplierExpirationAlert,
} from "@/services/supplierManagementService";

export default function SupplierAlertsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, error, refetch } = useQuery({
    queryKey: ["supplier-expiration-alerts"],
    queryFn: getSupplierExpirationAlerts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateExpirationAlertStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-expiration-alerts"] });
      toast({ title: "Status atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    },
  });

  const categorizedAlerts = useMemo(() => {
    if (!alerts) return { critical: [], attention: [], ok: [] };

    const critical: SupplierExpirationAlert[] = [];
    const attention: SupplierExpirationAlert[] = [];
    const ok: SupplierExpirationAlert[] = [];

    alerts.forEach(alert => {
      const days = differenceInDays(parseISO(alert.expiry_date), new Date());
      if (days < 0) {
        critical.push({ ...alert, days_until_expiry: days });
      } else if (days <= 30) {
        attention.push({ ...alert, days_until_expiry: days });
      } else {
        ok.push({ ...alert, days_until_expiry: days });
      }
    });

    return { 
      critical: critical.sort((a, b) => (a.days_until_expiry || 0) - (b.days_until_expiry || 0)),
      attention: attention.sort((a, b) => (a.days_until_expiry || 0) - (b.days_until_expiry || 0)),
      ok: ok.sort((a, b) => (a.days_until_expiry || 0) - (b.days_until_expiry || 0))
    };
  }, [alerts]);

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "documento": return <FileText className="h-4 w-4" />;
      case "treinamento": return <GraduationCap className="h-4 w-4" />;
      case "avaliacao": return <ClipboardCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "documento": return "Documento";
      case "treinamento": return "Treinamento";
      case "avaliacao": return "Avaliação";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pendente": return <Badge variant="secondary">Pendente</Badge>;
      case "Visualizado": return <Badge className="bg-yellow-100 text-yellow-800">Visualizado</Badge>;
      case "Resolvido": return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const renderAlertTable = (alertList: SupplierExpirationAlert[], title: string, bgClass: string) => (
    <Card className={bgClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {title} ({alertList.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertList.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum alerta nesta categoria</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertList.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(alert.alert_type)}
                      <span>{getAlertTypeLabel(alert.alert_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {alert.supplier?.company_name || alert.supplier?.full_name || "-"}
                  </TableCell>
                  <TableCell>{alert.reference_name}</TableCell>
                  <TableCell>
                    {format(parseISO(alert.expiry_date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        (alert.days_until_expiry || 0) < 0 ? "destructive" : 
                        (alert.days_until_expiry || 0) <= 30 ? "secondary" : "outline"
                      }
                    >
                      {(alert.days_until_expiry || 0) < 0 
                        ? `${Math.abs(alert.days_until_expiry || 0)} dias atrás`
                        : `${alert.days_until_expiry} dias`
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(alert.alert_status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (alert.alert_type === "documento") {
                            navigate(`/fornecedores/avaliacao-documental/${alert.supplier_id}`);
                          } else if (alert.alert_type === "avaliacao") {
                            navigate(`/fornecedores/avaliacao-desempenho/${alert.supplier_id}`);
                          }
                        }}
                        title="Ver"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {alert.alert_status !== "Resolvido" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateMutation.mutate({ id: alert.id, status: "Resolvido" })}
                          title="Marcar como Resolvido"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central de Alertas</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe vencimentos de documentos, treinamentos e avaliações
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">{categorizedAlerts.critical.length}</div>
                  <p className="text-sm text-red-700">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Bell className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-600">{categorizedAlerts.attention.length}</div>
                  <p className="text-sm text-yellow-700">Vencem em 30 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{categorizedAlerts.ok.length}</div>
                  <p className="text-sm text-green-700">Em dia (&gt;30 dias)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts by Category */}
        <LoadingState
          loading={isLoading}
          error={error?.message}
          retry={refetch}
          empty={!alerts?.length}
          emptyMessage="Nenhum alerta de vencimento cadastrado"
        >
          <Tabs defaultValue="critical" className="space-y-4">
            <TabsList>
              <TabsTrigger value="critical" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Crítico ({categorizedAlerts.critical.length})
              </TabsTrigger>
              <TabsTrigger value="attention" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Atenção ({categorizedAlerts.attention.length})
              </TabsTrigger>
              <TabsTrigger value="ok" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Em Dia ({categorizedAlerts.ok.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="critical">
              {renderAlertTable(categorizedAlerts.critical, "🔴 Vencidos", "border-red-200")}
            </TabsContent>

            <TabsContent value="attention">
              {renderAlertTable(categorizedAlerts.attention, "🟡 Vencem em até 30 dias", "border-yellow-200")}
            </TabsContent>

            <TabsContent value="ok">
              {renderAlertTable(categorizedAlerts.ok, "🟢 Em dia", "border-green-200")}
            </TabsContent>
          </Tabs>
        </LoadingState>
      </div>
    </MainLayout>
  );
}
