import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Stakeholder, STAKEHOLDER_CATEGORIES } from "@/services/stakeholders";

interface StakeholderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholder?: Stakeholder | null;
  onSave: (stakeholder: Omit<Stakeholder, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const StakeholderModal = ({ open, onOpenChange, stakeholder, onSave }: StakeholderModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: stakeholder?.name || '',
    category: stakeholder?.category || 'employees',
    subcategory: stakeholder?.subcategory || '',
    contact_email: stakeholder?.contact_email || '',
    contact_phone: stakeholder?.contact_phone || '',
    organization: stakeholder?.organization || '',
    position: stakeholder?.position || '',
    influence_level: stakeholder?.influence_level || 'medium',
    interest_level: stakeholder?.interest_level || 'medium',
    engagement_frequency: stakeholder?.engagement_frequency || 'annual',
    preferred_communication: stakeholder?.preferred_communication || 'email',
    notes: stakeholder?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (trimmedName.length > 255) {
      toast({
        title: "Erro",
        description: "Nome deve ter no máximo 255 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    // Validar e-mail se fornecido
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      toast({
        title: "Erro",
        description: "E-mail inválido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Sanitizar dados
      const sanitizedData = {
        name: trimmedName,
        category: formData.category as Stakeholder['category'],
        subcategory: formData.subcategory.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        organization: formData.organization.trim() || null,
        position: formData.position.trim() || null,
        influence_level: formData.influence_level as Stakeholder['influence_level'],
        interest_level: formData.interest_level as Stakeholder['interest_level'],
        engagement_frequency: formData.engagement_frequency as Stakeholder['engagement_frequency'],
        preferred_communication: formData.preferred_communication as Stakeholder['preferred_communication'],
        notes: formData.notes.trim() || null,
        company_id: '', // Será preenchido automaticamente via RLS
        is_active: true,
      };
      
      await onSave(sanitizedData);
      
      toast({
        title: "Sucesso",
        description: `Stakeholder ${stakeholder ? 'atualizado' : 'criado'} com sucesso`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.message?.includes('duplicate')
        ? 'Já existe um stakeholder com este nome'
        : `Erro ao ${stakeholder ? 'atualizar' : 'criar'} stakeholder`;
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = STAKEHOLDER_CATEGORIES.find(cat => cat.value === formData.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {stakeholder ? 'Editar Stakeholder' : 'Novo Stakeholder'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dados principais do stakeholder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do stakeholder"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value as Stakeholder['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAKEHOLDER_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-sm text-muted-foreground">{category.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <Badge variant="outline" className="mt-2">
                      {selectedCategory.label}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategoria</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="Ex: Acionistas minoritários, Sindicato, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="organization">Organização</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Nome da empresa/organização"
                  />
                </div>

                <div>
                  <Label htmlFor="position">Cargo/Posição</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Cargo ou função"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contato e Engajamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contato e Engajamento
                </CardTitle>
                <CardDescription>
                  Informações de contato e estratégia de engajamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact_email">E-mail</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Telefone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="influence_level">Nível de Influência</Label>
                    <Select 
                      value={formData.influence_level} 
                      onValueChange={(value) => setFormData({ ...formData, influence_level: value as Stakeholder['influence_level'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="interest_level">Nível de Interesse</Label>
                    <Select 
                      value={formData.interest_level} 
                      onValueChange={(value) => setFormData({ ...formData, interest_level: value as Stakeholder['interest_level'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="engagement_frequency">Frequência de Engajamento</Label>
                  <Select 
                    value={formData.engagement_frequency} 
                    onValueChange={(value) => setFormData({ ...formData, engagement_frequency: value as Stakeholder['engagement_frequency'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="biannual">Semestral</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferred_communication">Comunicação Preferida</Label>
                  <Select 
                    value={formData.preferred_communication} 
                    onValueChange={(value) => setFormData({ ...formData, preferred_communication: value as Stakeholder['preferred_communication'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="survey">Questionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Informações adicionais sobre o stakeholder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais, histórico de engajamento, preferências..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : stakeholder ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};