import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupplierContract, CreateSupplierContractData } from "@/services/supplierContracts";
import { getSuppliers } from "@/services/supplierService";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });
  
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
    
    if (!formData.supplier_id) {
      toast.error("Selecione um fornecedor");
      return;
    }
    
    if (!formData.contract_number || !formData.title) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    if (!formData.start_date || !formData.end_date) {
      toast.error("Selecione as datas de início e término");
      return;
    }
    
    setIsLoading(true);

    try {
      await createSupplierContract(formData);
      toast.success("Contrato criado com sucesso!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error("Erro ao criar contrato: " + (error as Error).message);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato de Fornecedor</DialogTitle>
          <DialogDescription>
            Crie um novo contrato para gerenciar o relacionamento com o fornecedor.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_number">Número do Contrato *</Label>
              <Input
                id="contract_number"
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                required
                placeholder="CT-2025-001"
              />
            </div>
            <div>
              <Label htmlFor="title">Título do Contrato *</Label>
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
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Término *</Label>
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
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto_renewal"
              checked={formData.auto_renewal}
              onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="auto_renewal">Renovação Automática</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
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