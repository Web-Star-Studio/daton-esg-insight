
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Target, Users, TrendingUp, Info, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "@/hooks/use-toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createGoal, getCompanyUsers, type CreateGoalData } from "@/services/goals"

const formSchema = z.object({
  nome: z.string().min(3, "Nome da meta deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  metrica: z.string().min(1, "Métrica é obrigatória"),
  valorBase: z.number().min(0, "Valor base deve ser positivo").optional(),
  periodoBase: z.string().optional(),
  valorAlvo: z.number().min(0.01, "Valor alvo deve ser maior que zero"),
  prazoFinal: z.date({ message: "Prazo final é obrigatório" }),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  frequencia: z.string().min(1, "Frequência é obrigatória"),
}).refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return data.prazoFinal > today;
}, {
  message: "Prazo final deve ser uma data futura",
  path: ["prazoFinal"],
}).refine((data) => {
  if (data.valorBase && data.valorBase >= data.valorAlvo) {
    return false;
  }
  return true;
}, {
  message: "Valor alvo deve ser diferente do valor base",
  path: ["valorAlvo"],
})

const CriarMeta = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch company users for responsible assignment
  const { data: companyUsers = [] } = useQuery({
    queryKey: ['company-users'],
    queryFn: getCompanyUsers,
  })

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({
        title: "Meta criada com sucesso!",
        description: "A nova meta de sustentabilidade foi cadastrada.",
      })
      navigate("/metas")
    },
    onError: (error) => {
      console.error('Error creating goal:', error)
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta. Tente novamente.",
        variant: "destructive",
      })
    },
  })

  const calculateProgress = () => {
    const valorBase = form.watch('valorBase') || 0;
    const valorAlvo = form.watch('valorAlvo') || 0;
    
    if (valorBase && valorAlvo && valorBase !== valorAlvo) {
      // Example calculation - in real scenario this would be based on actual data
      return Math.abs((valorBase / valorAlvo) * 100);
    }
    return 0;
  };

  const getDaysUntilDeadline = () => {
    const deadline = form.watch('prazoFinal');
    if (!deadline) return 0;
    return differenceInDays(deadline, new Date());
  };

  const getMetricInfo = (metricKey: string) => {
    const metricMap: Record<string, { description: string; unit: string; example: string }> = {
      'emissoes-totais': {
        description: 'Total de emissões de gases de efeito estufa da organização',
        unit: 'tCO₂e',
        example: 'Meta: reduzir de 500 para 425 tCO₂e (15% redução)'
      },
      'emissoes-escopo1': {
        description: 'Emissões diretas de fontes controladas pela organização',
        unit: 'tCO₂e',
        example: 'Meta: reduzir emissões de frota e combustão direta'
      },
      'emissoes-escopo2': {
        description: 'Emissões indiretas de energia elétrica consumida',
        unit: 'tCO₂e',
        example: 'Meta: reduzir através de energia renovável'
      },
      'taxa-reciclagem': {
        description: 'Porcentagem de resíduos destinados à reciclagem',
        unit: '%',
        example: 'Meta: aumentar taxa de 60% para 80%'
      },
      'geracao-residuos': {
        description: 'Quantidade total de resíduos gerados pela organização',
        unit: 'ton',
        example: 'Meta: reduzir geração através de economia circular'
      },
      'consumo-eletricidade': {
        description: 'Consumo total de energia elétrica',
        unit: 'kWh',
        example: 'Meta: reduzir consumo através de eficiência energética'
      },
      'consumo-agua': {
        description: 'Consumo total de água da organização',
        unit: 'm³',
        example: 'Meta: reduzir consumo através de reuso e eficiência'
      },
    };
    return metricMap[metricKey];
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      metrica: "",
      valorBase: 0,
      periodoBase: "",
      valorAlvo: 0,
      responsavel: "",
      frequencia: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const goalData: CreateGoalData = {
      name: values.nome,
      description: values.descricao,
      metric_key: values.metrica,
      baseline_value: values.valorBase,
      baseline_period: values.periodoBase,
      target_value: values.valorAlvo,
      deadline_date: values.prazoFinal.toISOString().split('T')[0],
      responsible_user_id: values.responsavel,
    }

    createGoalMutation.mutate(goalData)
  }

  const handleCancel = () => {
    navigate("/metas")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Criar Nova Meta de Sustentabilidade</h1>
            <p className="text-muted-foreground mt-1">
              Defina os objetivos e indicadores para acompanhar o progresso
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button 
              type="submit" 
              form="meta-form"
              disabled={createGoalMutation.isPending}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              {createGoalMutation.isPending ? "Salvando..." : "Salvar Meta"}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="meta-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção 1: Definição da Meta */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Definição da Meta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dê um título para a sua meta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Reduzir as emissões de GEE da frota em 15%" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descreva o objetivo e a importância desta meta</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Esta meta visa a renovação parcial da frota para veículos elétricos e a otimização de rotas para diminuir o consumo de diesel..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção 2: Métrica e Acompanhamento */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Métrica e Acompanhamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="metrica"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione a Métrica que será acompanhada</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha a métrica chave (KPI)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="emissoes-totais">Emissões Totais (tCO₂e)</SelectItem>
                        <SelectItem value="emissoes-escopo1">Emissões Escopo 1 (tCO₂e)</SelectItem>
                        <SelectItem value="emissoes-escopo2">Emissões Escopo 2 (tCO₂e)</SelectItem>
                        <SelectItem value="taxa-reciclagem">Taxa de Reciclagem (%)</SelectItem>
                        <SelectItem value="geracao-residuos">Geração Total de Resíduos (ton)</SelectItem>
                        <SelectItem value="consumo-eletricidade">Consumo de Eletricidade (kWh)</SelectItem>
                        <SelectItem value="consumo-agua">Consumo de Água (m³)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2 p-3 bg-info/10 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-info">
                              {getMetricInfo(field.value)?.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getMetricInfo(field.value)?.example}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </FormItem>
                  )}
                />

                {/* Linha de Base */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Linha de Base</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="valorBase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Base</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="500"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="periodoBase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Período Base</FormLabel>
                          <FormControl>
                            <Input placeholder="Ano de 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Alvo da Meta */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Alvo da Meta</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="valorAlvo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Alvo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="425"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prazoFinal"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Prazo Final</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
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
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                          {field.value && (
                            <FormDescription className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {getDaysUntilDeadline()} dias para atingir a meta
                            </FormDescription>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção 3: Governança */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Governança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atribuir a um responsável</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name} {user.job_title ? `(${user.job_title})` : ''}
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
                    name="frequencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência de Reporte do Progresso</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            {form.watch('nome') && form.watch('metrica') && form.watch('valorAlvo') && (
              <Card className="shadow-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Preview da Meta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">Meta</Badge>
                      <p className="font-medium">{form.watch('nome')}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Métrica</Badge>
                      <p className="text-sm text-muted-foreground">
                        {getMetricInfo(form.watch('metrica'))?.unit}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Valor Alvo</Badge>
                      <p className="font-medium">{form.watch('valorAlvo')}</p>
                    </div>
                    {form.watch('prazoFinal') && (
                      <div>
                        <Badge variant="outline" className="mb-2">Prazo</Badge>
                        <p className="text-sm">
                          {format(form.watch('prazoFinal'), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {form.watch('valorBase') && (
                    <Separator />
                  )}
                  
                  {form.watch('valorBase') && form.watch('valorAlvo') && form.watch('valorBase') !== form.watch('valorAlvo') && (
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        {form.watch('valorBase')! > form.watch('valorAlvo') 
                          ? `Meta de redução: ${((form.watch('valorBase')! - form.watch('valorAlvo')) / form.watch('valorBase')! * 100).toFixed(1)}%`
                          : `Meta de aumento: ${((form.watch('valorAlvo') - form.watch('valorBase')!) / form.watch('valorBase')! * 100).toFixed(1)}%`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
    </div>
  );
};

export default CriarMeta;