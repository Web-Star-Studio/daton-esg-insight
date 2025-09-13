import { useState, useEffect } from "react"
import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Upload, X, Check, ChevronsUpDown, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { carbonProjectsService, type CarbonProject } from "@/services/carbonProjects"

const formSchema = z.object({
  project_id: z.string().optional(),
  project_name_text: z.string().min(1, "Nome do projeto é obrigatório"),
  standard: z.string().min(1, "Padrão de certificação é obrigatório"),
  type_methodology: z.string().min(1, "Tipo de projeto é obrigatório"),
  quantity_tco2e: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  total_cost: z.number().min(0, "Custo deve ser positivo").optional(),
  purchase_date: z.date({ required_error: "Data da compra é obrigatória" }),
  registry_id: z.string().min(1, "ID de registro é obrigatório"),
})

const RegistrarCreditosCarbono = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [isNovoProjetoMode, setIsNovoProjetoMode] = useState(false)
  const [projects, setProjects] = useState<CarbonProject[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_name_text: "",
      standard: "",
      type_methodology: "",
      quantity_tco2e: 0,
      total_cost: 0,
      registry_id: "",
    },
  })

  // SEO
  useEffect(() => {
    document.title = 'Registrar Créditos de Carbono | Compra de Créditos';
    const desc = 'Registre a compra de créditos de carbono para compensação de emissões com controle detalhado.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/projetos-carbono/registrar-creditos`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await carbonProjectsService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
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
    try {
      setLoading(true);

      const purchaseData = {
        project_id: values.project_id || undefined,
        project_name_text: values.project_name_text,
        standard: values.standard,
        type_methodology: values.type_methodology,
        registry_id: values.registry_id,
        purchase_date: values.purchase_date.toISOString().split('T')[0],
        quantity_tco2e: values.quantity_tco2e,
        total_cost: values.total_cost || undefined,
      };

      await carbonProjectsService.createPurchase(purchaseData);
      
      toast({
        title: "Sucesso",
        description: "Compra de créditos registrada com sucesso!",
      });
      
      navigate("/projetos-carbono");
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar compra de créditos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/projetos-carbono")
  }

  const handleSelectProjeto = (projectValue: string) => {
    if (projectValue === "novo-projeto") {
      setIsNovoProjetoMode(true)
      form.setValue("project_name_text", "")
      form.setValue("project_id", undefined)
    } else {
      const selectedProject = projects.find(p => p.id === projectValue);
      if (selectedProject) {
        setIsNovoProjetoMode(false)
        form.setValue("project_name_text", selectedProject.name)
        form.setValue("project_id", selectedProject.id)
        form.setValue("standard", selectedProject.standard)
        form.setValue("type_methodology", selectedProject.type_methodology)
      }
    }
    setOpenCombobox(false)
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Aquisição de Créditos de Carbono</h1>
            <p className="text-muted-foreground mt-1">
              Registre a compra de créditos de carbono para compensação de emissões
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="creditos-form" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="creditos-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout de duas colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna da Esquerda - Seções 1 e 2 */}
              <div className="space-y-6">
                {/* Seção 1: Detalhes do Projeto */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Detalhes do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="project_name_text"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Selecione ou adicione o projeto de origem dos créditos</FormLabel>
                          {!isNovoProjetoMode ? (
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value || "Busque pelo nome do projeto, ex: Parque Eólico de Guajiru"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Buscar projeto..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {projects.map((project) => (
                                        <CommandItem
                                          key={project.id}
                                          value={project.id}
                                          onSelect={() => handleSelectProjeto(project.id)}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === project.name ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span>{project.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {project.type_methodology} • {project.standard}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                      <CommandItem
                                        value="novo-projeto"
                                        onSelect={() => handleSelectProjeto("novo-projeto")}
                                      >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        + Adicionar novo projeto
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div className="space-y-2">
                              <FormControl>
                                <Input 
                                  placeholder="Digite o nome do novo projeto"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsNovoProjetoMode(false)
                                  form.setValue("project_name_text", "")
                                }}
                              >
                                Selecionar projeto existente
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="standard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Padrão de Certificação do Crédito</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o padrão" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VCS">Verified Carbon Standard (VCS - Verra)</SelectItem>
                              <SelectItem value="Gold Standard">Gold Standard</SelectItem>
                              <SelectItem value="ACR">American Carbon Registry (ACR)</SelectItem>
                              <SelectItem value="CAR">Climate Action Reserve (CAR)</SelectItem>
                              <SelectItem value="CERCARBONO">CERCARBONO</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type_methodology"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Projeto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Energia Renovável, REDD+, Aterro Sanitário" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Seção 2: Detalhes da Transação */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Detalhes da Transação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="quantity_tco2e"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Créditos Adquiridos (em tCO₂e)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="1000"
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
                      name="total_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Total da Transação (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="R$ 0,00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          {field.value && field.value > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Valor formatado: {formatCurrency(field.value)}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purchase_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data da Aquisição</FormLabel>
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
                  </CardContent>
                </Card>
              </div>

              {/* Coluna da Direita - Seção 3 */}
              <div>
                {/* Seção 3: Registro e Comprovação */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Registro e Comprovação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="registry_id"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel>ID de Registro dos Créditos (Serial Number)</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Este é o identificador único dos seus créditos na plataforma da certificadora (ex: Verra Registry).
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Input placeholder="Insira o número de série ou lote dos créditos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Upload de Certificado */}
                    <div className="space-y-3">
                      <Label>Anexar Certificado de Compra/Aposentadoria</Label>
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
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  )
}

export default RegistrarCreditosCarbono