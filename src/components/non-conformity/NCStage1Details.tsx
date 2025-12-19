import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Calendar, 
  User, 
  AlertTriangle, 
  Building, 
  CheckCircle,
  Clock,
  Tag
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NonConformity } from "@/services/nonConformityService";

interface NCStage1DetailsProps {
  nc: NonConformity;
  onComplete: () => void;
  isLoading?: boolean;
}

const severityConfig: Record<string, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  critical: { label: "Crítica", variant: "destructive" },
  major: { label: "Maior", variant: "destructive" },
  minor: { label: "Menor", variant: "default" },
  observation: { label: "Observação", variant: "secondary" },
};

const statusConfig: Record<string, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  open: { label: "Aberta", variant: "destructive" },
  in_progress: { label: "Em Andamento", variant: "default" },
  closed: { label: "Encerrada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "outline" },
};

export function NCStage1Details({ nc, onComplete, isLoading }: NCStage1DetailsProps) {
  const severity = severityConfig[nc.severity] || { label: nc.severity, variant: "default" as const };
  const status = statusConfig[nc.status] || { label: nc.status, variant: "default" as const };

  const isStageComplete = nc.current_stage > 1 || !!nc.stage_1_completed_at;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-primary font-mono">
              {nc.nc_number}
            </Badge>
            <Badge variant={severity.variant}>{severity.label}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <h2 className="text-2xl font-bold">{nc.title}</h2>
        </div>
        
        {!isStageComplete && (
          <Button onClick={onComplete} disabled={isLoading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Completar Registro
          </Button>
        )}
        
        {isStageComplete && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Etapa Concluída
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Descrição</label>
              <p className="mt-1 text-sm">{nc.description || "Sem descrição"}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Categoria</label>
                <p className="mt-1 text-sm font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {nc.category || "Não definida"}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Fonte</label>
                <p className="mt-1 text-sm font-medium">{nc.source || "Não definida"}</p>
              </div>
            </div>
            
            {nc.damage_level && (
              <>
                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Nível de Dano</label>
                  <p className="mt-1 text-sm">{nc.damage_level}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Detecção e Prazos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datas e Prazos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Data de Detecção</label>
                <p className="mt-1 text-sm font-medium">
                  {format(new Date(nc.detected_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Data de Criação</label>
                <p className="mt-1 text-sm font-medium">
                  {format(new Date(nc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <Separator />
            
            {nc.due_date && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Prazo Final</label>
                <p className="mt-1 text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(nc.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            
            {nc.completion_date && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Data de Conclusão</label>
                <p className="mt-1 text-sm font-medium text-green-600">
                  {format(new Date(nc.completion_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responsáveis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Responsável</label>
              <p className="mt-1 text-sm font-medium">
                {nc.responsible_user_id || "Não atribuído"}
              </p>
            </div>
            
            {nc.approved_by_user_id && (
              <>
                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Aprovado por</label>
                  <p className="mt-1 text-sm font-medium">{nc.approved_by_user_id}</p>
                  {nc.approval_date && (
                    <p className="text-xs text-muted-foreground">
                      em {format(new Date(nc.approval_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nc.organizational_unit_id && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Unidade Organizacional</label>
                <p className="mt-1 text-sm font-medium">{nc.organizational_unit_id}</p>
              </div>
            )}
            
            {nc.process_id && (
              <>
                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Processo</label>
                  <p className="mt-1 text-sm font-medium">{nc.process_id}</p>
                </div>
              </>
            )}
            
            {!nc.organizational_unit_id && !nc.process_id && (
              <p className="text-sm text-muted-foreground">Nenhuma localização definida</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análise de Impacto */}
      {nc.impact_analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Análise de Impacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{nc.impact_analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Revisão */}
      {nc.revision_number > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3">
            <p className="text-sm text-amber-800">
              <strong>Revisão #{nc.revision_number}</strong>
              {nc.parent_nc_id && ` - Originada da NC ${nc.parent_nc_id}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
