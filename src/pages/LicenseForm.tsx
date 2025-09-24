
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { format, differenceInYears, differenceInMonths, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, Save } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createLicense, updateLicense, getLicenseById, type CreateLicenseData, type UpdateLicenseData } from "@/services/licenses"
import { toast } from "sonner"

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  orgaoEmissor: z.string().min(1, "Órgão emissor é obrigatório"),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataEmissao: z.date({ required_error: "Data de emissão é obrigatória" }),
  dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
  status: z.string().min(1, "Status é obrigatório"),
  responsavel: z.string().optional(),
  condicionantes: z.string().optional(),
}).refine((data) => data.dataVencimento > data.dataEmissao, {
  message: "Data de vencimento deve ser posterior à data de emissão",
  path: ["dataVencimento"],
})

const LicenseForm = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isEditing = !!id

  // Query for editing existing license
  const { data: license, isLoading: isLoadingLicense } = useQuery({
    queryKey: ['license-details', id],
    queryFn: () => getLicenseById(id!),
    enabled: isEditing,
  })

  // Create license mutation
  const createLicenseMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license-stats'] })
      toast.success('Licença criada com sucesso!')
      navigate("/licenciamento")
    },
    onError: (error) => {
      console.error('Error creating license:', error)
      toast.error('Erro ao criar licença')
      setIsSubmitting(false)
    }
  })

  // Update license mutation
  const updateLicenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateLicenseData }) => updateLicense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license-stats'] })
      queryClient.invalidateQueries({ queryKey: ['license-details', id] })
      toast.success('Licença atualizada com sucesso!')
      navigate("/licenciamento")
    },
    onError: (error) => {
      console.error('Error updating license:', error)
      toast.error('Erro ao atualizar licença')
      setIsSubmitting(false)
    }
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "",
      orgaoEmissor: "",
      numeroProcesso: "",
      status: "",
      responsavel: "",
      condicionantes: "",
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (license && isEditing) {
      form.reset({
        nome: license.name || "",
        tipo: license.type || "",
        orgaoEmissor: license.issuing_body || "",
        numeroProcesso: license.process_number || "",
        dataEmissao: license.issue_date ? new Date(license.issue_date) : undefined,
        dataVencimento: license.expiration_date ? new Date(license.expiration_date) : undefined,
        status: license.status || "",
        responsavel: "", // This would come from user lookup
        condicionantes: license.conditions || "",
      })
    }
  }, [license, isEditing, form])

  const watchedDates = form.watch(["dataEmissao", "dataVencimento"])
  
  const calculatePeriod = () => {
    const [emissao, vencimento] = watchedDates
    if (emissao && vencimento) {
      const years = differenceInYears(vencimento, emissao)
      const months = differenceInMonths(vencimento, emissao) % 12
      const days = differenceInDays(vencimento, emissao) % 30

      if (years > 0) {
        return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mês${months > 1 ? 'es' : ''}` : ''}`
      } else if (months > 0) {
        return `${months} mês${months > 1 ? 'es' : ''}${days > 0 ? ` e ${days} dia${days > 1 ? 's' : ''}` : ''}`
      } else {
        return `${days} dia${days > 1 ? 's' : ''}`
      }
    }
    return ""
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      if (isEditing && id) {
        const updateData: UpdateLicenseData = {
          name: values.nome,
          type: values.tipo,
          issuing_body: values.orgaoEmissor,
          process_number: values.numeroProcesso,
          issue_date: values.dataEmissao,
          expiration_date: values.dataVencimento,
          status: values.status,
          conditions: values.condicionantes,
        }

        updateLicenseMutation.mutate({ id, data: updateData })
      } else {
        const licenseData: CreateLicenseData = {
          name: values.nome,
          type: values.tipo,
          issuing_body: values.orgaoEmissor,
          process_number: values.numeroProcesso,
          issue_date: values.dataEmissao,
          expiration_date: values.dataVencimento,
          status: values.status,
          conditions: values.condicionantes,
        }

        createLicenseMutation.mutate(licenseData)
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      setIsSubmitting(false)
    }
  }

  if (isEditing && isLoadingLicense) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando dados da licença...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isEditing ? 'Editar Licença' : 'Nova Licença'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize as informações da licença' : 'Preencha os dados da nova licença ambiental'}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/licenciamento')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Licença</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="licenca-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Licença</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Licença de Operação - Unidade 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tipo */}
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Licença Prévia">Licença Prévia (LP)</SelectItem>
                            <SelectItem value="Licença de Instalação">Licença de Instalação (LI)</SelectItem>
                            <SelectItem value="Licença de Operação">Licença de Operação (LO)</SelectItem>
                            <SelectItem value="Licença de Operação Corretiva">Licença de Operação Corretiva (LOC)</SelectItem>
                            <SelectItem value="Licença Única">Licença Única (LU)</SelectItem>
                            <SelectItem value="Autorização Ambiental">Autorização Ambiental (AA)</SelectItem>
                            <SelectItem value="Outorga">Outorga</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Órgão Emissor */}
                  <FormField
                    control={form.control}
                    name="orgaoEmissor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Emissor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: IBAMA, CETESB, FEAM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número do Processo */}
                  <FormField
                    control={form.control}
                    name="numeroProcesso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Processo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 02001.123456/2023-89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de Emissão */}
                  <FormField
                    control={form.control}
                    name="dataEmissao"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Emissão</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de Vencimento */}
                  <FormField
                    control={form.control}
                    name="dataVencimento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Vencimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ativa">Ativa</SelectItem>
                            <SelectItem value="Vencida">Vencida</SelectItem>
                            <SelectItem value="Em Renovação">Em Renovação</SelectItem>
                            <SelectItem value="Suspensa">Suspensa</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Responsável */}
                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Período de Validade */}
                {calculatePeriod() && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Período de Validade:</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {calculatePeriod()}
                    </p>
                  </div>
                )}

                {/* Condicionantes */}
                <FormField
                  control={form.control}
                  name="condicionantes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condicionantes e Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva as condicionantes, restrições ou observações importantes desta licença..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/licenciamento')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || createLicenseMutation.isPending || updateLicenseMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting || createLicenseMutation.isPending || updateLicenseMutation.isPending 
                      ? (isEditing ? 'Atualizando...' : 'Salvando...')
                      : (isEditing ? 'Atualizar Licença' : 'Criar Licença')
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
}

export default LicenseForm