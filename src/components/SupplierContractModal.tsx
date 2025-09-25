import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createSupplierContract, CreateSupplierContractData } from "@/services/supplierContracts";

interface SupplierContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  supplierId?: string;
}

export function SupplierContractModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  supplierId 
}: SupplierContractModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSupplierContractData>({
    supplier_id: supplierId || "",
    contract_number: "",
    title: "",
    contract_type: "Fornecimento",
    description: "",
    start_date: "",
    end_date: "",
    value: 0,
    currency: "BRL",
    auto_renewal: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createSupplierContract(formData);
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso.",
      });
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "Erro ao criar contrato",
        description: "Ocorreu um erro ao criar o contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: supplierId || "",
      contract_number: "",
      title: "",
      contract_type: "Fornecimento",
      description: "",
      start_date: "",
      end_date: "",
      value: 0,
      currency: "BRL",
      auto_renewal: false
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
          <DialogTitle>Novo Contrato de Fornecedor</DialogTitle>
          <DialogDescription>
            Crie um novo contrato para gerenciar o relacionamento com o fornecedor.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_number">Número do Contrato</Label>
              <Input
                id="contract_number"
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                required
                placeholder="CT-2025-001"
              />
            </div>
            <div>
              <Label htmlFor="title">Título do Contrato</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Título descritivo do contrato"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contract_type">Tipo de Contrato</Label>
            <Select 
              value={formData.contract_type} 
              onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fornecimento">Fornecimento</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Consultoria">Consultoria</SelectItem>
                <SelectItem value="Obra">Obra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada do contrato..."
              rows={3}
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
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Valor do Contrato</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="currency">Moeda</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (BRL)</SelectItem>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Contrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}