import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createEmissionSource } from "@/services/emissions";
import { SCOPE_3_CATEGORIES } from "@/services/scope3Categories";

interface Scope3CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function Scope3CategoryModal({ isOpen, onClose, onSuccess }: Scope3CategoryModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category_number: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const categoryName = SCOPE_3_CATEGORIES[parseInt(formData.category_number) as keyof typeof SCOPE_3_CATEGORIES];
      
      await createEmissionSource({
        name: formData.name,
        scope: 3,
        category: categoryName,
        description: formData.description,
        // Adicionar campos específicos para Escopo 3
        subcategory: undefined,
        scope_3_category_number: parseInt(formData.category_number)
      } as any);

      toast({
        title: "Sucesso",
        description: "Categoria de Escopo 3 adicionada com sucesso!",
      });

      setFormData({ name: "", category_number: "", description: "" });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao criar categoria de Escopo 3:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categoria de Escopo 3",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Categoria de Escopo 3</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="category_number">Categoria do GHG Protocol</Label>
              <Select
                value={formData.category_number}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_number: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCOPE_3_CATEGORIES).map(([number, name]) => (
                    <SelectItem key={number} value={number}>
                      {number}. {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nome da Fonte de Emissão</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Transporte de produtos acabados"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva as atividades incluídas nesta fonte de emissão..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}