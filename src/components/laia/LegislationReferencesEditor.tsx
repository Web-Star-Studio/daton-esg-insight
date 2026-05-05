import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ExternalLink, Loader2, Plus, Sparkles, X } from "lucide-react";
import {
  normalizeLegislationUrl,
  type LegislationReference,
  type LegislationSuggestion,
} from "@/types/laia";

interface SuggestionsResult {
  suggestions: LegislationSuggestion[];
  citations: string[];
}

interface LegislationReferencesEditorProps {
  value: LegislationReference[];
  onChange: (next: LegislationReference[]) => void;
  onRequestSuggestions: () => Promise<SuggestionsResult>;
  canSuggest: boolean;
  canSuggestReason?: string;
}

export function LegislationReferencesEditor({
  value,
  onChange,
  onRequestSuggestions,
  canSuggest,
  canSuggestReason,
}: LegislationReferencesEditorProps) {
  const [newRef, setNewRef] = useState("");
  const [suggestions, setSuggestions] = useState<LegislationSuggestion[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const norm = (ref: string) => ref.trim().toLowerCase();

  const isReferenceTaken = (ref: string, excludeIndex?: number) => {
    const target = norm(ref);
    if (!target) return false;
    return value.some((r, i) => i !== excludeIndex && norm(r.reference) === target);
  };

  const addReference = (item: LegislationReference) => {
    const trimmed = item.reference.trim();
    if (!trimmed || isReferenceTaken(trimmed)) return;
    onChange([
      ...value,
      {
        reference: trimmed,
        url: item.url?.trim() ? normalizeLegislationUrl(item.url) : null,
      },
    ]);
  };

  const handleAddManual = () => {
    if (!newRef.trim()) return;
    addReference({ reference: newRef, url: null });
    setNewRef("");
  };

  const handleUpdate = (index: number, next: LegislationReference): boolean => {
    const trimmed = next.reference.trim();
    if (!trimmed || isReferenceTaken(trimmed, index)) return false;
    onChange(value.map((r, i) => (i === index ? { ...next, reference: trimmed } : r)));
    return true;
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    setSuggestError(null);
    try {
      const result = await onRequestSuggestions();
      if (result.suggestions.length === 0) {
        setSuggestError("A IA não retornou sugestões para este contexto.");
        return;
      }
      setSuggestions((prev) => {
        const seen = new Set(prev.map((s) => norm(s.reference)));
        const additions = result.suggestions.filter((s) => !seen.has(norm(s.reference)));
        return [...prev, ...additions];
      });
      setCitations((prev) => {
        const seen = new Set(prev);
        const additions = result.citations.filter((c) => !seen.has(c));
        return [...prev, ...additions];
      });
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : "Erro ao buscar sugestões");
    } finally {
      setIsSuggesting(false);
    }
  };

  const acceptSuggestion = (s: LegislationSuggestion) => {
    addReference({ reference: s.reference, url: s.url });
    setSuggestions((prev) => prev.filter((x) => norm(x.reference) !== norm(s.reference)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Referência Legal</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSuggest}
          disabled={isSuggesting || !canSuggest}
          title={!canSuggest ? canSuggestReason : undefined}
        >
          {isSuggesting ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-3.5 w-3.5" />
          )}
          {isSuggesting ? "Buscando..." : "Sugerir com IA"}
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((ref, idx) => (
            <LegislationChip
              key={`${ref.reference}-${idx}`}
              value={ref}
              onUpdate={(next) => handleUpdate(idx, next)}
              onRemove={() => handleRemove(idx)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newRef}
          onChange={(e) => setNewRef(e.target.value)}
          placeholder="Ex: Lei 12.305/2010, CONAMA 237/97"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddManual();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddManual}
          disabled={!newRef.trim() || isReferenceTaken(newRef)}
          title={isReferenceTaken(newRef) ? "Esta referência já foi adicionada" : "Adicionar referência"}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Adicione quantas referências forem aplicáveis. Clique em uma referência para editar ou anexar uma URL.
      </p>

      {suggestError && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{suggestError}</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Sugestões da IA — clique para adicionar:
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSuggestions([]);
                setCitations([]);
              }}
            >
              Dispensar
            </Button>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const already = isReferenceTaken(s.reference);
              return (
                <button
                  key={`${s.reference}-${i}`}
                  type="button"
                  onClick={() => !already && acceptSuggestion(s)}
                  disabled={already}
                  className="w-full text-left rounded-md border bg-background px-3 py-2 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={already ? "Já adicionada" : s.summary}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{s.reference}</div>
                    {s.url && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {s.summary}
                  </div>
                  {already && (
                    <div className="text-xs text-muted-foreground italic mt-1">
                      Já adicionada
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {citations.length > 0 && (
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground mb-1">
                Fontes consultadas pela IA:
              </p>
              <ul className="space-y-1">
                {citations.map((url, i) => (
                  <li key={`${url}-${i}`}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[480px]">{url}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LegislationChipProps {
  value: LegislationReference;
  onUpdate: (next: LegislationReference) => boolean;
  onRemove: () => void;
}

function LegislationChip({ value, onUpdate, onRemove }: LegislationChipProps) {
  const [open, setOpen] = useState(false);
  const [draftRef, setDraftRef] = useState(value.reference);
  const [draftUrl, setDraftUrl] = useState(value.url ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftRef(value.reference);
      setDraftUrl(value.url ?? "");
      setError(null);
    }
  }, [open, value]);

  const handleSave = () => {
    const trimmed = draftRef.trim();
    if (!trimmed) return;
    const accepted = onUpdate({
      reference: trimmed,
      url: draftUrl.trim() ? normalizeLegislationUrl(draftUrl) : null,
    });
    if (!accepted) {
      setError("Já existe outra referência com esse nome.");
      return;
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="inline-flex items-center rounded-md border bg-background pl-3 pr-1 py-1 text-sm">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="font-medium hover:underline"
            title="Clique para editar"
          >
            {value.reference}
          </button>
        </PopoverTrigger>
        {value.url && (
          <a
            href={normalizeLegislationUrl(value.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-primary"
            title="Abrir referência"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Remover"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="chip-ref" className="text-xs">
              Referência
            </Label>
            <Input
              id="chip-ref"
              value={draftRef}
              onChange={(e) => setDraftRef(e.target.value)}
              placeholder="Ex: Lei 12.305/2010"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chip-url" className="text-xs">
              URL (opcional)
            </Label>
            <Input
              id="chip-url"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!draftRef.trim()}
            >
              Salvar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
