import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIntegratedReport } from '@/hooks/useIntegratedReport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const reportSchema = z.object({
  report_title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  report_type: z.enum(['Anual', 'Semestral', 'Trimestral'] as const, {
    message: 'Selecione o tipo de relatório',
  }),
  reporting_period_start: z.date({
    message: 'Data inicial obrigatória',
  }),
  reporting_period_end: z.date({
    message: 'Data final obrigatória',
  }),
  framework: z.string().optional(),
  status: z.enum(['Rascunho', 'Em Revisão'] as const).default('Rascunho'),
}).refine(
  (data) => data.reporting_period_end > data.reporting_period_start,
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['reporting_period_end'],
  }
);

type ReportFormData = z.infer<typeof reportSchema>;

interface CreateIntegratedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateIntegratedReportModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateIntegratedReportModalProps) {
  const { createReport, isCreating } = useIntegratedReport();
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      report_title: '',
      report_type: 'Anual',
      status: 'Rascunho',
      framework: '',
    },
  });

  const handleSubmit = async (data: ReportFormData) => {
    try {
      setIsLoadingUser(true);
      
      // Get current user and company_id
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('Erro ao obter usuário autenticado');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();

      if (profileError || !profileData?.company_id) {
        toast.error('Erro ao obter empresa do usuário');
        return;
      }

      setIsLoadingUser(false);

      // Create report data
      const reportData = {
        company_id: profileData.company_id,
        report_title: data.report_title,
        report_type: data.report_type,
        reporting_period_start: format(data.reporting_period_start, 'yyyy-MM-dd'),
        reporting_period_end: format(data.reporting_period_end, 'yyyy-MM-dd'),
        framework: data.framework || null,
        content: {},
        status: data.status,
        created_by_user_id: userData.user.id,
      };

      createReport(reportData, {
        onSuccess: () => {
          form.reset();
          onClose();
          onSuccess?.();
        },
      });
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Erro ao criar relatório');
      setIsLoadingUser(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Relatório Integrado</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo relatório ESG integrado
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="report_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Relatório *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Relatório Anual de Sustentabilidade 2024"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="report_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Relatório *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Anual">Anual</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reporting_period_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Inicial *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('2020-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporting_period_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Final *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('2020-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="framework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Framework (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um framework" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GRI">GRI Standards</SelectItem>
                      <SelectItem value="SASB">SASB</SelectItem>
                      <SelectItem value="TCFD">TCFD</SelectItem>
                      <SelectItem value="ISO 14001">ISO 14001</SelectItem>
                      <SelectItem value="CDP">CDP</SelectItem>
                      <SelectItem value="UN Global Compact">UN Global Compact</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Inicial *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating || isLoadingUser}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isLoadingUser}>
                {isCreating || isLoadingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Relatório'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
