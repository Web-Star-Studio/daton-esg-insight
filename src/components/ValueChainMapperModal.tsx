import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateValueChainProcess } from "@/services/valueChainMapping";
import { useEmployeesAsOptions } from "@/services/employees";
import { useToast } from "@/hooks/use-toast";
import { Network, ArrowRight, Users, Building } from "lucide-react";

interface ValueChainMapperModalProps {
  open: boolean;
  onClose: () => void;
}

export function ValueChainMapperModal({ open, onClose }: ValueChainMapperModalProps) {
  const [formData, setFormData] = useState({
    process_name: "",
    process_type: "principal",
    input_description: "",
    output_description: "",
    internal_client: "",
    internal_supplier: "",
    external_suppliers: [] as string[],
    external_clients: [] as string[],
    requirements: [] as string[],
    kpis: [] as string[],
    responsible_user_id: "",
    process_owner_user_id: ""
  });

  const [newSupplier, setNewSupplier] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newKpi, setNewKpi] = useState("");

  const { data: employees } = useEmployeesAsOptions();
  const { mutate: createProcess, isPending } = useCreateValueChainProcess();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.process_name) {
      toast({
        title: "Erro",
        description: "Nome do processo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    createProcess({
      process_name: formData.process_name,
      process_type: formData.process_type,
      input_description: formData.input_description || undefined,
      output_description: formData.output_description || undefined,
      internal_client: formData.internal_client || undefined,
      internal_supplier: formData.internal_supplier || undefined,
      external_suppliers: formData.external_suppliers,
      external_clients: formData.external_clients,
      requirements: formData.requirements,
      kpis: formData.kpis,
      responsible_user_id: formData.responsible_user_id || undefined,
      process_owner_user_id: formData.process_owner_user_id || undefined
    }, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Processo da cadeia de valor criado com sucesso"
        });
        onClose();
        setFormData({
          process_name: "",
          process_type: "principal",
          input_description: "",
          output_description: "",
          internal_client: "",
          internal_supplier: "",
          external_suppliers: [],
          external_clients: [],
          requirements: [],
          kpis: [],
          responsible_user_id: "",
          process_owner_user_id: ""
        });
      },
      onError: (error) => {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const addItem = (type: 'supplier' | 'client' | 'requirement' | 'kpi', value: string) => {
    if (value.trim()) {
      const field = type === 'supplier' ? 'external_suppliers' : 
                   type === 'client' ? 'external_clients' :
                   type === 'requirement' ? 'requirements' : 'kpis';
      
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      
      if (type === 'supplier') setNewSupplier("");
      else if (type === 'client') setNewClient("");
      else if (type === 'requirement') setNewRequirement("");
      else setNewKpi("");
    }
  };

  const removeItem = (type: 'supplier' | 'client' | 'requirement' | 'kpi', index: number) => {
    const field = type === 'supplier' ? 'external_suppliers' : 
                 type === 'client' ? 'external_clients' :
                 type === 'requirement' ? 'requirements' : 'kpis';
    
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Mapear Processo da Cadeia de Valor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="process_name">Nome do Processo *</Label>
              <Input
                id="process_name"
                value={formData.process_name}
                onChange={(e) => setFormData(prev => ({ ...prev, process_name: e.target.value }))}
                placeholder="Ex: Atendimento ao Cliente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="process_type">Tipo do Processo</Label>
              <Select value={formData.process_type} onValueChange={(value) => setFormData(prev => ({ ...prev, process_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="gerencial">Gerencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input_description" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Entrada (Input)
              </Label>
              <Textarea
                id="input_description"
                value={formData.input_description}
                onChange={(e) => setFormData(prev => ({ ...prev, input_description: e.target.value }))}
                placeholder="Descreva as entradas necessárias para o processo"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="output_description" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Saída (Output)
              </Label>
              <Textarea
                id="output_description"
                value={formData.output_description}
                onChange={(e) => setFormData(prev => ({ ...prev, output_description: e.target.value }))}
                placeholder="Descreva as saídas geradas pelo processo"
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="internal_client" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Cliente Interno
              </Label>
              <Input
                id="internal_client"
                value={formData.internal_client}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_client: e.target.value }))}
                placeholder="Ex: Departamento Comercial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal_supplier" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Fornecedor Interno
              </Label>
              <Input
                id="internal_supplier"
                value={formData.internal_supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_supplier: e.target.value }))}
                placeholder="Ex: Departamento de TI"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fornecedores Externos</Label>
              <div className="flex gap-2">
                <Input
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  placeholder="Nome do fornecedor externo"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('supplier', newSupplier))}
                />
                <Button type="button" onClick={() => addItem('supplier', newSupplier)} variant="outline">
                  Adicionar
                </Button>
              </div>
              {formData.external_suppliers.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                  {formData.external_suppliers.map((supplier, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{supplier}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem('supplier', index)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Clientes Externos</Label>
              <div className="flex gap-2">
                <Input
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Nome do cliente externo"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('client', newClient))}
                />
                <Button type="button" onClick={() => addItem('client', newClient)} variant="outline">
                  Adicionar
                </Button>
              </div>
              {formData.external_clients.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                  {formData.external_clients.map((client, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{client}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem('client', index)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_user_id">Responsável pelo Processo</Label>
              <Select value={formData.responsible_user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_user_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.value} value={employee.value}>
                      {employee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="process_owner_user_id">Dono do Processo</Label>
              <Select value={formData.process_owner_user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, process_owner_user_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dono do processo" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.value} value={employee.value}>
                      {employee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}