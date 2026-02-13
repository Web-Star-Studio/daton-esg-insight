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
import { User, Building2, Calendar, Settings, Package, Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { MODULE_MAP_BY_ID } from "@/components/onboarding/modulesCatalog";

// ── Dicionários de tradução ──────────────────────────────────────

const COMPANY_PROFILE_LABELS: Record<string, string> = {
  size: "Porte da empresa",
  sector: "Setor de atuação",
  goals: "Objetivos ESG",
  maturity_level: "Nível de maturidade",
  maturityLevel: "Nível de maturidade",
  current_challenges: "Desafios atuais",
  currentChallenges: "Desafios atuais",
  employees_count: "Nº de funcionários",
};

const VALUE_TRANSLATIONS: Record<string, string> = {
  // Porte
  micro: "Micro", small: "Pequena", medium: "Média", large: "Grande", enterprise: "Corporação",
  // Setor
  services: "Serviços", industry: "Indústria", commerce: "Comércio", agriculture: "Agropecuária",
  technology: "Tecnologia", construction: "Construção", education: "Educação", health: "Saúde",
  // Maturidade
  beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado", leader: "Líder",
  // Objetivos / Desafios
  quality: "Qualidade", compliance: "Compliance", performance: "Performance",
  innovation: "Inovação", cost_reduction: "Redução de custos",
  health_safety: "Saúde e Segurança", water_management: "Gestão de água",
  waste_reduction: "Redução de resíduos", carbon_neutrality: "Neutralidade de carbono",
  energy_efficiency: "Eficiência energética", social_responsibility: "Responsabilidade social",
  regulatory: "Regulatório", data_collection: "Coleta de dados",
  stakeholder_engagement: "Engajamento de stakeholders",
  supply_chain: "Cadeia de suprimentos",
};

const FEATURE_LABELS: Record<string, string> = {
  // Inventário GEE
  auto_calculate: "Cálculo automático", import_data: "Importação de dados", notifications: "Notificações",
  // Energia
  medir_consumo: "Medição de consumo", metas_reducao: "Metas de redução", alertas_pico: "Alertas de pico",
  // Resíduos
  segregacao: "Segregação", manifestos_digitais: "Manifestos digitais", rastreio_coleta: "Rastreio de coleta",
  // Qualidade
  audit_scheduling: "Agendamento de auditorias", procedure_management: "Gestão de procedimentos",
  nonconformity_tracking: "Rastreio de não-conformidades",
  // S&S
  incidentes: "Registro de incidentes", inspecoes: "Inspeções", treinamentos_obrigatorios: "Treinamentos obrigatórios",
  // Performance
  kpi_tracking: "Acompanhamento de KPIs", dashboards: "Dashboards", benchmarking: "Benchmarking",
  // Análise de Dados
  data_visualization: "Visualização de dados", custom_reports: "Relatórios customizados", export: "Exportação",
  // Gestão de Pessoas
  training_tracking: "Acompanhamento de treinamentos", performance_reviews: "Avaliações de desempenho",
  goal_setting: "Definição de metas",
  // Documentos
  version_control: "Controle de versão", approval_workflow: "Fluxo de aprovação", search: "Busca",
  // Economia Circular
  rastrear_materiais: "Rastreio de materiais", parceiros_reciclagem: "Parceiros de reciclagem",
  indicadores_circularidade: "Indicadores de circularidade",
  // Inovação
  portfolio_ideias: "Portfólio de ideias", pipeline_poc: "Pipeline de PoC", indicadores_inovacao: "Indicadores de inovação",
  // Stakeholders
  mapa_stakeholders: "Mapa de stakeholders", pesquisas_satisfacao: "Pesquisas de satisfação",
  registro_interacoes: "Registro de interações",
};

function translateValue(value: string): string {
  return VALUE_TRANSLATIONS[value] ?? value.replace(/_/g, " ");
}

function getModuleName(id: string): string {
  return MODULE_MAP_BY_ID[id]?.name ?? id.replace(/_/g, " ");
}

function getFeatureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key.replace(/_/g, " ");
}

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
                            {getModuleName(m)}
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
                        {Object.entries(companyProfile).map(([key, value]) => {
                          const label = COMPANY_PROFILE_LABELS[key] ?? key.replace(/_/g, " ");
                          const isArray = Array.isArray(value);
                          return (
                            <div key={key} className={`text-xs ${isArray ? "col-span-2" : ""}`}>
                              <span className="text-muted-foreground">{label}</span>
                              {isArray ? (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {(value as string[]).length > 0 ? (value as string[]).map((v) => (
                                    <Badge key={v} variant="secondary" className="text-xs">
                                      {translateValue(v)}
                                    </Badge>
                                  )) : <p className="font-medium">—</p>}
                                </div>
                              ) : (
                                <p className="font-medium">{translateValue(String(value ?? "—"))}</p>
                              )}
                            </div>
                          );
                        })}
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
                          <div className="space-y-3">
                            {Object.entries(moduleConfigs).map(([moduleId, features]) => (
                              <div key={moduleId}>
                                <p className="text-xs font-semibold mb-1">{getModuleName(moduleId)}</p>
                                <div className="space-y-0.5 pl-1">
                                  {Object.entries(features as Record<string, boolean>).map(([feat, enabled]) => (
                                    <div key={feat} className="flex items-center gap-1.5 text-xs">
                                      {enabled ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                                      ) : (
                                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                      )}
                                      <span className={enabled ? "" : "text-muted-foreground"}>{getFeatureLabel(feat)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
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
