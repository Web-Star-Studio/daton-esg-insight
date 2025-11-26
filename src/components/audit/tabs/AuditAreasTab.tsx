import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Building2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AuditAreasTabProps {
  auditId: string;
}

export function AuditAreasTab({ auditId }: AuditAreasTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const { data: allAreas } = useQuery({
    queryKey: ['audit-areas'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data, error } = await supabase
        .from('audit_areas')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ['audit-area-assignments', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_area_assignments')
        .select('*, audit_areas(*)')
        .eq('audit_id', auditId);
      if (error) throw error;
      return data || [];
    },
  });

  const assignAreas = useMutation({
    mutationFn: async (areaIds: string[]) => {
      const inserts = areaIds.map(areaId => ({
        audit_id: auditId,
        area_id: areaId,
        status: 'pending' as const,
      }));

      const { error } = await supabase
        .from('audit_area_assignments')
        .insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-area-assignments', auditId] });
      toast({ title: "Áreas vinculadas", description: "Áreas adicionadas à auditoria." });
      setIsDialogOpen(false);
      setSelectedAreas([]);
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao vincular áreas.", variant: "destructive" });
    },
  });

  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('audit_area_assignments')
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-area-assignments', auditId] });
      toast({ title: "Área removida", description: "Área desvinculada da auditoria." });
    },
  });

  const assignedAreaIds = assignments?.map(a => a.area_id) || [];
  const availableAreas = allAreas?.filter(a => !assignedAreaIds.includes(a.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Áreas Auditadas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as áreas e processos incluídos nesta auditoria
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Áreas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Áreas à Auditoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {availableAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todas as áreas já estão vinculadas ou não há áreas cadastradas.
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableAreas.map((area) => (
                      <div key={area.id} className="flex items-start space-x-3 p-3 border rounded">
                        <Checkbox
                          id={area.id}
                          checked={selectedAreas.includes(area.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAreas([...selectedAreas, area.id]);
                            } else {
                              setSelectedAreas(selectedAreas.filter(id => id !== area.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={area.id} className="font-medium cursor-pointer">
                            {area.name}
                          </Label>
                          {area.description && (
                            <p className="text-sm text-muted-foreground">{area.description}</p>
                          )}
                          <Badge variant="outline" className="mt-1">
                            Risco: {area.risk_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => assignAreas.mutate(selectedAreas)}
                    disabled={selectedAreas.length === 0}
                    className="w-full"
                  >
                    Adicionar {selectedAreas.length} área(s)
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((assignment: any) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{assignment.audit_areas.name}</CardTitle>
                    {assignment.audit_areas.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.audit_areas.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAssignment.mutate(assignment.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant={assignment.status === 'completed' ? 'default' : 'secondary'}>
                    {assignment.status === 'completed' ? 'Auditada' : 'Pendente'}
                  </Badge>
                  <Badge variant="outline">
                    Risco: {assignment.audit_areas.risk_level}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma área vinculada</h3>
            <p className="text-muted-foreground">
              Adicione áreas e processos a serem auditados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
