import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createInternalAgreement, CreateInternalAgreementData } from "@/services/internalAgreements";

interface InternalAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InternalAgreementModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: InternalAgreementModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInternalAgreementData>({
    agreement_number: "",
    title: "",
    description: "",
    agreement_type: "Contrato",
    scope: "",
    start_date: "",
    end_date: "",
    client_company_id: "",
    supplier_company_id: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createInternalAgreement(formData);
      toast({
        title: "Acordo criado",
        description: "O acordo interno foi criado com sucesso.",
      });
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast({
        title: "Erro ao criar acordo",
        description: "Ocorreu um erro ao criar o acordo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      agreement_number: "",
      title: "",
      description: "",
      agreement_type: "Contrato",
      scope: "",
      start_date: "",
      end_date: "",
      client_company_id: "",
      supplier_company_id: ""
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Acordo Interno</DialogTitle>
          <DialogDescription>
            Crie um novo acordo interno entre empresas ou departamentos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agreement_number">Número do Acordo</Label>
              <Input
                id="agreement_number"
                value={formData.agreement_number}
                onChange={(e) => setFormData({ ...formData, agreement_number: e.target.value })}
                required
                placeholder="AI-2025-001"
              />
            </div>
            <div>
              <Label htmlFor="agreement_type">Tipo de Acordo</Label>
              <Select 
                value={formData.agreement_type} 
                onValueChange={(value) => setFormData({ ...formData, agreement_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrato">Contrato</SelectItem>
                  <SelectItem value="SLA">SLA - Acordo de Nível de Serviço</SelectItem>
                  <SelectItem value="MOU">MOU - Memorando de Entendimento</SelectItem>
                  <SelectItem value="NDA">NDA - Acordo de Confidencialidade</SelectItem>
                  <SelectItem value="Parceria">Acordo de Parceria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Título do Acordo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Título descritivo do acordo..."
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada do acordo..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="scope">Escopo</Label>
            <Textarea
              id="scope"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              placeholder="Definição do escopo e abrangência do acordo..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Acordo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}