import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";
import { createGoal } from "@/services/goals";

export function CreateGHGReductionGoalDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Redução de Emissões de GEE',
    baseYear: new Date().getFullYear() - 1,
    targetReduction: 30,
    targetYear: new Date().getFullYear() + 5
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createGoal({
        name: formData.name,
        description: `Meta de reduzir emissões em ${formData.targetReduction}% até ${formData.targetYear} (ano base: ${formData.baseYear})`,
        metric_key: 'ghg_reduction_percent',
        baseline_period: formData.baseYear.toString(),
        target_value: formData.targetReduction,
        deadline_date: `${formData.targetYear}-12-31`
      });
      
      toast.success('Meta de redução de GEE criada com sucesso!');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar meta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta de Redução GEE
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Criar Meta de Redução de Emissões
          </DialogTitle>
          <DialogDescription>
            Configure a meta de redução de GEE da sua organização
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Nome da Meta</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ano Base</Label>
              <Input
                type="number"
                value={formData.baseYear}
                onChange={(e) => setFormData({ ...formData, baseYear: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Ano Meta</Label>
              <Input
                type="number"
                value={formData.targetYear}
                onChange={(e) => setFormData({ ...formData, targetYear: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div>
            <Label>Redução Alvo (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.targetReduction}
              onChange={(e) => setFormData({ ...formData, targetReduction: parseFloat(e.target.value) })}
              placeholder="Ex: 30 (para reduzir 30%)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Meta de reduzir {formData.targetReduction}% das emissões até {formData.targetYear}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Meta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
