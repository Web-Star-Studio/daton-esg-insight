import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, differenceInDays } from 'date-fns';
import type { RenewalSchedule, RenewalFormData, RenewalSuggestion } from '@/types/licenseRenewal';

export async function calculateRenewalSuggestion(
  expirationDate: string
): Promise<RenewalSuggestion> {
  const expiration = new Date(expirationDate);
  const today = new Date();
  const daysUntilExpiration = differenceInDays(expiration, today);

  // Suggest starting 120-180 days before expiration
  const idealStartDate = addDays(expiration, -150);
  const protocolDeadline = addDays(expiration, -45); // 45 days buffer
  const estimatedCompletion = addDays(expiration, -15);

  let urgencyLevel: RenewalSuggestion['urgency_level'] = 'low';
  if (daysUntilExpiration < 45) urgencyLevel = 'critical';
  else if (daysUntilExpiration < 90) urgencyLevel = 'high';
  else if (daysUntilExpiration < 150) urgencyLevel = 'medium';

  return {
    ideal_start_date: idealStartDate,
    protocol_deadline: protocolDeadline,
    estimated_completion: estimatedCompletion,
    days_until_expiration: daysUntilExpiration,
    is_within_deadline: today <= protocolDeadline,
    urgency_level: urgencyLevel,
  };
}

export async function scheduleRenewal(
  licenseId: string,
  formData: RenewalFormData
): Promise<RenewalSchedule> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.company_id) throw new Error('Company not found');

    // Create renewal schedule
    const { data, error } = await supabase
      .from('license_renewal_schedules')
      .insert({
        license_id: licenseId,
        company_id: profile.company_id,
        scheduled_start_date: formData.scheduled_start_date.toISOString().split('T')[0],
        protocol_deadline: formData.protocol_deadline.toISOString().split('T')[0],
        expected_completion_date: formData.expected_completion_date?.toISOString().split('T')[0],
        assigned_to_user_id: formData.assigned_to_user_id,
        notification_config: {
          reminders: formData.notification_days,
          channels: formData.notification_channels,
        } as any,
        status: 'scheduled',
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update license status
    await supabase
      .from('licenses')
      .update({ status: 'Em Renovação' })
      .eq('id', licenseId);

    // Create tasks if requested
    if (formData.create_tasks) {
      await createRenewalTasks(licenseId, profile.company_id, formData, user.id);
    }

    toast.success('Renovação agendada com sucesso!');
    return data as RenewalSchedule;
  } catch (error) {
    console.error('Error scheduling renewal:', error);
    toast.error('Erro ao agendar renovação');
    throw error;
  }
}

async function createRenewalTasks(
  licenseId: string,
  companyId: string,
  formData: RenewalFormData,
  userId: string
) {
  const tasks = [
    {
      name: 'Separar documentação para renovação',
      description: 'Reunir todos os documentos necessários para o processo de renovação',
      task_type: 'Licenciamento',
      due_date: addDays(formData.scheduled_start_date, 7).toISOString().split('T')[0],
      period_start: formData.scheduled_start_date.toISOString().split('T')[0],
      period_end: formData.protocol_deadline.toISOString().split('T')[0],
    },
    {
      name: 'Protocolar pedido de renovação',
      description: 'Dar entrada no pedido de renovação junto ao órgão ambiental',
      task_type: 'Licenciamento',
      due_date: addDays(formData.protocol_deadline, -7).toISOString().split('T')[0],
      period_start: formData.scheduled_start_date.toISOString().split('T')[0],
      period_end: formData.protocol_deadline.toISOString().split('T')[0],
    },
    {
      name: 'Acompanhar processo de renovação',
      description: 'Monitorar andamento do processo junto ao órgão emissor',
      task_type: 'Licenciamento',
      due_date: formData.protocol_deadline.toISOString().split('T')[0],
      period_start: formData.protocol_deadline.toISOString().split('T')[0],
      period_end: (formData.expected_completion_date || formData.protocol_deadline).toISOString().split('T')[0],
    },
  ];

  await supabase.from('data_collection_tasks').insert(
    tasks.map((task) => ({
      ...task,
      company_id: companyId,
      assigned_to_user_id: formData.assigned_to_user_id,
      status: 'Pendente',
      frequency: 'one_time',
    }))
  );
}

export async function getRenewalSchedule(licenseId: string): Promise<RenewalSchedule | null> {
  try {
    const { data, error } = await supabase
      .from('license_renewal_schedules')
      .select('*')
      .eq('license_id', licenseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as RenewalSchedule | null;
  } catch (error) {
    console.error('Error fetching renewal schedule:', error);
    return null;
  }
}

export async function updateRenewalStatus(
  scheduleId: string,
  status: RenewalSchedule['status']
): Promise<void> {
  try {
    const { error } = await supabase
      .from('license_renewal_schedules')
      .update({ status })
      .eq('id', scheduleId);

    if (error) throw error;
    toast.success('Status atualizado com sucesso');
  } catch (error) {
    console.error('Error updating renewal status:', error);
    toast.error('Erro ao atualizar status');
    throw error;
  }
}
