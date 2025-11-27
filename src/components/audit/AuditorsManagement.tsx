import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Award } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CreateAuditorDialog } from "./CreateAuditorDialog";
import { EditAuditorDialog } from "./EditAuditorDialog";
import { useToast } from "@/hooks/use-toast";

export function AuditorsManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAuditor, setEditingAuditor] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: auditors, isLoading } = useQuery({
    queryKey: ['auditor-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditor_profiles')
        .select(`
          *,
          user:profiles!auditor_profiles_user_id_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auditor_profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditor-profiles'] });
      toast({
        title: "Auditor removido",
        description: "O perfil de auditor foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o auditor.",
        variant: "destructive",
      });
    },
  });

  const getQualificationBadge = (level: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      lead_auditor: { variant: "default", label: "Auditor Líder" },
      auditor: { variant: "secondary", label: "Auditor" },
      auditor_in_training: { variant: "outline", label: "Em Treinamento" },
    };
    const config = variants[level] || variants.auditor;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      accessorKey: "user.full_name",
      header: "Nome",
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium">{row.original.user?.full_name}</p>
        </div>
      ),
    },
    {
      accessorKey: "qualification_level",
      header: "Qualificação",
      cell: ({ row }: any) => getQualificationBadge(row.original.qualification_level),
    },
    {
      accessorKey: "certifications",
      header: "Certificações",
      cell: ({ row }: any) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.certifications?.map((cert: string, i: number) => (
            <Badge key={i} variant="outline" className="text-xs">
              <Award className="w-3 h-3 mr-1" />
              {cert}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "standards_competent",
      header: "Normas",
      cell: ({ row }: any) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.standards_competent?.map((std: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {std}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "audit_hours_completed",
      header: "Horas",
      cell: ({ row }: any) => (
        <span className="text-sm">{row.original.audit_hours_completed || 0}h</span>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingAuditor(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Auditores</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre e gerencie os perfis dos auditores da empresa
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Auditor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auditores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : (
            <DataTable columns={columns} data={auditors || []} />
          )}
        </CardContent>
      </Card>

      <CreateAuditorDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {editingAuditor && (
        <EditAuditorDialog
          open={!!editingAuditor}
          onOpenChange={(open) => !open && setEditingAuditor(null)}
          auditor={editingAuditor}
        />
      )}
    </div>
  );
}
