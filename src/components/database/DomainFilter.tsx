import { Badge } from '@/components/ui/badge';
import { getDomainInfo } from '@/utils/databaseSchemaParser';
import { cn } from '@/lib/utils';

interface DomainFilterProps {
  domains: string[];
  selectedDomains: string[];
  onToggleDomain: (domain: string) => void;
}

export function DomainFilter({ domains, selectedDomains, onToggleDomain }: DomainFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {domains.map(domain => {
        const domainInfo = getDomainInfo(domain);
        const isSelected = selectedDomains.includes(domain);
        
        return (
          <Badge
            key={domain}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all hover:scale-105",
              isSelected ? "shadow-md" : "hover:bg-accent"
            )}
            onClick={() => onToggleDomain(domain)}
          >
            <span className="mr-1">{domainInfo.icon}</span>
            {domainInfo.name}
          </Badge>
        );
      })}
    </div>
  );
}
