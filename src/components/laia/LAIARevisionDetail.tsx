import { useLAIARevision } from "@/hooks/useLAIARevisions";
import { FIELD_LABELS } from "@/services/laiaRevisionService";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
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
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Plus className="h-3 w-3 mr-1" /> Criado</Badge>;
    case 'updated':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Pencil className="h-3 w-3 mr-1" /> Editado</Badge>;
    case 'deleted':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><Trash2 className="h-3 w-3 mr-1" /> Removido</Badge>;
    default:
      return <Badge variant="outline">{changeType}</Badge>;
  }
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

  // Group changes by entity
  const grouped: Record<string, typeof revision.changes> = {};
  revision.changes.forEach(change => {
    const key = `${change.entity_type}:${change.entity_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(change);
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

      {/* Changes grouped by entity */}
      {Object.entries(grouped).map(([key, changes]) => {
        const [entityType] = key.split(":");
        const firstChange = changes[0];

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {entityType === 'assessment' ? 'Avaliação' : 'Setor'}
              </Badge>
              {getChangeTypeBadge(firstChange.change_type)}
            </div>

            <div className="rounded-lg border bg-muted/30 divide-y">
              {changes.map(change => (
                <div key={change.id} className="px-4 py-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-foreground min-w-[180px]">
                      {FIELD_LABELS[change.field_name || ''] || change.field_name || '—'}
                    </span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-red-600 dark:text-red-400 line-through truncate">
                        {formatValue(change.field_name, change.old_value)}
                      </span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <span className="text-green-600 dark:text-green-400 font-medium truncate">
                        {formatValue(change.field_name, change.new_value)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {revision.changes.length === 0 && (
        <p className="text-muted-foreground text-center py-4">Nenhuma alteração registrada nesta revisão.</p>
      )}
    </div>
  );
}
