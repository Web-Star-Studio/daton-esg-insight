import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AuditTeamTabProps {
  auditId: string;
}

export function AuditTeamTab({ auditId }: AuditTeamTabProps) {
  const [selectedAuditor, setSelectedAuditor] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: audit } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*, audit_plans(*)')
        .eq('id', auditId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: auditors } = useQuery({
    queryKey: ['auditor-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditor_profiles')
        .select(`
          *,
          user:profiles!auditor_profiles_user_id_fkey(id, full_name)
        `)
        .order('user(full_name)');
      if (error) throw error;
      return data || [];
    },
  });

  const teamMembers = audit?.audit_plans?.[0]?.team_members as any[] || [];

  const addTeamMemberMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAuditor || !selectedRole) {
        throw new Error("Selecione um auditor e função");
      }

      const auditorData = auditors?.find(a => a.id === selectedAuditor);
      const newMember = {
        auditor_id: selectedAuditor,
        auditor_name: auditorData?.user?.full_name,
        role: selectedRole,
      };

      const updatedTeam = [...teamMembers, newMember];

      // Update or create audit plan
      if (audit?.audit_plans?.[0]) {
        const { error } = await supabase
          .from('audit_plans')
          .update({ team_members: updatedTeam })
          .eq('id', audit.audit_plans[0].id);
        if (error) throw error;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        const { error } = await supabase
          .from('audit_plans')
          .insert({
            audit_id: auditId,
            company_id: profile?.company_id,
            audit_type: audit?.audit_type || 'internal',
            status: 'draft',
            team_members: updatedTeam,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      setSelectedAuditor("");
      setSelectedRole("");
      toast({
        title: "Membro adicionado",
        description: "O auditor foi adicionado à equipe.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o membro.",
        variant: "destructive",
      });
    },
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (auditorId: string) => {
      const updatedTeam = teamMembers.filter(m => m.auditor_id !== auditorId);

      const { error } = await supabase
        .from('audit_plans')
        .update({ team_members: updatedTeam })
        .eq('id', audit?.audit_plans?.[0]?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      toast({
        title: "Membro removido",
        description: "O auditor foi removido da equipe.",
      });
    },
  });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary"; label: string }> = {
      lead: { variant: "default", label: "Líder" },
      member: { variant: "secondary", label: "Membro" },
      observer: { variant: "secondary", label: "Observador" },
    };
    const config = variants[role] || variants.member;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Equipe de Auditoria</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os auditores participantes desta auditoria
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Selecionar Auditor</Label>
              <Select value={selectedAuditor} onValueChange={setSelectedAuditor}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um auditor" />
                </SelectTrigger>
                <SelectContent>
                  {auditors?.map((auditor) => (
                    <SelectItem key={auditor.id} value={auditor.id}>
                      {auditor.user?.full_name} - {auditor.qualification_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Função na Equipe</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Auditor Líder</SelectItem>
                  <SelectItem value="member">Membro da Equipe</SelectItem>
                  <SelectItem value="observer">Observador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => addTeamMemberMutation.mutate()}
            disabled={!selectedAuditor || !selectedRole || addTeamMemberMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar à Equipe
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {teamMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum membro na equipe</p>
              <p className="text-sm">Adicione auditores para formar a equipe</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <UserCheck className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{member.auditor_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getRoleBadge(member.role)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMemberMutation.mutate(member.auditor_id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
