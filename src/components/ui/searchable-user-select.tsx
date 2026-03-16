import { useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name: string;
}

interface SearchableUserSelectProps {
  users: User[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function SearchableUserSelect({
  users,
  value,
  onChange,
  placeholder = "Selecione",
}: SearchableUserSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const selected = users.find((u) => u.id === value);

  const filtered = search.trim()
    ? users.filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()))
    : users;

  const handleSearch = (v: string) => {
    setSearch(v);
    if (!v.trim() && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.full_name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col">
          <div className="border-b p-2">
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-8 border-0 shadow-none focus-visible:ring-0 px-1"
              autoFocus
            />
          </div>
          <div ref={listRef} className="max-h-60 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </p>
            ) : (
              filtered.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === user.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {user.full_name}
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
