import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateJobApplication, useUpdateJobApplication } from '@/hooks/useRecruitment';
import { useJobPostings } from '@/hooks/useRecruitment';
import { JobApplication } from '@/services/recruitment';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobApplication?: JobApplication;
  preselectedJobId?: string;
}

export default function JobApplicationModal({ 
  isOpen, 
  onClose, 
  jobApplication, 
  preselectedJobId 
}: JobApplicationModalProps) {
  const [formData, setFormData] = useState({
    job_posting_id: jobApplication?.job_posting_id || preselectedJobId || '',
    candidate_name: jobApplication?.candidate_name || '',
    candidate_email: jobApplication?.candidate_email || '',
    candidate_phone: jobApplication?.candidate_phone || '',
    candidate_location: jobApplication?.candidate_location || '',
    cover_letter: jobApplication?.cover_letter || '',
    experience_years: jobApplication?.experience_years || 0,
    current_stage: jobApplication?.current_stage || 'Análise Curricular',
    score: jobApplication?.score || 0,
    status: jobApplication?.status || 'Em Análise',
    notes: jobApplication?.notes || '',
  });

  const { data: jobPostings = [] } = useJobPostings();
  const createMutation = useCreateJobApplication();
  const updateMutation = useUpdateJobApplication();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      application_date: new Date().toISOString().split('T')[0],
      additional_info: {},
    };

    if (jobApplication) {
      updateMutation.mutate({ id: jobApplication.id, updates: submitData }, {
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {jobApplication ? 'Editar Candidatura' : 'Nova Candidatura'}
          </DialogTitle>
          <DialogDescription>
            {jobApplication ? 'Atualize as informações da candidatura' : 'Registre uma nova candidatura'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vaga</Label>
              <Select
                value={formData.job_posting_id}
                onValueChange={(value) => setFormData({ ...formData, job_posting_id: value })}
                disabled={!!preselectedJobId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a vaga" />
                </SelectTrigger>
                <SelectContent>
                  {jobPostings.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Candidato</Label>
              <Input
                placeholder="Nome completo"
                value={formData.candidate_name}
                onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={formData.candidate_email}
                onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="(11) 99999-9999"
                value={formData.candidate_phone}
                onChange={(e) => setFormData({ ...formData, candidate_phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                placeholder="Cidade, Estado"
                value={formData.candidate_location}
                onChange={(e) => setFormData({ ...formData, candidate_location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Anos de Experiência</Label>
              <Input
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Etapa Atual</Label>
              <Select
                value={formData.current_stage}
                onValueChange={(value) => setFormData({ ...formData, current_stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Análise Curricular">Análise Curricular</SelectItem>
                  <SelectItem value="Entrevista RH">Entrevista RH</SelectItem>
                  <SelectItem value="Entrevista Técnica">Entrevista Técnica</SelectItem>
                  <SelectItem value="Entrevista Final">Entrevista Final</SelectItem>
                  <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                  <SelectItem value="Background Check">Background Check</SelectItem>
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
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Em Processo">Em Processo</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="Finalista">Finalista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Score (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Carta de Apresentação</Label>
            <Textarea
              placeholder="Carta de apresentação do candidato..."
              value={formData.cover_letter}
              onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações internas sobre o candidato..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : jobApplication ? 'Atualizar' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}