import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateSafetyIncident, useUpdateSafetyIncident } from '@/hooks/useSafetyIncidents';
import { useEmployeesAsOptions } from '@/services/employees';
import { SafetyIncident } from '@/services/safetyIncidents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SafetyIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident?: SafetyIncident;
}

export default function SafetyIncidentModal({ isOpen, onClose, incident }: SafetyIncidentModalProps) {
  const [userId, setUserId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    incident_type: incident?.incident_type || '',
    severity: incident?.severity || '',
    employee_id: incident?.employee_id || '',
    incident_date: incident?.incident_date ? new Date(incident.incident_date).toISOString().split('T')[0] : '',
    incident_time: incident?.incident_time || '',
    location: incident?.location || '',
    description: incident?.description || '',
    immediate_cause: incident?.immediate_cause || '',
    root_cause: incident?.root_cause || '',
    corrective_actions: incident?.corrective_actions || '',
    days_lost: incident?.days_lost || 0,
    medical_treatment_required: incident?.medical_treatment_required || false,
    status: incident?.status || 'Aberto',
  });

  const createMutation = useCreateSafetyIncident();
  const updateMutation = useUpdateSafetyIncident();
  const { data: employeeOptions = [] } = useEmployeesAsOptions();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setCompanyId(profile.company_id);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        toast.error('Erro ao carregar dados do usuário');
      }
    };
    
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  // Atualizar formData quando incident mudar
  useEffect(() => {
    if (incident) {
      setFormData({
        incident_type: incident.incident_type || '',
        severity: incident.severity || '',
        employee_id: incident.employee_id || '',
        incident_date: incident.incident_date 
          ? new Date(incident.incident_date).toISOString().split('T')[0] 
          : '',
        incident_time: incident.incident_time || '',
        location: incident.location || '',
        description: incident.description || '',
        immediate_cause: incident.immediate_cause || '',
        root_cause: incident.root_cause || '',
        corrective_actions: incident.corrective_actions || '',
        days_lost: incident.days_lost || 0,
        medical_treatment_required: incident.medical_treatment_required || false,
        status: incident.status || 'Aberto',
      });
    } else {
      // Resetar formulário quando não houver incident (modo criar)
      setFormData({
        incident_type: '',
        severity: '',
        employee_id: '',
        incident_date: '',
        incident_time: '',
        location: '',
        description: '',
        immediate_cause: '',
        root_cause: '',
        corrective_actions: '',
        days_lost: 0,
        medical_treatment_required: false,
        status: 'Aberto',
      });
    }
  }, [incident]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !companyId) {
      toast.error('Erro: Dados do usuário não carregados');
      return;
    }

    if (!formData.incident_type || !formData.severity || !formData.incident_date || !formData.description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const submitData = {
      ...formData,
      company_id: companyId,
      reported_by_user_id: userId,
    };

    if (incident) {
      updateMutation.mutate({ id: incident.id, updates: submitData }, {
        onSuccess: () => onClose(),
      });
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isLoadingUserData = !userId || !companyId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {incident ? 'Editar Incidente' : 'Registrar Novo Incidente'}
          </DialogTitle>
          <DialogDescription>
            {incident ? 'Atualize as informações do incidente' : 'Registre um novo incidente de segurança do trabalho'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Incidente *</Label>
              <Select
                value={formData.incident_type}
                onValueChange={(value) => setFormData({ ...formData, incident_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acidente de Trabalho">Acidente de Trabalho</SelectItem>
                  <SelectItem value="Quase Acidente">Quase Acidente</SelectItem>
                  <SelectItem value="Condição Insegura">Condição Insegura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severidade *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Funcionário Envolvido</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.map((employee) => (
                    <SelectItem key={employee.value} value={employee.value}>
                      {employee.label}
                    </SelectItem>
                  ))}
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
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Em Investigação">Em Investigação</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data do Incidente *</Label>
              <Input
                type="date"
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário (opcional)</Label>
              <Input
                type="time"
                value={formData.incident_time}
                onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Local (opcional)</Label>
              <Input
                placeholder="Ex: Setor B, Linha 3"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Dias Perdidos</Label>
              <Input
                type="number"
                min="0"
                value={formData.days_lost}
                onChange={(e) => setFormData({ ...formData, days_lost: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição do Incidente *</Label>
            <Textarea
              placeholder="Descreva detalhadamente o que aconteceu..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Causa Imediata (opcional)</Label>
            <Textarea
              placeholder="Descreva a causa imediata do incidente..."
              value={formData.immediate_cause}
              onChange={(e) => setFormData({ ...formData, immediate_cause: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Causa Raiz (opcional)</Label>
            <Textarea
              placeholder="Descreva a causa raiz do incidente..."
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Ações Corretivas (opcional)</Label>
            <Textarea
              placeholder="Descreva as ações corretivas tomadas..."
              value={formData.corrective_actions}
              onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="medical_treatment"
              checked={formData.medical_treatment_required}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, medical_treatment_required: checked as boolean })
              }
            />
            <Label htmlFor="medical_treatment">Tratamento médico necessário</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingUserData}>
              {isLoading ? 'Salvando...' : isLoadingUserData ? 'Carregando...' : incident ? 'Atualizar' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}