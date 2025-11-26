import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, AlertCircle, Calendar } from "lucide-react";
import { useAuditAreas } from "@/hooks/useAuditAreas";
import { AuditAreaModal } from "./AuditAreaModal";
import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AuditAreasManagement() {
  const { areas, isLoading } = useAuditAreas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      low: { variant: "outline", label: "Baixo" },
      medium: { variant: "secondary", label: "Médio" },
      high: { variant: "default", label: "Alto" },
      critical: { variant: "destructive", label: "Crítico" },
    };
    const config = variants[riskLevel] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStandardsBadges = (standards: any) => {
    if (!standards || typeof standards !== 'object') return null;
    const standardsList = Array.isArray(standards) ? standards : Object.keys(standards);
    return (
      <div className="flex flex-wrap gap-1">
        {standardsList.map((std: string) => (
          <Badge key={std} variant="outline" className="text-xs">
            {std}
          </Badge>
        ))}
      </div>
    );
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Área/Processo",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "department",
      header: "Departamento",
      cell: ({ row }: any) => row.original.department || "-",
    },
    {
      accessorKey: "risk_level",
      header: "Nível de Risco",
      cell: ({ row }: any) => getRiskBadge(row.original.risk_level),
    },
    {
      accessorKey: "applicable_standards",
      header: "Normas Aplicáveis",
      cell: ({ row }: any) => getStandardsBadges(row.original.applicable_standards),
    },
    {
      accessorKey: "next_audit_date",
      header: "Próxima Auditoria",
      cell: ({ row }: any) => {
        if (!row.original.next_audit_date) return "-";
        return format(new Date(row.original.next_audit_date), 'dd/MM/yyyy', { locale: ptBR });
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedArea(row.original);
            setIsModalOpen(true);
          }}
        >
          Editar
        </Button>
      ),
    },
  ];

  const stats = {
    total: areas?.length || 0,
    byRisk: {
      critical: areas?.filter(a => a.risk_level === 'critical').length || 0,
      high: areas?.filter(a => a.risk_level === 'high').length || 0,
      medium: areas?.filter(a => a.risk_level === 'medium').length || 0,
      low: areas?.filter(a => a.risk_level === 'low').length || 0,
    },
  };

  if (isLoading) {
    return <div className="p-6">Carregando áreas auditáveis...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Áreas Auditáveis</h2>
          <p className="text-muted-foreground">
            Gerencie processos e áreas sujeitas a auditoria
          </p>
        </div>
        <Button onClick={() => {
          setSelectedArea(null);
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Área
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Áreas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Áreas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco Crítico</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRisk.critical}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco Alto</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRisk.high}</div>
            <p className="text-xs text-muted-foreground">Prioridade elevada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco Médio/Baixo</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRisk.medium + stats.byRisk.low}</div>
            <p className="text-xs text-muted-foreground">Monitoramento regular</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Áreas e Processos</CardTitle>
          <CardDescription>
            Lista de áreas e processos mapeados para auditoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {areas && areas.length > 0 ? (
            <DataTable columns={columns} data={areas} />
          ) : (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma área cadastrada</h3>
              <p className="text-muted-foreground">
                Comece mapeando as áreas e processos da sua organização.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AuditAreaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        area={selectedArea}
      />
    </div>
  );
}
