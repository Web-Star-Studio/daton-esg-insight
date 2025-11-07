import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateJobPosting } from "@/services/careerDevelopment";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { unifiedToast } from "@/utils/unifiedToast";
import { supabase } from "@/integrations/supabase/client";

interface InternalJobPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InternalJobPostingModal({ isOpen, onClose }: InternalJobPostingModalProps) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [contractType, setContractType] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [benefits, setBenefits] = useState<string[]>([""]);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("Aberto");

  const queryClient = useQueryClient();
  const createJobPosting = useCreateJobPosting();

  const handleAddRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const handleAddBenefit = () => {
    setBenefits([...benefits, ""]);
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !department || !description || !deadline) {
      unifiedToast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const filteredRequirements = requirements.filter(r => r.trim() !== "");
    const filteredBenefits = benefits.filter(b => b.trim() !== "");

    // Get current user's data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      unifiedToast.error("Usuário não autenticado");
      return;
    }

    // Get user's profile to get company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      unifiedToast.error("Empresa não encontrada");
      return;
    }

    const jobPosting = {
      title,
      department,
      location: location || null,
      employment_type: contractType,
      level,
      description,
      requirements: filteredRequirements,
      benefits: filteredBenefits,
      salary_range_min: minSalary ? parseFloat(minSalary) : null,
      salary_range_max: maxSalary ? parseFloat(maxSalary) : null,
      application_deadline: deadline,
      status,
      company_id: profile.company_id,
      created_by_user_id: user.id,
    };

    createJobPosting.mutate(jobPosting, {
      onSuccess: () => {
        unifiedToast.success("Vaga interna criada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['internal-job-postings'] });
        handleClose();
      },
      onError: (error) => {
        console.error("Erro ao criar vaga:", error);
        unifiedToast.error("Erro ao criar vaga interna");
      },
    });
  };

  const handleClose = () => {
    setTitle("");
    setDepartment("");
    setLocation("");
    setContractType("");
    setLevel("");
    setDescription("");
    setRequirements([""]);
    setBenefits([""]);
    setMinSalary("");
    setMaxSalary("");
    setDeadline("");
    setStatus("Aberto");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Vaga Interna</DialogTitle>
          <DialogDescription>
            Publique uma nova oportunidade de carreira para funcionários internos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Vaga *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Analista de RH Sênior"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento *</Label>
              <Select value={department} onValueChange={setDepartment} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="TI">TI</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operações">Operações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo - SP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">Tipo de Contrato</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Nível</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Júnior">Júnior</SelectItem>
                  <SelectItem value="Pleno">Pleno</SelectItem>
                  <SelectItem value="Sênior">Sênior</SelectItem>
                  <SelectItem value="Especialista">Especialista</SelectItem>
                  <SelectItem value="Coordenador">Coordenador</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                  <SelectItem value="Diretor">Diretor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status da vaga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Fechado">Fechado</SelectItem>
                  <SelectItem value="Preenchido">Preenchido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição da Vaga *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as responsabilidades e atividades da posição..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Requisitos</Label>
            {requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={req}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                  placeholder="Digite um requisito..."
                />
                {requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveRequirement(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRequirement}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Requisito
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Benefícios</Label>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => handleBenefitChange(index, e.target.value)}
                  placeholder="Digite um benefício..."
                />
                {benefits.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveBenefit(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBenefit}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Benefício
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minSalary">Salário Mínimo (R$)</Label>
              <Input
                id="minSalary"
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="Ex: 5000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSalary">Salário Máximo (R$)</Label>
              <Input
                id="maxSalary"
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="Ex: 8000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo para Candidaturas *</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createJobPosting.isPending}>
              {createJobPosting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar Vaga
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
