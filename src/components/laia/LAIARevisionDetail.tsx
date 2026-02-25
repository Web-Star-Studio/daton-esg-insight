import { useLAIARevision } from "@/hooks/useLAIARevisions";
import { FIELD_LABELS, type LAIARevisionChange } from "@/services/laiaRevisionService";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Pencil, Trash2, ArrowRight, MapPin, FileText, Layers } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  revisionId: string;
}

const VALUE_LABELS: Record<string, Record<string, string>> = {
  temporality: { passada: "Passada", atual: "Atual", futura: "Futura" },
  operational_situation: { normal: "Normal", anormal: "Anormal", emergencia: "Emergência" },
  incidence: { direto: "Direto", indireto: "Indireto" },
  impact_class: { benefico: "Benéfico", adverso: "Adverso" },
  scope: { local: "Local", regional: "Regional", global: "Global" },
  severity: { baixa: "Baixa", media: "Média", alta: "Alta" },
  frequency_probability: { baixa: "Baixa", media: "Média", alta: "Alta" },
};

function formatValue(fieldName: string | null, value: string | null): string {
  if (value === null || value === undefined) return "—";
  
  try {
    const parsed = JSON.parse(value);
    
    if (typeof parsed === "boolean") return parsed ? "Sim" : "Não";
    if (Array.isArray(parsed)) return parsed.length ? parsed.join(", ") : "Nenhum";
    
    if (typeof parsed === "string" && fieldName && VALUE_LABELS[fieldName]) {
      return VALUE_LABELS[fieldName][parsed] || parsed;
    }
    
    return String(parsed);
  } catch {
    return value;
  }
}

function getChangeTypeBadge(changeType: string) {
  switch (changeType) {
    case 'created':
      return <Badge variant="success-subtle"><Plus className="h-3 w-3 mr-1" /> Criado</Badge>;
    case 'updated':
      return <Badge variant="info-subtle"><Pencil className="h-3 w-3 mr-1" /> Editado</Badge>;
    case 'deleted':
      return <Badge variant="destructive-subtle"><Trash2 className="h-3 w-3 mr-1" /> Removido</Badge>;
    default:
      return <Badge variant="outline">{changeType}</Badge>;
  }
}

interface GroupedByBranch {
  branchName: string;
  entities: {
    key: string;
    entityType: string;
    changeType: string;
    assessmentInfo?: LAIARevisionChange['assessment_info'];
    sectorInfo?: LAIARevisionChange['sector_info'];
    changes: LAIARevisionChange[];
  }[];
}

export function LAIARevisionDetail({ revisionId }: Props) {
  const { data: revision, isLoading } = useLAIARevision(revisionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!revision) {
    return <p className="text-muted-foreground text-center py-8">Revisão não encontrada.</p>;
  }

  // Group changes: branch → entity → fields
  const branchGroups = new Map<string, GroupedByBranch>();

  revision.changes.forEach(change => {
    const branchKey = change.branch_id || '_no_branch';
    const branchName = change.branch_name || 'Sem unidade';
    const entityKey = `${change.entity_type}:${change.entity_id}`;

    if (!branchGroups.has(branchKey)) {
      branchGroups.set(branchKey, { branchName, entities: [] });
    }

    const group = branchGroups.get(branchKey)!;
    let entity = group.entities.find(e => e.key === entityKey);
    if (!entity) {
      entity = {
        key: entityKey,
        entityType: change.entity_type,
        changeType: change.change_type,
        assessmentInfo: change.assessment_info,
        sectorInfo: change.sector_info,
        changes: [],
      };
      group.entities.push(entity);
    }
    entity.changes.push(change);
  });

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Revisão:</strong> {String(revision.revision_number).padStart(2, '0')}</p>
        {revision.title && <p><strong>Título:</strong> {revision.title}</p>}
        {revision.description && <p><strong>Descrição:</strong> {revision.description}</p>}
        {revision.finalized_at && (
          <p><strong>Finalizada em:</strong> {format(new Date(revision.finalized_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        )}
        <p><strong>Total de alterações:</strong> {revision.changes.length}</p>
      </div>

      <Separator />

      {/* Changes grouped by branch then entity */}
      {[...branchGroups.entries()].map(([branchKey, group]) => (
        <div key={branchKey} className="space-y-3">
          {/* Branch header */}
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{group.branchName}</span>
          </div>

          <div className="ml-2 border-l-2 border-primary/20 pl-4 space-y-3">
            {group.entities.map(entity => (
              <div key={entity.key} className="rounded-lg border bg-card shadow-sm overflow-hidden">
                {/* Entity header */}
                <div className="px-4 py-3 bg-muted/50 border-b space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {entity.entityType === 'assessment' && entity.assessmentInfo ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold text-sm text-foreground">
                          {entity.assessmentInfo.aspect_code} — {entity.assessmentInfo.activity_operation}
                        </span>
                      </div>
                    ) : entity.entityType === 'sector' && entity.sectorInfo ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold text-sm text-foreground">
                          Setor {entity.sectorInfo.code} — {entity.sectorInfo.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {entity.entityType === 'assessment' ? 'Avaliação' : 'Setor'}
                        </Badge>
                      </div>
                    )}
                    {getChangeTypeBadge(entity.changeType)}
                  </div>

                  {/* Assessment details */}
                  {entity.entityType === 'assessment' && entity.assessmentInfo && (
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                      <p><strong>Aspecto:</strong> {entity.assessmentInfo.environmental_aspect}</p>
                      <p><strong>Impacto:</strong> {entity.assessmentInfo.environmental_impact}</p>
                      {entity.assessmentInfo.sector_name && (
                        <p><strong>Setor:</strong> {entity.assessmentInfo.sector_name}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Field changes */}
                {entity.changes.length > 0 && entity.changeType === 'updated' && (
                  <div className="divide-y">
                    {entity.changes.map(change => (
                      <div key={change.id} className="px-4 py-2.5 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-foreground min-w-[160px] text-xs">
                            {FIELD_LABELS[change.field_name || ''] || change.field_name || '—'}
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-destructive line-through truncate text-xs">
                              {formatValue(change.field_name, change.old_value)}
                            </span>
                            <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                            <span className="text-green-600 dark:text-green-400 font-medium truncate text-xs">
                              {formatValue(change.field_name, change.new_value)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {revision.changes.length === 0 && (
        <p className="text-muted-foreground text-center py-4">Nenhuma alteração registrada nesta revisão.</p>
      )}
    </div>
  );
}
