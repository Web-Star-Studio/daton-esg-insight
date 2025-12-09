import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { LegislationUnitCompliance } from "@/services/legislations";
import { useCompanyUsers } from "@/hooks/data/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

const formSchema = z.object({
  applicability: z.enum(['real', 'potential', 'na', 'revoked', 'pending']),
  compliance_status: z.enum(['conforme', 'para_conhecimento', 'adequacao', 'plano_acao', 'pending']),
  has_pending_requirements: z.boolean(),
  pending_description: z.string().optional(),
  action_plan: z.string().optional(),
  action_plan_deadline: z.string().optional(),
  evidence_notes: z.string().optional(),
  unit_responsible_user_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UnitComplianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legislationId: string;
  branchId: string;
  branchName: string;
  existingCompliance?: LegislationUnitCompliance | null;
  onSave: (data: Partial<LegislationUnitCompliance>) => void;
  isSaving?: boolean;
}

export const UnitComplianceModal: React.FC<UnitComplianceModalProps> = ({
  open,
  onOpenChange,
  legislationId,
  branchId,
  branchName,
  existingCompliance,
  onSave,
  isSaving,
}) => {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { data: users } = useCompanyUsers();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicability: 'pending',
      compliance_status: 'pending',
      has_pending_requirements: false,
      pending_description: '',
      action_plan: '',
      action_plan_deadline: '',
      evidence_notes: '',
      unit_responsible_user_id: '',
    },
  });

  useEffect(() => {
    if (existingCompliance) {
      form.reset({
        applicability: existingCompliance.applicability,
        compliance_status: existingCompliance.compliance_status,
        has_pending_requirements: existingCompliance.has_pending_requirements,
        pending_description: existingCompliance.pending_description || '',
        action_plan: existingCompliance.action_plan || '',
        action_plan_deadline: existingCompliance.action_plan_deadline || '',
        evidence_notes: existingCompliance.evidence_notes || '',
        unit_responsible_user_id: existingCompliance.unit_responsible_user_id || '',
      });
    } else {
      form.reset({
        applicability: 'pending',
        compliance_status: 'pending',
        has_pending_requirements: false,
        pending_description: '',
        action_plan: '',
        action_plan_deadline: '',
        evidence_notes: '',
        unit_responsible_user_id: '',
      });
    }
  }, [existingCompliance, form]);

  const onSubmit = (data: FormData) => {
    onSave({
      legislation_id: legislationId,
      branch_id: branchId,
      company_id: selectedCompany?.id,
      ...data,
      unit_responsible_user_id: data.unit_responsible_user_id || null,
      action_plan_deadline: data.action_plan_deadline || null,
      evaluated_at: new Date().toISOString(),
      evaluated_by: user?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliação de Conformidade - {branchName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applicability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicabilidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="real">Real (Aplicável)</SelectItem>
                        <SelectItem value="potential">Potencial</SelectItem>
                        <SelectItem value="na">Não Aplicável</SelectItem>
                        <SelectItem value="revoked">Revogada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compliance_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status de Atendimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="conforme">Conforme</SelectItem>
                        <SelectItem value="para_conhecimento">Para Conhecimento</SelectItem>
                        <SelectItem value="adequacao">Em Adequação</SelectItem>
                        <SelectItem value="plano_acao">Plano de Ação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_responsible_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável da Unidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="has_pending_requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Possui Pendências?</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(v === 'true')} 
                      value={field.value ? 'true' : 'false'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="false">Não</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pending_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição das Pendências</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva as pendências ou requisitos não atendidos..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Ação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o plano de ação para atender a legislação..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action_plan_deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo do Plano de Ação</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidence_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas sobre Evidências</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre evidências de conformidade..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Avaliação'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
