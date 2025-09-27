import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Supplier, updateSupplier } from "@/services/supplierService";

interface SupplierEditModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SUPPLIER_CATEGORIES = [
  "Materiais",
  "Serviços",
  "Equipamentos",
  "Tecnologia",
  "Logística",
  "Manutenção",
  "Consultoria",
  "Outros"
];

const SUPPLIER_STATUS = [
  "Ativo",
  "Inativo",
  "Suspenso"
];

const QUALIFICATION_STATUS = [
  "Não Qualificado",
  "Em Qualificação",
  "Qualificado",
  "Re-qualificação",
  "Desqualificado"
];

export function SupplierEditModal({ supplier, isOpen, onClose, onSuccess }: SupplierEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    cnpj: supplier?.cnpj || "",
    contact_email: supplier?.contact_email || "",
    contact_phone: supplier?.contact_phone || "",
    address: supplier?.address || "",
    category: supplier?.category || "",
    status: supplier?.status || "Ativo",
    qualification_status: supplier?.qualification_status || "Não Qualificado",
    notes: supplier?.notes || ""
  });

  // Update form data when supplier changes
  React.useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        cnpj: supplier.cnpj || "",
        contact_email: supplier.contact_email || "",
        contact_phone: supplier.contact_phone || "",
        address: supplier.address || "",
        category: supplier.category || "",
        status: supplier.status || "Ativo",
        qualification_status: supplier.qualification_status || "Não Qualificado",
        notes: supplier.notes || ""
      });
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier) return;
    
    if (!formData.name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    setIsLoading(true);

    try {
      await updateSupplier(supplier.id, formData);
      
      toast.success("Fornecedor atualizado com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao atualizar fornecedor: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        cnpj: supplier.cnpj || "",
        contact_email: supplier.contact_email || "",
        contact_phone: supplier.contact_phone || "",
        address: supplier.address || "",
        category: supplier.category || "",
        status: supplier.status || "Ativo",
        qualification_status: supplier.qualification_status || "Não Qualificado",
        notes: supplier.notes || ""
      });
    }
    onClose();
  };

  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Fornecedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Razão social do fornecedor"
                required
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contato@fornecedor.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_STATUS.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="qualification">Status de Qualificação</Label>
            <Select
              value={formData.qualification_status}
              onValueChange={(value) => setFormData({ ...formData, qualification_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATION_STATUS.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Endereço completo"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o fornecedor"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}