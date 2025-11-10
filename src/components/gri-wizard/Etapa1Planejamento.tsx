import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  company_name: z.string().min(2, 'Nome da organização é obrigatório'),
  sector: z.string().min(2, 'Setor é obrigatório'),
  company_size: z.enum(['Micro', 'Pequena', 'Média', 'Grande']),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  reporting_year: z.string(),
  period_start: z.date(),
  period_end: z.date(),
  scope: z.string().min(10, 'Descreva a abrangência do relatório'),
  objectives: z.string().min(20, 'Defina os objetivos do relatório'),
  responsible_name: z.string().min(2, 'Nome do responsável é obrigatório'),
  responsible_role: z.string().min(2, 'Cargo é obrigatório'),
  responsible_email: z.string().email('Email inválido'),
  principles: z.array(z.string()).min(1, 'Selecione ao menos um princípio'),
});

const SETORES = [
  'Agronegócio', 'Alimentos e Bebidas', 'Automotivo', 'Construção Civil',
  'Educação', 'Energia', 'Financeiro', 'Indústria', 'Saúde', 'Tecnologia',
  'Telecomunicações', 'Transporte e Logística', 'Varejo', 'Outro'
];

const PRINCIPIOS_GRI = [
  { id: 'materialidade', label: 'Materialidade' },
  { id: 'transparencia', label: 'Transparência' },
  { id: 'consistencia', label: 'Consistência' },
  { id: 'comparabilidade', label: 'Comparabilidade' },
  { id: 'precisao', label: 'Precisão' },
  { id: 'tempestividade', label: 'Tempestividade' },
];

interface Etapa1Props {
  reportId?: string;
  reportData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export function Etapa1Planejamento({ reportId, reportData, onUpdate, onNext }: Etapa1Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: reportData.company_name || '',
      sector: reportData.sector || '',
      company_size: reportData.company_size || 'Média',
      cnpj: reportData.cnpj || '',
      reporting_year: reportData.reporting_year || new Date().getFullYear().toString(),
      scope: reportData.scope || '',
      objectives: reportData.objectives || '',
      responsible_name: reportData.responsible_name || '',
      responsible_role: reportData.responsible_role || '',
      responsible_email: reportData.responsible_email || '',
      principles: reportData.principles || ['materialidade', 'transparencia', 'consistencia', 'comparabilidade'],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Get company_id from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID não encontrado');

      // Create or update GRI report
      const reportPayload = {
        company_id: profile.company_id,
        report_title: `Relatório GRI ${values.reporting_year} - ${values.company_name}`,
        year: parseInt(values.reporting_year),
        gri_standard_version: 'GRI Standards 2021',
        reporting_period_start: values.period_start.toISOString().split('T')[0],
        reporting_period_end: values.period_end.toISOString().split('T')[0],
      };

      let savedReportId = reportId;

      if (reportId) {
        await supabase
          .from('gri_reports')
          .update(reportPayload)
          .eq('id', reportId);
      } else {
        const { data: newReport, error } = await supabase
          .from('gri_reports')
          .insert([reportPayload])
          .select()
          .single();

        if (error) throw error;
        savedReportId = newReport.id;
      }

      onUpdate({ ...values, reportId: savedReportId });
      toast.success('Planejamento salvo com sucesso!');
      onNext();
    } catch (error: any) {
      console.error('Error saving planning:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Organização *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Empresa Sustentável Ltda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ *</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000/0000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setor de Atuação *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SETORES.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porte da Empresa *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o porte" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Micro">Micro</SelectItem>
                    <SelectItem value="Pequena">Pequena</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Grande">Grande</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reporting_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano-Base *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Inicial do Período *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Final do Período *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abrangência e Limites *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva as unidades, operações, subsidiárias e cadeia de valor incluídas no relatório..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivos do Relatório *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Defina os principais objetivos deste relatório de sustentabilidade..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Princípios GRI Aplicados *</FormLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
            {PRINCIPIOS_GRI.map((principio) => (
              <FormField
                key={principio.id}
                control={form.control}
                name="principles"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(principio.id)}
                        onCheckedChange={(checked) => {
                          const value = field.value || [];
                          field.onChange(
                            checked
                              ? [...value, principio.id]
                              : value.filter((v) => v !== principio.id)
                          );
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{principio.label}</FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="responsible_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável pela Elaboração *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsible_role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Gerente de Sustentabilidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsible_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar e Continuar'}
        </Button>
      </form>
    </Form>
  );
}
