import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { User, Building2, Calendar, Settings, Package, Briefcase } from "lucide-react";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  userCompany: string;
  userJobTitle: string;
  userIsApproved: boolean;
  userIsActive: boolean;
  userCreatedAt: string;
  userRole: string;
}

export function UserDetailsModal({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  userCompany,
  userJobTitle,
  userIsApproved,
  userIsActive,
  userCreatedAt,
  userRole,
}: UserDetailsModalProps) {
  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["user-onboarding-details", userId],
    enabled: open && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_selections")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const selectedModules = (onboarding?.selected_modules as string[]) ?? [];
  const moduleConfigs = (onboarding?.module_configurations as Record<string, any>) ?? {};
  const companyProfile = (onboarding?.company_profile as Record<string, any>) ?? {};
  const isCompleted = onboarding?.is_completed ?? false;
  const completedAt = onboarding?.completed_at;
  const currentStep = onboarding?.current_step ?? 0;
  const totalSteps = (onboarding as any)?.total_steps ?? 4;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
          <DialogDescription>
            Informações completas do perfil e onboarding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Profile Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nome</span>
                <p className="font-medium">{userName || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{userEmail}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Empresa</span>
                <p className="font-medium">{userCompany || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cargo</span>
                <p className="font-medium">{userJobTitle || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Role</span>
                <p><Badge variant="secondary">{userRole || "—"}</Badge></p>
              </div>
              <div>
                <span className="text-muted-foreground">Cadastro</span>
                <p className="font-medium">
                  {userCreatedAt ? format(new Date(userCreatedAt), "dd/MM/yyyy HH:mm") : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p>
                  <Badge variant={userIsActive ? "success-subtle" : "destructive-subtle"}>
                    {userIsActive ? "Ativo" : "Inativo"}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Aprovação</span>
                <p>
                  <Badge variant={userIsApproved ? "success-subtle" : "warning-subtle"}>
                    {userIsApproved ? "Aprovado" : "Pendente"}
                  </Badge>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" /> Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !onboarding ? (
                <p className="text-sm text-muted-foreground">Onboarding não iniciado.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <StatusIndicator status={isCompleted ? "success" : "pending"}>
                      {isCompleted ? "Concluído" : "Em andamento"}
                    </StatusIndicator>
                    {completedAt && (
                      <span className="text-xs text-muted-foreground">
                        em {format(new Date(completedAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    )}
                  </div>

                  {!isCompleted && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Etapa {currentStep + 1} de {totalSteps}</span>
                        <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
                      </div>
                      <Progress value={((currentStep + 1) / totalSteps) * 100} />
                    </div>
                  )}

                  {/* Selected Modules */}
                  {selectedModules.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" /> Módulos selecionados
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedModules.map((m) => (
                          <Badge key={m} variant="outline" className="text-xs">
                            {m.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company Profile */}
                  {Object.keys(companyProfile).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" /> Perfil da empresa (onboarding)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(companyProfile).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                            <p className="font-medium truncate">{String(value ?? "—")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Module Configurations */}
                  {Object.keys(moduleConfigs).length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="configs" className="border-none">
                        <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Configurações de módulos
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-auto max-h-48">
                            {JSON.stringify(moduleConfigs, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
