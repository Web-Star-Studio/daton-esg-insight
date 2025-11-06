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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, MapPin, Calendar, Star, AlertTriangle, AlertCircle } from "lucide-react";
import { z } from "zod";
import { 
  createWasteSupplier, 
  updateWasteSupplier, 
  WasteSupplier, 
  formatSupplierType, 
  getLicenseStatus 
} from "@/services/wasteSuppliers";

const supplierSchema = z.object({
  company_name: z.string().trim().min(1, "Nome da empresa é obrigatório").max(255, "Nome muito longo"),
  supplier_type: z.string().refine(
    (val) => val === "transporter" || val === "destination" || val === "both" || val === "",
    "Selecione um tipo de fornecedor"
  ).refine(
    (val) => val !== "",
    "Tipo de fornecedor é obrigatório"
  ),
  cnpj: z.string().optional().refine(
    (val) => !val || val.replace(/\D/g, '').length === 14,
    "CNPJ deve ter 14 dígitos"
  ),
  contact_email: z.string().optional().refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "Email inválido"
  ),
  license_expiry: z.string().optional().refine(
    (val) => !val || !isNaN(new Date(val).getTime()),
    "Data de vencimento inválida"
  ),
  contact_name: z.string().max(255, "Nome muito longo").optional(),
  contact_phone: z.string().max(50, "Telefone muito longo").optional(),
  address: z.string().max(500, "Endereço muito longo").optional(),
  license_number: z.string().max(100, "Número muito longo").optional(),
  license_type: z.string().max(50, "Tipo muito longo").optional(),
  license_issuing_body: z.string().max(100, "Nome muito longo").optional(),
  notes: z.string().max(1000, "Notas muito longas").optional()
});

interface WasteSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: WasteSupplier | null;
  onSuccess?: () => void;
}

