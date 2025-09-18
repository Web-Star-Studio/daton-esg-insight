import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Calendar, Star, AlertTriangle } from "lucide-react";
import { 
  createWasteSupplier, 
  updateWasteSupplier, 
  WasteSupplier, 
  formatSupplierType, 
  getLicenseStatus 
} from "@/services/wasteSuppliers";

interface WasteSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: WasteSupplier | null;
  onSuccess?: () => void;
}

export function WasteSupplierModal({ open, onOpenChange, supplier, onSuccess }: WasteSupplierModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    cnpj: '',
    supplier_type: '' as 'transporter' | 'destination' | 'both',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    license_number: '',
    license_type: '',
    license_expiry: '',
    license_issuing_body: '',
    notes: ''
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        company_name: supplier.company_name || '',
        cnpj: supplier.cnpj || '',
        supplier_type: supplier.supplier_type,
        contact_name: supplier.contact_name || '',
        contact_email: supplier.contact_email || '',
        contact_phone: supplier.contact_phone || '',
        address: supplier.address || '',
        license_number: supplier.license_number || '',
        license_type: supplier.license_type || '',
        license_expiry: supplier.license_expiry || '',
        license_issuing_body: supplier.license_issuing_body || '',
        notes: supplier.notes || ''
      });
    } else {
      setFormData({
        company_name: '',
        cnpj: '',
        supplier_type: '' as 'transporter' | 'destination' | 'both',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        license_number: '',
        license_type: '',
        license_expiry: '',
        license_issuing_body: '',
        notes: ''
      });
    }
  }, [supplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.supplier_type) {
      toast({
        title: "Erro",
        description: "Nome da empresa e tipo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (supplier) {
        await updateWasteSupplier(supplier.id, formData);
        toast({
          title: "Sucesso",
          description: "Fornecedor atualizado com sucesso",
          variant: "default"
        });
      } else {
        await createWasteSupplier(formData);
        toast({
          title: "Sucesso",
          description: "Fornecedor criado com sucesso",
          variant: "default"
        });
      }
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao ${supplier ? 'atualizar' : 'criar'} fornecedor: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    // Aplica máscara XX.XXX.XXX/XXXX-XX
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  const licenseStatus = supplier?.license_expiry ? getLicenseStatus(supplier.license_expiry) : 'unknown';

  const getLicenseStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="secondary" className="text-green-700 bg-green-100">Válida</Badge>;
      case 'expiring':
        return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">Vencendo</Badge>;
      case 'expired':
        return <Badge variant="destructive">Vencida</Badge>;
      default:
        return <Badge variant="outline">Não informada</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_type">Tipo de Fornecedor *</Label>
                <Select
                  value={formData.supplier_type}
                  onValueChange={(value: 'transporter' | 'destination' | 'both') => 
                    setFormData(prev => ({ ...prev, supplier_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transporter">Transportador</SelectItem>
                    <SelectItem value="destination">Destinador</SelectItem>
                    <SelectItem value="both">Transportador e Destinador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo da empresa"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Nome do Contato</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    placeholder="Nome da pessoa de contato"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">E-mail</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contato@empresa.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Licenciamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Licenciamento Ambiental
                {supplier && getLicenseStatusBadge(licenseStatus)}
              </CardTitle>
              {supplier && licenseStatus === 'expiring' && (
                <CardDescription className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="w-4 h-4" />
                  Licença vencendo em breve!
                </CardDescription>
              )}
              {supplier && licenseStatus === 'expired' && (
                <CardDescription className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  Licença vencida!
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number">Número da Licença</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    placeholder="Número da licença"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_type">Tipo de Licença</Label>
                  <Input
                    id="license_type"
                    value={formData.license_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_type: e.target.value }))}
                    placeholder="Ex: LO, LP, LI"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_expiry">Data de Vencimento</Label>
                  <Input
                    id="license_expiry"
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_expiry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_issuing_body">Órgão Emissor</Label>
                  <Input
                    id="license_issuing_body"
                    value={formData.license_issuing_body}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_issuing_body: e.target.value }))}
                    placeholder="Ex: CETESB, IBAMA"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o fornecedor..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (supplier ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}