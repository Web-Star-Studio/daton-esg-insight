import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MaterialityThemeDetail, MATERIALITY_CATEGORIES } from '@/constants/materialityThemesLibrary';

interface ThemeCardProps {
  theme: MaterialityThemeDetail;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}

export function ThemeCard({ theme, selected, expanded, onToggle, onExpand }: ThemeCardProps) {
  const categoryInfo = MATERIALITY_CATEGORIES[theme.category];

  return (
    <Card 
      className={`transition-all hover:shadow-md ${
        selected ? 'border-primary border-2 shadow-sm' : ''
      }`}
    >
      <CardContent className="pt-6">
        {/* Header do card */}
        <div className="flex items-start gap-3 mb-3">
          <Checkbox 
            checked={selected} 
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="flex-1 cursor-pointer" onClick={onExpand}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{theme.icon}</span>
              <h4 className="font-semibold text-sm leading-tight">{theme.name}</h4>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {theme.description}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge 
            variant="outline" 
            style={{ 
              backgroundColor: `${theme.color}20`, 
              borderColor: theme.color,
              color: theme.color
            }}
          >
            {categoryInfo.icon} {categoryInfo.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {theme.gri_standards[0] || 'GRI'}
          </Badge>
        </div>

        {/* Info rápida */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{theme.metrics.length} métricas</span>
          <Button variant="ghost" size="sm" onClick={onExpand}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Conteúdo expandido */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Descrição detalhada */}
            <div>
              <h5 className="font-semibold text-xs mb-2">📋 Descrição Detalhada</h5>
              <p className="text-xs text-muted-foreground">{theme.detailed_description}</p>
            </div>

            {/* Métricas */}
            <div>
              <h5 className="font-semibold text-xs mb-2">📊 Métricas ({theme.metrics.length})</h5>
              <ul className="text-xs space-y-1.5">
                {theme.metrics.map(metric => (
                  <li key={metric.code} className="flex items-start gap-2 pl-2">
                    <span className="text-primary">•</span>
                    <div className="flex-1">
                      <span className="font-medium">{metric.name}</span>
                      <span className="text-muted-foreground"> ({metric.unit})</span>
                      {metric.gri_reference && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                          {metric.gri_reference}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Relevância Brasil */}
            <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
              <h5 className="font-semibold text-xs mb-2 flex items-center gap-1">
                🇧🇷 Relevância para Empresas Brasileiras
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">{theme.brazilian_relevance}</p>
            </div>

            {/* ODS */}
            <div>
              <h5 className="font-semibold text-xs mb-2">🎯 ODS Relacionados</h5>
              <div className="flex flex-wrap gap-2">
                {theme.related_sdgs.map(sdg => (
                  <Badge key={sdg} variant="outline" className="text-xs">
                    ODS {sdg}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stakeholders */}
            <div>
              <h5 className="font-semibold text-xs mb-2">👥 Stakeholders Impactados</h5>
              <div className="flex flex-wrap gap-1.5">
                {theme.stakeholders_impacted.map((stakeholder, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px]">
                    {stakeholder}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ações sugeridas */}
            <div>
              <h5 className="font-semibold text-xs mb-2">💡 Ações Sugeridas</h5>
              <ul className="text-xs space-y-1">
                {theme.example_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-muted-foreground">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
