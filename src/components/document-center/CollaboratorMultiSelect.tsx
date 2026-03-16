import { useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Collaborator {
  id: string;
  full_name: string;
}

interface CollaboratorMultiSelectProps {
  collaborators: Collaborator[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function CollaboratorMultiSelect({
  collaborators,
  selectedIds,
  onChange,
  placeholder = "Selecionar colaboradores",
}: CollaboratorMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? collaborators.filter((c) => c.full_name.toLowerCase().includes(search.toLowerCase()))
    : collaborators;

  const selectedCollaborators = collaborators.filter((c) => selectedIds.includes(c.id));

  const toggleCollaborator = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    if (!v.trim() && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", selectedIds.length === 0 && "text-muted-foreground")}>
              {selectedIds.length === 0 ? placeholder : `${selectedIds.length} colaborador(es) selecionado(s)`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="flex flex-col">
            <div className="border-b p-2">
              <Input
                placeholder="Buscar colaborador..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-8 border-0 shadow-none focus-visible:ring-0 px-1"
                autoFocus
              />
            </div>
            <div ref={listRef} className="max-h-60 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum colaborador encontrado.
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCollaborator(c.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selectedIds.includes(c.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {c.full_name}
                  </button>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedCollaborators.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCollaborators.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
              {c.full_name}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-background/50"
                onClick={() => toggleCollaborator(c.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
