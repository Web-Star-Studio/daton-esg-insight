import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditFindingsTabProps {
  auditId: string;
}

export function AuditFindingsTab({ auditId }: AuditFindingsTabProps) {
  const { data: findings } = useQuery({
    queryKey: ['audit-findings', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', auditId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      critical: { variant: "destructive", label: "Crítico" },
      major: { variant: "destructive", label: "Maior" },
      minor: { variant: "secondary", label: "Menor" },
      observation: { variant: "default", label: "Observação" },
    };
    const config = variants[severity] || variants.observation;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      open: { variant: "destructive", label: "Aberto" },
      in_progress: { variant: "secondary", label: "Em Andamento" },
      resolved: { variant: "outline", label: "Resolvido" },
      closed: { variant: "default", label: "Fechado" },
    };
    const config = variants[status] || variants.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }: any) => (
        <div className="max-w-md">
          <p className="font-medium">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severidade",
      cell: ({ row }: any) => getSeverityBadge(row.original.severity),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "due_date",
      header: "Prazo",
      cell: ({ row }: any) => {
        if (!row.original.due_date) return "-";
        return format(new Date(row.original.due_date), 'dd/MM/yyyy', { locale: ptBR });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Achados de Auditoria</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie não conformidades, observações e oportunidades de melhoria
          </p>
        </div>
      </div>

      {findings && findings.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <DataTable columns={columns} data={findings} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum achado registrado</h3>
            <p className="text-muted-foreground">
              Os achados aparecerão aqui conforme forem identificados na auditoria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
