import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateJobPosting, useUpdateJobPosting } from '@/hooks/useRecruitment';
import { JobPosting } from '@/services/recruitment';

interface JobPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobPosting?: JobPosting;
}

export default function JobPostingModal({ isOpen, onClose, jobPosting }: JobPostingModalProps) {
  const [formData, setFormData] = useState({
    title: jobPosting?.title || '',
    department: jobPosting?.department || '',
    location: jobPosting?.location || '',
    employment_type: jobPosting?.employment_type || 'CLT',
    level: jobPosting?.level || 'Júnior',
    description: jobPosting?.description || '',
    requirements: Array.isArray(jobPosting?.requirements) ? jobPosting.requirements.join('\n') : '',
    benefits: Array.isArray(jobPosting?.benefits) ? jobPosting.benefits.join('\n') : '',
    salary_range_min: jobPosting?.salary_range_min || '',
    salary_range_max: jobPosting?.salary_range_max || '',
    priority: jobPosting?.priority || 'Média',
    application_deadline: jobPosting?.application_deadline ? new Date(jobPosting.application_deadline).toISOString().split('T')[0] : '',
    status: jobPosting?.status || 'Ativa',
  });

  const createMutation = useCreateJobPosting();
  const updateMutation = useUpdateJobPosting();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      requirements: formData.requirements ? formData.requirements.split('\n').filter(r => r.trim()) : [],
      benefits: formData.benefits ? formData.benefits.split('\n').filter(b => b.trim()) : [],
      salary_range_min: formData.salary_range_min ? Number(formData.salary_range_min) : undefined,
      salary_range_max: formData.salary_range_max ? Number(formData.salary_range_max) : undefined,
    };

    if (jobPosting) {
      updateMutation.mutate({ id: jobPosting.id, updates: submitData }, {
        onSuccess: () => onClose(),
      });
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {jobPosting ? 'Editar Vaga' : 'Nova Vaga'}
          </DialogTitle>
          <DialogDescription>
            {jobPosting ? 'Atualize as informações da vaga' : 'Crie uma nova vaga para recrutamento'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título da Vaga</Label>
              <Input
                placeholder="Ex: Desenvolvedor Full Stack"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Operações">Operações</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                placeholder="Ex: São Paulo, SP ou Remote"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Contratação</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estagiário">Estagiário</SelectItem>
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
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Pausada">Pausada</SelectItem>
                  <SelectItem value="Encerrada">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prazo para Candidaturas</Label>
              <Input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Salário Mínimo</Label>
              <Input
                type="number"
                placeholder="Ex: 5000"
                value={formData.salary_range_min}
                onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Salário Máximo</Label>
              <Input
                type="number"
                placeholder="Ex: 8000"
                value={formData.salary_range_max}
                onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição da Vaga</Label>
            <Textarea
              placeholder="Descreva as responsabilidades e objetivos da posição..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Requisitos (um por linha)</Label>
            <Textarea
              placeholder="Ex:&#10;Graduação em Ciência da Computação&#10;3+ anos de experiência com React&#10;Conhecimento em Node.js"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Benefícios (um por linha)</Label>
            <Textarea
              placeholder="Ex:&#10;Vale alimentação&#10;Plano de saúde&#10;Home office flexível"
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : jobPosting ? 'Atualizar' : 'Criar Vaga'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}