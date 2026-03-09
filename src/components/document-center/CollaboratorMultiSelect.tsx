import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

  const selectedCollaborators = useMemo(
    () => collaborators.filter((collaborator) => selectedIds.includes(collaborator.id)),
    [collaborators, selectedIds],
  );

  const toggleCollaborator = (collaboratorId: string) => {
    if (selectedIds.includes(collaboratorId)) {
      onChange(selectedIds.filter((id) => id !== collaboratorId));
      return;
    }

    onChange([...selectedIds, collaboratorId]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
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
          <Command>
            <CommandInput placeholder="Buscar colaborador..." />
            <CommandList>
              <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
              <CommandGroup>
                {collaborators.map((collaborator) => (
                  <CommandItem
                    key={collaborator.id}
                    value={collaborator.full_name}
                    onSelect={() => toggleCollaborator(collaborator.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(collaborator.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {collaborator.full_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCollaborators.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCollaborators.map((collaborator) => (
            <Badge key={collaborator.id} variant="secondary" className="gap-1 pr-1">
              {collaborator.full_name}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-background/50"
                onClick={() => toggleCollaborator(collaborator.id)}
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
