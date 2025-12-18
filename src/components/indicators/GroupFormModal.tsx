import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateIndicatorGroup } from "@/services/indicatorManagement";
import { useToast } from "@/hooks/use-toast";

interface GroupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
  };
}

const ICONS = ["📊", "📈", "📉", "🎯", "💰", "🏭", "👥", "🔧", "📦", "🚀", "⚡", "🌱"];

export function GroupFormModal({ open, onOpenChange, editData }: GroupFormModalProps) {
  const [name, setName] = useState(editData?.name || "");
  const [description, setDescription] = useState(editData?.description || "");
  const [icon, setIcon] = useState(editData?.icon || "📊");
  
  const { toast } = useToast();
  const createGroup = useCreateIndicatorGroup();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do grupo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        icon,
      });

      toast({
        title: "Grupo criado",
        description: "O grupo foi criado com sucesso.",
      });
      
      handleClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setIcon("📊");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editData ? "Editar Grupo" : "Novo Grupo de Indicadores"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input
              id="name"
              placeholder="Ex: Financeiro, Produção, RH..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito deste grupo..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                    icon === i 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createGroup.isPending}
          >
            {createGroup.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
