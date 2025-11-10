import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SDGInfo } from "@/constants/sdgData";
import { CheckCircle2 } from "lucide-react";

interface SDGCardProps {
  sdg: SDGInfo;
  selected: boolean;
  impactLevel?: 'Alto' | 'Médio' | 'Baixo';
  selectedTargetsCount?: number;
  onToggle: () => void;
  onClick: () => void;
}

export function SDGCard({ 
  sdg, 
  selected, 
  impactLevel,
  selectedTargetsCount,
  onToggle, 
  onClick 
}: SDGCardProps) {
  const getImpactColor = (level?: string) => {
    switch (level) {
      case 'Alto': return 'bg-green-500';
      case 'Médio': return 'bg-yellow-500';
      case 'Baixo': return 'bg-orange-500';
      default: return 'bg-muted';
    }
  };

  const getImpactEmoji = (level?: string) => {
    switch (level) {
      case 'Alto': return '🟢';
      case 'Médio': return '🟡';
      case 'Baixo': return '🟠';
      default: return '⚪';
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer border-2",
        selected 
          ? "border-primary shadow-lg scale-105 ring-2 ring-primary/20" 
          : "border-border/50 hover:border-primary/50 hover:shadow-md hover:scale-102"
      )}
      style={{
        background: selected 
          ? `linear-gradient(135deg, ${sdg.color}15 0%, ${sdg.color}05 100%)`
          : 'transparent'
      }}
    >
      {/* Header com checkbox */}
      <div className="absolute top-2 right-2 z-10">
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
            selected 
              ? "bg-primary border-primary" 
              : "bg-background border-border hover:border-primary"
          )}
        >
          {selected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
        </div>
      </div>

      {/* Conteúdo do card */}
      <div 
        onClick={onClick}
        className="p-4 space-y-3"
      >
        {/* Ícone e número */}
        <div className="flex items-center justify-between">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-md"
            style={{ backgroundColor: sdg.color }}
          >
            {sdg.icon}
          </div>
          <Badge 
            variant="secondary" 
            className="font-bold"
            style={{ 
              backgroundColor: `${sdg.color}20`,
              color: sdg.color,
              borderColor: sdg.color
            }}
          >
            ODS {sdg.number}
          </Badge>
        </div>

        {/* Nome */}
        <div>
          <h3 
            className="font-bold text-sm leading-tight min-h-[2.5rem] line-clamp-2"
            style={{ color: selected ? sdg.color : 'inherit' }}
          >
            {sdg.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {sdg.description}
          </p>
        </div>

        {/* Informações adicionais (quando selecionado) */}
        {selected && (
          <div className="space-y-2 pt-2 border-t">
            {/* Nível de contribuição */}
            {impactLevel && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Contribuição:</span>
                <Badge variant="outline" className="gap-1">
                  <span>{getImpactEmoji(impactLevel)}</span>
                  <span className="font-medium">{impactLevel}</span>
                </Badge>
              </div>
            )}

            {/* Metas selecionadas */}
            {selectedTargetsCount !== undefined && selectedTargetsCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Metas:</span>
                <Badge variant="outline">
                  {selectedTargetsCount} de {sdg.targets.length}
                </Badge>
              </div>
            )}

            {/* Pacto Global */}
            {sdg.globalPactPrinciples && sdg.globalPactPrinciples.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>🤝</span>
                <span>Pacto Global: {sdg.globalPactPrinciples.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          selected && "opacity-100"
        )}
      />
    </Card>
  );
}
