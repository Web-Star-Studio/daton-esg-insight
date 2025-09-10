import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "@/hooks/use-toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createGoal, getCompanyUsers, type CreateGoalData } from "@/services/goals"

const formSchema = z.object({
  nome: z.string().min(1, "Nome da meta é obrigatório"),
  descricao: z.string().optional(),
  metrica: z.string().min(1, "Métrica é obrigatória"),
  valorBase: z.number().min(0, "Valor base deve ser positivo").optional(),
  periodoBase: z.string().optional(),
  valorAlvo: z.number().min(0, "Valor alvo deve ser positivo"),
  prazoFinal: z.date({ required_error: "Prazo final é obrigatório" }),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  frequencia: z.string().min(1, "Frequência é obrigatória"),
}).refine((data) => data.prazoFinal > new Date(), {
  message: "Prazo final deve ser uma data futura",
  path: ["prazoFinal"],
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
  })

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
    <MainLayout>
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
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="meta-form"
              disabled={createGoalMutation.isPending}
            >
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
          </form>
        </Form>
      </div>
    </MainLayout>
  )
}

export default CriarMeta