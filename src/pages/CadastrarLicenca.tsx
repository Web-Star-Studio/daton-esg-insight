import { MainLayout } from "@/components/MainLayout"
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
import { CalendarIcon, Upload, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createLicense, uploadLicenseDocument } from "@/services/licenses"
import { toast } from "sonner"

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  orgaoEmissor: z.string().min(1, "Órgão emissor é obrigatório"),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  dataEmissao: z.date({ required_error: "Data de emissão é obrigatória" }),
  dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
  status: z.string().min(1, "Status é obrigatório"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  condicionantes: z.string().optional(),
}).refine((data) => data.dataVencimento > data.dataEmissao, {
  message: "Data de vencimento deve ser posterior à data de emissão",
  path: ["dataVencimento"],
})

const CadastrarLicenca = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mutation for creating license
  const createLicenseMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: async (newLicense) => {
      // If there's a file to upload, upload it
      if (uploadedFile) {
        try {
          await uploadLicenseDocument(newLicense.id, uploadedFile)
        } catch (error) {
          console.error('Error uploading document:', error)
          toast.error('Licença criada, mas houve erro no upload do documento')
        }
      }
      
      // Invalidate and refetch licenses
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license-stats'] })
      
      navigate("/licenciamento")
    },
    onError: (error) => {
      console.error('Error creating license:', error)
      toast.error('Erro ao criar licença')
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const licenseData = {
        name: values.nome,
        type: values.tipo,
        issuing_body: values.orgaoEmissor,
        process_number: values.numeroProcesso,
        issue_date: values.dataEmissao,
        expiration_date: values.dataVencimento,
        status: values.status,
        conditions: values.condicionantes,
        // For now, we'll leave responsible_user_id empty
        // In a real app, this would be set to the selected user
      }

      createLicenseMutation.mutate(licenseData)
    } catch (error) {
      console.error('Error in form submission:', error)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate("/licenciamento")
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cadastrar Nova Licença Ambiental</h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados da nova licença ambiental
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="licenca-form" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="licenca-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout de duas colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna da Esquerda - Informações Principais */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Informações Principais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Identificação da Licença</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Licença de Operação - Fábrica Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Licença</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LP">Licença Prévia (LP)</SelectItem>
                            <SelectItem value="LI">Licença de Instalação (LI)</SelectItem>
                            <SelectItem value="LO">Licença de Operação (LO)</SelectItem>
                            <SelectItem value="LAS">Licença Ambiental Simplificada (LAS)</SelectItem>
                            <SelectItem value="LOC">Licença de Operação Corretiva (LOC)</SelectItem>
                            <SelectItem value="Outra">Outra</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orgaoEmissor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Ambiental Emissor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: IBAMA, CETESB, FEPAM, SEMAD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numeroProcesso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Processo ou Documento</FormLabel>
                        <FormControl>
                          <Input placeholder="Insira o número de referência oficial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Datas de Validade */}
                  <div className="grid grid-cols-2 gap-4">
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
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                  {/* Período de validade calculado */}
                  {watchedDates[0] && watchedDates[1] && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>Período de validade:</strong> {calculatePeriod()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Coluna da Direita - Detalhes e Anexos */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Detalhes e Anexos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ativa">Ativa</SelectItem>
                            <SelectItem value="Em Renovação">Em Renovação</SelectItem>
                            <SelectItem value="Suspensa">Suspensa</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável Interno</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ana Silva">Ana Silva</SelectItem>
                            <SelectItem value="Carlos Pereira">Carlos Pereira</SelectItem>
                            <SelectItem value="Mariana Costa">Mariana Costa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload de Arquivos */}
                  <div className="space-y-3">
                    <Label>Anexar Documento da Licença</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      {!uploadedFile ? (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            Arraste um arquivo aqui ou
                          </div>
                          <Button type="button" variant="outline" size="sm">
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            Selecionar arquivo
                          </Button>
                          <div className="text-xs text-muted-foreground">
                            PDF, DOC, JPG até 10MB
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                          <span className="text-sm font-medium">{uploadedFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção de Condicionantes */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Condicionantes da Licença</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="condicionantes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Liste aqui todas as condicionantes e obrigações que devem ser cumpridas durante a vigência desta licença. Ex: 1. Apresentar relatório de monitoramento de efluentes semestralmente. 2. Realizar o inventário de resíduos sólidos anualmente."
                          className="min-h-[150px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </MainLayout>
  )
}

export default CadastrarLicenca