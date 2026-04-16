import { useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  maxBadges?: number;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecione...",
  emptyText = "Nenhuma opção encontrada.",
  searchPlaceholder = "Buscar...",
  disabled,
  maxBadges = 2,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const selectedOptions = useMemo(
    () => options.filter(o => selected.includes(o.value)),
    [options, selected]
  );

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={id}
          disabled={disabled}
          className={cn("w-full justify-between min-h-10 h-auto py-2", className)}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 text-left">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : selectedOptions.length <= maxBadges ? (
              selectedOptions.map(o => (
                <Badge key={o.value} variant="secondary" className="text-xs">
                  {o.label}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">
                {selectedOptions.length} selecionados
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {selectedOptions.length > 0 && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={clearAll}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent id={id} className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map(option => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
                    />
                    <span className="flex-1">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
