import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { EmissionFactor } from "@/services/emissionFactors";

interface DuplicateFactorData {
  name: string;
  category: string;
  activity_unit: string;
  co2_factor?: number;
  ch4_factor?: number;
  n2o_factor?: number;
  source: string;
  year_of_validity?: number;
}

interface DuplicateFactorConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingFactor: EmissionFactor;
  newFactor: DuplicateFactorData;
  onConfirm: (action: 'replace' | 'keep_both' | 'cancel') => void;
}

export function DuplicateFactorConfirmModal({
  open,
  onOpenChange,
  existingFactor,
  newFactor,
  onConfirm
}: DuplicateFactorConfirmModalProps) {
  const [selectedAction, setSelectedAction] = useState<'replace' | 'keep_both'>('replace');

  const handleConfirm = () => {
    onConfirm(selectedAction);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onConfirm('cancel');
    onOpenChange(false);
  };

  const FactorCard = ({ factor, title, isNew = false }: { 
    factor: any; 
    title: string; 
    isNew?: boolean; 
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          {isNew && <Badge variant="secondary">Novo</Badge>}
          {!isNew && <Badge variant="outline">Atual</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <span className="font-medium">Nome:</span> {factor.name}
        </div>
        <div>
          <span className="font-medium">Categoria:</span> {factor.category}
        </div>
        <div>
          <span className="font-medium">Unidade:</span> {factor.activity_unit}
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="font-medium">Fatores de Emissão:</div>
          {factor.co2_factor !== null && (
            <div className="flex justify-between">
              <span>CO₂:</span>
              <span>{factor.co2_factor} kg CO₂/unidade</span>
            </div>
          )}
          {factor.ch4_factor !== null && (
            <div className="flex justify-between">
              <span>CH₄:</span>
              <span>{factor.ch4_factor} kg CH₄/unidade</span>
            </div>
          )}
          {factor.n2o_factor !== null && (
            <div className="flex justify-between">
              <span>N₂O:</span>
              <span>{factor.n2o_factor} kg N₂O/unidade</span>
            </div>
          )}
        </div>
        <Separator />
        <div>
          <span className="font-medium">Fonte:</span> {factor.source}
        </div>
        {factor.year_of_validity && (
          <div>
            <span className="font-medium">Ano:</span> {factor.year_of_validity}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Fator Duplicado Detectado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Encontramos um fator de emissão similar já existente. 
              Escolha como proceder com a importação:
            </p>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FactorCard 
              factor={existingFactor} 
              title="Fator Existente" 
            />
            
            <div className="flex items-center justify-center lg:hidden">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <FactorCard 
              factor={newFactor} 
              title="Fator a Importar" 
              isNew 
            />
          </div>

          {/* Action Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escolha uma Ação</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedAction}
                onValueChange={(value) => setSelectedAction(value as 'replace' | 'keep_both')}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="replace" id="replace" className="mt-1" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="replace" className="font-medium cursor-pointer">
                      Substituir Fator Existente
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      O fator existente será atualizado com os novos dados. 
                      Recomendado quando os dados são mais recentes ou precisos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="keep_both" id="keep_both" className="mt-1" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="keep_both" className="font-medium cursor-pointer">
                      Manter Ambos os Fatores
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Ambos os fatores serão mantidos. O novo fator terá um sufixo 
                      adicionado ao nome para diferenciação.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Pular Este Fator
            </Button>
            <Button onClick={handleConfirm}>
              {selectedAction === 'replace' ? 'Substituir Fator' : 'Manter Ambos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}