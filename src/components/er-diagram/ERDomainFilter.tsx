import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ERDomain } from '@/utils/erDiagramData';
import { Badge } from '@/components/ui/badge';

interface ERDomainFilterProps {
  domains: ERDomain[];
  selectedDomains: Set<string>;
  onToggle: (domainId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const ERDomainFilter = React.memo(function ERDomainFilter({
  domains,
  selectedDomains,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: ERDomainFilterProps) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Domains</span>
        <div className="flex gap-1">
          <button onClick={onSelectAll} className="text-xs text-primary hover:underline">All</button>
          <span className="text-xs text-muted-foreground">/</span>
          <button onClick={onDeselectAll} className="text-xs text-primary hover:underline">None</button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 pr-3">
          {domains.map(domain => {
            const isSelected = selectedDomains.has(domain.id);
            return (
              <button
                key={domain.id}
                onClick={() => onToggle(domain.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
                  isSelected
                    ? 'bg-accent/50 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/30'
                }`}
              >
                <Checkbox checked={isSelected} className="pointer-events-none h-3.5 w-3.5" />
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: domain.color }}
                />
                <span className="truncate flex-1">{domain.icon} {domain.name}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[1.5rem] justify-center">
                  {domain.tables.length}
                </Badge>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});
