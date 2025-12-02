import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useBranches, useCreateBranch } from '@/services/branches';
import { Badge } from '@/components/ui/badge';

interface BranchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export const BranchSelect = ({ value, onValueChange }: BranchSelectProps) => {
  const [open, setOpen] = useState(false);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();

  const selectedBranch = branches?.find((b) => b.id === value);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;

    try {
      const newBranch = await createBranch.mutateAsync({
        name: newBranchName,
        is_headquarters: false,
        status: 'Ativo',
      });
      onValueChange(newBranch.id);
      setNewBranchName('');
      setShowNewBranch(false);
      setOpen(false);
    } catch (error) {
      console.error('Error creating branch:', error);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando filiais...</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedBranch ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {selectedBranch.name}
              {selectedBranch.is_headquarters && (
                <Badge variant="secondary" className="ml-2">Matriz</Badge>
              )}
            </div>
          ) : (
            'Selecione uma filial...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar filial..." />
          <CommandEmpty>
            Nenhuma filial encontrada.
          </CommandEmpty>
          <CommandGroup>
            {/* Opção de criar nova filial - sempre visível */}
            {showNewBranch ? (
              <div className="p-2 space-y-2 border-b">
                <input
                  type="text"
                  placeholder="Nome da filial"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateBranch();
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border rounded bg-background"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateBranch}
                    disabled={!newBranchName.trim() || createBranch.isPending}
                  >
                    Criar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewBranch(false);
                      setNewBranchName('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <CommandItem
                onSelect={() => setShowNewBranch(true)}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar nova filial
              </CommandItem>
            )}
            {branches?.map((branch) => (
              <CommandItem
                key={branch.id}
                value={branch.id}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? '' : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === branch.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {branch.name}
                  {branch.is_headquarters && (
                    <Badge variant="secondary" className="ml-2">Matriz</Badge>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
