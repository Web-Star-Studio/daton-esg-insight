import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Leaf, Users, Shield } from "lucide-react";

interface ESGCostCenterToggleProps {
  onToggle: (enabled: boolean) => void;
  defaultEnabled?: boolean;
}

export function ESGCostCenterToggle({ onToggle, defaultEnabled = false }: ESGCostCenterToggleProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    onToggle(checked);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-accent/5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="esg-center" className="text-lg font-semibold">
              Centro de Custos ESG
            </Label>
            {enabled && (
              <Badge variant="default" className="bg-primary/10 text-primary">
                Ativo
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ative para categorizar automaticamente despesas e receitas por pilar ESG.
            Permite análise de impacto financeiro por categoria (Ambiental, Social, Governança).
          </p>

          {enabled && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="gap-1.5">
                <Leaf className="h-3 w-3 text-green-600" />
                <span>Ambiental</span>
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Users className="h-3 w-3 text-blue-600" />
                <span>Social</span>
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Shield className="h-3 w-3 text-purple-600" />
                <span>Governança</span>
              </Badge>
            </div>
          )}
        </div>

        <Switch
          id="esg-center"
          checked={enabled}
          onCheckedChange={handleToggle}
          className="mt-1"
        />
      </div>
    </Card>
  );
}
