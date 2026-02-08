import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2 } from 'lucide-react';
import {
  createEmissionSupplier,
  updateEmissionSupplier,
  type EmissionSupplier,
} from '@/services/emissionSuppliersGateway';

interface SupplierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingSupplier?: EmissionSupplier | null;
}

export function SupplierManagementModal({ isOpen, onClose, onSuccess, editingSupplier }: SupplierManagementModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: editingSupplier?.supplier_name || '',
    cnpj: editingSupplier?.cnpj || '',
    category: editingSupplier?.category || 'goods',
    contact_email: editingSupplier?.contact_email || '',
    contact_phone: editingSupplier?.contact_phone || '',
    has_inventory: editingSupplier?.has_inventory || false,
    scope_3_category: editingSupplier?.scope_3_category || '1',
    annual_emissions_estimate:
      editingSupplier?.annual_emissions_estimate !== undefined &&
      editingSupplier?.annual_emissions_estimate !== null
        ? String(editingSupplier.annual_emissions_estimate)
        : '',
    data_quality_score:
      editingSupplier?.data_quality_score !== undefined
        ? String(editingSupplier.data_quality_score)
        : '3',
    notes: editingSupplier?.notes || '',
  });

  const formatCNPJ = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 14);
    
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 5) {
      return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 8) {
      return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5)}`;
    } else if (limitedNumbers.length <= 12) {
      return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8)}`;
    } else {
      return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8, 12)}-${limitedNumbers.slice(12)}`;
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCNPJ(rawValue);
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  useEffect(() => {
    if (isOpen) {
      if (editingSupplier) {
        setFormData({
          supplier_name: editingSupplier.supplier_name || '',
          cnpj: formatCNPJ(editingSupplier.cnpj || ''),
          category: editingSupplier.category || 'goods',
          contact_email: editingSupplier.contact_email || '',
          contact_phone: editingSupplier.contact_phone || '',
          has_inventory: editingSupplier.has_inventory || false,
          scope_3_category: editingSupplier.scope_3_category || '1',
          annual_emissions_estimate:
            editingSupplier.annual_emissions_estimate !== undefined &&
            editingSupplier.annual_emissions_estimate !== null
              ? String(editingSupplier.annual_emissions_estimate)
              : '',
          data_quality_score:
            editingSupplier.data_quality_score !== undefined
              ? String(editingSupplier.data_quality_score)
              : '3',
          notes: editingSupplier.notes || '',
        });
      } else {
        setFormData({
          supplier_name: '',
          cnpj: '',
          category: 'goods',
          contact_email: '',
          contact_phone: '',
          has_inventory: false,
          scope_3_category: '1',
          annual_emissions_estimate: '',
          data_quality_score: '3',
          notes: '',
        });
      }
    }
  }, [isOpen, editingSupplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSave = {
        supplier_name: formData.supplier_name,
        cnpj: formData.cnpj || undefined,
        category: formData.category,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        has_inventory: formData.has_inventory,
        scope_3_category: formData.scope_3_category,
        annual_emissions_estimate: formData.annual_emissions_estimate
          ? parseFloat(String(formData.annual_emissions_estimate))
          : null,
        data_quality_score: parseInt(formData.data_quality_score, 10),
        notes: formData.notes || undefined,
      };

      if (editingSupplier) {
        await updateEmissionSupplier(editingSupplier.id, dataToSave);
        
        toast({
          title: 'Fornecedor atualizado!',
          description: 'Os dados do fornecedor foram atualizados com sucesso.',
        });
      } else {
        await createEmissionSupplier(dataToSave);
        
        toast({
          title: 'Fornecedor cadastrado!',
          description: 'O fornecedor foi adicionado ao seu inventário Escopo 3.',
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o fornecedor. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor - Escopo 3'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Nome do Fornecedor *</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/[^\d.-/]/g, '');
                    e.target.value = onlyNumbers;
                    handleCNPJChange(e);
                  }}
                  onKeyDown={(e) => {
                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                    const isNumber = /^[0-9]$/.test(e.key);
                    const isControlKey = e.ctrlKey || e.metaKey;
                    
                    if (!isNumber && !allowedKeys.includes(e.key) && !isControlKey) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const formatted = formatCNPJ(pastedText);
                    setFormData(prev => ({ ...prev, cnpj: formatted }));
                  }}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goods">Bens Adquiridos</SelectItem>
                    <SelectItem value="services">Serviços Contratados</SelectItem>
                    <SelectItem value="transport">Transporte e Distribuição</SelectItem>
                    <SelectItem value="waste">Gestão de Resíduos</SelectItem>
                    <SelectItem value="business_travel">Viagens Corporativas</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope_3_category">Categoria Escopo 3 *</Label>
                <Select value={formData.scope_3_category} onValueChange={(value) => setFormData({ ...formData, scope_3_category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Cat. 1 - Bens e Serviços Adquiridos</SelectItem>
                    <SelectItem value="2">Cat. 2 - Bens de Capital</SelectItem>
                    <SelectItem value="3">Cat. 3 - Combustíveis e Energia</SelectItem>
                    <SelectItem value="4">Cat. 4 - Transporte e Distribuição (Upstream)</SelectItem>
                    <SelectItem value="5">Cat. 5 - Resíduos</SelectItem>
                    <SelectItem value="6">Cat. 6 - Viagens Corporativas</SelectItem>
                    <SelectItem value="7">Cat. 7 - Deslocamento de Funcionários</SelectItem>
                    <SelectItem value="8">Cat. 8 - Ativos Arrendados (Upstream)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Informações de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-mail de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  inputMode="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Emission Data */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Dados de Emissão</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annual_emissions_estimate">Emissões Anuais Estimadas (tCO₂e)</Label>
                <Input
                  id="annual_emissions_estimate"
                  type="number"
                  step="0.01"
                  value={formData.annual_emissions_estimate}
                  onChange={(e) => setFormData({ ...formData, annual_emissions_estimate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_quality_score">Qualidade dos Dados (1-5)</Label>
                <Select value={formData.data_quality_score} onValueChange={(value) => setFormData({ ...formData, data_quality_score: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Muito Baixa</SelectItem>
                    <SelectItem value="2">2 - Baixa</SelectItem>
                    <SelectItem value="3">3 - Média</SelectItem>
                    <SelectItem value="4">4 - Alta</SelectItem>
                    <SelectItem value="5">5 - Muito Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_inventory"
                  checked={formData.has_inventory}
                  onChange={(e) => setFormData({ ...formData, has_inventory: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="has_inventory" className="cursor-pointer">
                  Fornecedor possui inventário GEE próprio
                </Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Informações adicionais sobre o fornecedor..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSupplier ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
