import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Save, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { createBoardMember, updateBoardMember, BoardMember } from "@/services/governance";

interface BoardMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: BoardMember | null;
  onUpdate: () => void;
}

export function BoardMemberModal({ isOpen, onClose, member, onUpdate }: BoardMemberModalProps) {
  const [formData, setFormData] = useState({
    full_name: member?.full_name || '',
    position: member?.position || '',
    committee: member?.committee || '',
    appointment_date: member?.appointment_date ? new Date(member.appointment_date) : new Date(),
    term_end_date: member?.term_end_date ? new Date(member.term_end_date) : null,
    is_independent: member?.is_independent || false,
    gender: member?.gender || '',
    age: member?.age?.toString() || '',
    experience_years: member?.experience_years?.toString() || '',
    expertise_areas: member?.expertise_areas || [],
    biography: member?.biography || '',
    status: member?.status || 'Ativo',
  });

  const [newExpertise, setNewExpertise] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validação client-side
    const trimmedFullName = formData.full_name.trim();
    const trimmedPosition = formData.position.trim();
    
    if (!trimmedFullName || !trimmedPosition) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome completo e cargo são obrigatórios.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (trimmedFullName.length > 255) {
      toast({
        title: "Nome muito longo",
        description: "Nome deve ter no máximo 255 caracteres.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const sanitizedData = {
        ...formData,
        full_name: trimmedFullName,
        position: trimmedPosition,
        committee: formData.committee.trim(),
        biography: formData.biography.trim(),
        age: formData.age ? parseInt(formData.age) : undefined,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
        appointment_date: format(formData.appointment_date, 'yyyy-MM-dd'),
        term_end_date: formData.term_end_date ? format(formData.term_end_date, 'yyyy-MM-dd') : undefined,
      };

      if (member) {
        await updateBoardMember(member.id, sanitizedData);
        toast({
          title: "Sucesso",
          description: "Conselheiro atualizado com sucesso!",
        });
      } else {
        await createBoardMember(sanitizedData as any);
        toast({
          title: "Sucesso",
          description: "Conselheiro adicionado com sucesso!",
        });
      }

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving board member:', error);
      const errorMessage = error?.message || "Erro ao salvar conselheiro";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertise_areas.includes(newExpertise.trim())) {
      setFormData({
        ...formData,
        expertise_areas: [...formData.expertise_areas, newExpertise.trim()]
      });
      setNewExpertise('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData({
      ...formData,
      expertise_areas: formData.expertise_areas.filter(e => e !== expertise)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {member ? 'Editar Conselheiro' : 'Novo Conselheiro'}
          </DialogTitle>
          <DialogDescription>
            {member ? 'Edite as informações do conselheiro' : 'Adicione um novo membro ao conselho de administração'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presidente do Conselho">Presidente do Conselho</SelectItem>
                      <SelectItem value="Vice-Presidente">Vice-Presidente</SelectItem>
                      <SelectItem value="Conselheiro Independente">Conselheiro Independente</SelectItem>
                      <SelectItem value="Conselheiro">Conselheiro</SelectItem>
                      <SelectItem value="Conselheiro Fiscal">Conselheiro Fiscal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="committee">Comitê</Label>
                  <Select
                    value={formData.committee}
                    onValueChange={(value) => setFormData({ ...formData, committee: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o comitê" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auditoria">Auditoria</SelectItem>
                      <SelectItem value="Sustentabilidade">Sustentabilidade</SelectItem>
                      <SelectItem value="Remuneração">Remuneração</SelectItem>
                      <SelectItem value="Estratégia">Estratégia</SelectItem>
                      <SelectItem value="Riscos">Riscos</SelectItem>
                      <SelectItem value="Inovação">Inovação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_independent"
                    checked={formData.is_independent}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_independent: checked })}
                  />
                  <Label htmlFor="is_independent">Conselheiro Independente</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Licenciado">Licenciado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Não binário">Não binário</SelectItem>
                      <SelectItem value="Prefere não informar">Prefere não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    min="18"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Anos de Experiência</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    min="0"
                    max="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment_date">Data de Nomeação *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.appointment_date, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.appointment_date}
                        onSelect={(date) => date && setFormData({ ...formData, appointment_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term_end_date">Fim do Mandato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.term_end_date ? format(formData.term_end_date, 'dd/MM/yyyy') : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.term_end_date}
                        onSelect={(date) => setFormData({ ...formData, term_end_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Áreas de Expertise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Áreas de Expertise</CardTitle>
              <CardDescription>
                Adicione as principais áreas de conhecimento e experiência do conselheiro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Finanças, Marketing, Tecnologia..."
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                />
                <Button type="button" onClick={addExpertise}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.expertise_areas.map((expertise, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {expertise}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeExpertise(expertise)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Biografia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Biografia Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                placeholder="Breve biografia profissional, experiências relevantes, formação acadêmica..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {member ? 'Atualizar' : 'Criar'} Conselheiro
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}