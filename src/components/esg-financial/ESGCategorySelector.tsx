import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Leaf, Users, Shield } from 'lucide-react';

interface ESGCategorySelectorProps {
  value?: string;
  projectId?: string;
  carbonImpact?: number;
  onChange: (category?: string) => void;
  onProjectIdChange?: (projectId?: string) => void;
  onCarbonImpactChange?: (impact?: number) => void;
  disabled?: boolean;
}

const ESG_CATEGORIES = [
  { value: 'Environmental', label: 'Ambiental (E)', icon: Leaf, color: 'text-green-600' },
  { value: 'Social', label: 'Social (S)', icon: Users, color: 'text-blue-600' },
  { value: 'Governance', label: 'Governança (G)', icon: Shield, color: 'text-purple-600' },
];

export function ESGCategorySelector({
  value,
  projectId,
  carbonImpact,
  onChange,
  onProjectIdChange,
  onCarbonImpactChange,
  disabled = false
}: ESGCategorySelectorProps) {
  const selectedCategory = ESG_CATEGORIES.find(cat => cat.value === value);

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Categorização ESG (Opcional)</h4>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="esg-category">Categoria ESG</Label>
          <Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? undefined : v)} disabled={disabled}>
            <SelectTrigger id="esg-category">
              <SelectValue placeholder="Selecione uma categoria ESG" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Nenhuma (Transação Não-ESG)</span>
              </SelectItem>
              {ESG_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${category.color}`} />
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedCategory && (
            <p className="text-xs text-muted-foreground">
              Esta transação será contabilizada nos relatórios de impacto {selectedCategory.label.split('(')[0].trim().toLowerCase()}.
            </p>
          )}
        </div>

        {value && (
          <>
            <div className="space-y-2">
              <Label htmlFor="project-id">ID do Projeto ESG (Opcional)</Label>
              <Input
                id="project-id"
                type="text"
                placeholder="UUID do projeto relacionado"
                value={projectId || ''}
                onChange={(e) => onProjectIdChange?.(e.target.value || undefined)}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Vincule a uma meta, projeto social, atividade de conservação ou programa de treinamento.
              </p>
            </div>

            {value === 'Environmental' && onCarbonImpactChange && (
              <div className="space-y-2">
                <Label htmlFor="carbon-impact">Impacto de Carbono (tCO2e)</Label>
                <Input
                  id="carbon-impact"
                  type="number"
                  step="0.01"
                  placeholder="Ex: -2.5 para sequestro, 5.0 para emissão"
                  value={carbonImpact || ''}
                  onChange={(e) => onCarbonImpactChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Valores negativos representam sequestro de carbono, positivos representam emissões.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
