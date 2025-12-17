import { Pencil, FileText, Calendar, Users, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStandards } from "@/hooks/audit/useStandards";
import { useCategories } from "@/hooks/audit/useCategories";
import { useTemplates } from "@/hooks/audit/useTemplates";
import { AuditFormData } from "./AuditCreationWizard";

interface WizardStepReviewProps {
  formData: AuditFormData;
  onEditStep: (step: number) => void;
}

export function WizardStepReview({ formData, onEditStep }: WizardStepReviewProps) {
  const { data: standards } = useStandards();
  const { data: categories } = useCategories();
  const { data: allTemplates } = useTemplates();
  const templates = allTemplates?.filter(t => !formData.category_id || t.category_id === formData.category_id);

  const selectedStandards = standards?.filter((s) =>
    formData.standard_ids.includes(s.id)
  );

  const category = categories?.find((c) => c.id === formData.category_id);
  const template = templates?.find((t) => t.id === formData.template_id);

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const totalItems = formData.sessions.reduce(
    (sum, session) => sum + session.item_ids.length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <span>Revise as informações antes de criar a auditoria</span>
      </div>

      {/* Dados Gerais */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dados Gerais
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => onEditStep(1)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-3 px-4 pt-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Título</dt>
              <dd className="font-medium">{formData.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Categoria</dt>
              <dd>{category?.title || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Template</dt>
              <dd>{template?.name || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Entidade Auditada</dt>
              <dd>{formData.target_entity || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data Início</dt>
              <dd>{formatDate(formData.start_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data Fim</dt>
              <dd>{formatDate(formData.end_date)}</dd>
            </div>
            {formData.description && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Descrição</dt>
                <dd className="text-muted-foreground line-clamp-2">
                  {formData.description}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Normas */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Normas ({formData.standard_ids.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => onEditStep(2)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-3 px-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {selectedStandards?.map((standard) => (
              <Badge key={standard.id} variant="secondary">
                {standard.code}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sessões */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sessões ({formData.sessions.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => onEditStep(3)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-3 px-4 pt-0">
          {formData.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão configurada. Você poderá criar sessões após criar a auditoria.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.sessions.map((session, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{session.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {session.session_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.session_date)}
                        </span>
                      )}
                      {session.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                      )}
                      <span>{session.item_ids.length} itens</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4 px-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total de normas:</span>
            <span className="font-medium">{formData.standard_ids.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span>Total de sessões:</span>
            <span className="font-medium">{formData.sessions.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span>Total de itens nas sessões:</span>
            <span className="font-medium">{totalItems}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