export function WasteSupplierModal({ open, onOpenChange, supplier, onSuccess }: WasteSupplierModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    company_name: '',
    cnpj: '',
    supplier_type: '' as string,
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
        supplier_type: '' as string,
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
    setErrors({});
    setTouched({});
  }, [supplier, open]);

  const validateAll = (): boolean => {
    const result = supplierSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        newErrors[path] = issue.message;
      });
      
      setErrors(newErrors);
      
      // Focus no primeiro campo com erro
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }, 100);
      
      toast({
        title: "Corrija os campos destacados",
        description: "Verifique os campos obrigatórios e tente novamente",
        variant: "destructive"
      });
      
      return false;
    }
    
    setErrors({});
    return true;
  };

  const validateField = (fieldName: string) => {
    try {
      const fieldSchema = supplierSchema.pick({ [fieldName]: true } as any);
      fieldSchema.parse({ [fieldName]: (formData as any)[fieldName] });
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: error.issues[0]?.message || 'Campo inválido'
        }));
      }
    }
  };

  const onFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpa erro se havia
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const onFieldBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    if (!validateAll()) {
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
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      
      // Extrair mensagem de erro apropriada
      let errorMessage = 'Erro desconhecido ao salvar fornecedor';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      }
      
      // Mensagens de erro mais amigáveis
      if (errorMessage.includes('duplicate key')) {
        errorMessage = 'Já existe um fornecedor com este CNPJ';
      } else if (errorMessage.includes('not authenticated')) {
        errorMessage = 'Você precisa estar autenticado para realizar esta ação';
      } else if (errorMessage.includes('company_id')) {
        errorMessage = 'Erro ao identificar sua empresa. Faça login novamente.';
      } else if (errorMessage.includes('permission denied') || errorMessage.includes('policy')) {
        errorMessage = 'Você não tem permissão para realizar esta ação';
      }
      
      toast({
        title: "Erro ao " + (supplier ? 'atualizar' : 'criar') + " fornecedor",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (value: string): string => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    const limitedDigits = digits.slice(0, 14);
    
    // Aplica a formatação progressivamente
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 5) {
      return limitedDigits.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    } else if (limitedDigits.length <= 8) {
      return limitedDigits.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (limitedDigits.length <= 12) {
      return limitedDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else {
      return limitedDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    onFieldChange('cnpj', formatted);
  };

  const canSubmit = formData.company_name.trim() && formData.supplier_type;

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
          {/* Aviso de campos obrigatórios */}
          <p className="text-sm text-muted-foreground">
            Campos marcados com * são obrigatórios
          </p>

          {/* Resumo de erros */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Corrija os campos obrigatórios:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>
                      <button
                        type="button"
                        className="underline hover:no-underline"
                        onClick={() => document.getElementById(field)?.focus()}
                      >
                        {message}
                      </button>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className={errors.company_name ? "text-destructive" : ""}>
                    Nome da Empresa *
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => onFieldChange('company_name', e.target.value)}
                    onBlur={() => onFieldBlur('company_name')}
                    placeholder="Nome da empresa"
                    disabled={isLoading}
                    required
                    className={errors.company_name ? "border-destructive focus-visible:ring-destructive" : ""}
                    aria-invalid={!!errors.company_name}
                    aria-describedby={errors.company_name ? "company_name-error" : undefined}
                  />
                  {errors.company_name && (
                    <p id="company_name-error" className="text-sm text-destructive">
                      {errors.company_name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className={errors.cnpj ? "text-destructive" : ""}>
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    onBlur={() => onFieldBlur('cnpj')}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    disabled={isLoading}
                    className={errors.cnpj ? "border-destructive focus-visible:ring-destructive" : ""}
                    aria-invalid={!!errors.cnpj}
                    aria-describedby={errors.cnpj ? "cnpj-error" : undefined}
                  />
                  {errors.cnpj && (
                    <p id="cnpj-error" className="text-sm text-destructive">
                      {errors.cnpj}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_type" className={errors.supplier_type ? "text-destructive" : ""}>
                  Tipo de Fornecedor *
                </Label>
                <Select
                  value={formData.supplier_type}
                  onValueChange={(value) => onFieldChange('supplier_type', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="supplier_type"
                    className={errors.supplier_type ? "border-destructive focus:ring-destructive" : ""}
                    aria-invalid={!!errors.supplier_type}
                    aria-describedby={errors.supplier_type ? "supplier_type-error" : undefined}
                    onBlur={() => onFieldBlur('supplier_type')}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transporter">Transportador</SelectItem>
                    <SelectItem value="destination">Destinador</SelectItem>
                    <SelectItem value="both">Transportador e Destinador</SelectItem>
                  </SelectContent>
                </Select>
                {errors.supplier_type && (
                  <p id="supplier_type-error" className="text-sm text-destructive">
                    {errors.supplier_type}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo da empresa"
                  rows={2}
                  disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className={errors.contact_email ? "text-destructive" : ""}>
                  E-mail
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => onFieldChange('contact_email', e.target.value)}
                  onBlur={() => onFieldBlur('contact_email')}
                  placeholder="contato@empresa.com"
                  disabled={isLoading}
                  className={errors.contact_email ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={!!errors.contact_email}
                  aria-describedby={errors.contact_email ? "contact_email-error" : undefined}
                />
                {errors.contact_email && (
                  <p id="contact_email-error" className="text-sm text-destructive">
                    {errors.contact_email}
                  </p>
                )}
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
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_type">Tipo de Licença</Label>
                  <Input
                    id="license_type"
                    value={formData.license_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_type: e.target.value }))}
                    placeholder="Ex: LO, LP, LI"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_expiry" className={errors.license_expiry ? "text-destructive" : ""}>
                    Data de Vencimento
                  </Label>
                  <Input
                    id="license_expiry"
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => onFieldChange('license_expiry', e.target.value)}
                    onBlur={() => onFieldBlur('license_expiry')}
                    disabled={isLoading}
                    className={errors.license_expiry ? "border-destructive focus-visible:ring-destructive" : ""}
                    aria-invalid={!!errors.license_expiry}
                    aria-describedby={errors.license_expiry ? "license_expiry-error" : undefined}
                  />
                  {errors.license_expiry && (
                    <p id="license_expiry-error" className="text-sm text-destructive">
                      {errors.license_expiry}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_issuing_body">Órgão Emissor</Label>
                  <Input
                    id="license_issuing_body"
                    value={formData.license_issuing_body}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_issuing_body: e.target.value }))}
                    placeholder="Ex: CETESB, IBAMA"
                    disabled={isLoading}
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
                  disabled={isLoading}
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading ? 'Salvando...' : (supplier ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}