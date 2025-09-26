import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateInterview, useUpdateInterview } from '@/hooks/useRecruitment';
import { useJobApplications } from '@/hooks/useRecruitment';
import { Interview } from '@/services/recruitment';

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview?: Interview;
  preselectedApplicationId?: string;
}

export default function InterviewModal({ 
  isOpen, 
  onClose, 
  interview, 
  preselectedApplicationId 
}: InterviewModalProps) {
  const [formData, setFormData] = useState({
    job_application_id: interview?.job_application_id || preselectedApplicationId || '',
    interviewer_user_id: interview?.interviewer_user_id || '',
    interview_type: interview?.interview_type || 'RH',
    scheduled_date: interview?.scheduled_date ? new Date(interview.scheduled_date).toISOString().split('T')[0] : '',
    scheduled_time: interview?.scheduled_time || '',
    duration_minutes: interview?.duration_minutes || 60,
    location_type: interview?.location_type || 'Presencial',
    meeting_link: interview?.meeting_link || '',
    notes: interview?.notes || '',
    feedback: interview?.feedback || '',
    score: interview?.score || 0,
    status: interview?.status || 'Agendada',
  });

  const { data: jobApplications = [] } = useJobApplications();
  const createMutation = useCreateInterview();
  const updateMutation = useUpdateInterview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      company_id: 'temp', // Will be set by trigger
      created_by_user_id: 'temp', // Will be set by trigger
    };

    if (interview) {
      updateMutation.mutate({ id: interview.id, updates: submitData }, {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {interview ? 'Editar Entrevista' : 'Agendar Entrevista'}
          </DialogTitle>
          <DialogDescription>
            {interview ? 'Atualize as informações da entrevista' : 'Agende uma nova entrevista'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Candidatura</Label>
              <Select
                value={formData.job_application_id}
                onValueChange={(value) => setFormData({ ...formData, job_application_id: value })}
                disabled={!!preselectedApplicationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a candidatura" />
                </SelectTrigger>
                <SelectContent>
                  {jobApplications.map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      {application.candidate_name} - {(application as any).job_posting?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Entrevista</Label>
              <Select
                value={formData.interview_type}
                onValueChange={(value) => setFormData({ ...formData, interview_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RH">RH</SelectItem>
                  <SelectItem value="Técnica">Técnica</SelectItem>
                  <SelectItem value="Portfolio">Portfolio</SelectItem>
                  <SelectItem value="Comportamental">Comportamental</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                min="15"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Local</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => setFormData({ ...formData, location_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
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
                  <SelectItem value="Agendada">Agendada</SelectItem>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                  <SelectItem value="Realizada">Realizada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                  <SelectItem value="Reagendada">Reagendada</SelectItem>
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

          {formData.location_type === 'Online' && (
            <div className="space-y-2">
              <Label>Link da Reunião</Label>
              <Input
                type="url"
                placeholder="https://meet.google.com/..."
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre a entrevista..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Feedback</Label>
            <Textarea
              placeholder="Feedback da entrevista (preencher após realizada)..."
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : interview ? 'Atualizar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}