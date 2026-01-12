import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  getCategoryColor, 
  getSignificanceColor,
  CONTROL_TYPES 
} from "@/types/laia";
import type { LAIAAssessment } from "@/types/laia";
import { X, Pencil, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LAIAAssessmentDetailProps {
  assessment: LAIAAssessment | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (assessment: LAIAAssessment) => void;
}

export function LAIAAssessmentDetail({ 
  assessment, 
  open, 
  onClose, 
  onEdit 
}: LAIAAssessmentDetailProps) {
  if (!assessment) return null;

  const getLabel = (value: string, type: string) => {
    const labels: Record<string, Record<string, string>> = {
      temporality: { passada: "Passada", atual: "Atual", futura: "Futura" },
      operational_situation: { normal: "Normal", anormal: "Anormal", emergencia: "Emergência" },
      incidence: { direto: "Direto (Sob Controle)", indireto: "Indireto (Sob Influência)" },
      impact_class: { benefico: "Benéfico", adverso: "Adverso" },
      scope: { local: "Local", regional: "Regional", global: "Global" },
      severity: { baixa: "Baixa", media: "Média", alta: "Alta" },
      frequency_probability: { baixa: "Baixa", media: "Média", alta: "Alta" },
      category: { desprezivel: "Desprezível", moderado: "Moderado", critico: "Crítico" },
      significance: { significativo: "Significativo", nao_significativo: "Não Significativo" },
      status: { ativo: "Ativo", inativo: "Inativo", em_revisao: "Em Revisão" },
    };
    return labels[type]?.[value] ?? value;
  };

  const getControlTypeLabel = (value: string) => {
    return CONTROL_TYPES.find(c => c.value === value)?.label ?? value;
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Avaliação {assessment.aspect_code}
          </SheetTitle>
          <SheetDescription>
            Detalhes completos da avaliação LAIA
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge className={getCategoryColor(assessment.category)}>
                {getLabel(assessment.category, "category")}
              </Badge>
              <Badge className={getSignificanceColor(assessment.significance)}>
                {getLabel(assessment.significance, "significance")}
              </Badge>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(assessment)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>

          <Separator />

          {/* Identification Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">IDENTIFICAÇÃO</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Código</div>
                <div className="font-mono font-medium">{assessment.aspect_code}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Setor</div>
                <div>{assessment.sector?.code} - {assessment.sector?.name}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Atividade/Operação</div>
              <div>{assessment.activity_operation}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Aspecto Ambiental</div>
              <div>{assessment.environmental_aspect}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Impacto Ambiental</div>
              <div>{assessment.environmental_impact}</div>
            </div>
          </div>

          <Separator />

          {/* Characterization Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">CARACTERIZAÇÃO</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Temporalidade</div>
                <div>{getLabel(assessment.temporality, "temporality")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Situação Operacional</div>
                <div>{getLabel(assessment.operational_situation, "operational_situation")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Incidência</div>
                <div>{getLabel(assessment.incidence, "incidence")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Classe do Impacto</div>
                <div>{getLabel(assessment.impact_class, "impact_class")}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Scoring Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">VERIFICAÇÃO DE IMPORTÂNCIA</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Abrangência</div>
                <div>{getLabel(assessment.scope, "scope")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Severidade</div>
                <div>{getLabel(assessment.severity, "severity")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Freq./Probabilidade</div>
                <div>{getLabel(assessment.frequency_probability, "frequency_probability")}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Consequência</div>
                <div className="text-lg font-bold">{assessment.consequence_score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Freq./Prob.</div>
                <div className="text-lg font-bold">{assessment.freq_prob_score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg font-bold">{assessment.total_score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Categoria</div>
                <Badge className={`mt-1 ${getCategoryColor(assessment.category)}`}>
                  {getLabel(assessment.category, "category")}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Significance Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">AVALIAÇÃO DE SIGNIFICÂNCIA</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={assessment.has_legal_requirements ? "default" : "outline"}>
                  Requisitos Legais
                </Badge>
                <Badge variant={assessment.has_stakeholder_demand ? "default" : "outline"}>
                  Demanda de Partes Interessadas
                </Badge>
                <Badge variant={assessment.has_strategic_options ? "default" : "outline"}>
                  Opções Estratégicas
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Controls Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">OBSERVAÇÕES ADICIONAIS</h4>
            
            {assessment.control_types && assessment.control_types.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Tipos de Controle</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {assessment.control_types.map((type) => (
                    <Badge key={type} variant="secondary">
                      {getControlTypeLabel(type)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {assessment.existing_controls && (
              <div>
                <div className="text-xs text-muted-foreground">Controles Existentes</div>
                <div>{assessment.existing_controls}</div>
              </div>
            )}

            {assessment.legislation_reference && (
              <div>
                <div className="text-xs text-muted-foreground">Referência Legal</div>
                <div>{assessment.legislation_reference}</div>
              </div>
            )}
          </div>

          {/* Lifecycle Section */}
          {assessment.has_lifecycle_control && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">PERSPECTIVA DO CICLO DE VIDA</h4>
                
                {assessment.lifecycle_stages && assessment.lifecycle_stages.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground">Estágios</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assessment.lifecycle_stages.map((stage) => (
                        <Badge key={stage} variant="outline">
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.output_actions && (
                  <div>
                    <div className="text-xs text-muted-foreground">Saídas/Ações</div>
                    <div>{assessment.output_actions}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Criado em {format(new Date(assessment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
            {assessment.responsible_user && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsável: {assessment.responsible_user.full_name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getLabel(assessment.status, "status")}</Badge>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
